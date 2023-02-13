import * as mongoose from "mongoose";
import { Schema } from "mongoose";
export const BuyerSchema = new mongoose.Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },

    address: {
      type: Schema.Types.String,
      required: true,
    },

    city: {
      type: Schema.Types.String,
      required: true,
    },

    state: {
      type: Schema.Types.String,
      required: true,
    },
    payOff: {
      type: Schema.Types.Boolean,
      required: true,
    },

    zipCode: {
      type: Schema.Types.String,
      required: true,
    },

    phoneNumber: {
      type: Schema.Types.String,
      required: true,
    },

    email: {
      type: Schema.Types.String,
      required: true,
    },
  },
  { _id: false }
);
