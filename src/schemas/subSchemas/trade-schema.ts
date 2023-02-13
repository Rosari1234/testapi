import * as mongoose from "mongoose";
import { Schema } from "mongoose";

export const TradeSchema = new mongoose.Schema(
  {
    year:{
        type:Schema.Types.Number,
        required:false,
    },

    make: {
        type: Schema.Types.String,
        required: false, 
      },

    model: {
        type: Schema.Types.String,
        required: false, 
      },

    vin: {
        type: Schema.Types.String,
        required: false,
      },

    miles: {
        type: Schema.Types.String,
        required: false,
      },
},
{ _id: false }
);

