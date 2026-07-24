import httpStatus from "http-status";
import RewardsCoupon, { RewardsCouponDocument } from "./schema.rewardscoupon";
import ApiError from "../../../../utilities/apiError";
import mongoose from "mongoose";
import { RangeFilter } from "../../../utils/interface";

/**
 * Create Rewards Coupon
 */
// rewardsCoupon.service.ts

const createRewardsCoupon = async (
  body: any
): Promise<RewardsCouponDocument> => {
  // Check if reward name already exists
  const exists = await RewardsCoupon.findOne({
    rewardName: body.rewardName,
    isDeleted: false,
  });

  if (exists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Reward coupon with this name already exists."
    );
  }

  // Check if coupon code already exists
  if (body.couponCode) {
    const codeExists = await RewardsCoupon.findOne({
      couponCode: body.couponCode.toUpperCase(),
      isDeleted: false,
    });
    if (codeExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Coupon code already exists. Please use a different code."
      );
    }
  }

  // If branchId is empty or not provided, set as empty array (means all branches)
  // If serviceId is empty or not provided, set as empty array (means all services)
  const branchId = body.branchId && Array.isArray(body.branchId) && body.branchId.length > 0 
    ? body.branchId 
    : [];
    
  const serviceId = body.serviceId && Array.isArray(body.serviceId) && body.serviceId.length > 0 
    ? body.serviceId 
    : [];

  return RewardsCoupon.create({
    rewardName: body.rewardName,
    rewardsPoint: body.rewardsPoint,
    rewardType: body.rewardType || "AMOUNT",
    rewardValue: body.rewardValue,
    minimumSpend: body.minimumSpend || 0,
    maximumDiscount: body.maximumDiscount || 0,
    couponCode: body.couponCode.toUpperCase(),
    branchId: branchId, // Empty array = all branches
    serviceId: serviceId, // Empty array = all services
    validDays: body.validDays || [],
    startTime: body.startTime || "",
    endTime: body.endTime || "",
    validFrom: body.validFrom,
    validTill: body.validTill,
    description: body.description || "",
    isActive: body.isActive !== undefined ? body.isActive : true,
    status: body.status || "active",
  });
};

/**
 * Query Rewards Coupons with Pagination
 */
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

/**
 * Update Rewards Coupon by ID
 */
const updateRewardsCouponById = async (
  rewardsCouponId: string | number,
  updateBody: any
): Promise<RewardsCouponDocument> => {
  const rewardsCoupon = await getRewardsCouponById(rewardsCouponId);
  if (!rewardsCoupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rewards coupon not found");
  }

  // Check if reward name already exists (excluding current coupon)
  if (updateBody.rewardName) {
    const existingReward = await RewardsCoupon.findOne({
      rewardName: updateBody.rewardName,
      isDeleted: false,
      _id: { $ne: rewardsCouponId },
    });
    if (existingReward) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Reward coupon with this name already exists."
      );
    }
  }

  // Check if coupon code already exists (excluding current coupon)
  if (updateBody.couponCode) {
    const existingCode = await RewardsCoupon.findOne({
      couponCode: updateBody.couponCode.toUpperCase(),
      isDeleted: false,
      _id: { $ne: rewardsCouponId },
    });
    if (existingCode) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Coupon code already exists. Please use a different code."
      );
    }
  }

  // Update only provided fields
  Object.assign(rewardsCoupon, {
    ...(updateBody.rewardName !== undefined && { rewardName: updateBody.rewardName }),
    ...(updateBody.rewardsPoint !== undefined && { rewardsPoint: updateBody.rewardsPoint }),
    ...(updateBody.rewardType !== undefined && { rewardType: updateBody.rewardType }),
    ...(updateBody.rewardValue !== undefined && { rewardValue: updateBody.rewardValue }),
    ...(updateBody.minimumSpend !== undefined && { minimumSpend: updateBody.minimumSpend }),
    ...(updateBody.maximumDiscount !== undefined && { maximumDiscount: updateBody.maximumDiscount }),
    ...(updateBody.couponCode !== undefined && { couponCode: updateBody.couponCode.toUpperCase() }),
    ...(updateBody.branchId !== undefined && { branchId: updateBody.branchId }),
    ...(updateBody.serviceId !== undefined && { serviceId: updateBody.serviceId }),
    ...(updateBody.validDays !== undefined && { validDays: updateBody.validDays }),
    ...(updateBody.startTime !== undefined && { startTime: updateBody.startTime }),
    ...(updateBody.endTime !== undefined && { endTime: updateBody.endTime }),
    ...(updateBody.validFrom !== undefined && { validFrom: updateBody.validFrom }),
    ...(updateBody.validTill !== undefined && { validTill: updateBody.validTill }),
    ...(updateBody.description !== undefined && { description: updateBody.description }),
    ...(updateBody.isActive !== undefined && { isActive: updateBody.isActive }),
    ...(updateBody.status !== undefined && { status: updateBody.status }),
  });

  await rewardsCoupon.save();
  return rewardsCoupon;
};

