import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { IDeal } from "../models/deal-model";
import { BuyerSchema } from "./subSchemas/buyer-schema";
import { TradeSchema } from "./subSchemas/trade-schema";
import { Purchasedschema } from "./subSchemas/purchased-schema";
import User from "./user-schema";
import CustomerAdmin from "./customerAdmin-schema";
import AdminUser from "./adminUser-schema";

const schemaOptions: mongoose.SchemaOptions = {
  _id: true,
  id: false,
  timestamps: true,
  skipVersioning: true,
  strict: false,
  toJSON: {
    getters: true,
    virtuals: true,
  },
};

export const DealSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: AdminUser.modelName,
  },
  customerAdminId: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: CustomerAdmin.modelName,
  },
  // buyerInfo: {
  //   type: BuyerSchema,
  // },
  purchased: {
    type: Purchasedschema,
  },
  tradeInfo: {
    type: TradeSchema,
  },
  sellingPrice: {
    type: Schema.Types.Number,
    require: true,
  },
  // tradeAllowance: {
  //   type: Schema.Types.Number,
  //   require: true,
  // },

  tradePayoff: {
    type: Schema.Types.Number,
    require: true,
  },

  serviceContract: {
    type: Schema.Types.Number,
    require: true,
  },
  gapInsuarance: {
    type: Schema.Types.Number,
    require: true,
  },
  paintProtection: {
    type: Schema.Types.Number,
    require: true,
  },
  docFee: {
    type: Schema.Types.Number,
    require: true,
  },
  option1: {
    type: Schema.Types.Number,
    require: false,
  },
  option2: {
    type: Schema.Types.Number,
    require: false,
  },
  totalPrice: {
    type: Schema.Types.Number,
    require: true,
  },
  term: {
    type: Schema.Types.Number,
    require: true,
  },
  rate: {
    type: Schema.Types.Number,
    require: true,
  },
  down: {
    type: Schema.Types.Number,
    require: true,
  },
  cashDeal: {
    type: Schema.Types.Boolean,
    dafault: true,
  },
  payOff: {
    type: Schema.Types.Boolean,
    dafault: true,
  },
  payment: {
    type: Schema.Types.String,
    require: true,
  },

  firstPayment: {
    type: Schema.Types.Number,
    require: false,
  },

  term1: {
    type: Schema.Types.Number,
    require: true,
  },
  term2: {
    type: Schema.Types.Number,
    require: true,
  },
  term3: {
    type: Schema.Types.Number,
    require: true,
  },

  rate1: {
    type: Schema.Types.Number,
    require: true,
  },
  rate2: {
    type: Schema.Types.Number,
    require: true,
  },
  rate3: {
    type: Schema.Types.Number,
    require: true,
  },

  down1: {
    type: Schema.Types.Number,
    require: true,
  },
  down2: {
    type: Schema.Types.Number,
    require: true,
  },

  down3: {
    type: Schema.Types.Number,
    require: true,
  },
  R1price1: {
    type: Schema.Types.Number,
    require: true,
  },
  R1price2: {
    type: Schema.Types.Number,
    require: true,
  },
  R1price3: {
    type: Schema.Types.Number,
    require: true,
  },
  R2price1: {
    type: Schema.Types.Number,
    require: true,
  },
  R2price2: {
    type: Schema.Types.Number,
    require: true,
  },
  R2price3: {
    type: Schema.Types.Number,
    require: true,
  },
  R3price1: {
    type: Schema.Types.Number,
    require: true,
  },
  R3price2: {
    type: Schema.Types.Number,
    require: true,
  },
  R3price3: {
    type: Schema.Types.Number,
    require: true,
  },
  signature: {
    type: Schema.Types.String,
    require: true,
  },
  status: {
    type: Schema.Types.String,
    require: true,
  },
  date: {
    type: Schema.Types.Date,
    require: true,
  },
});

const Deal = mongoose.model<IDeal>("Deal", DealSchema);

export default Deal;
