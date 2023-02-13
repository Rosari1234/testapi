import { AppLogger } from "../common/logging";
import { DAdmin, IAdmin } from "../models/admin-model";
import Admin from "../schemas/admin-schema";
import { IUser, UserRole } from "../models/user-model";
import User from "../schemas/user-schema";
import { ApplicationError } from "../common/application-error";
import { Types } from "mongoose";
import { DCustomerAdmin, ICustomerAdmin } from "../models/customerAdmin-model";
import CustomerAdmin from "../schemas/customerAdmin-schema";
import { StringOrObjectId } from "../common/util";
import { IAdminUser } from "../models/adminUser-model";
import AdminUser from "../schemas/adminUser-schema";
export namespace AdminUserDao {


    export async function getUserByEmail(email: string): Promise<IAdminUser | null> {
        let admin: IAdminUser = await AdminUser.findOne({ email: email });
        AppLogger.info(`Got admin for email, userID: ${admin ? admin._id : "None"}`);
        return admin;
    }

    export async function getUserById(adminId: StringOrObjectId): Promise<IAdminUser> {
        const admin = await AdminUser.findById(adminId)
        AppLogger.info(`Got admin for ID: ${adminId}`);
        return admin;
    }
}
