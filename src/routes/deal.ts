import { Express } from "express";
import { DealEp } from "../end-point/deal-ep";
import { Authentication } from "../middleware/authentication";

export function initDealRoutes(app: Express) {
  app.post(
    "/api/auth/create/deal/:userId",
    Authentication.cuctomerAdminAndUserVerification,
    // DealEp.dealValidationRules(),
    DealEp.createDeal
  );
  app.put(
    "/api/auth/deal/update/:dealId/:userId",
    Authentication.customerAdminVerification,
    DealEp.updateDeal
  );
  app.delete(
    "/api/auth/deal/delete/:dealId",
    Authentication.customerAdminVerification,
    DealEp.deleteDeal
  );

  app.post(
    "/api/auth/searchDeals/:limit?/:offset?",
    Authentication.AllVerification,
    DealEp.searchDeals
  );

  app.get("/api/auth/getAllDeals/:limit?/:offset?", Authentication.cuctomerAdminAndUserVerification, DealEp.getAllDeals);

  app.get("/api/auth/getAllDealsByUserId/:id?/:limit?/:offset?", Authentication.superAdminVerification, DealEp.getAllDealsByUserId);

  app.get("/api/auth/getAllDealsById/:id?/:limit?/:offset?", Authentication.superAdminAndCuctomerAdminVerification, DealEp.getAllDealsById);

  app.get("/api/auth/getAllDealsByCustomerId/:limit?/:offset?", Authentication.customerAdminVerification, DealEp.getAllDealsByCustomerId);

  app.get("/api/auth/getDealsById/:id", Authentication.AllVerification, DealEp.getDealsByDealId);
}
