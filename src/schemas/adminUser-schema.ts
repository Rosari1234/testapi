import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { UserRole } from "../models/user-model";
import User, { UserSchemaOptions } from "./user-schema";

import { IAdminUser } from "../models/adminUser-model";

export const adminUserSchema = new mongoose.Schema({
  firstName: {
    type: Schema.Types.String,
    required: false,
  },
  lastName: {
    type: Schema.Types.String,
    required: false,
  },
  customerAdminId: {
    type: Schema.Types.String,
    required: false,
  }
}, UserSchemaOptions);

export const AdminUser = User.discriminator<IAdminUser>('AdminUser', adminUserSchema, UserRole.USER);

export default AdminUser;