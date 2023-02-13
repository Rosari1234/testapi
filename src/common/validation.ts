import { check } from "express-validator";
import { UserRole } from "../models/user-model";
import { Types } from "mongoose";

export const Validation = {
  email: () =>
    check("email")
      .not()
      .isEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false })
      .withMessage("Invalid email address and please try again."),
  phone: () => check("phone").isMobilePhone("en-US").withMessage("Phone number is invalid or outside US"),
  password: () =>
    check("password")
      .isString()
      .not()
      .isEmpty()
      .withMessage("Password is required.")
      .isLength({ min: 6, max: 40 })
      .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
      .not()
      .isIn(["123", "password", "god", "abc"])
      .withMessage("Do not use a common word as the password")
      .matches(/\d/)
      .withMessage("Password must contain a number."),
  oldPassword: () =>
    check("oldPassword")
      .isString()
      .not()
      .isEmpty()
      .withMessage("Password is required.")
      .isLength({ min: 6, max: 40 })
      .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
      .not()
      .isIn(["123", "password", "god", "abc"])
      .withMessage("Do not use a common word as the password")
      .matches(/\d/)
      .withMessage("Password must contain a number."),
  role: (...roles: UserRole[]) =>
    check("role")
      .not()
      .isEmpty()
      .withMessage("User Role is required.")
      .isIn(roles)
      .withMessage("User role has to be either a CLIENT or a THERAPIST"),
  noPermissions: () => check("permissions").not().exists(),
};

export function isObjectId(v: string): boolean {
  return Types.ObjectId.isValid(v) && Types.ObjectId(v).toHexString() == v;
}
