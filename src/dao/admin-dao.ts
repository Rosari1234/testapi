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
export namespace AdminDao {
  const populateOptions = ["coverPhoto", "profilePhoto"];


  export async function signUpAdminUser(
    customerBusinessName: string,
    primaryContactName: string,
    email: string,
    streetAddress: string,
    city: string,
    state: string,
    zipCode: string,
    phoneNumber: string,
    subscriptionLevel: string,
    role: string,
    password: string,
    validationCode: string,
    verifiedStatus: string,
    adminApproved: boolean
  ): Promise<IUser> {
    let isEmailUsed = await User.findOne({ email: email });
    if (isEmailUsed) {
      throw new ApplicationError("Provided email is already taken.");
    }
    let userDetails: DAdmin | DCustomerAdmin = null;
    userDetails = {
      customerBusinessName: customerBusinessName,
      primaryContactName: primaryContactName,
      email: email,
      streetAddress: streetAddress,
      city: city,
      state: state,
      zipCode: zipCode,
      phoneNumber: phoneNumber,
      subscriptionLevel: "0",
      role: role,
      password: password,
      validationCode: validationCode,
      verifiedStatus: verifiedStatus,
      adminApproved: adminApproved,
    };
    console.log('userdetails new', userDetails)
    if (role == UserRole.CUSTOMER_ADMIN) {

      try {
        const user = new User(userDetails);
        const newUser = await user.save();
        return newUser;
      }
      catch (err) {
        console.log('errrr', err)
      }
    }

    console.log('userdetalils', userDetails)

  }

  export async function getAdminByEmail(email: string): Promise<IUser | null> {
    let admin: IUser = await Admin.findOne({ email: email });
    AppLogger.info(`Got admin for email, userID: ${admin ? admin._id : "None"}`);
    return admin;
  }

  export async function getAdmin(adminId: string): Promise<IAdmin> {
    const admin = await Admin.findById(adminId).populate(populateOptions);
    AppLogger.info(`Got admin for ID: ${adminId}`);
    return admin;
  }

  export async function updateAdmin(adminId: string, data: Partial<DAdmin>): Promise<IAdmin> {
    const admin = await Admin.findByIdAndUpdate(adminId, { $set: data });
    AppLogger.info(`Update profile for user ID: ${admin._id}`);
    return getAdmin(admin._id);
  }
  export async function unSetField(userId: Types.ObjectId, _fieldName?: string): Promise<any> {
    const response = await User.findByIdAndUpdate(
      userId,
      {
        $unset: { verificationCode: "" },
      },
      { new: true }
    );
    return response;
  }

  export async function getAllAdminCustomers(limit: number, offset: number): Promise<ICustomerAdmin[]> {
    const customerList = await CustomerAdmin.find({ adminApproved: true, validationCode: "ACTIVE" }).sort({ createdAt: -1 })
      .skip(limit * (offset - 1))
      .limit(limit);
    return customerList;
  }

  export async function getAllAdminCustomersCount(): Promise<any> {
    const data = await CustomerAdmin.find({ validationCode: "ACTIVE" })
    return data.length;
  }

  export async function getAllAdminUsersCount(): Promise<any> {
    const data = await AdminUser.find({ validationCode: "ACTIVE" })
    return data.length;
  }
  export async function getAllPendingAdminCustomers(
    limit?: number,
    offset?: number
  ): Promise<ICustomerAdmin[]> {
    const list = await CustomerAdmin.find({ adminApproved: false }).sort({ createdAt: -1 })
      .skip(limit * (offset - 1))
      .limit(limit);
    return list;
  }

  export async function getAllUsers(adminId: StringOrObjectId, limit: number, offset: number): Promise<IAdminUser[]> {
    const customerList = await AdminUser.find({ customerAdminId: adminId, validationCode: "ACTIVE" }).sort({ createdAt: -1 })
      .skip(limit * (offset - 1))
      .limit(limit);

    return customerList;
  }


  export async function getSingleUser(adminId: StringOrObjectId): Promise<ICustomerAdmin> {
    const customerList = await CustomerAdmin.findById(adminId)

    return customerList;
  }


  export async function searchCustomerAdmin(
    searchText: string,
    limit: number,
    offset: number,

  ): Promise<ICustomerAdmin[]> {


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
                { customerBusinessName: searchedName  },
                { primaryContactName: searchedName },
                { email: searchedName },
                { streetAddress: searchedName },
                { phoneNumber: searchedName },
                { subscriptionLevel: searchedName },
               
              ],
            },
          ],
        }
        : {
          $or: [
            { validationCode: "ACTIVE" }
          ],
        };

    let searchResult: ICustomerAdmin[] = await CustomerAdmin
    .aggregate([
       {
        $project: {
          customerBusinessName: 1,
          primaryContactName: 1,
          email: 1,
          createdAt: 1,
          streetAddress: 1,
          city: 1,
          state: 1,
          zipCode: 1,
          phoneNumber: 1,
          subscriptionLevel: 1,
          validationCode: 1,
          verifiedStatus: 1,
          _id: 1,
        },
      },
      {
        $match: {
           validationCode: "ACTIVE",
           $and: [

             customerAdminQuery

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
    console.log('serch resultes',searchResult)
    return searchResult;
  }

  
  export async function searchPendingCustomerAdmin(
    searchText: string,
    limit: number,
    offset: number,

  ): Promise<ICustomerAdmin[]> {


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
                { customerBusinessName: searchedName  },
                { primaryContactName: searchedName },
                { email: searchedName },
                { streetAddress: searchedName },
                { phoneNumber: searchedName },
                { subscriptionLevel: searchedName },
                {_id:searchedName}
              ],
            },
          ],
        }
        : {
          $or: [
            { adminApproved: false }
          ],
        };

    let searchResult: ICustomerAdmin[] = await CustomerAdmin
    .aggregate([
       {
        $project: {
          customerBusinessName: 1,
          primaryContactName: 1,
          email: 1,
          createdAt: 1,
          streetAddress: 1,
          city: 1,
          state: 1,
          zipCode: 1,
          phoneNumber: 1,
          subscriptionLevel: 1,
          validationCode: 1,
          verifiedStatus: 1,
          _id: 1,
        },
      },
      {
        $match: {
          adminApproved: false,
           $and: [

             customerAdminQuery

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
