/**
 * @file expo.service.ts
 * @description 展会后台：注册、登录、展会、用户、权限
 */

import { generateToken } from "[@BASE]/lib/jwt.ts";
import { hashPassword, verifyPassword } from "[@BASE]/lib/password.ts";
import { AppError } from "[@BASE]/lib/errors/app-error.ts";
import { ErrorCodes } from "[@BASE]/lib/errors/error-codes.ts";
import { adminRepository } from "[@BASE-repositories]/base.repository.ts";
import type { Tables } from "[@BASE]/types/database.types.ts";
import type {
  ExpoApproveRegistrationInput,
  ExpoCreateEventInput,
  ExpoCreateUserInput,
  ExpoPutRolePermissionsInput,
} from "[@BASE-schemas]/expo.schema.ts";

type StaffUser = Tables<"staff_users">;
type RoleRow = Tables<"roles">;
type EventRow = Tables<"events">;
type MembershipRow = Tables<"event_memberships">;

const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORGANIZER: "ORGANIZER",
  PART_TIME: "PART_TIME",
  OUTSOURCE_COFFEE: "OUTSOURCE_COFFEE",
  WORKORDER_ADMIN: "WORKORDER_ADMIN",
  WORKORDER_WORKER: "WORKORDER_WORKER",
} as const;

async function findRoleById(id: string): Promise<RoleRow | null> {
  return adminRepository.findOne<RoleRow>("roles", { id });
}

async function findRoleByKey(key: string): Promise<RoleRow | null> {
  return adminRepository.findOne<RoleRow>("roles", { key });
}

async function listMemberships(staffId: string): Promise<MembershipRow[]> {
  const { data } = await adminRepository.query<MembershipRow>("event_memberships", {
    where: { staff_user_id: staffId },
    orderBy: { column: "created_at", ascending: true },
  });
  return data;
}

async function getRoleKeyInEvent(
  staffId: string,
  eventId: string,
): Promise<string | null> {
  const m = await adminRepository.findOne<MembershipRow>("event_memberships", {
    staff_user_id: staffId,
    event_id: eventId,
  });
  if (!m) return null;
  const role = await findRoleById(m.role_id);
  return role?.key ?? null;
}

/** 在任意展会下是否为超级管理员或主办方 */
async function hasElevatedAccess(staffId: string): Promise<boolean> {
  const mems = await listMemberships(staffId);
  for (const m of mems) {
    const role = await findRoleById(m.role_id);
    if (role?.key === ROLE.SUPER_ADMIN || role?.key === ROLE.ORGANIZER) return true;
  }
  return false;
}

function assertCanAssignRole(actorKey: string, targetRoleKey: string) {
  if (actorKey === ROLE.SUPER_ADMIN) return;
  if (actorKey === ROLE.ORGANIZER) {
    if (targetRoleKey === ROLE.SUPER_ADMIN || targetRoleKey === ROLE.ORGANIZER) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "主办方不能分配超级管理员或主办方角色");
    }
    return;
  }
  if (actorKey === ROLE.WORKORDER_ADMIN) {
    if (targetRoleKey !== ROLE.WORKORDER_WORKER) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "工单管理员仅能管理工单施工员");
    }
    return;
  }
  throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权分配角色");
}

async function issueExpoToken(staff: StaffUser): Promise<string> {
  const eid = staff.current_event_id;
  return await generateToken({
    sub: staff.id,
    email: `${staff.username}@expo.local`,
    typ: "expo",
    sv: staff.session_version,
    eid: eid ?? null,
  });
}

export async function expoRegister(input: {
  username: string;
  password: string;
  display_name?: string;
  phone?: string;
  remark?: string;
}): Promise<{ id: string; username: string }> {
  const exists = await adminRepository.findOne<StaffUser>("staff_users", {
    username: input.username,
  });
  if (exists) {
    throw new AppError(ErrorCodes.USER_ALREADY_EXISTS, "用户名已存在");
  }
  const password_hash = await hashPassword(input.password);
  const row = await adminRepository.insert<StaffUser>("staff_users", {
    username: input.username,
    password_hash,
    display_name: input.display_name ?? "",
    phone: input.phone ?? null,
    remark: input.remark ?? null,
    registration_status: "pending",
    disabled: false,
    session_version: 0,
  });
  return { id: row.id, username: row.username };
}

