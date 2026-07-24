import httpStatus from "http-status";
import RewardsCoupon, { RewardsCouponDocument } from "./schema.rewardscoupon"; // Adjust RewardsCouponDocument based on your schema setup
import ApiError from "../../../../utilities/apiError";
import mongoose from "mongoose";
import { RangeFilter } from "../../../utils/interface";

const createRewardsCoupon = async (
  body: any
): Promise<RewardsCouponDocument> => {

  // Reward Name unique
  const rewardExists = await RewardsCoupon.findOne({
    rewardName: body.rewardName,
    isDeleted: false,
  });

  if (rewardExists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Reward name already exists."
    );
  }

  // Coupon Code unique
  const couponExists = await RewardsCoupon.findOne({
    couponCode: body.couponCode.toUpperCase(),
    isDeleted: false,
  });

  if (couponExists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Coupon code already exists."
    );
  }

  // Validate dates
  if (body.validFrom && body.validTill) {
    const fromDate = new Date(body.validFrom);
    const tillDate = new Date(body.validTill);
    
    if (fromDate > tillDate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Valid From date cannot be greater than Valid Till date."
      );
    }
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (body.startTime && !timeRegex.test(body.startTime)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start time must be in HH:MM format."
    );
  }
  if (body.endTime && !timeRegex.test(body.endTime)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "End time must be in HH:MM format."
    );
  }

  // Validate rewards point for REWARD type
  if (body.couponType === "REWARD") {
    if (!body.rewardsPoint || body.rewardsPoint <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Rewards point is required for Reward Coupon and must be greater than 0."
      );
    }
  }

  // Validate reward value
  if (body.rewardType === "PERCENTAGE") {
    if (body.rewardValue > 100) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Percentage value cannot be greater than 100."
      );
    }
    if (body.rewardValue <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Percentage value must be greater than 0."
      );
    }
  } else if (body.rewardType === "AMOUNT") {
    if (body.rewardValue <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Reward amount must be greater than 0."
      );
    }
  }

  // Validate minimum spend
  if (body.minimumSpend < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Minimum spend cannot be negative."
    );
  }

  // Validate maximum discount
  if (body.maximumDiscount < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Maximum discount cannot be negative."
    );
  }

  // Validate valid days
  if (body.validDays && body.validDays.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "At least one valid day must be selected."
    );
  }

  return await RewardsCoupon.create({
    couponType: body.couponType || "COUPON",
    rewardName: body.rewardName,
    rewardsPoint: body.couponType === "REWARD" ? body.rewardsPoint : 0,
    rewardType: body.rewardType || "AMOUNT",
    rewardValue: body.rewardValue,
    
    minimumSpend: body.minimumSpend || 0,
    maximumDiscount: body.maximumDiscount || 0,
    
    giftCardAmount: body.giftCardAmount || 0,
    balanceAmount: body.balanceAmount || 0,
    promotionCategory: body.promotionCategory || "",
    
    couponCode: body.couponCode.toUpperCase(),
    
    branchId: body.branchId || [],
    serviceId: body.serviceId || [],
    
    validDays: body.validDays || [],
    startTime: body.startTime || "",
    endTime: body.endTime || "",
    
    validFrom: body.validFrom,
    validTill: body.validTill,
    
    description: body.description || "",
    
    isActive: body.isActive === undefined ? true : body.isActive,
    status: body.status || "active",
  });
};

