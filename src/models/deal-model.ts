import * as mongoose from "mongoose";
import { BuyerInfoModel } from "./sub-models/buyer-model";
import { PurchasedModel } from "./sub-models/purchased-model";
import { TradeInfoModel } from "./sub-models/trade-model";
import { Types } from "mongoose";
import { StringOrObjectId } from "../common/util";

interface Common {
  userId: Types.ObjectId;
  customerAdminId: Types.ObjectId;
  // buyerInfo: BuyerInfoModel;
  purchased: PurchasedModel;
  tradeInfo: TradeInfoModel;
  sellingPrice: number;
  // tradeAllowance: number;
  tradePayoff?: number;
  serviceContract: number;
  gapInsuarance: number;
  paintProtection: number;
  docFee: number;
  option1: number;
  option2: number;
  totalPrice: number;
  term: number;
  rate: number;
  down: number;
  cashDeal: boolean;
  payOff: boolean;
  payment: string;
  firstPayment: number;
  signature: String;
  status: String;
  date: Date;

  // caculation variables
  term1: number;
  term2: number;
  term3: number;
  rate1: number;
  rate2: number;
  rate3: number;
  down1: number;
  down2: number;
  down3: number;
  R1price1: number;
  R1price2: number;
  R1price3: number;
  R2price1: number;
  R2price2: number;
  R2price3: number;
  R3price1: number;
  R3price2: number;
  R3price3: number;
}

export interface DDeal extends Common {}

export interface IDeal extends Common, mongoose.Document {
  [x: string]: any;
  _id: Types.ObjectId;
}
