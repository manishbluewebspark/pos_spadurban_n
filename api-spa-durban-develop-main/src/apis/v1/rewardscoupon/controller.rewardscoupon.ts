import { Request, Response } from "express";
import httpStatus from "http-status";
import { pick } from "../../../../utilities/pick";
import ApiError from "../../../../utilities/apiError";
import catchAsync from "../../../../utilities/catchAsync";
import { rewardsCouponService, outletService } from "../service.index";
import {
  DateFilter,
  RangeFilter,
  AuthenticatedRequest,
} from "../../../utils/interface";
import {
  getFilterQuery,
  getRangeQuery,
  getSearchQuery,
  checkInvalidParams,
  getDateFilterQuery,
} from "../../../utils/utils";
import { searchKeys, allowedDateFilterKeys } from "./schema.rewardscoupon";
import mongoose from "mongoose";
import { UserEnum } from "../../../utils/enumUtils";
import crypto from "crypto";
import RewardsCoupon from "./schema.rewardscoupon";

/**
 * Generate unique coupon code
 * Format: RWD-XXXXXXXXXX (10 character hex)
 */
const generateUniqueCouponCode = async (): Promise<string> => {
  let isUnique = false;
  let couponCode = "";

  while (!isUnique) {
    // Generate a random 10-character alphanumeric code with RWD prefix
    couponCode = `RWD-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    // Check if the code already exists in the database
    const existingCoupon = await RewardsCoupon.findOne({ 
      couponCode, 
      isDeleted: false 
    });
    if (!existingCoupon) {
      isUnique = true;
    }
  }

  return couponCode;
};

/**
 * Create Rewards Coupon
 */
const createRewardsCoupon = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    // Auto generate coupon code
    if (!req.body.couponCode) {
      req.body.couponCode = await generateUniqueCouponCode();
    }

    const rewardsCoupon =
      await rewardsCouponService.createRewardsCoupon(req.body);

    return res.status(httpStatus.CREATED).send({
      status: true,
      code: "OK",
      message: "Reward created successfully.",
      data: rewardsCoupon,
      issue: null,
    });
  }
);

/**
 * Get All Rewards Coupons with Pagination, Search, Filters
 */
const getRewardsCoupons = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const filter = pick(req.query, []);
    const options = pick(req.query, [
      "sortBy",
      "limit",
      "page",
      "searchValue",
      "searchIn",
      "dateFilter",
      "rangeFilterBy",
    ]);
    const searchValue = req.query.searchValue as string | undefined;
    const searchIn = req.query.searchIn as string[] | null;
    const dateFilter = req.query.dateFilter as DateFilter | null;
    const rangeFilterBy = req.query.rangeFilterBy as RangeFilter | undefined;
    const isAdmin = req?.userData?.userType === UserEnum.Admin;
    
    let outletQuery = {};
    if (!isAdmin) {
      outletQuery = {
        outletsId: {
          $in: req?.userData?.outletsData,
        },
      };
    }

    // Search functionality
    if (searchValue) {
      let searchQueryCheck = checkInvalidParams(
        searchIn ? searchIn : [],
        searchKeys
      );
      if (searchQueryCheck && !searchQueryCheck.status) {
        return res.status(httpStatus.OK).send({
          ...searchQueryCheck,
        });
      }
      const searchQuery = getSearchQuery(
        searchIn ? searchIn : [],
        searchKeys,
        searchValue
      );
      if (searchQuery !== null) {
        options["search"] = { $or: searchQuery } as any;
      }
    }

    // Date filter
    if (dateFilter) {
      const datefilterQuery = await getDateFilterQuery(
        dateFilter,
        allowedDateFilterKeys
      );
      if (datefilterQuery && datefilterQuery.length) {
        options["dateFilter"] = { $and: datefilterQuery } as any;
      }
    }

    // Range filter
    if (rangeFilterBy !== undefined) {
      const rangeQuery = getRangeQuery(rangeFilterBy);
      if (rangeQuery && rangeQuery.length) {
        options["rangeFilterBy"] = { $and: rangeQuery } as any;
      }
    }

    let additionalQuery = [{ $match: outletQuery }];
    options["additionalQuery"] = additionalQuery as any;
    
    const result = await rewardsCouponService.queryRewardsCoupons(
      filter,
      options
    );
    
    return res.status(httpStatus.OK).send(result);
  }
);

/**
 * Update Rewards Coupon
 */
const updateRewardsCoupon = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const { rewardsCouponId } = req.params;

    const rewardsCoupon =
      await rewardsCouponService.updateRewardsCouponById(
        rewardsCouponId,
        req.body
      );

    return res.status(httpStatus.OK).send({
      status: true,
      code: "OK",
      message: "Reward updated successfully.",
      data: rewardsCoupon,
      issue: null,
    });
  }
);

/**
 * Delete Rewards Coupon (Soft Delete)
 */
const deleteRewardsCoupon = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const { rewardsCouponId } = req.params;

    // Check if coupon exists
    const coupon = await RewardsCoupon.findOne({
      _id: rewardsCouponId,
      isDeleted: false,
    });
    if (!coupon) {
      throw new ApiError(httpStatus.NOT_FOUND, "Rewards coupon not found");
    }

    await rewardsCouponService.deleteRewardsCouponById(rewardsCouponId);
    
    return res.status(httpStatus.OK).send({
      message: "Deleted successfully!",
      data: null,
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

/**
 * Toggle Rewards Coupon Status (Active/Inactive)
 */
const toggleRewardsCouponStatus = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const { rewardsCouponId } = req.params;

    const rewardsCoupon = await rewardsCouponService.getRewardsCouponById(
      rewardsCouponId
    );
    if (!rewardsCoupon) {
      throw new ApiError(httpStatus.NOT_FOUND, "RewardsCoupon not found");
    }

    rewardsCoupon.isActive = !rewardsCoupon.isActive;
    rewardsCoupon.status = rewardsCoupon.isActive ? 'active' : 'inactive';
    await rewardsCoupon.save();

    return res.status(httpStatus.OK).send({
      message: "Status updated successfully.",
      data: rewardsCoupon,
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

/**
 * Get Single Rewards Coupon by ID
 */
const getRewardsCoupon = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const { rewardsCouponId } = req.params;

    const rewardsCoupon = await rewardsCouponService.getRewardsCouponById(
      rewardsCouponId
    );

    if (!rewardsCoupon || rewardsCoupon.isDeleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "RewardsCoupon not found");
    }

    return res.status(httpStatus.OK).send({
      message: "Successful.",
      data: rewardsCoupon,
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

/**
 * Generate Unique Coupon Code (Utility endpoint)
 */
const generateCouponCode = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const couponCode = await generateUniqueCouponCode();

    return res.status(httpStatus.OK).send({
      status: true,
      code: "OK",
      message: "Coupon code generated successfully.",
      data: { couponCode },
      issue: null,
    });
  }
);

/**
 * Bulk Delete Rewards Coupons
 */
const bulkDeleteRewardsCoupons = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please provide an array of coupon IDs to delete."
      );
    }

    await RewardsCoupon.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { isDeleted: true }
    );

    return res.status(httpStatus.OK).send({
      message: "Coupons deleted successfully!",
      data: null,
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

/**
 * Bulk Toggle Rewards Coupons Status
 */
const bulkToggleRewardsCouponsStatus = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userData) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please provide an array of coupon IDs to update."
      );
    }

    if (status === undefined || typeof status !== 'boolean') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please provide a valid status (true/false)."
      );
    }

    await RewardsCoupon.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { 
        isActive: status,
        status: status ? 'active' : 'inactive'
      }
    );

    return res.status(httpStatus.OK).send({
      message: "Coupons status updated successfully!",
      data: null,
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

export {
  createRewardsCoupon,
  getRewardsCoupons,
  updateRewardsCoupon,
  deleteRewardsCoupon,
  toggleRewardsCouponStatus,
  getRewardsCoupon,
  generateCouponCode,
  bulkDeleteRewardsCoupons,
  bulkToggleRewardsCouponsStatus,
};