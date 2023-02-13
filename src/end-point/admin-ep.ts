import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import multer = require("multer");
import path = require("path");
import { AdminDao } from "../dao/admin-dao";
import { UserDao } from "../dao/user-dao";
import { UserRole, UserActivation, UserStatus } from "../models/user-model";
import { check, validationResult } from "express-validator";
import { StringOrObjectId, Util } from "../common/util";
import Admin from "../schemas/admin-schema";
import { EmailService } from "../mail/config";
import { DAdmin, IAdmin } from "../models/admin-model";
import { DCustomerAdmin, ICustomerAdmin } from "../models/customerAdmin-model";
import { UploadDao } from "../dao/upload-dao";
import { DUpload, IUpload } from "../models/upload-model";
import { CustomerAdminDao } from "../dao/customerAdmin-dao";
import { DealDao } from "../dao/deal-dao";

var fs = require("fs");
let mongoose = require("mongoose");
export enum UploadCategory {
    PROFILE_IMAGE = "PROFILE_IMAGE",
}

export namespace AdminEp {

    export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
        const userId = req.user._id;
        try {

            let profileDetails = req.body
            const newPassword = await Util.passwordHashing(profileDetails.password)
            const adminUser: DAdmin = {
                //    password: newPassword,
                email: profileDetails.email,
                name: profileDetails.name

            };
            let user = await UserDao.updateUser(userId, adminUser);

            if (!user) {
                return res.sendError("Failed to update the user.");
            }

            return res.sendSuccess(user, "Your profile has been updated successfully.");
        }

