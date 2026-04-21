/**
 * @file user.repository.ts
 * @description public.profiles 数据访问（与 auth.users 一对一）
 */

import { BaseRepository } from "[@BASE-repositories]/base.repository.ts";
import { logger } from "[@BASE]/lib/logger.ts";
import type { Profile, ProfileInsert, ProfileUpdate } from "[@BASE]/types/user.types.ts";

/**
 * 用户资料仓储（表名为 profiles）
 */
export class UserRepository extends BaseRepository {
    private readonly table = "profiles";

    findById(id: string): Promise<Profile | null> {
        logger.debug("Finding profile by id", { id });
        return this.findOne<Profile>(this.table, { id });
    }

    create(data: ProfileInsert): Promise<Profile> {
        logger.info("Creating profile", { id: data.id });
        return this.insert<Profile>(this.table, data);
    }

    updateById(id: string, data: ProfileUpdate): Promise<Profile> {
        logger.info("Updating profile", { id, fields: Object.keys(data) });
        return this.update<Profile>(this.table, { id }, data);
    }

    async softDelete(id: string): Promise<boolean> {
        logger.info("Soft deleting profile", { id });
        await this.update<Profile>(this.table, { id }, { status: "deleted" });
        return true;
    }
}

/** 服务端统一用 service role，避免 RLS 与自定义 JWT 不一致 */
export const userRepository = new UserRepository(true);