export async function expoLogin(
  username: string,
  password: string,
): Promise<{ token: string; user: Record<string, unknown> }> {
  const staff = await adminRepository.findOne<StaffUser>("staff_users", { username });
  if (!staff) {
    throw new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, "用户名或密码错误");
  }
  if (staff.registration_status === "pending") {
    throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "账号待管理员审核");
  }
  if (staff.registration_status === "rejected") {
    throw new AppError(ErrorCodes.AUTH_ACCOUNT_DISABLED, "注册未通过审核");
  }
  if (staff.disabled) {
    throw new AppError(ErrorCodes.AUTH_ACCOUNT_DISABLED, "账号已被禁用");
  }
  const ok = await verifyPassword(password, staff.password_hash);
  if (!ok) {
    throw new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, "用户名或密码错误");
  }

  let currentEventId = staff.current_event_id;
  if (!currentEventId) {
    const mems = await listMemberships(staff.id);
    if (mems.length > 0) {
      currentEventId = mems[0].event_id;
      await adminRepository.update<StaffUser>("staff_users", { id: staff.id }, {
        current_event_id: currentEventId,
      });
    }
  }

  const refreshed = await adminRepository.findOne<StaffUser>("staff_users", { id: staff.id });
  if (!refreshed) throw new AppError(ErrorCodes.INTERNAL_ERROR, "登录失败");

  const token = await issueExpoToken(refreshed);
  const me = await buildMePayload(refreshed);
  return { token, user: me };
}

export async function buildMePayload(staff: StaffUser): Promise<Record<string, unknown>> {
  const mems = await listMemberships(staff.id);
  const eventsOut: Record<string, unknown>[] = [];
  const roleIds = [...new Set(mems.map((m) => m.role_id))];
  const rolesById = new Map<string, RoleRow>();
  for (const rid of roleIds) {
    const r = await findRoleById(rid);
    if (r) rolesById.set(rid, r);
  }
  const eventIds = [...new Set(mems.map((m) => m.event_id))];
  for (const eid of eventIds) {
    const ev = await adminRepository.findOne<EventRow>("events", { id: eid });
    const m = mems.find((x) => x.event_id === eid);
    if (!ev || !m) continue;
    const rk = rolesById.get(m.role_id)?.key;
    eventsOut.push({
      event: ev,
      role_key: rk,
      role_id: m.role_id,
    });
  }

  let permissionKeys: string[] = [];
  if (staff.current_event_id) {
    const rk = await getRoleKeyInEvent(staff.id, staff.current_event_id);
    const m = mems.find((x) => x.event_id === staff.current_event_id);
    if (m && rk) {
      permissionKeys = await listPermissionKeysForRole(m.role_id);
    }
  }

  const currentEvent = staff.current_event_id
    ? await adminRepository.findOne<EventRow>("events", { id: staff.current_event_id })
    : null;

  return {
    id: staff.id,
    username: staff.username,
    display_name: staff.display_name,
    phone: staff.phone,
    remark: staff.remark,
    registration_status: staff.registration_status,
    current_event_id: staff.current_event_id,
    current_event: currentEvent,
    memberships: eventsOut,
    permissions: permissionKeys,
  };
}

async function listPermissionKeysForRole(roleId: string): Promise<string[]> {
  const { data } = await adminRepository.query<{ permission_id: string }>("role_permissions", {
    where: { role_id: roleId },
    select: "permission_id",
  });
  const keys: string[] = [];
  for (const row of data) {
    const p = await adminRepository.findOne<Tables<"permissions">>("permissions", {
      id: row.permission_id,
    });
    if (p) keys.push(p.key);
  }
  keys.sort();
  return keys;
}

