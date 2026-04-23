/**
 * @file 20260421000001_exhibition_staff_rbac.sql
 * @description 展会现场后台：events、roles、permissions、staff_users、event_memberships
 */

-- ==================== events ====================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);

COMMENT ON TABLE public.events IS '单场展会';

-- ==================== roles ====================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS '展会后台角色（含超级管理员）';

-- ==================== permissions ====================

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    group_key TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_group ON public.permissions (group_key);

COMMENT ON TABLE public.permissions IS '菜单级权限（稳定 key）';

-- ==================== role_permissions ====================

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions (id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS '角色拥有的权限';

-- ==================== staff_users ====================

CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    remark TEXT,
    registration_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (registration_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.staff_users (id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    disabled BOOLEAN NOT NULL DEFAULT false,
    session_version INTEGER NOT NULL DEFAULT 0,
    current_event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_registration ON public.staff_users (registration_status);
CREATE INDEX IF NOT EXISTS idx_staff_users_disabled ON public.staff_users (disabled);

COMMENT ON TABLE public.staff_users IS '展会后台账号（用户名+密码，独立于 Supabase Auth）';

-- ==================== event_memberships ====================

CREATE TABLE IF NOT EXISTS public.event_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID NOT NULL REFERENCES public.staff_users (id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles (id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (staff_user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_memberships_event ON public.event_memberships (event_id);
CREATE INDEX IF NOT EXISTS idx_event_memberships_staff ON public.event_memberships (staff_user_id);

COMMENT ON TABLE public.event_memberships IS '用户在某个展会下的角色（单场一个角色）';

-- ==================== updated_at triggers ====================

CREATE OR REPLACE FUNCTION public.set_expo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.set_expo_updated_at();

DROP TRIGGER IF EXISTS set_roles_updated_at ON public.roles;
CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_expo_updated_at();

DROP TRIGGER IF EXISTS set_staff_users_updated_at ON public.staff_users;
CREATE TRIGGER set_staff_users_updated_at
    BEFORE UPDATE ON public.staff_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_expo_updated_at();

DROP TRIGGER IF EXISTS set_event_memberships_updated_at ON public.event_memberships;
CREATE TRIGGER set_event_memberships_updated_at
    BEFORE UPDATE ON public.event_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.set_expo_updated_at();

-- ==================== 种子：固定 UUID 便于开发与文档 ====================

INSERT INTO public.roles (id, key, name, sort_order) VALUES
    ('22222222-2222-2222-2222-222222222201', 'SUPER_ADMIN', '超级管理员', 10),
    ('22222222-2222-2222-2222-222222222202', 'ORGANIZER', '主办方', 20),
    ('22222222-2222-2222-2222-222222222203', 'PART_TIME', '兼职人员', 30),
    ('22222222-2222-2222-2222-222222222204', 'OUTSOURCE_COFFEE', '外包人员-咖啡车', 40),
    ('22222222-2222-2222-2222-222222222205', 'WORKORDER_ADMIN', '工单-管理员', 50),
    ('22222222-2222-2222-2222-222222222206', 'WORKORDER_WORKER', '工单-施工员', 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permissions (id, key, group_key, label, sort_order) VALUES
    ('33333333-3333-3333-3333-333333330001', 'coffee.scan', 'coffee', '咖啡券-扫一扫', 10),
    ('33333333-3333-3333-3333-333333330002', 'coffee.records', 'coffee', '咖啡券-核销记录', 20),
    ('33333333-3333-3333-3333-333333330003', 'coffee.gift', 'coffee', '咖啡券-赠送咖啡券', 30),
    ('33333333-3333-3333-3333-333333330004', 'material.scan', 'material', '物资券-扫一扫', 10),
    ('33333333-3333-3333-3333-333333330005', 'material.records', 'material', '物资券-核销记录', 20),
    ('33333333-3333-3333-3333-333333330006', 'material.stats', 'material', '物资券-概况统计', 30),
    ('33333333-3333-3333-3333-333333330007', 'bus.departure', 'bus', '大巴-出发核销', 10),
    ('33333333-3333-3333-3333-333333330008', 'bus.return', 'bus', '大巴-返程核销', 20),
    ('33333333-3333-3333-3333-333333330009', 'bus.list', 'bus', '大巴-核销清单', 30),
    ('33333333-3333-3333-3333-333333330010', 'workorder.list', 'workorder', '工单-工单列表', 10),
    ('33333333-3333-3333-3333-333333330011', 'workorder.stats', 'workorder', '工单-概况统计', 20),
    ('33333333-3333-3333-3333-333333330012', 'common.links', 'common', '常用链接', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (id, name, status) VALUES
    ('11111111-1111-1111-1111-111111111111', '默认展会', 'active')
ON CONFLICT (id) DO NOTHING;

-- 超级管理员 + 主办方：默认拥有全部菜单权限（其余角色由你后续配置）
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key IN ('SUPER_ADMIN', 'ORGANIZER')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 初始超级管理员（用户名 admin / 密码 Admin123456）— 仅用于本地开发，生产请立即修改
INSERT INTO public.staff_users (
    id,
    username,
    password_hash,
    display_name,
    registration_status,
    disabled,
    session_version,
    current_event_id
) VALUES (
    '44444444-4444-4444-4444-444444444441',
    'admin',
    '$2a$10$W8iQkzkHKDAigl9Eyp.U9ODlnjjL5EBmkIbHkvAfdlrzy3FZv4mxy',
    '系统超级管理员',
    'approved',
    false,
    0,
    '11111111-1111-1111-1111-111111111111'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.event_memberships (staff_user_id, event_id, role_id)
SELECT s.id,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid
FROM public.staff_users s
WHERE s.username = 'admin'
ON CONFLICT (staff_user_id, event_id) DO NOTHING;
