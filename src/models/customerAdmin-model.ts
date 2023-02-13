import * as mongoose from "mongoose";
import { Types } from "mongoose";

import { DUser, IUser } from "./user-model";
export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  UNPAID = "unpaid",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  TRIALING = "trialing",
  ALL = "all",
  ENDED = "ended",
}

interface Common {
  customerBusinessName?: string;
  primaryContactName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionLevel?: string;
  validationCode?: string;
  isSubscribe?:Boolean; 
   
}

export interface DCustomerAdmin extends Common, DUser { }

export interface ICustomerAdmin extends Common, IUser, mongoose.Document { }
