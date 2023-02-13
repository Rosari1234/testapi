import * as mongoose from "mongoose";
import { StringOrObjectId } from "../common/util";
import { Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  CUSTOMER_ADMIN = "CUSTOMER_ADMIN",
  USER = "USER",
}

export enum UserActivation {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum DealActivation {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
export enum UserStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
}

interface CommonAttributes {
  email?: string;
  password?: string;
  verificationCode?: string;
  verifiedStatus?: string;
  validationCode?: string;
  adminApproved?: boolean;
  profileImageId?: Types.ObjectId;
  role?: string;
}

export enum SignedUpAs {
  EMAIL = "EMAIL",
}

export interface DUser extends CommonAttributes {
  _id?: StringOrObjectId;
}

export interface IUser extends CommonAttributes, mongoose.Document {
  readonly role: UserRole;

  lastLogin: Date;

  createAccessToken(): string;

  comparePassword(password: string): Promise<boolean>;

  compareVerificationCode(verificationCode: string): Promise<boolean>;
}