        catch (error) {
            return res.sendError(error);
        }
    }

    export async function updateCustomerAdminProfile(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;

        try {

            let profileDetails = req.body
            // const newPassword = await Util.passwordHashing(profileDetails.password)
            const adminUser: DCustomerAdmin = {
                email: profileDetails.email,
                customerBusinessName: profileDetails.customerBusinessName,
                primaryContactName: profileDetails.primaryContactName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                subscriptionLevel: profileDetails.subscriptionLevel,
                validationCode: profileDetails.validationCode,
                adminApproved: profileDetails.adminApproved,

            };
            let user = await UserDao.updateUser(userId, adminUser);

            if (!user) {
                return res.sendError("Failed to update the user.");
            }

            return res.sendSuccess(user, "Your profile has been updated successfully.");
        }

        catch (error) {
            return res.sendError(error);
        }
    }




    export async function createAdminUser(req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.sendError(errors.array()[0]["msg"]);
        }
        const {
            customerBusinessName,
            primaryContactName,
            email,
            streetAddress,
            city,
            state,
            zipCode,
            phoneNumber,
            subscriptionLevel,
            password
        } = req.body
        const role = UserRole.CUSTOMER_ADMIN
        const validationCode = UserActivation.ACTIVE
        const adminApproved = true
        const verifiedStatus = UserStatus.PENDING
        try {

            let isEmailUsed = await UserDao.getUserByEmail(email);
            if (isEmailUsed) {
                return res.sendError("Provided email is already taken.");
            }


            let user = await AdminDao.signUpAdminUser(customerBusinessName,
                primaryContactName,
                email,
                streetAddress,
                city,
                state,
                zipCode,
                phoneNumber,
                subscriptionLevel,
                role,
                password,
                validationCode,
                verifiedStatus,
                adminApproved);

            if (!user) {
                return res.sendError("Failed to create the Customer Admin.");
            }

            await EmailService.sendWelcomeEmail(user, "Welcome To Pencil My Deal");

            return res.sendSuccess(user, "Customer Admin created sucessfully.");
        }

        catch (error) {
            return res.sendError(error);
        }
    }


    export async function signUpCustomerAdmin(req: Request, res: Response, next: NextFunction) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.sendError(errors.array()[0]["msg"]);
        }

        try {
            const email = req.body.email;
            const customerBusinessName = req.body.customerBusinessName;
            const primaryContactName = req.body.primaryContactName;
            const streetAddress = req.body.streetAddress;
            const city = req.body.city;
            const state = req.body.state;
            const zipCode = req.body.zipCode;
            const phoneNumber = req.body.phoneNumber;
            const subscriptionLevel = req.body.subscriptionLevel;
            const password = req.body.password;
            let user = null;
            let verificationCode = null;
            try {
                let isEmailUsed = await UserDao.getUserByEmail(email);
                if (isEmailUsed) {
                    return res.sendError("Provided email is already taken.");
                }
            } catch (error) {
                return res.sendError(error);
            }

            const customerAdmin: any = {
                email: email,
                customerBusinessName: customerBusinessName,
                primaryContactName: primaryContactName,
                streetAddress: streetAddress,
                city: city,
                state: state,
                zipCode: zipCode,
                phoneNumber: phoneNumber,
                subscriptionLevel: "0",
                password: password,
                validationCode: UserActivation.ACTIVE,
                adminApproved: false,
                role: UserRole.CUSTOMER_ADMIN,
                verifiedStatus: UserStatus.PENDING,
            };
            user = await UserDao.signupAdmin(customerAdmin);

            let code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
            try {
                verificationCode = code.toString();

                const updatedUser: any = {
                    verificationCode: await Util.passwordHashing(verificationCode),
                };

                let userWithVerificationCode = await UserDao.updateUser(user._id, updatedUser);

                if (!userWithVerificationCode) {
                    return res.sendError("Something went wrong with verification code.");
                }
            } catch (error) {
                return res.sendError(error);
            }

            let isEmailSent = await EmailService.sendVerifyEmail(
                user,
                "Pencil my deal - Verify your email.",
                verificationCode,
                "Thank you for signing up with Pencil my deal!",
                "To proceed with your account you have to verify your email. Please enter the following OTP in the verify section."
            );
            if (!user) {
                return res.sendError("User signup failed! Please try again later.");
            }

            if (isEmailSent) {
                return res.sendSuccess(user, "Success");
            } else {
                return res.sendError("Email not sent.");
            }

        } catch (error) {
            return res.sendError(error);
        }
    }

    export async function verifyUserByCode(req: Request, res: Response, next: NextFunction) {
        const verificationCode = req.body.verificationCode;
        const userId = req.body.userId;
        try {
            let user = await UserDao.getUserById(userId);
            let updatedUser = null;

            if (!user.verificationCode) {
                return res.sendError("User is already verified.");
            }

            let isMatch = await user.compareVerificationCode(verificationCode);

            if (isMatch) {
                try {
                    const details: any = {
                        verifiedStatus: UserStatus.VERIFIED,
                    };
                    console.log(details)
                    const userDetails = await UserDao.updateUser(userId, details);

                    if (!userDetails) {
                        return res.sendError("Something went wrong! Please try again later.");
                    }

                    try {
                        updatedUser = await AdminDao.unSetField(userId);

                        if (!updatedUser) {
                            return res.sendError("Verification code could not be removed from the document");
                        }
                    } catch (error) {
                        return res.sendError(error);
                    }

                    await EmailService.sendWelcomeEmail(user, "Welcome To Pencil My Deal");

                    return res.sendSuccess(null, "Successfully verified.");
                } catch (error) {
                    return res.sendError(error);
                }
            } else {
                return res.sendError("Invalid verification code.");
            }
        } catch (error) {
            return res.sendError(error);
        }
    }


    export async function getAllCustomerAdmins(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
        if (req.user.role == UserRole.SUPER_ADMIN) {
            try {
                const list = await AdminDao.getAllAdminCustomers(limit, offset);
                const adminCustomersCount = await AdminDao.getAllAdminCustomersCount();
                const userCount = await AdminDao.getAllAdminUsersCount();
                const dealCount = await DealDao.getAllDealCount();

                const data = {
                    set: list,
                    adminCount: adminCustomersCount,
                    userCount: userCount,
                    dealCount: dealCount
                };
                return res.sendSuccess(data, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }

    export async function getAllPendingCustomerAdmins(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);

        if (req.user.role == UserRole.SUPER_ADMIN) {
            try {
                const list = await AdminDao.getAllPendingAdminCustomers(limit, offset);

                return res.sendSuccess(list, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }

    export async function getAllUsersByCustomerId(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
        const customerAdminId = req.params.id;

        if (req.user.role == UserRole.SUPER_ADMIN) {
            try {
                const userList = await AdminDao.getAllUsers(customerAdminId, limit, offset);

                return res.sendSuccess(userList, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }

    export async function searchCustomerAdminByAdmin(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
        const searchText = req.body.searchableString;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.sendError(errors.array()[0]["msg"]);
        }

        if (req.user.role == UserRole.SUPER_ADMIN) {
            try {
                const result = await AdminDao.searchCustomerAdmin(searchText, limit, offset);
                const data = {
                    cusAdminData: result,
                };

                return res.sendSuccess(data, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("No permission to access!");
        }
    }

    export async function searchPendingCustomerAdminByAdmin(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.params.limit);
        const offset = Number(req.params.offset);
        const searchText = req.body.searchableString;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.sendError(errors.array()[0]["msg"]);
        }

        if (req.user.role == UserRole.SUPER_ADMIN) {
            try {
                const result = await AdminDao.searchPendingCustomerAdmin(searchText, limit, offset);
                const data = {
                    cusAdminData: result,
                };

                return res.sendSuccess(data, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("No permission to access!");
        }
    }

    export async function getSingleUserById(req: Request, res: Response, next: NextFunction) {
        const customerAdminId = req.params.id;
        if (req.user.role == UserRole.SUPER_ADMIN) {
            try {
                const user = await AdminDao.getSingleUser(customerAdminId);

                return res.sendSuccess(user, "Success");
            } catch (error) {
                return res.sendError(error);
            }
        } else {
            return res.sendError("Invalid user role.");
        }
    }
}