/**
 * Mark Reward Coupon as Used by Customer
 */
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

  // Check if coupon is still valid (date range)
  const now = new Date();
  // if (coupon.validFrom && coupon.validFrom > now) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon is not yet valid');
  // }
  if (coupon.validTill && coupon.validTill < now) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon has expired');
  }

  // Check if already used by this customer
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

/**
 * Delete Rewards Coupon by ID (Soft Delete)
 */
const deleteRewardsCouponById = async (
  rewardsCouponId: string | number
): Promise<RewardsCouponDocument> => {
  const rewardsCoupon = await getRewardsCouponById(rewardsCouponId);
  if (!rewardsCoupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rewards coupon not found");
  }

  // Soft delete - update isDeleted field to true
  await RewardsCoupon.updateOne(
    { _id: rewardsCoupon._id },
    { $set: { isDeleted: true } }
  );

  return rewardsCoupon;
};

/**
 * Toggle Rewards Coupon Status by ID
 */
const toggleRewardsCouponStatusById = async (
  rewardsCouponId: string | number
): Promise<RewardsCouponDocument> => {
  const rewardsCoupon = await getRewardsCouponById(rewardsCouponId);
  if (!rewardsCoupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rewards coupon not found");
  }
  
  rewardsCoupon.isActive = !rewardsCoupon.isActive;
  rewardsCoupon.status = rewardsCoupon.isActive ? 'active' : 'inactive';
  await rewardsCoupon.save();
  
  return rewardsCoupon;
};

/**
 * Get Rewards Coupon by ID
 */
const getRewardsCouponById = async (
  id: string | number
): Promise<RewardsCouponDocument | null> => {
  if (typeof id === "string" || typeof id === "number") {
    return RewardsCoupon.findOne({
      _id: new mongoose.Types.ObjectId(id.toString()),
      isDeleted: false,
    });
  }
  return null;
};

/**
 * Get One by Multi Field
 */
const getOneByMultiField = async (
  filter: any
): Promise<RewardsCouponDocument | null> => {
  return RewardsCoupon.findOne({ ...filter, isDeleted: false });
};

/**
 * Check if Records Exist
 */
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

/**
 * Combine Objects Helper
 */
async function combineObjects(
  filterArray: FilterObject[]
): Promise<FilterObject> {
  let combinedObj: FilterObject = {};
  filterArray.forEach((obj) => {
    Object.assign(combinedObj, obj);
  });
  return combinedObj;
}

/**
 * Bulk Delete Rewards Coupons
 */
const bulkDeleteRewardsCoupons = async (
  ids: string[]
): Promise<void> => {
  if (!ids || ids.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Please provide coupon IDs to delete."
    );
  }

  await RewardsCoupon.updateMany(
    { _id: { $in: ids }, isDeleted: false },
    { $set: { isDeleted: true } }
  );
};

/**
 * Bulk Toggle Rewards Coupons Status
 */
const bulkToggleRewardsCouponsStatus = async (
  ids: string[],
  status: boolean
): Promise<void> => {
  if (!ids || ids.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Please provide coupon IDs to update."
    );
  }

  await RewardsCoupon.updateMany(
    { _id: { $in: ids }, isDeleted: false },
    { 
      $set: { 
        isActive: status,
        status: status ? 'active' : 'inactive'
      } 
    }
  );
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
  markRewardCouponAsUsed,
  bulkDeleteRewardsCoupons,
  bulkToggleRewardsCouponsStatus,
};