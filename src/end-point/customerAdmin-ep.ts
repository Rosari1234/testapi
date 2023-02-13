import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import multer = require("multer");
import path = require("path");
import { AdminDao } from "../dao/admin-dao";
import { CustomerAdminDao } from "../dao/customerAdmin-dao";
import { UserDao } from "../dao/user-dao";
import { StringOrObjectId, Util } from "../common/util";
import { DUser, IUser, SignedUpAs, UserRole, UserActivation } from "../models/user-model";
import { DAdmin, IAdmin } from "../models/admin-model";
import { DCustomerAdmin, ICustomerAdmin, SubscriptionStatus } from "../models/customerAdmin-model";
import { DAdminUser, IAdminUser } from "../models/adminUser-model";
import { check, validationResult } from "express-validator";
import { DUpload, IUpload } from "../models/upload-model";
import { UploadDao } from "../dao/upload-dao";
import { DealDao } from "../dao/deal-dao";
import { EmailService } from "../mail/config";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var fs = require("fs");
let mongoose = require("mongoose");

export enum UploadCategory {
  PROFILE_IMAGE = "PROFILE_IMAGE",
}


export namespace CustomerAdminEp {


  export async function createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const customerAdminId = req.user._id;
    let uploadCategory = UploadCategory.PROFILE_IMAGE;

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await updateTherapisProfileValidationRules(req, cb);
      },
    });



    async function updateTherapisProfileValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        let profileDetails = JSON.parse(req.body.profileDetails);

        let isEmailUsed = await UserDao.getUserByEmail(profileDetails.email);
        if (isEmailUsed) {
            return res.sendError("Provided email is already taken.");
        }


        if (
          !profileDetails.firstName ||
          typeof profileDetails.firstName !== "string"
        ) {
          return cb(Error("First name is required."), null);
        }

        if (
          !profileDetails.lastName ||
          typeof profileDetails.lastName !== "string"
        ) {
          return cb(Error("Last name is required."), null);
        }

        if (!profileDetails.email || typeof profileDetails.email !== "string") {
          return cb(Error("Email is required."), null);
        }

        if (
          !profileDetails.deletingImageId ||
          typeof profileDetails.deletingImageId !== "string"
        ) {
          return cb(Error("Deleting profile image id is required."), null);
        }

        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) =>
              cb(error, "destination")
            );
          } else {
            return cb(null, destination);
          }
        });

        console.log(profileDetails);
      } catch (error) {
        return cb(Error(error), null);
      }
    }

    async function deleteOldFiles(uploadId: string) {
      let isDeleted = false;

      let resultHandler = async function (error: any) {
        if (error) {
          console.log("Unlink failed.", error);
        } else {
          console.log("File deleted.");
        }
      };

      try {
        let oldFile = await UploadDao.getUpload(uploadId);
        await fs.unlink(oldFile.path, resultHandler);
        await UploadDao.deleteUploadById(uploadId);
        isDeleted = true;
      } catch (error) {
        isDeleted = false;
      }
      return isDeleted;
    }

    const upload = multer({ storage: storage }).single("profileImage");

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + " ");
        } else {
          let profileDetails = JSON.parse(req.body.profileDetails);
          if (req.file == null || req.file === undefined || !req.file) {
            if (!profileDetails?.password || profileDetails?.password == undefined || profileDetails?.password == null) {
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                customerAdminId: customerAdminId,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                role: UserRole.USER,
                validationCode: UserActivation.ACTIVE

              };

              console.log("adminUser1", adminUser)
              let user = await CustomerAdminDao.signUpUser(adminUser);

              if (!user) {
                return res.sendError("Failed to create the user.");
              }

              return res.sendSuccess(user, "User account has been created successfully.");
            } else {
              const newPassword = await Util.passwordHashing(profileDetails.password)
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                password:  profileDetails.password,
                customerAdminId: customerAdminId,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                role: UserRole.USER,
                validationCode: UserActivation.ACTIVE
              };
              console.log("adminUser2", adminUser)
              let user = await CustomerAdminDao.signUpUser(adminUser);

              if (!user) {
                return res.sendError("Failed to create the user.");
              }

              return res.sendSuccess(user, "User account has been created successfully.");
            }
          } else {
            let profileDetails = JSON.parse(req.body.profileDetails);
            const image = req.file;
            let isFileDeleted = false;
            if (profileDetails.deletingImageId !== "none") {
              isFileDeleted = await deleteOldFiles(
                profileDetails.deletingImageId
              );

              if (!isFileDeleted)
                return res.sendError("Error while deleting the previous file");
            }

            let signRequired: boolean = false;
            if (req.body.signRequired !== undefined) {
              signRequired = req.body.signRequired;
            }

            const data: DUpload = {
              originalName: image.originalname.replace(/ /g, ""),
              name: image.filename,
              type: image.mimetype,
              path: image.path,
              fileSize: image.size,
              extension: path.extname(image.originalname) || req.body.extension,
              category: uploadCategory,
              signRequired: signRequired,
            };

            let uploadedImage: IUpload = await UploadDao.createUpload(data);

            if (uploadedImage == null) {
              return res.sendError("Error while uploading the cover image.");
            }

            if (!profileDetails?.password || profileDetails?.password == undefined || profileDetails?.password == null) {
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                customerAdminId: customerAdminId,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                profileImageId: uploadedImage._id,
                role: UserRole.USER,
                validationCode: UserActivation.ACTIVE
              };
              console.log("adminUser3", adminUser)
              let user = await CustomerAdminDao.signUpUser(adminUser);

              if (!user) {
                return res.sendError("Failed to create the user.");
              }

              return res.sendSuccess(user, "User account has been created successfully.");
            } else {
              const newPassword = await Util.passwordHashing(profileDetails.password)
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                customerAdminId: customerAdminId,
                password:  profileDetails.password,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                profileImageId: uploadedImage._id,
                role: UserRole.USER,
                validationCode: UserActivation.ACTIVE
              };
              console.log("adminUser4", adminUser)
              let user = await CustomerAdminDao.signUpUser(adminUser);

              if (!user) {
                return res.sendError("Failed to create the user.");
              }

              return res.sendSuccess(user, "User account has been created successfully.");
            }
          }
        }
      });
    } catch (error) {
      return res.sendError("Failed to upload image. " + error);
    }
  }



  export async function updateCustomerUserProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;
    let uploadCategory = UploadCategory.PROFILE_IMAGE;

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await updateTherapisProfileValidationRules(req, cb);
      },
    });

    async function updateTherapisProfileValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {
        let profileDetails = JSON.parse(req.body.profileDetails);

        if (
          !profileDetails.firstName ||
          typeof profileDetails.firstName !== "string"
        ) {
          return cb(Error("First name is required."), null);
        }

        if (
          !profileDetails.lastName ||
          typeof profileDetails.lastName !== "string"
        ) {
          return cb(Error("Last name is required."), null);
        }

        if (!profileDetails.email || typeof profileDetails.email !== "string") {
          return cb(Error("Email is required."), null);
        }

        if (
          !profileDetails.deletingImageId ||
          typeof profileDetails.deletingImageId !== "string"
        ) {
          return cb(Error("Deleting profile image id is required."), null);
        }

        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) =>
              cb(error, "destination")
            );
          } else {
            return cb(null, destination);
          }
        });

        console.log(profileDetails);
      } catch (error) {
        return cb(Error(error), null);
      }
    }

    async function deleteOldFiles(uploadId: string) {
      let isDeleted = false;

      let resultHandler = async function (error: any) {
        if (error) {
          console.log("Unlink failed.", error);
        } else {
          console.log("File deleted.");
        }
      };

      try {
        let oldFile = await UploadDao.getUpload(uploadId);
        await fs.unlink(oldFile.path, resultHandler);
        await UploadDao.deleteUploadById(uploadId);
        isDeleted = true;
      } catch (error) {
        isDeleted = false;
      }
      return isDeleted;
    }

    const upload = multer({ storage: storage }).single("profileImage");

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + " ");
        } else {
          let profileDetails = JSON.parse(req.body.profileDetails);
          if (req.file == null || req.file === undefined || !req.file) {
            if (!profileDetails?.password || profileDetails?.password == undefined || profileDetails?.password == null) {
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            } else {
              const newPassword = await Util.passwordHashing(profileDetails.password)
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                password: newPassword,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            }
          } else {
            let profileDetails = JSON.parse(req.body.profileDetails);
            const image = req.file;
            let isFileDeleted = false;
            if (profileDetails.deletingImageId !== "none") {
              isFileDeleted = await deleteOldFiles(
                profileDetails.deletingImageId
              );

              if (!isFileDeleted)
                return res.sendError("Error while deleting the previous file");
            }

            let signRequired: boolean = false;
            if (req.body.signRequired !== undefined) {
              signRequired = req.body.signRequired;
            }

            const data: DUpload = {
              originalName: image.originalname.replace(/ /g, ""),
              name: image.filename,
              type: image.mimetype,
              path: image.path,
              fileSize: image.size,
              extension: path.extname(image.originalname) || req.body.extension,
              category: uploadCategory,
              signRequired: signRequired,
            };

            let uploadedImage: IUpload = await UploadDao.createUpload(data);

            if (uploadedImage == null) {
              return res.sendError("Error while uploading the cover image.");
            }

            if (!profileDetails?.password || profileDetails?.password == undefined || profileDetails?.password == null) {
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                profileImageId: uploadedImage._id,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            } else {
              const newPassword = await Util.passwordHashing(profileDetails.password)
              const adminUser: DAdminUser = {
                email: profileDetails.email,
                password: newPassword,
                firstName: profileDetails.firstName,
                lastName: profileDetails.lastName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                profileImageId: uploadedImage._id,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            }
          }
        }
      });
    } catch (error) {
      return res.sendError("Failed to upload image. " + error);
    }
  }





  export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    let uploadCategory = UploadCategory.PROFILE_IMAGE;

    const storage = multer.diskStorage({
      destination: async (req, FileRes, cb) => {
        await updateTherapisProfileValidationRules(req, cb);
      },
    });

    async function updateTherapisProfileValidationRules(req: any, cb: any) {
      let destination = `${process.env.UPLOAD_PATH}/${uploadCategory}`;

      try {

        let profileDetails = JSON.parse(req.body.profileDetails);

        if (!profileDetails.customerBusinessName || typeof profileDetails.customerBusinessName !== "string") {
          return cb(Error("Customer Business name is required."), null);
        }

        if (!profileDetails.primaryContactName || typeof profileDetails.primaryContactName !== "string") {
          return cb(Error("Primary Contact name is required."), null);
        }

        if (!profileDetails.email || typeof profileDetails.email !== "string") {
          return cb(Error("Email is required."), null);
        }


        if (!profileDetails.deletingImageId || typeof profileDetails.deletingImageId !== "string") {
          return cb(Error("Deleting profile image id is required."), null);
        }

        fs.access(destination, (error: any) => {
          if (error) {
            return fs.mkdir(destination, (error: any) => cb(error, "destination"));
          } else {
            return cb(null, destination);
          }
        });
      } catch (error) {
        return cb(Error(error), null);
      }
    }


    async function deleteOldFiles(uploadId: string) {
      let isDeleted = false;

      let resultHandler = async function (error: any) {
        if (error) {
          console.log("Unlink failed.", error);
        } else {
          console.log("File deleted.");
        }
      };

      try {
        let oldFile = await UploadDao.getUpload(uploadId);
        await fs.unlink(oldFile.path, resultHandler);
        await UploadDao.deleteUploadById(uploadId);
        isDeleted = true;
      } catch (error) {
        isDeleted = false;
      }
      return isDeleted;
    }

    const upload = multer({ storage: storage }).single("profileImage");

    try {
      upload(req, res, async function (error: any) {
        if (error) {
          return res.sendError(error + " ");
        } else {
          let profileDetails = JSON.parse(req.body.profileDetails);
          if (req.file == null || req.file == undefined || !req.file) {

            if (!profileDetails?.password || profileDetails?.password == undefined || profileDetails?.password == null) {
              const adminUser: DCustomerAdmin = {
                email: profileDetails.email,
                customerBusinessName: profileDetails.customerBusinessName,
                primaryContactName: profileDetails.primaryContactName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            } else {
              const newPassword = await Util.passwordHashing(profileDetails.password)
              const adminUser: DCustomerAdmin = {
                email: profileDetails.email,
                password: newPassword,
                customerBusinessName: profileDetails.customerBusinessName,
                primaryContactName: profileDetails.primaryContactName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            }


          } else {
            let profileDetails = JSON.parse(req.body.profileDetails);
            const image = req.file;
            let isFileDeleted = false;
            if (profileDetails.deletingImageId !== "none") {
              isFileDeleted = await deleteOldFiles(profileDetails.deletingImageId);

              if (!isFileDeleted) return res.sendError("Error while deleting the previous file");
            }

            let signRequired: boolean = false;
            if (req.body.signRequired !== undefined) {
              signRequired = req.body.signRequired;
            }

            const data: DUpload = {
              originalName: image.originalname.replace(/ /g, ""),
              name: image.filename,
              type: image.mimetype,
              path: image.path,
              fileSize: image.size,
              extension: path.extname(image.originalname) || req.body.extension,
              category: uploadCategory,
              signRequired: signRequired,
            };


            let uploadedImage: IUpload = await UploadDao.createUpload(data);
            if (uploadedImage == null) {
              return res.sendError("Error while uploading the cover image.");
            }

            if (!profileDetails?.password || profileDetails?.password == undefined || profileDetails?.password == null) {
              const adminUser: DCustomerAdmin = {
                email: profileDetails.email,
                customerBusinessName: profileDetails.customerBusinessName,
                primaryContactName: profileDetails.primaryContactName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                profileImageId: uploadedImage._id,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            } else {
              const newPassword = await Util.passwordHashing(profileDetails.password)
              const adminUser: DCustomerAdmin = {
                email: profileDetails.email,
                password: newPassword,
                customerBusinessName: profileDetails.customerBusinessName,
                primaryContactName: profileDetails.primaryContactName,
                streetAddress: profileDetails.streetAddress,
                city: profileDetails.city,
                state: profileDetails.state,
                zipCode: profileDetails.zipCode,
                phoneNumber: profileDetails.phoneNumber,
                profileImageId: uploadedImage._id,
              };
              let user = await UserDao.updateUser(userId, adminUser);

              if (!user) {
                return res.sendError("Failed to update the user.");
              }

              return res.sendSuccess(user, "Your profile has been updated successfully.");
            }

          }
        }
      });
    } catch (error) {
      return res.sendError("Failed to upload image. " + error);
    }

  }

  export async function updateCustomerAdminProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.user._id;
    try {
      const updatedUser = await CustomerAdminDao.updateCustomerAdmin(userId, {
        subscriptionLevel: req.body.subscriptionLevel,
      });

      return res.sendSuccess(updatedUser, "Your profile has been updated successfully.");
    } catch (error) {
      return res.sendError(error);
    }
  }


  
  export async function blockUserProfile(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;
    console.log('userid', userId)

    try {

      let profileDetails = req.body
      const adminUser: DAdminUser = {
        email: profileDetails.email,
        firstName: profileDetails.firstName,
        lastName: profileDetails.lastName,
        validationCode: profileDetails.validationCode,
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

  export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const customerAdminId = req.user._id;

    if (req.user.role == UserRole.CUSTOMER_ADMIN) {
      try {
        const clientList = await CustomerAdminDao.getAllUsers(customerAdminId, limit, offset);

        const userCount = await CustomerAdminDao.getAllUserssCount(customerAdminId);

        const dealCount = await DealDao.getAllAdminDealdCount(customerAdminId);

        const data = {
          set: clientList,
          count: userCount,
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



  export async function customerAdminUpdate(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;

    if (role == UserRole.CUSTOMER_ADMIN) {
      try {
        const { paymentMethod } = req.body;
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);

        let stripeCusId;

        if (client.stripeCustomerId) {
          const stripeCustomer = await stripe.customers.retrieve(client.stripeCustomerId);

          if (!stripeCustomer.deleted) {
            stripeCusId = stripeCustomer.id;
            await stripe.paymentMethods.attach(paymentMethod, { customer: stripeCusId });
          } else {
            const customer = await stripe.customers.update(
              stripeCusId,
              { default_payment_method: paymentMethod }
            );

            stripeCusId = customer.id;
          }
        } else {
          const customer = await stripe.customers.update(
            stripeCusId,
            { default_payment_method: paymentMethod }
          );

          stripeCusId = customer.id;
        }

        client.save();

        return res.sendSuccess(
          "Payment method update successfully."
        );
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }


  export async function customerAdminSubscribe(req: Request, res: Response, next: NextFunction) {
    const role = req.user.role;

    if (role == UserRole.CUSTOMER_ADMIN) {
      try {
        const { paymentMethod } = req.body;
        const { plan } = req.body;
        const { trialMode } = req.body;
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);

        let stripeCusId;

        if (client.stripeCustomerId) {
          const stripeCustomer = await stripe.customers.retrieve(client.stripeCustomerId);

          if (!stripeCustomer.deleted) {
            stripeCusId = stripeCustomer.id;
            await stripe.paymentMethods.attach(paymentMethod, { customer: stripeCusId });
          } else {
            const customer = await stripe.customers.create({
              payment_method: paymentMethod,
              email: client.email,
              name: client.primaryContactName,
              invoice_settings: {
                default_payment_method: paymentMethod,
              },
            });

            stripeCusId = customer.id;
          }
        } else {
          const customer = await stripe.customers.create({
            payment_method: paymentMethod,
            email: client.email,
            name: client.primaryContactName,
            invoice_settings: {
              default_payment_method: paymentMethod,
            },
          });

          stripeCusId = customer.id;
        }
        const trail = Math.floor(+new Date() / 1000) + 7 * 24 * 60 * 60
        let subscription;
        if (plan == "SILVER" && trialMode == true) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCusId,
            items: [{ price: process.env.STRIPE_PRICE_ID_SILVER }],
            expand: ["latest_invoice.payment_intent"],
            trial_end: trail,
            default_payment_method: paymentMethod,
          });
        } else if (plan == "SILVER" && trialMode == false) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCusId,
            items: [{ price: process.env.STRIPE_PRICE_ID_SILVER }],
            expand: ["latest_invoice.payment_intent"],
            default_payment_method: paymentMethod,
          });
        } else if (plan == "GOLD" && trialMode == true) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCusId,
            items: [{ price: process.env.STRIPE_PRICE_ID_GOLD }],
            expand: ["latest_invoice.payment_intent"],
            trial_end: trail,
            default_payment_method: paymentMethod,
          });
        }
        else if (plan == "GOLD" && trialMode == false) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCusId,
            items: [{ price: process.env.STRIPE_PRICE_ID_GOLD }],
            expand: ["latest_invoice.payment_intent"],
            default_payment_method: paymentMethod,
          });
        }
        else if (plan == "PLATINUM" && trialMode == true) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCusId,
            items: [{ price: process.env.STRIPE_PRICE_ID_PLATINUM }],
            expand: ["latest_invoice.payment_intent"],
            trial_end: trail,
            default_payment_method: paymentMethod,
          });
        }
        else if (plan == "PLATINUM" && trialMode == false) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCusId,
            items: [{ price: process.env.STRIPE_PRICE_ID_PLATINUM }],
            expand: ["latest_invoice.payment_intent"],
            default_payment_method: paymentMethod,
          });
        }


        const status = subscription["status"];
        const clientSecret = subscription["client_secret"];
        const subscriptionId = subscription.id;
        const subscriptionStatus = subscription.status;

        client.stripeCustomerId = stripeCusId;
        client.subscriptionId = subscriptionId;
        client.subscriptionStatus = subscriptionStatus;

        client.save();

        return res.sendSuccess(
          {
            clientSecret: clientSecret,
            status: status,
            subscriptionId: subscriptionId,
            subscriptionStatus: subscriptionStatus,
          },
          "New subscription created successfully."
        );
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function getActiveSubscription(req: Request, res: Response) {
    const role = req.user.role;

    if (role == UserRole.CUSTOMER_ADMIN) {
      try {
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);

        if (!client.subscriptionId) {
          return res.sendError("No active subscription found.");
        }

        const subscription = await stripe.subscriptions.retrieve(client.subscriptionId);

        if (client.subscriptionStatus != subscription.status) {
          client.subscriptionStatus = subscription.status;
          client.save();
        }

        if (subscription) {
          return res.sendSuccess(subscription, "Received active subscription.");
        } else {
          return res.sendError("No active subscription found.");
        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function getBillingHistory(req: Request, res: Response) {
    const role = req.user.role;
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    if (role == UserRole.CUSTOMER_ADMIN) {
      try {
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);

        if (!client.stripeCustomerId) {
          return res.sendError("Not an active stripe customer.");
        }

        const paymentIntents = await stripe.paymentIntents.list({
          customer: client.stripeCustomerId,
        });

        if (paymentIntents) {
          return res.sendSuccess(paymentIntents, "Received payment intents.");
        } else {
          return res.sendError("No active subscription found.");
        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function cancelSubscription(req: Request, res: Response) {
    const role = req.user.role;

    if (role == UserRole.CUSTOMER_ADMIN) {
      try {
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);


        if (
          !client.subscriptionId ||
          (client.subscriptionStatus != SubscriptionStatus.ACTIVE && client.subscriptionStatus != SubscriptionStatus.PAST_DUE && client.subscriptionStatus != SubscriptionStatus.TRIALING)
        ) {
          return res.sendError("No active subscription to cancel.");
        }

        const subscriptionUpdated = stripe.subscriptions.update(client.subscriptionId, { cancel_at_period_end: true },);




        if (subscriptionUpdated) {
          return res.sendSuccess(subscriptionUpdated, "Successfully Canceled.");
        } else {
          return res.sendError("Unable to cancel subscription.");
        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function resumeSubscription(req: Request, res: Response) {
    const role = req.user.role;

    if (role == UserRole.CUSTOMER_ADMIN) {
      try {
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);


        if (
          !client.subscriptionId ||
          (client.subscriptionStatus != SubscriptionStatus.ACTIVE && client.subscriptionStatus != SubscriptionStatus.PAST_DUE && client.subscriptionStatus != SubscriptionStatus.TRIALING)
        ) {
          return res.sendError("No active subscription to cancel.");
        }

        const subscriptionUpdated = stripe.subscriptions.update(client.subscriptionId, { cancel_at_period_end: false });

        if (subscriptionUpdated) {
          return res.sendSuccess(subscriptionUpdated, "Successfully Resumed.");
        } else {
          return res.sendError("Unable to resume subscription.");
        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function serachUserByCustomerAdmin(req: Request, res: Response, next: NextFunction) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const searchText = req.body.searchableString;
    const userId = req.body.userId

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }

    if (req.user.role == UserRole.CUSTOMER_ADMIN || req.user.role == UserRole.SUPER_ADMIN) {
      try {
        const result = await CustomerAdminDao.searchUser(userId, searchText, limit, offset);
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

  export async function changeDefaultPaymentMethod(req: Request, res: Response) {
    const role = req.user.role;

    if (role == UserRole.SUPER_ADMIN) {
      try {
        const client = await CustomerAdminDao.getCustomerAdmin(req.user._id);

        if (!client.stripeCustomerId) {
          return res.sendError("Not a valid stripe customer.");
        }

        const paymentMethodId = req.body.paymentMethodId;

        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        if (!paymentMethod) {
          return res.sendError("No such payment method found.");
        }

        if (paymentMethod.customer != client.stripeCustomerId) {
          return res.sendError("You don't have access to this payment method.");
        }

        if (client.subscriptionId && client.subscriptionId != "") {
          if (client.subscriptionStatus != SubscriptionStatus.ACTIVE && client.subscriptionStatus != SubscriptionStatus.PAST_DUE) {
            return res.sendError("No active subscription to update.");
          }

          const subscriptionUpdated = stripe.subscriptions.update(client.subscriptionId, { default_payment_method: paymentMethodId });

          if (subscriptionUpdated) {
            return res.sendSuccess(subscriptionUpdated, "Default payment method is updated successfully.");
          } else {
            return res.sendError("No active subscription found.");
          }
        } else {
          const customer = await stripe.customers.update(client.stripeCustomerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });

          if (customer) {
            return res.sendSuccess("Default payment method is updated successfully.");
          }

        }
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

}