const queryRewardsCoupons = async (
  filter: any,
  options: any
): Promise<{
  data: RewardsCouponDocument[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  search: any;
  dateFilter: any;
  filterBy: any;
  rangeFilterBy: RangeFilter | undefined;
}> => {
  const rewardsCoupons = await RewardsCoupon.paginate(filter, options);
  return rewardsCoupons;
};

const updateRewardsCouponById = async (
  rewardsCouponId: string,
  updateBody: any
): Promise<RewardsCouponDocument> => {

  const rewardsCoupon = await getRewardsCouponById(rewardsCouponId);

  if (!rewardsCoupon) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Reward not found."
    );
  }

  // Reward Name duplicate check
  if (updateBody.rewardName) {
    const rewardExists = await RewardsCoupon.findOne({
      rewardName: updateBody.rewardName,
      isDeleted: false,
      _id: { $ne: rewardsCouponId },
    });

    if (rewardExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Reward name already exists."
      );
    }
  }

  // Coupon Code duplicate check
  if (updateBody.couponCode) {
    updateBody.couponCode = updateBody.couponCode.toUpperCase();

    const couponExists = await RewardsCoupon.findOne({
      couponCode: updateBody.couponCode,
      isDeleted: false,
      _id: { $ne: rewardsCouponId },
    });

    if (couponExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Coupon code already exists."
      );
    }
  }

  // Validate dates
  const validFrom = updateBody.validFrom || rewardsCoupon.validFrom;
  const validTill = updateBody.validTill || rewardsCoupon.validTill;
  
  if (validFrom && validTill) {
    const fromDate = new Date(validFrom);
    const tillDate = new Date(validTill);
    
    if (fromDate > tillDate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Valid From date cannot be greater than Valid Till date."
      );
    }
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const startTime = updateBody.startTime || rewardsCoupon.startTime;
  const endTime = updateBody.endTime || rewardsCoupon.endTime;
  
  if (startTime && !timeRegex.test(startTime)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start time must be in HH:MM format."
    );
  }
  if (endTime && !timeRegex.test(endTime)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "End time must be in HH:MM format."
    );
  }

  // Validate rewards point for REWARD type
  const couponType = updateBody.couponType || rewardsCoupon.couponType;
  const rewardsPoint = updateBody.rewardsPoint !== undefined ? updateBody.rewardsPoint : rewardsCoupon.rewardsPoint;
  
  if (couponType === "REWARD") {
    if (!rewardsPoint || rewardsPoint <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Rewards point is required for Reward Coupon and must be greater than 0."
      );
    }
  }

  // Validate reward value
  const rewardType = updateBody.rewardType || rewardsCoupon.rewardType;
  const rewardValue = updateBody.rewardValue !== undefined ? updateBody.rewardValue : rewardsCoupon.rewardValue;
  
  if (rewardType === "PERCENTAGE") {
    if (rewardValue > 100) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Percentage value cannot be greater than 100."
      );
    }
    if (rewardValue <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Percentage value must be greater than 0."
      );
    }
  } else if (rewardType === "AMOUNT") {
    if (rewardValue <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Reward amount must be greater than 0."
      );
    }
  }

  // Validate minimum spend
  const minimumSpend = updateBody.minimumSpend !== undefined ? updateBody.minimumSpend : rewardsCoupon.minimumSpend;
  if (minimumSpend < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Minimum spend cannot be negative."
    );
  }

  // Validate maximum discount
  const maximumDiscount = updateBody.maximumDiscount !== undefined ? updateBody.maximumDiscount : rewardsCoupon.maximumDiscount;
  if (maximumDiscount < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Maximum discount cannot be negative."
    );
  }

  // Validate valid days
  const validDays = updateBody.validDays || rewardsCoupon.validDays;
  if (validDays && validDays.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "At least one valid day must be selected."
    );
  }

  // If coupon type is changing from REWARD to something else, reset rewardsPoint to 0
  if (updateBody.couponType && updateBody.couponType !== "REWARD") {
    updateBody.rewardsPoint = 0;
  }

  // If coupon type is changing to REWARD, ensure rewardsPoint is provided
  if (updateBody.couponType === "REWARD" && !updateBody.rewardsPoint) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rewards point is required when coupon type is REWARD."
    );
  }

  Object.assign(rewardsCoupon, updateBody);

  await rewardsCoupon.save();

  return rewardsCoupon;
};

