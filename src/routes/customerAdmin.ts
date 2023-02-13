import { Express } from "express";
import { CustomerAdminEp } from "../end-point/customerAdmin-ep";
import { UserEp } from "../end-point/user-ep";
import { Authentication } from "../middleware/authentication";
export function initCustomerAdminRoutes(app: Express) {
  app.post("/api/auth/create/user", Authentication.customerAdminVerification, Authentication.subscriptionVerification, UserEp.signUpValidationRules(), CustomerAdminEp.createUser);
  app.get("/api/auth/getAllUsers/:limit?/:offset?", Authentication.customerAdminVerification, CustomerAdminEp.getAllUsers);
  app.post(
    "/api/auth/update/customerAdmin",
    Authentication.customerAdminVerification,
    CustomerAdminEp.updateUserProfile
  );

  app.post(
    "/api/auth/update/customerAdminProfile",
    Authentication.customerAdminVerification,
    CustomerAdminEp.updateCustomerAdminProfile
  );


  app.post(
    "/api/auth/update/userByCustomerAdmin/:id",
    Authentication.customerAdminVerification,
    CustomerAdminEp.updateCustomerUserProfile
  );

  app.post(
    "/api/auth/update/blockUser/:id",
    Authentication.customerAdminVerification,
    CustomerAdminEp.blockUserProfile
  );

  app.post("/api/auth/subscribe", Authentication.customerAdminVerification, CustomerAdminEp.customerAdminSubscribe);

  app.post("/api/auth/changeCard", Authentication.customerAdminVerification, CustomerAdminEp.customerAdminUpdate);

  app.get("/api/auth/billingHistory/:limit?/:offset?", Authentication.customerAdminVerification, CustomerAdminEp.getBillingHistory);

  app.get("/api/auth/cancelSubscription", Authentication.customerAdminVerification, CustomerAdminEp.cancelSubscription);

  app.get("/api/auth/resumeSubscription", Authentication.customerAdminVerification, CustomerAdminEp.resumeSubscription);

  app.get("/api/auth/currentSubscription", Authentication.customerAdminVerification, CustomerAdminEp.getActiveSubscription);
 
  app.post(
    "/api/auth/serachUserByCustomerAdmin/:limit?/:offset?",
    Authentication.superAdminAndCuctomerAdminVerification,
    CustomerAdminEp.serachUserByCustomerAdmin
  );

  app.post("/api/auth/changeDefaultPaymentMethod", Authentication.customerAdminVerification, CustomerAdminEp.changeDefaultPaymentMethod);

}