/**
 * @file zod-validation.hook.ts
 * @description @hono/zod-validator 第三参数：校验失败时返回统一 ApiResponse，避免把 ZodError.message 原文返回给前端。
 */

import type { Context } from "@hono/hono";
import type { ZodError } from "zod";
import { apiResponse } from "[@BASE]/lib/api-response.ts";

/**
 * 用法：zValidator('json', schema, zodValidationHook)
 * hono 传入的 result 含 success / error / target 等字段，此处只消费校验失败分支。
 */
// deno-lint-ignore no-explicit-any
export function zodValidationHook(result: any, c: Context) {
  if (result.success) {
    return;
  }
  const err = result.error as ZodError | undefined;
  if (!err?.issues?.length) {
    return c.json(
      apiResponse.error("数据验证失败", "VALIDATION_ERROR"),
      400,
    );
  }
  const msg = err.issues[0]?.message ?? "数据验证失败";
  return c.json(
    apiResponse.error(msg, "VALIDATION_ERROR", err.issues),
    400,
  );
}
