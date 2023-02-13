import { AppLogger } from "../common/logging";
import { DAdmin, IAdmin } from "../models/admin-model";
import Admin from "../schemas/admin-schema";
import { DUser, IUser, UserRole } from "../models/user-model";
import User from "../schemas/user-schema";
import { ApplicationError } from "../common/application-error";
import { DCustomerAdmin, ICustomerAdmin } from "../models/customerAdmin-model";
import { DAdminUser, IAdminUser } from "../models/adminUser-model";
import AdminUser from "../schemas/adminUser-schema";
import { StringOrObjectId } from "../common/util";
import { Types } from "mongoose";
import CustomerAdmin from "../schemas/customerAdmin-schema";
import { AdminUserDao } from "./adminUser-dao";

export namespace CustomerAdminDao {
  const populateOptions = ["coverPhoto", "profilePhoto"];

  export async function signUpUser(data: Partial<DAdminUser>): Promise<IUser> {
    const user = new User(data);
    const newUser = await user.save();
    return newUser;
  }



  export async function getCustomerAdminByEmail(email: string): Promise<IUser | null> {
    let admin: IUser = await Admin.findOne({ email: email });
    AppLogger.info(`Got admin for email, userID: ${admin ? admin._id : "None"}`);
    return admin;
  }

  export async function getCustomerAdmin(adminId: StringOrObjectId): Promise<ICustomerAdmin> {
    const admin = await CustomerAdmin.findById(adminId).populate(populateOptions);
    AppLogger.info(`Got admin for ID: ${adminId}`);
    return admin;
  }



  export async function updateCustomerAdmin(adminId: StringOrObjectId, data: Partial<DCustomerAdmin>): Promise<ICustomerAdmin> {
    const admin = await CustomerAdmin.findByIdAndUpdate(adminId, { $set: data });
    return admin;
  }


  export async function getAllUsers(adminId: StringOrObjectId, limit: number, offset: number): Promise<IAdminUser[]> {
    const customerList = await AdminUser.find({ customerAdminId: adminId, validationCode: "ACTIVE" }).sort({ createdAt: -1 }).populate([
      { path: "profileImageId" },
    ])
      .skip(limit * (offset - 1))
      .limit(limit);

    return customerList;
  }

  export async function getAllUserssCount(adminId: StringOrObjectId): Promise<any> {
    const data = await AdminUser.find({ customerAdminId: adminId, validationCode: "ACTIVE" })
    return data.length;
  }



  export async function searchUser(
    userId: Types.ObjectId,
    searchText: string,
    limit: number,
    offset: number,

  ): Promise<IAdminUser[]> {

    const user = await AdminUserDao.getUserById(userId);
    let searchedName = null;

    if (searchText) {
      let seacrhItem = searchText.replace(/\s/g, "");
      searchedName =
        searchText != null ? new RegExp(`^${seacrhItem}`, "i") : null;
    }

    const customerAdminQuery =
      searchedName != null && searchedName
        ? {
          $and: [
            {
              $or: [
                { firstName: searchedName },
                { lastName: searchedName },
                { email: searchedName },
                { validationCode: searchedName }
              ],
            },
          ],
        }
        : {
          $or: [
            { customerAdminId: userId }
          ],
        };

    // const validationCode = user.validationCode == "ACTIVE"

    let searchResult: IAdminUser[] = await AdminUser.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          validationCode: 1,
          customerAdminId: 1,
          _id: 1,
        },
      },
      {
        $match: {
          customerAdminId: userId,
          $and: [
            customerAdminQuery,


          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);

    return searchResult;
  }
}
