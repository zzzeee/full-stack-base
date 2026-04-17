/**
 * @file server.ts
 * @description 服务器工具函数，提供与服务器相关的辅助功能
 * @author System
 * @createDate 2026-01-25
 */

import type { Context } from "@hono/hono";

/**
 * 获取客户端 IP 地址
 */
export function getClientIp(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "0.0.0.0";
}
