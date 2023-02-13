import { NextFunction, Request, Response } from "express";
import * as mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import { Types } from "mongoose";

export type ObjectIdOr<T extends mongoose.Document> = mongoose.Types.ObjectId | T;

export type StringOrObjectId = string | mongoose.Types.ObjectId;

export namespace Util {
  export function withErrorHandling(requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return function updateProject(req: Request, res: Response, next: NextFunction) {
      requestHandler(req, res, next).catch(next);
    };
  }

  export async function passwordHashing(password: string): Promise<any> {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  export async function getLastDayOfMonth(year: number, month: number): Promise<any> {
    return new Date(year, month + 1, 0).getDate();
  }

  export function isObjectId(v: string): boolean {
    return mongoose.Types.ObjectId.isValid(v) && Types.ObjectId(v).toHexString() == v;
  }

  export async function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }
}
