/**
 * @file expo.routes.ts
 * @description 展会现场后台 API（/api/expo）
 */

import { Hono } from "@hono/hono";
import { apiResponse } from "[@BASE]/lib/api-response.ts";
import { expoAuthMiddleware } from "[@BASE-middlewares]/expo-auth.middleware.ts";
import * as expoHandler from "[@BASE-handlers]/expo.handler.ts";

const publicAuth = new Hono();
publicAuth.post("/register", expoHandler.expoRegisterHandler);
publicAuth.post("/login", expoHandler.expoLoginHandler);
publicAuth.post("/logout", (c) => c.json(apiResponse.success(null, "退出成功")));

const secured = new Hono();
secured.use("*", expoAuthMiddleware);

secured.get("/me", expoHandler.expoMeHandler);
secured.patch("/me/password", expoHandler.expoChangePasswordHandler);
secured.patch("/me/current-event", expoHandler.expoSetCurrentEventHandler);

secured.get("/events", expoHandler.expoListEventsHandler);
secured.post("/events", expoHandler.expoCreateEventHandler);
secured.patch("/events/:eventId", expoHandler.expoPatchEventHandler);

secured.get("/users", expoHandler.expoListUsersHandler);
secured.post("/users", expoHandler.expoCreateUserHandler);
secured.patch("/users/:userId", expoHandler.expoPatchUserHandler);
secured.post("/users/:userId/reset-password", expoHandler.expoResetPasswordHandler);
secured.post("/users/:userId/kick", expoHandler.expoKickUserHandler);

secured.get("/registrations/pending", expoHandler.expoListPendingRegistrationsHandler);
secured.post(
  "/registrations/:userId/approve",
  expoHandler.expoApproveRegistrationHandler,
);
secured.post(
  "/registrations/:userId/reject",
  expoHandler.expoRejectRegistrationHandler,
);

secured.get("/roles", expoHandler.expoListRolesHandler);
secured.get("/permissions", expoHandler.expoListPermissionsHandler);
secured.put("/roles/:roleId/permissions", expoHandler.expoPutRolePermissionsHandler);

const expo = new Hono();
expo.route("/auth", publicAuth);
expo.route("/", secured);

export default expo;