export async function expoGetMe(staff: StaffUser) {
  const fresh = await adminRepository.findOne<StaffUser>("staff_users", { id: staff.id });
  if (!fresh) throw new AppError(ErrorCodes.USER_NOT_FOUND, "用户不存在");
  return buildMePayload(fresh);
}

export async function expoChangeOwnPassword(
  staff: StaffUser,
  oldPassword: string,
  newPassword: string,
) {
  const ok = await verifyPassword(oldPassword, staff.password_hash);
  if (!ok) throw new AppError(ErrorCodes.AUTH_INVALID_OLD_PASSWORD, "旧密码错误");
  const password_hash = await hashPassword(newPassword);
  const nextSv = staff.session_version + 1;
  await adminRepository.update<StaffUser>("staff_users", { id: staff.id }, {
    password_hash,
    session_version: nextSv,
  });
  const updated = await adminRepository.findOne<StaffUser>("staff_users", { id: staff.id });
  if (!updated) throw new AppError(ErrorCodes.INTERNAL_ERROR, "更新失败");
  const token = await issueExpoToken(updated);
  return { token };
}

export async function expoSetCurrentEvent(staff: StaffUser, eventId: string) {
  const m = await adminRepository.findOne<MembershipRow>("event_memberships", {
    staff_user_id: staff.id,
    event_id: eventId,
  });
  if (!m) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "您不属于该展会");
  }
  await adminRepository.update<StaffUser>("staff_users", { id: staff.id }, {
    current_event_id: eventId,
  });
  const updated = await adminRepository.findOne<StaffUser>("staff_users", { id: staff.id });
  if (!updated) throw new AppError(ErrorCodes.INTERNAL_ERROR, "更新失败");
  const token = await issueExpoToken(updated);
  const me = await buildMePayload(updated);
  return { token, me };
}

export async function expoListEvents(actor: StaffUser): Promise<EventRow[]> {
  const elevated = await hasElevatedAccess(actor.id);
  if (elevated) {
    const { data } = await adminRepository.query<EventRow>("events", {
      orderBy: { column: "created_at", ascending: false },
    });
    return data;
  }
  const mems = await listMemberships(actor.id);
  const out: EventRow[] = [];
  for (const m of mems) {
    const ev = await adminRepository.findOne<EventRow>("events", { id: m.event_id });
    if (ev) out.push(ev);
  }
  return out;
}

export async function expoCreateEvent(actor: StaffUser, input: ExpoCreateEventInput) {
  const ok = await hasElevatedAccess(actor.id);
  if (!ok) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权创建展会");
  const row = await adminRepository.insert<EventRow>("events", {
    name: input.name,
    logo_url: input.logo_url ?? null,
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    status: input.status ?? "draft",
  });

  let roleIdToAssign: string | null = null;
  if (actor.current_event_id) {
    const m = await adminRepository.findOne<MembershipRow>("event_memberships", {
      staff_user_id: actor.id,
      event_id: actor.current_event_id,
    });
    roleIdToAssign = m?.role_id ?? null;
  }
  if (!roleIdToAssign) {
    const mems = await listMemberships(actor.id);
    roleIdToAssign = mems[0]?.role_id ?? null;
  }
  if (!roleIdToAssign) {
    const org = await findRoleByKey(ROLE.ORGANIZER);
    roleIdToAssign = org?.id ?? null;
  }
  if (roleIdToAssign) {
    await adminRepository.insert<MembershipRow>("event_memberships", {
      staff_user_id: actor.id,
      event_id: row.id,
      role_id: roleIdToAssign,
    });
  }

  return row;
}

export async function expoPatchEvent(
  actor: StaffUser,
  eventId: string,
  patch: Partial<Pick<EventRow, "name" | "logo_url" | "starts_at" | "ends_at" | "status">>,
) {
  const ok = await hasElevatedAccess(actor.id);
  if (!ok) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权修改展会");
  const ev = await adminRepository.findOne<EventRow>("events", { id: eventId });
  if (!ev) throw new AppError(ErrorCodes.NOT_FOUND, "展会不存在");
  return adminRepository.update<EventRow>("events", { id: eventId }, patch);
}

