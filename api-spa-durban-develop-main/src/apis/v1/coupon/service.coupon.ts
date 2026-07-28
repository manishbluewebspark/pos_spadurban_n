import httpStatus from "http-status";
import Coupon, { CouponDocument } from "./schema.coupon"; // Adjust CouponDocument based on your schema setup
import ApiError from "../../../../utilities/apiError";
import mongoose, { Document, Model } from "mongoose";
import { DateFilter, RangeFilter } from "../../../utils/interface";
import RewardsCoupon from "../rewardscoupon/schema.rewardscoupon";
import PromotionCoupon from "../promotioncoupon/schema.promotioncoupon";
import { customerService } from "../service.index";
import GiftCard from "../giftCard/schema.giftCard";
import Invoice from "../invoice/schema.invoice";

/**
 * Create a coupon
 * @param {Object} couponBody
 * @returns {Promise <CouponDocument>}
 */
const createCoupon = async (couponBody: any): Promise<CouponDocument> => {
  return Coupon.create(couponBody);
};

/**
 * Query for coupons
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {any} [options.search] - Search value to perform text search
 * @param {any} [options.dateFilter] - dateFilter
 * @param {any} [options.filterBy] - dateFilter
 * @returns {Promise<{ data: CouponDocument[]; page: number; limit: number; totalPages: number; totalResults: number;  }> }
 */
const queryCoupons = async (
  filter: any,
  options: any
): Promise<{
  data: CouponDocument[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  search: any;
  dateFilter: any;
  filterBy: any;
  rangeFilterBy: RangeFilter | undefined;
}> => {
  const coupons = await Coupon.paginate(filter, options);
  return coupons;
};

/**
 * Update coupon by id
 * @param {string | number} couponId
 * @param {Object} updateBody
 * @returns {Promise <CouponDocument>}
 */
const updateCouponById = async (
  couponId: string | number,
  updateBody: any
): Promise<CouponDocument> => {
  const coupon = await getCouponById(couponId);
  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");
  }

  Object.assign(coupon, updateBody);
  await coupon.save();
  return coupon;
};

/**
 * Mark a coupon as used by a specific customer using referralCode
 * @param {string} referralCode - The coupon code used as referral
 * @param {string} customerId - The customer using the coupon
 * @returns {Promise<CouponDocument>}
 */
const markCouponAsUsed = async (
  referralCode: string,
  customerId: string
): Promise<CouponDocument> => {
  const coupon = await Coupon.findOne({
    referralCode: referralCode,
    isDeleted: false,
    isActive: true,
  });

  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Referral coupon not found');
  }
  if (Array.isArray(coupon.usedBy) && coupon.usedBy.some(id => id?.equals(customerId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Referral coupon already used by this customer');
  }

  coupon.usedBy.push(new mongoose.Types.ObjectId(customerId));
  await coupon.save();

  return coupon;
};



/**
 * Toggle coupon status by id
 * @param {string | number} couponId
 * @returns {Promise<CouponDocument>}
 */
const toggleCouponStatusById = async (
  couponId: string | number
): Promise<CouponDocument> => {
  const coupon = await getCouponById(couponId);
  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");
  }
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
};

/**
 * Delete coupon by id
 * @param {string | number} couponId
 * @returns {Promise <CouponDocument> }
 */
const deleteCouponById = async (
  couponId: string | number
): Promise<CouponDocument> => {
  const coupon = await getCouponById(couponId);
  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");
  }
  await Coupon.deleteOne({ _id: coupon._id });
  return coupon;
};

interface FilterObject {
  [key: string]: any; // Adjust any as per your field types
}

interface ExistsResult {
  exists: boolean;
  existsSummary: string;
}

/**
 * Check if certain conditions exist in the database
 * @param {Array<FilterObject> } filterArray - Array of filters to check
 * @param {Array<string>} exceptIds - Array of IDs to exclude from checks
 * @param {Boolean} combined - Whether to combine filters with AND logic
 * @returns {Promise<ExistsResult>}
 */
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
    { exists: false, existsSummary: "" } as ExistsResult // Ensure initial type assignment
  );
};

// Example functions used in the code, add typings accordingly
async function combineObjects(
  filterArray: FilterObject[]
): Promise<FilterObject> {
  // Implementation
  return {} as FilterObject;
}

async function getOneByMultiField(filter: FilterObject): Promise<boolean> {
  // Implementation
  return false;
}

/**
 * Get Coupon by id
 * @param {string | number} id
 * @returns {Promise<CouponDocument | null> }
 */
const getCouponById = async (
  id: string | number
): Promise<CouponDocument | null> => {
  if (typeof id === "string" || typeof id === "number") {
    return Coupon.findById({
      _id: new mongoose.Types.ObjectId(id),
      isDeleted: false,
    });
  }
  return null;
};

