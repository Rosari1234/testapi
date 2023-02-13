import { Types } from "mongoose";
import { AppLogger } from "../common/logging";
import { StringOrObjectId } from "../common/util";
import { DDeal, IDeal } from "../models/deal-model";
import Deal from "../schemas/deal-schema";

export namespace DealDao {
  export async function createDeal(data: DDeal): Promise<IDeal> {
    const deal = new Deal(data);
    let res = await deal.save()
    let dealList = await Deal.populate(res, [
      { path: "userId" },
      { path: "customerAdminId" }
    ]);
    return dealList;
  }

  export async function updateDeal(
    id: Types.ObjectId,
    data: any
  ): Promise<IDeal> {
    let deal: IDeal = await Deal.findByIdAndUpdate(id, data, { new: true });
    return deal;
  }

  export async function getDealById(Id: Types.ObjectId): Promise<IDeal> {
    let deal = await Deal.findById(Id).populate([
      { path: "userId" },
      { path: "customerAdminId" }
    ]);
    return deal;
  }

  export async function deleteDeal(id: Types.ObjectId) {
    let dealDeleted = await Deal.remove({ _id: id });
    return dealDeleted;
  }

  export async function getAllDeals(
    userId: StringOrObjectId,
    limit: number,
    offset: number
  ): Promise<IDeal[]> {
    const customerList = await Deal.find({ userId: userId, status: "ACTIVE" })
      .populate([{ path: "userId" }, { path: "customerAdminId" }])
      .sort({ createdAt: -1 })
      .skip(limit * (offset - 1))
      .limit(limit);

    return customerList;
  }

  export async function getAllDealsById(
    userId: StringOrObjectId,
    adminId: StringOrObjectId,
    limit: number,
    offset: number
  ): Promise<IDeal[]> {
    const customerList = await Deal.find({
      userId: userId,
      customerAdminId: adminId,
      status: "ACTIVE"
    }).populate([
      { path: "userId" },
      { path: "customerAdminId" }
    ])
      .sort({ createdAt: -1 })
      .skip(limit * (offset - 1))
      .limit(limit);

    return customerList;
  }

  export async function getAllDealsByCusId(
    adminId: StringOrObjectId,
    limit: number,
    offset: number
  ): Promise<IDeal[]> {
    const dealList = await Deal.find({ customerAdminId: adminId, status: "ACTIVE" }).populate([
      { path: "userId" },
      { path: "customerAdminId" }
    ])
      .sort({ createdAt: -1 })
      .skip(limit * (offset - 1))
      .limit(limit);

    const dealLists = dealList.filter(deal => {
      return deal.userId !== null;
    });
    console.log("dealLists", dealLists)
    return dealLists;
  }

  export async function getDealsByDealId(
    dealId: StringOrObjectId,
  ): Promise<IDeal> {
    const customerList = await Deal.findById({ _id: dealId }).populate([
      { path: "userId" },
      { path: "customerAdminId" }
    ]);

    return customerList;
  }

  export async function getAllDealsCount(
    userId: StringOrObjectId
  ): Promise<any> {
    const data = await Deal.find({ userId: userId });
    return data.length;
  }

  export async function getAllAdminDealdCount(
    adminId: StringOrObjectId
  ): Promise<any> {
    const data = await Deal.find({ customerAdminId: adminId, status: "ACTIVE" });
    return data.length;
  }

  export async function getAllDealCount(): Promise<any> {
    const data = await Deal.find();
    return data.length;
  }

  export async function searchDeals(
    searchText: string,
    limit: number,
    offset: number,

  ): Promise<IDeal[]> {


    let searchedName = null;

    if (searchText) {
      let seacrhItem = searchText.replace(/\s/g, "");
      searchedName =
        searchText != null ? new RegExp(`^${seacrhItem}`, "i") : null;
    }

    // const customerAdminQuery =
    //   searchedName != null && searchedName
    //     ? {
    //       $and: [
    //         {
    //           $or: [
    //             { firstName: searchedName },
    //             { lastName: searchedName },
    //             { email: searchedName },
    //             { validationCode: searchedName }
    //           ],
    //         },
    //       ],
    //     }
    //     : {
    //     };

    const dealQuery =
      searchedName != null && searchedName
        ? {
          $and: [
            {
              $or: [
                { sellingPrice: searchedName },
                { tradePayoff: searchedName },
                { serviceContract: searchedName },
                { gapInsuarance: searchedName },
                { paintProtection: searchedName },
                { docFee: searchedName },
                { option1: searchedName },
                { option2: searchedName },
                { totalPrice: searchedName },
                { term: searchedName },
                { rate: searchedName },
                { down: searchedName },
                { cashDeal: searchedName },
                { payOff: searchedName },
                { payment: searchedName },
                { firstPayment: searchedName },
                { signature: searchedName },
                { status: searchedName },
                { date: searchedName },
              ],
            },
          ],
        }
        : {
          // $or: [
          //   { status: "ACTIVE" }
          // ],
        };

    let searchResult: IDeal[] = await Deal.aggregate([
      {
        $project: {
          sellingPrice: 1,
          tradePayoff: 1,
          serviceContract: 1,
          gapInsuarance: 1,
          paintProtection: 1,
          docFee: 1,
          option1: 1,
          option2: 1,
          totalPrice: 1,
          term: 1,
          rate: 1,
          down: 1,
          cashDeal: 1,
          payOff: 1,
          payment: 1,
          firstPayment: 1,
          signature: 1,
          status: 1,
          date: 1,
          _id: 1,
        },
      },
      {
        $match: {
          $and: [
            // customerAdminQuery,
            dealQuery
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);
    console.log('serch resultes', searchResult)
    return searchResult;
  }
}