export async function expoListUsers(actor: StaffUser, eventId: string) {
  const actorKey = await getRoleKeyInEvent(actor.id, eventId);
  if (!actorKey) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "您在该展会下无角色");

  const { data: mems } = await adminRepository.query<MembershipRow>("event_memberships", {
    where: { event_id: eventId },
    select: "*",
  });

  const enriched: Record<string, unknown>[] = [];
  for (const m of mems) {
    const u = await adminRepository.findOne<StaffUser>("staff_users", { id: m.staff_user_id });
    const r = await findRoleById(m.role_id);
    if (!u) continue;
    if (actorKey === ROLE.WORKORDER_ADMIN && r?.key !== ROLE.WORKORDER_WORKER) continue;
    enriched.push({
      user: {
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        phone: u.phone,
        remark: u.remark,
        disabled: u.disabled,
        registration_status: u.registration_status,
      },
      role_id: m.role_id,
      role_key: r?.key,
      membership_id: m.id,
    });
  }
  return enriched;
}

export async function expoCreateUser(actor: StaffUser, input: ExpoCreateUserInput) {
  const actorKey = await getRoleKeyInEvent(actor.id, input.event_id);
  if (!actorKey) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "您在该展会下无角色");

  const targetRole = await findRoleById(input.role_id);
  if (!targetRole) throw new AppError(ErrorCodes.VALIDATION_ERROR, "角色不存在");
  assertCanAssignRole(actorKey, targetRole.key);

  const exists = await adminRepository.findOne<StaffUser>("staff_users", {
    username: input.username,
  });
  if (exists) throw new AppError(ErrorCodes.USER_ALREADY_EXISTS, "用户名已存在");

  const password_hash = await hashPassword(input.password);
  const user = await adminRepository.insert<StaffUser>("staff_users", {
    username: input.username,
    password_hash,
    display_name: input.display_name ?? "",
    phone: input.phone ?? null,
    remark: input.remark ?? null,
    registration_status: "approved",
    approved_by: actor.id,
    approved_at: new Date().toISOString(),
    disabled: false,
    session_version: 0,
    current_event_id: input.event_id,
  });

  await adminRepository.insert<MembershipRow>("event_memberships", {
    staff_user_id: user.id,
    event_id: input.event_id,
    role_id: input.role_id,
  });

  return { id: user.id, username: user.username };
}

export async function expoPatchUser(
  actor: StaffUser,
  targetUserId: string,
  eventId: string,
  patch: {
    display_name?: string;
    phone?: string | null;
    remark?: string | null;
    disabled?: boolean;
    role_id?: string;
  },
) {
  if (targetUserId === actor.id && patch.disabled === true) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "不能禁用本人账号");
  }

  const actorKey = await getRoleKeyInEvent(actor.id, eventId);
  if (!actorKey) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "您在该展会下无角色");

  const targetMem = await adminRepository.findOne<MembershipRow>("event_memberships", {
    staff_user_id: targetUserId,
    event_id: eventId,
  });
  if (!targetMem) throw new AppError(ErrorCodes.NOT_FOUND, "用户不在该展会");

  const targetRole = await findRoleById(targetMem.role_id);
  if (!targetRole) throw new AppError(ErrorCodes.NOT_FOUND, "角色不存在");

  if (patch.role_id) {
    const newRole = await findRoleById(patch.role_id);
    if (!newRole) throw new AppError(ErrorCodes.VALIDATION_ERROR, "目标角色不存在");
    assertCanAssignRole(actorKey, newRole.key);
    if (actorKey === ROLE.WORKORDER_ADMIN && targetRole.key !== ROLE.WORKORDER_WORKER) {
      throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "仅能调整工单施工员");
    }
    await adminRepository.update<MembershipRow>("event_memberships", {
      id: targetMem.id,
    }, { role_id: patch.role_id });
  } else if (actorKey === ROLE.WORKORDER_ADMIN && targetRole.key !== ROLE.WORKORDER_WORKER) {
    throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "仅能管理工单施工员");
  }

  const { role_id: _r, ...userPatch } = patch;
  if (Object.keys(userPatch).length > 0) {
    await adminRepository.update<StaffUser>("staff_users", { id: targetUserId }, userPatch);
  }

  return adminRepository.findOne<StaffUser>("staff_users", { id: targetUserId });
}

