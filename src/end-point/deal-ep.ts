import { check, validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import { UserDao } from "../dao/user-dao";
import { DealActivation, UserActivation, UserRole } from "../models/user-model";
import { DDeal } from "../models/deal-model";
import { DealDao } from "../dao/deal-dao";
import { Types } from "mongoose";
import { request } from "http";
import { PmtCalculator } from "../middleware/PmtCalculator";
import { EmailService } from "../mail/config";

export namespace DealEp {
  export function dealValidationRules() {
    return [
      check("buyerInfo.email")
        .not()
        .isEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false })
        .withMessage("Invalid email address and please try again."),
      check("buyerInfo.phoneNumber")
        .not()
        .isEmpty()
        .withMessage("Phone Number is required.")
        .isLength({ max: 15 })
        .withMessage("Invalid Phone Number and please try again."),
    ];
  }

  // creating a Deal
  export async function createDeal(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const customerAdminId = req.user._id;
    const userId = Types.ObjectId(req.params.userId);

    try {
      let user = UserDao.getUserById(req.user._id);

      if (!user) {
        return res.sendError("Not Existing User!");
      }

      if ((await user).role == UserRole.CUSTOMER_ADMIN) {
        try {
          const totlePrice =
            Number(req.body.sellingPrice) -
            Number(req.body.tradePayoff) +
            (Number(req.body.tradePayoff) +
              Number(req.body.serviceContract) +
              Number(req.body.gapInsuarance) +
              Number(req.body.paintProtection) +
              Number(req.body.docFee) +
              Number(req.body.option1 ? req.body.option1 : 0) +
              Number(req.body.option2 ? req.body.option2 : 0));

          const payment = req.body.payment;
          let pf = 4;
          switch (payment) {
            case "month":
              pf = 12;
              break;
            case "Qtrly":
              pf = 4;
              break;
            case "Anual":
              pf = 1;
              break;
            case "weekly":
              pf = 52;
              break;
            case "biweekly":
              pf = 26;
              break;
            case "semimonthly":
              pf = 24;
              break;
            case "semianual":
              pf = 2;
              break;
          }

          const cal = new PmtCalculator(
            totlePrice,
            Number(req.body.rate),
            Number(req.body.term),
            Number(req.body.down),
            pf,
            Number(req.body.firstPayment)
          );

          const priceList = cal.getPriceList();
          const term1 = Number(cal.getPriceList().t1);
          const term2 = Number(cal.getPriceList().t2);
          const term3 = Number(cal.getPriceList().t3);
          const rate1 = Number(cal.getPriceList().price1.rt1);
          const rate2 = Number(cal.getPriceList().price1.rt2);
          const rate3 = Number(cal.getPriceList().price1.rt3);
          const down1 = Number(cal.getPriceList().dwn1);
          const down2 = Number(cal.getPriceList().dwn2);
          const down3 = Number(cal.getPriceList().dwn3);
          const R1price1 = Number(cal.getPriceList().price1.rate1);
          const R1price2 = cal.getPriceList().price1.rate2;
          const R1price3 = cal.getPriceList().price1.rate3;
          const R2price1 = cal.getPriceList().price2.rate1;
          const R2price2 = cal.getPriceList().price2.rate2;
          const R2price3 = cal.getPriceList().price2.rate3;
          const R3price1 = cal.getPriceList().price3.rate1;
          const R3price2 = cal.getPriceList().price3.rate2;
          const R3price3 = cal.getPriceList().price3.rate3;
          let deal;
          if (req.body.cashDeal == "true" && totlePrice > 0) {
            deal = {
              userId: userId,
              customerAdminId: customerAdminId,
              // buyerInfo: req.body.buyerInfo,
              purchased: req.body.purchased,
              tradeInfo: req.body.tradeInfo,
              sellingPrice: req.body.sellingPrice,
              // tradeAllowance: req.body.tradeAllowance,
              tradePayoff: req.body.tradePayoff,
              serviceContract: req.body.serviceContract,
              gapInsuarance: req.body.gapInsuarance,
              paintProtection: req.body.paintProtection,
              docFee: req.body.docFee,
              option1: req.body.option1,
              option2: req.body.option2,
              totalPrice: totlePrice,
              term: req.body.term,
              rate: req.body.rate,
              down: req.body.down,
              cashDeal: req.body.cashDeal,
              payOff: req.body.payOff,
              payment: req.body.payment,
              firstPayment: req.body.firstPayment,
              term1: term1,
              term2: term2,
              term3: term3,
              rate1: rate1 * 100,
              rate2: rate2 * 100,
              rate3: rate3 * 100,
              down1: down1,
              down2: down2,
              down3: down3,
              R1price1: 0,
              R1price2: 0,
              R1price3: 0,
              R2price1: 0,
              R2price2: 0,
              R2price3: 0,
              R3price1: 0,
              R3price2: 0,
              R3price3: 0,
              signature: req.body.signature,
              status: DealActivation.ACTIVE,
              date: req.body.date,
            };
          } else {
            deal = {
              userId: userId,
              customerAdminId: customerAdminId,
              // buyerInfo: req.body.buyerInfo,
              purchased: req.body.purchased,
              tradeInfo: req.body.tradeInfo,
              sellingPrice: req.body.sellingPrice,
              // tradeAllowance: req.body.tradeAllowance,
              tradePayoff: req.body.tradePayoff,
              serviceContract: req.body.serviceContract,
              gapInsuarance: req.body.gapInsuarance,
              paintProtection: req.body.paintProtection,
              docFee: req.body.docFee,
              option1: req.body.option1,
              option2: req.body.option2,
              totalPrice: totlePrice,
              term: req.body.term,
              rate: req.body.rate,
              down: req.body.down,
              cashDeal: req.body.cashDeal,
              payOff: req.body.payOff,
              payment: req.body.payment,
              firstPayment: req.body.firstPayment,
              term1: term1,
              term2: term2,
              term3: term3,
              rate1: rate1 * 100,
              rate2: rate2 * 100,
              rate3: rate3 * 100,
              down1: down1,
              down2: down2,
              down3: down3,
              R1price1: R1price1,
              R1price2: R1price2,
              R1price3: R1price3,
              R2price1: R2price1,
              R2price2: R2price2,
              R2price3: R2price3,
              R3price1: R3price1,
              R3price2: R3price2,
              R3price3: R3price3,
              signature: req.body.signature,
              status: DealActivation.ACTIVE,
              date: req.body.date,
            };
          }

          let dealData = await DealDao.createDeal(deal);
          const user = await UserDao.getUserById(userId);
          if (!dealData) {
            return res.sendError(
              "Deal could not be created. Please try again later."
            );
          }
          await EmailService.sendCreateDealEmail(user, "Create Deal");
          return res.sendSuccess(dealData, "Success");
        } catch (error) {
          console.log(">>>>>>>>>>>>>>", error);
          return res.sendError(error);
        }
      } else if ((await user).role == UserRole.USER) {
        try {
          const totlePrice =
            Number(req.body.sellingPrice) -
            Number(req.body.tradePayoff) +
            (Number(req.body.tradePayoff) +
              Number(req.body.serviceContract) +
              Number(req.body.gapInsuarance) +
              Number(req.body.paintProtection) +
              Number(req.body.docFee) +
              Number(req.body.option1 ? req.body.option1 : 0) +
              Number(req.body.option2 ? req.body.option2 : 0));

          const payment = req.body.payment;
          let pf = 4;
          switch (payment) {
            case "month":
              pf = 12;
              break;
            case "Qtrly":
              pf = 4;
              break;
            case "Anual":
              pf = 1;
              break;
            case "weekly":
              pf = 52;
              break;
            case "biweekly":
              pf = 26;
              break;
            case "semimonthly":
              pf = 24;
              break;
            case "semianual":
              pf = 2;
              break;
          }

          const cal = new PmtCalculator(
            totlePrice,
            Number(req.body.rate),
            Number(req.body.term),
            Number(req.body.down),
            pf,
            Number(req.body.firstPayment)
          );

          const priceList = cal.getPriceList();
          const term1 = Number(cal.getPriceList().t1);
          const term2 = Number(cal.getPriceList().t2);
          const term3 = Number(cal.getPriceList().t3);
          const rate1 = Number(cal.getPriceList().price1.rt1);
          const rate2 = Number(cal.getPriceList().price1.rt2);
          const rate3 = Number(cal.getPriceList().price1.rt3);
          const down1 = Number(cal.getPriceList().dwn1);
          const down2 = Number(cal.getPriceList().dwn2);
          const down3 = Number(cal.getPriceList().dwn3);
          const R1price1 = Number(cal.getPriceList().price1.rate1);
          const R1price2 = cal.getPriceList().price1.rate2;
          const R1price3 = cal.getPriceList().price1.rate3;
          const R2price1 = cal.getPriceList().price2.rate1;
          const R2price2 = cal.getPriceList().price2.rate2;
          const R2price3 = cal.getPriceList().price2.rate3;
          const R3price1 = cal.getPriceList().price3.rate1;
          const R3price2 = cal.getPriceList().price3.rate2;
          const R3price3 = cal.getPriceList().price3.rate3;
          let deal;
          if (req.body.cashDeal == "true" && totlePrice > 0) {
            deal = {
              userId: customerAdminId,
              customerAdminId: userId,
              // buyerInfo: req.body.buyerInfo,
              purchased: req.body.purchased,
              tradeInfo: req.body.tradeInfo,
              sellingPrice: req.body.sellingPrice,
              // tradeAllowance: req.body.tradeAllowance,
              tradePayoff: req.body.tradePayoff,
              serviceContract: req.body.serviceContract,
              gapInsuarance: req.body.gapInsuarance,
              paintProtection: req.body.paintProtection,
              docFee: req.body.docFee,
              option1: req.body.option1,
              option2: req.body.option2,
              totalPrice: totlePrice,
              term: req.body.term,
              rate: req.body.rate,
              down: req.body.down,
              cashDeal: req.body.cashDeal,
              payOff: req.body.payOff,
              payment: req.body.payment,
              firstPayment: req.body.firstPayment,
              term1: term1,
              term2: term2,
              term3: term3,
              rate1: rate1 * 100,
              rate2: rate2 * 100,
              rate3: rate3 * 100,
              down1: down1,
              down2: down2,
              down3: down3,
              R1price1: 0,
              R1price2: 0,
              R1price3: 0,
              R2price1: 0,
              R2price2: 0,
              R2price3: 0,
              R3price1: 0,
              R3price2: 0,
              R3price3: 0,
              signature: req.body.signature,
              status: DealActivation.ACTIVE,
              date: req.body.date,
            };
          } else {
            deal = {
              userId: customerAdminId,
              customerAdminId: userId,
              // buyerInfo: req.body.buyerInfo,
              purchased: req.body.purchased,
              tradeInfo: req.body.tradeInfo,
              sellingPrice: req.body.sellingPrice,
              // tradeAllowance: req.body.tradeAllowance,
              tradePayoff: req.body.tradePayoff,
              serviceContract: req.body.serviceContract,
              gapInsuarance: req.body.gapInsuarance,
              paintProtection: req.body.paintProtection,
              docFee: req.body.docFee,
              option1: req.body.option1,
              option2: req.body.option2,
              totalPrice: totlePrice,
              term: req.body.term,
              rate: req.body.rate,
              down: req.body.down,
              cashDeal: req.body.cashDeal,
              payOff: req.body.payOff,
              payment: req.body.payment,
              firstPayment: req.body.firstPayment,
              term1: term1,
              term2: term2,
              term3: term3,
              rate1: rate1 * 100,
              rate2: rate2 * 100,
              rate3: rate3 * 100,
              down1: down1,
              down2: down2,
              down3: down3,
              R1price1: R1price1,
              R1price2: R1price2,
              R1price3: R1price3,
              R2price1: R2price1,
              R2price2: R2price2,
              R2price3: R2price3,
              R3price1: R3price1,
              R3price2: R3price2,
              R3price3: R3price3,
              signature: req.body.signature,
              status: DealActivation.ACTIVE,
              date: req.body.date,
            };
          }

          let dealData = await DealDao.createDeal(deal);
          const user = await UserDao.getUserById(userId);
          if (!dealData) {
            return res.sendError(
              "Deal could not be created. Please try again later."
            );
          }
          await EmailService.sendCreateDealEmail(user, "Create Deal");
          return res.sendSuccess(dealData, "Success");
        } catch (error) {
          console.log(">>>>>>>>>>>>>>", error);
          return res.sendError(error);
        }
      } else {
        return res.sendError("You havn't permission to create deal!");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }

  // deal updating part
  export async function updateDeal(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const dealId = Types.ObjectId(req.params.dealId);
    const customerAdminId = req.user._id;
    const userId = Types.ObjectId(req.params.userId);
    try {
      let user = UserDao.getUserById(req.user._id);

      if (!user) {
        return res.sendError("Not Existing User!");
      }

      let userDa = UserDao.getUserById(userId);
      if (!userDa) {
        return res.sendError("Not Existing User!");
      }

      if ((await user).role == UserRole.CUSTOMER_ADMIN) {
        try {
          const dealdata = DealDao.getDealById(dealId);

          if (!dealdata) {
            return res.sendError("Deal not found for the provided deal id");
          }
          const totlePrice =
            Number(req.body.sellingPrice) -
            Number(req.body.tradePayoff) +
            (Number(req.body.tradePayoff) +
              Number(req.body.serviceContract) +
              Number(req.body.gapInsuarance) +
              Number(req.body.paintProtection) +
              Number(req.body.docFee) +
              Number(req.body.option1) +
              Number(req.body.option2));

          const payment = req.body.payment;
          let pf = 4;
          switch (payment) {
            case "month":
              pf = 12;
              break;
            case "Qtrly":
              pf = 4;
              break;
            case "Anual":
              pf = 1;
              break;
            case "weekly":
              pf = 52;
              break;
            case "biweekly":
              pf = 26;
              break;
            case "semimonthly":
              pf = 24;
              break;
            case "semianual":
              pf = 2;
              break;
          }

          const cal = new PmtCalculator(
            totlePrice,
            Number(req.body.rate),
            Number(req.body.term),
            Number(req.body.down),
            pf,
            Number(req.body.firstPayment)
          );

          const priceList = cal.getPriceList();
          const term1 = Number(cal.getPriceList().t1);
          const term2 = Number(cal.getPriceList().t2);
          const term3 = Number(cal.getPriceList().t3);
          const rate1 = Number(cal.getPriceList().price1.rt1);
          const rate2 = Number(cal.getPriceList().price1.rt2);
          const rate3 = Number(cal.getPriceList().price1.rt3);
          const down1 = Number(cal.getPriceList().dwn1);
          const down2 = Number(cal.getPriceList().dwn2);
          const down3 = Number(cal.getPriceList().dwn3);
          const R1price1 = Number(cal.getPriceList().price1.rate1);
          const R1price2 = cal.getPriceList().price1.rate2;
          const R1price3 = cal.getPriceList().price1.rate3;
          const R2price1 = cal.getPriceList().price2.rate1;
          const R2price2 = cal.getPriceList().price2.rate2;
          const R2price3 = cal.getPriceList().price2.rate3;
          const R3price1 = cal.getPriceList().price3.rate1;
          const R3price2 = cal.getPriceList().price3.rate2;
          const R3price3 = cal.getPriceList().price3.rate3;
          console.log(req.body.cashDeal)
          let deal;
          if (req.body.cashDeal == "true") {
            deal = {
              userId: userId,
              customerAdminId: customerAdminId,
              // buyerInfo: req.body.buyerInfo,
              purchased: req.body.purchased,
              tradeInfo: req.body.tradeInfo,
              sellingPrice: req.body.sellingPrice,
              // tradeAllowance: req.body.tradeAllowance,
              tradePayoff: req.body.tradePayoff,
              serviceContract: req.body.serviceContract,
              gapInsuarance: req.body.gapInsuarance,
              paintProtection: req.body.paintProtection,
              docFee: req.body.docFee,
              option1: req.body.option1,
              option2: req.body.option2,
              totalPrice: totlePrice,
              term: req.body.term,
              rate: req.body.rate,
              down: req.body.down,
              cashDeal: req.body.cashDeal,
              payOff: req.body.payOff,
              payment: req.body.payment,
              firstPayment: req.body.firstPayment,
              term1: term1,
              term2: term2,
              term3: term3,
              rate1: rate1 * 100,
              rate2: rate2 * 100,
              rate3: rate3 * 100,
              down1: down1,
              down2: down2,
              down3: down3,
              R1price1: 0,
              R1price2: 0,
              R1price3: 0,
              R2price1: 0,
              R2price2: 0,
              R2price3: 0,
              R3price1: 0,
              R3price2: 0,
              R3price3: 0,
              signature: req.body.signature,
              status: DealActivation.ACTIVE,
              date: req.body.date,
            };
          } else {
            deal = {
              userId: userId,
              customerAdminId: customerAdminId,
              // buyerInfo: req.body.buyerInfo,
              purchased: req.body.purchased,
              tradeInfo: req.body.tradeInfo,
              sellingPrice: req.body.sellingPrice,
              // tradeAllowance: req.body.tradeAllowance,
              tradePayoff: req.body.tradePayoff,
              serviceContract: req.body.serviceContract,
              gapInsuarance: req.body.gapInsuarance,
              paintProtection: req.body.paintProtection,
              docFee: req.body.docFee,
              option1: req.body.option1,
              option2: req.body.option2,
              totalPrice: totlePrice,
              term: req.body.term,
              rate: req.body.rate,
              down: req.body.down,
              cashDeal: req.body.cashDeal,
              payOff: req.body.payOff,
              payment: req.body.payment,
              firstPayment: req.body.firstPayment,
              term1: term1,
              term2: term2,
              term3: term3,
              rate1: rate1 * 100,
              rate2: rate2 * 100,
              rate3: rate3 * 100,
              down1: down1,
              down2: down2,
              down3: down3,
              R1price1: R1price1,
              R1price2: R1price2,
              R1price3: R1price3,
              R2price1: R2price1,
              R2price2: R2price2,
              R2price3: R2price3,
              R3price1: R3price1,
              R3price2: R3price2,
              R3price3: R3price3,
              signature: req.body.signature,
              status: DealActivation.ACTIVE,
              date: req.body.date,
            };
          }

          let dealData = await DealDao.updateDeal(dealId, deal);

          if (!dealData) {
            return res.sendError(
              "Deal could not be created. Please try again later."
            );
          }

          return res.sendSuccess(dealData, "Success");
        } catch (error) {
          console.log(">>>>>>>>>>>>>>", error);
          return res.sendError(error);
        }
      } else {
        return res.sendError("You havn't permission to create deal!");
      }
    } catch (error) {
      return res.sendError(error);
    }
  }

  // Deleting a deal
  export async function deleteDeal(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const dealId = Types.ObjectId(req.params.dealId);

    try {
      const deal = DealDao.getDealById(dealId);

      if (!deal) {
        return res.sendError("Deal not found for the provided deal id");
      }
      let dealData;
      dealData = {
        status: DealActivation.INACTIVE,
      };
      let dealDatas = await DealDao.updateDeal(dealId, dealData);

      if (!dealDatas) {
        return res.sendError(
          "Deal could not be deleted. Please try again later."
        );
      }

      return res.sendSuccess(dealDatas, "Deal deleted Successfully");
    } catch (e) {
      res.sendError(e);
    }
  }

  export async function getAllDeals(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const userId = req.user._id;

    if (req.user.role == UserRole.USER || req.user.role == UserRole.CUSTOMER_ADMIN) {
      try {
        const list = await DealDao.getAllDeals(userId, limit, offset);

        const dealCount = await DealDao.getAllDealsCount(userId);

        const data = {
          set: list,
          count: dealCount,
        };
        return res.sendSuccess(data, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function getAllDealsById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const userId = Types.ObjectId(req.params.id);
    const adminId = req.user._id;
    if (
      req.user.role == UserRole.SUPER_ADMIN ||
      req.user.role == UserRole.CUSTOMER_ADMIN
    ) {
      try {
        const list = await DealDao.getAllDealsById(
          userId,
          adminId,
          limit,
          offset
        );
        return res.sendSuccess(list, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function getAllDealsByUserId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const userId = Types.ObjectId(req.params.id);
    if (req.user.role == UserRole.SUPER_ADMIN) {
      try {
        const list = await DealDao.getAllDeals(userId, limit, offset);
        return res.sendSuccess(list, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }
  export async function getAllDealsByCustomerId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const adminId = req.user._id;
    if (req.user.role == UserRole.CUSTOMER_ADMIN) {
      try {
        const list = await DealDao.getAllDealsByCusId(adminId, limit, offset);
        return res.sendSuccess(list, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function getDealsByDealId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const dealId = Types.ObjectId(req.params.id);
    if (req.user.role == UserRole.CUSTOMER_ADMIN || req.user.role == UserRole.SUPER_ADMIN || req.user.role == UserRole.USER) {
      try {
        const list = await DealDao.getDealsByDealId(dealId);
        return res.sendSuccess(list, "Success");
      } catch (error) {
        return res.sendError(error);
      }
    } else {
      return res.sendError("Invalid user role.");
    }
  }

  export async function searchDeals(req: Request, res: Response, next: NextFunction) {
    const limit = Number(req.params.limit);
    const offset = Number(req.params.offset);
    const searchText = req.body.searchableString;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.sendError(errors.array()[0]["msg"]);
    }

    if (req.user.role == UserRole.SUPER_ADMIN || req.user.role == UserRole.CUSTOMER_ADMIN || req.user.role == UserRole.USER) {
        try {
            const result = await DealDao.searchDeals(searchText, limit, offset);
            const data = {
                deal: result,
            };

            return res.sendSuccess(data, "Success");
        } catch (error) {
            return res.sendError(error);
        }
    } else {
        return res.sendError("No permission to access!");
    }
}
}
