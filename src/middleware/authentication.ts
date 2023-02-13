import * as passport from "passport";
import { NextFunction, Request, Response } from "express";
import { AppLogger } from "../common/logging";
import { UserRole } from "../models/user-model";
import { CustomerAdminDao } from "../dao/customerAdmin-dao";

export class Authentication {
  public static verifyToken(req: Request, res: Response, next: NextFunction) {
    return passport.authenticate(
      "jwt",
      { session: false },
      (err: any, user: any, info: any) => {
        if (err || !user) {
          AppLogger.error(`Login Failed. reason: ${info}`);
          return res.sendError(info);
        }
        req.user = user;
        req.body.user = user._id;
        return next();
      }
    )(req, res, next);
  }

  public static superAdminVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.user.role == UserRole.SUPER_ADMIN) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static customerAdminVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.user.role == UserRole.CUSTOMER_ADMIN) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static userVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (req.user.role == UserRole.USER) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static superAdminAndCuctomerAdminVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (
      req.user.role == UserRole.SUPER_ADMIN ||
      req.user.role == UserRole.CUSTOMER_ADMIN
    ) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }


  public static cuctomerAdminAndUserVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (
      req.user.role == UserRole.CUSTOMER_ADMIN ||
      req.user.role == UserRole.USER
    ) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }


  public static AllVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (
      req.user.role == UserRole.SUPER_ADMIN ||
      req.user.role == UserRole.CUSTOMER_ADMIN ||
      req.user.role == UserRole.USER
    ) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "No authorization to access this route.",
      });
    }
  }

  public static async subscriptionVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const cusAdmin = await CustomerAdminDao.getCustomerAdmin(req.user._id);
    if (cusAdmin.subscriptionLevel == "5") {
      const allUserCount = await CustomerAdminDao.getAllUserssCount(
        req.user._id
      );

      if (allUserCount <= 4) {
        next();
      } else {
        return res.sendError(
          "User limit exceeded. Please update your subscripyion plan."
        );
      }
    } else if (cusAdmin.subscriptionLevel == "10") {
      const allUserCount = await CustomerAdminDao.getAllUserssCount(
        req.user._id
      );

      if (allUserCount <= 9) {
        next();
      } else {
        return res.sendError(
          "User limit exceeded. Please update your subscripyion plan."
        );
      }
    } else if (cusAdmin.subscriptionLevel == "10+") {
      next();
    } else {
      return res.sendError(
        "New Customer could not be created. Please try again later."
      );
    }
  }
}
