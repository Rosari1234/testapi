import { Express } from "express";
import { UserEp } from "../end-point/user-ep";

export function initUserRoutes(app: Express) {

    app.post("/api/public/login", UserEp.authenticateValidationRules(), UserEp.authenticate);
    app.get("/api/auth/me", UserEp.getMe);
    app.post("/api/public/logout", UserEp.authenticateValidationRules(), UserEp.logout);
}