const markRewardCouponAsUsed = async (
  referralCode: string,
  customerId: string
): Promise<RewardsCouponDocument> => {
  const coupon = await RewardsCoupon.findOne({
    couponCode: referralCode,
    isDeleted: false,
    isActive: true,
  });

  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reward coupon not found');
  }

  const alreadyUsed = Array.isArray(coupon.usedBy)
    ? coupon.usedBy.map(id => id?.toString()).includes(customerId.toString())
    : false;

  if (alreadyUsed) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Reward coupon already used by this customer');
  }

  coupon.usedBy.push(new mongoose.Types.ObjectId(customerId));
  await coupon.save();

  return coupon;
};


const deleteRewardsCouponById = async (
  rewardsCouponId: string | number
): Promise<RewardsCouponDocument> => {
  const rewardsCoupon = await getRewardsCouponById(rewardsCouponId);
  if (!rewardsCoupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "RewardsCoupon not found");
  }

  // Instead of deleting, update isDeleted field to true
  await RewardsCoupon.updateOne(
    { _id: rewardsCoupon._id },
    { $set: { isDeleted: true } }
  );

  // Return updated rewardsCoupon object with isDeleted: true
  return rewardsCoupon;
};

const toggleRewardsCouponStatusById = async (
  rewardsCouponId: string | number
): Promise<RewardsCouponDocument> => {
  const rewardsCoupon = await getRewardsCouponById(rewardsCouponId);
  if (!rewardsCoupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "RewardsCoupon not found");
  }
  rewardsCoupon.isActive = !rewardsCoupon.isActive;
  await rewardsCoupon.save();
  return rewardsCoupon;
};

interface FilterObject {
  [key: string]: any;
}

interface ExistsResult {
  exists: boolean;
  existsSummary: string;
}

const isExists = async (
  filterArray: FilterObject[],
  exceptIds: string[] = [],
  combined: boolean = false
): Promise<ExistsResult> => {
  if (combined) {
    let combinedObj = await combineObjects(filterArray);
    if (exceptIds.length > 0) {
      combinedObj["_id"] = { $nin: exceptIds };
    }
    if (await getOneByMultiField({ ...combinedObj })) {
      return {
        exists: true,
        existsSummary: `${Object.keys(combinedObj)} already exist.`,
      };
    }
    return { exists: false, existsSummary: "" };
  }

  let mappedArray = await Promise.all(
    filterArray.map(async (element) => {
      if (exceptIds.length > 0) {
        element["_id"] = { $nin: exceptIds };
      }
      if (await getOneByMultiField({ ...element })) {
        return { exists: true, fieldName: Object.keys(element)[0] };
      }
      return { exists: false, fieldName: Object.keys(element)[0] };
    })
  );

  return mappedArray.reduce(
    (acc, ele) => {
      if (ele.exists) {
        acc.exists = true;
        acc.existsSummary += `${ele.fieldName.toLowerCase()} already exist. `;
      }
      return acc;
    },
    { exists: false, existsSummary: "" } as ExistsResult
  );
};

async function combineObjects(
  filterArray: FilterObject[]
): Promise<FilterObject> {
  return {} as FilterObject;
}

const getOneByMultiField = async (
  filter: FilterObject
): Promise<RewardsCouponDocument | null> => {
  return RewardsCoupon.findOne({ ...filter, isDeleted: false });
};

const getRewardsCouponById = async (
  id: string | number
): Promise<RewardsCouponDocument | null> => {
  if (typeof id === "string" || typeof id === "number") {
    return RewardsCoupon.findById({
      _id: new mongoose.Types.ObjectId(id),
      isDeleted: false,
    });
  }
  return null;
};

export {
  createRewardsCoupon,
  queryRewardsCoupons,
  updateRewardsCouponById,
  deleteRewardsCouponById,
  isExists,
  getRewardsCouponById,
  getOneByMultiField,
  toggleRewardsCouponStatusById,
  markRewardCouponAsUsed
};
