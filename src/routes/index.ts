import { Express, Request, Response } from "express";
import { initAdminRoutes } from "./admin";
import { initUserRoutes } from "./user";
import { initCustomerAdminRoutes } from './customerAdmin';
import { initDealRoutes } from './deal';
import { initAdminUserRoutes } from "./adminUser";
import { initUploadRoutes } from "./upload";

export function initRoutes(app: Express) {
  /* TOP LEVEL */
  app.get("/api", (req: Request, res: Response) => res.sendSuccess("Deal™ Api", "Success"));

  initAdminRoutes(app);
  initUploadRoutes(app);
  initUserRoutes(app);
  initCustomerAdminRoutes(app);
  initAdminUserRoutes(app);
  initDealRoutes(app);
  /* ALL INVALID REQUESTS */
  app.get("/", (req: Request, res: Response) => res.redirect(301, "/api"));
  app.all("*", (req: Request, res: Response) => res.sendError("Route Not Found"));
}