const getCouponByCustomerId = async (
  customerId?: string,
  items: string[] = []
): Promise<any[]> => {
  const today = new Date();

  let customerData = null;

  if (customerId) {
    customerData = await customerService.getCustomerById(customerId);
  }

  let rewardCoupons: any[] = [];

  if (customerId && customerData) {
    const rewardsDocs = await RewardsCoupon.find({
      isDeleted: false,
      isActive: true,
      // validFrom: { $lte: today },
      validTill: { $gte: today },
      ...(items.length && {
        $or: [
          { serviceId: { $size: 0 } },
          { serviceId: { $in: items } },
        ],
      }),
      usedBy: { $nin: [customerId] },
    })
      .populate("serviceId", "serviceName name")
      .lean();

    rewardCoupons = rewardsDocs.map((doc: any) => ({
      id: doc._id.toString(),

      // DB se
      couponType: doc.couponType,
      type: doc.couponType?.toLowerCase(),

      title: doc.rewardName,
      code: doc.couponCode,
      description: doc.description || "",

      expiryDate: doc.validTill,

      rewardType: doc.rewardType,
      rewardValue: doc.rewardValue,
      rewardPoints: doc.rewardPoints,

      minimumSpend: doc.minimumSpend,
      maximumDiscount: doc.maximumDiscount,
      pointsRequired:doc.rewardsPoint,
      validFrom: doc.validFrom,
      validTill: doc.validTill,
      validDays: doc.validDays,
      startTime: doc.startTime,
      endTime: doc.endTime,

      services:
        doc.serviceId?.map((s: any) => s.name || s.serviceName) || [],
    }));
  }

  return [
    ...rewardCoupons
  ].sort(
    (a, b) =>
      new Date(a.expiryDate).getTime() -
      new Date(b.expiryDate).getTime()
  );
};



const getLoyaltyHistory = async (
  customerId?: string
): Promise<any[]> => {
  if (!customerId) return [];

  const customerObjectId = new mongoose.Types.ObjectId(customerId);

  // ===========================
  // Invoice History
  // ===========================
  const invoices = await Invoice.find({
    customerId: customerObjectId,
    isDeleted: false,
    isActive: true,
  }).lean();

  const invoiceHistory: any[] = [];

  for (const invoice of invoices) {
    const serviceDescription =
      invoice.items
        ?.map(
          (item: any) =>
            `${item.itemName}${item.quantity > 1 ? ` x${item.quantity}` : ""}`
        )
        .join(", ") || "Service";

    // Points Earned
    if (Number(invoice.loyaltyPoints || 0) > 0) {
      invoiceHistory.push({
        id: `${invoice._id}-earned`,
        date: invoice.invoiceDate,
        description: `Loyalty Points Earned by ${serviceDescription}`,
        points: Number(invoice.loyaltyPoints),
        amountPaid: invoice.amountPaid,
        type: "earned",
      });
    }

    // Points Used
    if (
      invoice.useLoyaltyPoints &&
      (invoice.loyaltyPointsDiscount || 0) > 0
    ) {
      invoiceHistory.push({
        id: `${invoice._id}-used`,
        date: invoice.invoiceDate,
        description: `Loyalty Points Used on ${serviceDescription}`,
        points: -invoice.loyaltyPointsDiscount,
        amountPaid: invoice.amountPaid,
        type: "used",
      });
    }
  }

  // ===========================
  // Reward Coupon History
  // ===========================
  const rewardCoupons = await RewardsCoupon.find({
    isDeleted: false,
    usedBy: customerObjectId,
  }).lean();

  const rewardHistory = rewardCoupons.map((coupon: any) => ({
    id: coupon._id.toString(),
    date: coupon.updatedAt || coupon.createdAt,
    description: `Redeemed Reward Coupon (${coupon.couponCode})`,
    points: -coupon.rewardsPoint,
    type: "redeemed",
  }));

  return [...invoiceHistory, ...rewardHistory].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// coupon.service.ts
export const getCouponByFilter = async (filter: any): Promise<CouponDocument | null> => {
  return await Coupon.findOne({
    ...filter,
    isDeleted: false,
    valid: { $gte: new Date() }, // ✅ Still valid (future)
  });
};



/**
 * Get Coupon by id
 * @param {object} matchObject
 * @returns {Promise<CouponDocument | null> }
 */
const getCouponByMultipleFields = async (matchObject: {
  [key: string]: any;
}): Promise<CouponDocument | null> => {
  return Coupon.findOne({
    ...matchObject,
    isDeleted: false,
  });
};

/**
 * Get Coupons by an array of IDs
 * @param {Array <string | number>} ids
 * @returns {Promise<Array<CouponDocument | null> >}
 */
const getCouponsByIds = async (
  ids: Array<string | number>
): Promise<Array<CouponDocument | null>> => {
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  return Coupon.find({ _id: { $in: objectIds }, isDeleted: false }).exec();
};

export {
  createCoupon,
  queryCoupons,
  updateCouponById,
  deleteCouponById,
  isExists,
  getCouponById,
  getCouponsByIds,
  getCouponByMultipleFields,
  toggleCouponStatusById,
  markCouponAsUsed,
  getCouponByCustomerId,
  getLoyaltyHistory
};
