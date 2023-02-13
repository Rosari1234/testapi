import { Express } from "express";
import { AdminEp } from "../end-point/admin-ep";
import { UserEp } from "../end-point/user-ep";
import { Authentication } from "../middleware/authentication";
export function initAdminRoutes(app: Express) {
  app.post("/api/auth/create/adminUser", Authentication.superAdminVerification, UserEp.signUpValidationRules(), AdminEp.createAdminUser);
  app.post("/api/public/create/adminCustomer", UserEp.signUpValidationRules(), AdminEp.signUpCustomerAdmin);
  app.post("/api/public/verifyByCode", AdminEp.verifyUserByCode);
  app.get("/api/auth/getAllCustomerAdmins/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllCustomerAdmins);
  app.get("/api/auth/getAllPendingCustomerAdmins/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllPendingCustomerAdmins);
  app.get("/api/auth/getUsersByCustomerAdminId/:id/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllUsersByCustomerId);
  // app.get("/api/auth/getDealsByUserId/:id/:limit?/:offset?", Authentication.superAdminVerification, AdminEp.getAllPendingCustomerAdmins);
  app.post(
    "/api/auth/update/admin",
    Authentication.superAdminVerification,
    AdminEp.updateUserProfile
  );
  app.post(
    "/api/auth/update/userByAdmin/:id",
    Authentication.superAdminVerification,
    AdminEp.updateCustomerAdminProfile
  );
  app.post(
    "/api/auth/searchCustomerAdminByAdmin/:limit?/:offset?",
    Authentication.superAdminVerification,
    AdminEp.searchCustomerAdminByAdmin
  );
  app.post(
    "/api/auth/serachPendingCustomerAdminByAdmin/:limit?/:offset?",
    Authentication.superAdminVerification,
    AdminEp.searchPendingCustomerAdminByAdmin
  );

  app.get("/api/auth/getSingleUserById/:id", Authentication.superAdminVerification, AdminEp.getSingleUserById);
}

