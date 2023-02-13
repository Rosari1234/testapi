import * as mongoose from "mongoose";
import { UserRole } from "../models/user-model";
import User, { UserSchemaOptions } from "./user-schema";
import { Schema } from "mongoose";

import { ICustomerAdmin } from "../models/customerAdmin-model";

export const customerAdminSchema = new mongoose.Schema({
  customerBusinessName: {
    type: Schema.Types.String,
    required: false,
  },
  primaryContactName: {
    type: Schema.Types.String,
    required: false,
  },
  streetAddress: {
    type: Schema.Types.String,
    required: false,
  },
  city: {
    type: Schema.Types.String,
    required: false,
  },
  phoneNumber: {
    type: Schema.Types.String,
    required: false,
  },
  state: {
    type: Schema.Types.String,
    required: false,
  },
  zipCode: {
    type: Schema.Types.String,
    required: false,
  },
  subscriptionLevel: {
    type: Schema.Types.String,
    required: false,
  },
  stripeCustomerId: {
    type: Schema.Types.String,
    required: false
  },
  subscriptionId: {
    type: Schema.Types.String,
    required: false
  },
  subscriptionStatus: {
    type: Schema.Types.String,
    required: false
  },
}, UserSchemaOptions);

export const CustomerAdmin = User.discriminator<ICustomerAdmin>('CustomerAdmin', customerAdminSchema, UserRole.CUSTOMER_ADMIN);

export default CustomerAdmin;