export async function expoResetPassword(
  actor: StaffUser,
  targetUserId: string,
  eventId: string,
  newPassword: string,
) {
  const actorKey = await getRoleKeyInEvent(actor.id, eventId);
  if (!actorKey) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "您在该展会下无角色");

  const targetMem = await adminRepository.findOne<MembershipRow>("event_memberships", {
    staff_user_id: targetUserId,
    event_id: eventId,
  });
  if (!targetMem) throw new AppError(ErrorCodes.NOT_FOUND, "用户不在该展会");

  const targetRole = await findRoleById(targetMem.role_id);
  if (actorKey === ROLE.WORKORDER_ADMIN && targetRole?.key !== ROLE.WORKORDER_WORKER) {
    throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "仅能重置工单施工员密码");
  }

  const target = await adminRepository.findOne<StaffUser>("staff_users", { id: targetUserId });
  if (!target) throw new AppError(ErrorCodes.USER_NOT_FOUND, "用户不存在");

  const password_hash = await hashPassword(newPassword);
  await adminRepository.update<StaffUser>("staff_users", { id: targetUserId }, {
    password_hash,
    session_version: target.session_version + 1,
  });
  return { ok: true };
}

export async function expoKickUser(actor: StaffUser, targetUserId: string, eventId: string) {
  const actorKey = await getRoleKeyInEvent(actor.id, eventId);
  if (!actorKey) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "您在该展会下无角色");
  if (!(await hasElevatedAccess(actor.id)) && actorKey !== ROLE.WORKORDER_ADMIN) {
    throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权踢下线");
  }

  const targetMem = await adminRepository.findOne<MembershipRow>("event_memberships", {
    staff_user_id: targetUserId,
    event_id: eventId,
  });
  if (!targetMem) throw new AppError(ErrorCodes.NOT_FOUND, "用户不在该展会");

  const targetRole = await findRoleById(targetMem.role_id);
  if (actorKey === ROLE.WORKORDER_ADMIN && targetRole?.key !== ROLE.WORKORDER_WORKER) {
    throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "仅能踢下线工单施工员");
  }

  const target = await adminRepository.findOne<StaffUser>("staff_users", { id: targetUserId });
  if (!target) throw new AppError(ErrorCodes.USER_NOT_FOUND, "用户不存在");

  await adminRepository.update<StaffUser>("staff_users", { id: targetUserId }, {
    session_version: target.session_version + 1,
  });
  return { ok: true };
}

export async function expoListPendingRegistrations(actor: StaffUser) {
  const ok = await hasElevatedAccess(actor.id);
  if (!ok) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权查看待审核列表");
  const { data } = await adminRepository.query<StaffUser>("staff_users", {
    where: { registration_status: "pending" },
    orderBy: { column: "created_at", ascending: false },
  });
  return data.map((u) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    phone: u.phone,
    remark: u.remark,
    created_at: u.created_at,
  }));
}

