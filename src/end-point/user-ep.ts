import { NextFunction, Request, Response } from "express";
import { UserDao } from "../dao/user-dao";
import { Validation } from "../common/validation";
import { check, validationResult } from "express-validator";
import { StringOrObjectId, Util } from "../common/util";
import { DUser, IUser, SignedUpAs, UserRole } from "../models/user-model";
import { DAdmin, IAdmin } from "../models/admin-model";
export namespace UserEp {
  export function authenticateValidationRules() {
    return [Validation.email(), Validation.password()];
  }

  export function signUpValidationRules() {
    return [
      check("email")
        .not()
        .isEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false })
        .withMessage("Invalid email address and please try again."),
      check("password")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage(
          "Password must be at least 6 chars long & not more than 40 chars long."
        )
        .not()
        .isIn(["123", "password", "god", "abc"])
        .withMessage("Do not use a common word as the password")
        .matches(/\d/)
        .withMessage("Password must contain a number."),
    ];
  }

  export async function updateAdminProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.user._id;
    console.log("userid", userId);

    try {
      //   let profileDetails = JSON.parse(req.body);
      let profileDetails = req.body;
      console.log("profiel details", req.body);
      const newPassword = await Util.passwordHashing(profileDetails.password);
      const admin: DAdmin = {
        password: newPassword,
        email: profileDetails.email,
        name: profileDetails.name,
      };
      let updatedAdmin = await UserDao.updateUser(userId, admin);

      if (!updatedAdmin) {
        return res.sendError("Failed to update the admin.");
      }

      return res.sendSuccess(
        updatedAdmin,
        "Your profile has been updated successfully."
      );
    } catch (error) {
      return res.sendError(error);
    }
  }

  export async function getMe(req: Request, res: Response, next: NextFunction) {
    let user = await UserDao.getUserById(req.user._id);

    if (!user) {
      return res.sendError("User not found.");
    }

    return res.sendSuccess(user, "Success");
  }

  export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }
    
    
    UserDao.authenticateUser(req.body.email, req.body.password)
      .then((token: string) => {
        res.sendSuccess(token, "Token sent successfully.");
      })
      .catch(next);
  }

  export function logout(req: Request, res: Response) {
    res.cookie("token", "", { httpOnly: true, secure: false, maxAge: 10 });
    res.sendSuccess(null, "Successfully logged out from server!");
  }
}
