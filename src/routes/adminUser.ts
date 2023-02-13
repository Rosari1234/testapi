import { Express } from "express";
import { CustomerAdminEp } from "../end-point/customerAdmin-ep";
import { UserEp } from "../end-point/user-ep";
import { AdminUserEp } from "../end-point/adminUser-ep";
import { Authentication } from "../middleware/authentication";

export function initAdminUserRoutes(app: Express) {
  app.post(
    "/api/auth/update/user",
    Authentication.userVerification,
    AdminUserEp.updateUserProfile
  );
}