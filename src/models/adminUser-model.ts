import * as mongoose from "mongoose";
import { Types } from "mongoose";

import { DUser, IUser } from "./user-model";

interface Common {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  customerAdminId?: Types.ObjectId;

}

export interface DAdminUser extends Common, DUser { } 

export interface IAdminUser extends Common, IUser, mongoose.Document { }