export async function expoApproveRegistration(
  actor: StaffUser,
  targetUserId: string,
  body: ExpoApproveRegistrationInput,
) {
  const ok = await hasElevatedAccess(actor.id);
  if (!ok) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权审核注册");

  const target = await adminRepository.findOne<StaffUser>("staff_users", { id: targetUserId });
  if (!target || target.registration_status !== "pending") {
    throw new AppError(ErrorCodes.NOT_FOUND, "待审核用户不存在");
  }

  const role = await findRoleById(body.role_id);
  if (!role) throw new AppError(ErrorCodes.VALIDATION_ERROR, "角色不存在");

  const actorKeyGlobal = await inferHighestRoleKey(actor.id);
  assertCanAssignRole(actorKeyGlobal, role.key);

  const ev = await adminRepository.findOne<EventRow>("events", { id: body.event_id });
  if (!ev) throw new AppError(ErrorCodes.NOT_FOUND, "展会不存在");

  await adminRepository.update<StaffUser>("staff_users", { id: targetUserId }, {
    registration_status: "approved",
    approved_by: actor.id,
    approved_at: new Date().toISOString(),
    current_event_id: body.event_id,
  });

  await adminRepository.insert<MembershipRow>("event_memberships", {
    staff_user_id: targetUserId,
    event_id: body.event_id,
    role_id: body.role_id,
  });

  return { ok: true };
}

/** 取用户「最高」角色 key（用于审核等跨展会上下文） */
async function inferHighestRoleKey(staffId: string): Promise<string> {
  const mems = await listMemberships(staffId);
  const order: string[] = [
    ROLE.SUPER_ADMIN,
    ROLE.ORGANIZER,
    ROLE.WORKORDER_ADMIN,
    ROLE.OUTSOURCE_COFFEE,
    ROLE.PART_TIME,
    ROLE.WORKORDER_WORKER,
  ];
  let best: string = ROLE.WORKORDER_WORKER;
  let bestIdx = order.length;
  for (const m of mems) {
    const r = await findRoleById(m.role_id);
    if (!r) continue;
    const idx = order.indexOf(r.key);
    if (idx >= 0 && idx < bestIdx) {
      bestIdx = idx;
      best = r.key as string;
    }
  }
  return best;
}

export async function expoRejectRegistration(actor: StaffUser, targetUserId: string) {
  const ok = await hasElevatedAccess(actor.id);
  if (!ok) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权审核注册");
  const target = await adminRepository.findOne<StaffUser>("staff_users", { id: targetUserId });
  if (!target || target.registration_status !== "pending") {
    throw new AppError(ErrorCodes.NOT_FOUND, "待审核用户不存在");
  }
  await adminRepository.update<StaffUser>("staff_users", { id: targetUserId }, {
    registration_status: "rejected",
    approved_by: actor.id,
    approved_at: new Date().toISOString(),
  });
  return { ok: true };
}

export async function expoListRolesWithPermissions() {
  const { data: roles } = await adminRepository.query<RoleRow>("roles", {
    orderBy: { column: "sort_order", ascending: true },
  });
  const out: Record<string, unknown>[] = [];
  for (const r of roles) {
    const keys = await listPermissionKeysForRole(r.id);
    out.push({ ...r, permission_keys: keys });
  }
  return out;
}

export async function expoListPermissionsCatalog() {
  const { data } = await adminRepository.query<Tables<"permissions">>("permissions", {
    orderBy: [{ column: "group_key", ascending: true }, { column: "sort_order", ascending: true }],
  });
  return data;
}

export async function expoPutRolePermissions(
  actor: StaffUser,
  roleId: string,
  body: ExpoPutRolePermissionsInput,
) {
  const ok = await hasElevatedAccess(actor.id);
  if (!ok) throw new AppError(ErrorCodes.AUTH_UNAUTHORIZED, "无权修改角色权限");

  const role = await findRoleById(roleId);
  if (!role) throw new AppError(ErrorCodes.NOT_FOUND, "角色不存在");

  await adminRepository.delete("role_permissions", { role_id: roleId });
  for (const pid of body.permission_ids) {
    const p = await adminRepository.findOne<Tables<"permissions">>("permissions", { id: pid });
    if (!p) continue;
    await adminRepository.insert("role_permissions", { role_id: roleId, permission_id: pid });
  }
  return { ok: true, role_id: roleId, permission_keys: await listPermissionKeysForRole(roleId) };
}
