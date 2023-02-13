import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import multer = require("multer");
import path = require("path");

import { UserDao } from "../dao/user-dao";
import { StringOrObjectId, Util } from "../common/util";
import { DAdmin, IAdmin } from "../models/admin-model";
import { DCustomerAdmin, ICustomerAdmin } from "../models/customerAdmin-model";
import { DAdminUser, IAdminUser } from "../models/adminUser-model";
import { UploadCategory } from "./customerAdmin-ep";
import { UploadDao } from "../dao/upload-dao";
import { DUpload, IUpload } from "../models/upload-model";
var fs = require("fs");
let mongoose = require("mongoose");

export namespace AdminUserEp {
  export async function updateUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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
                lastName: profileDetails.firstName,
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
                lastName: profileDetails.firstName,
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
                lastName: profileDetails.firstName,
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
                lastName: profileDetails.firstName,
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
}
