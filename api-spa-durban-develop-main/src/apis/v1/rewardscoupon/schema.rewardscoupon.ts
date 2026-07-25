// RewardsCoupon.model.ts (Database Schema)
import mongoose, { Document, ObjectId, Types } from "mongoose";
import timestamp from "../../plugins/timeStamp.plugin";
import { paginate } from "../../plugins/pagination.plugin";
import {
  DateFilter,
  FilterByItem,
  RangeFilter,
} from "../../../utils/interface";

export interface RewardsCouponDocument extends Document {
  // Coupon Type
  couponType: "REWARD" | "PROMOTION" | "NORMAL" | "GIFTCARD";

  // Basic Info
  rewardName: string;
  rewardsPoint: number;
  rewardType: "AMOUNT" | "PERCENTAGE";
  rewardValue: number;
  minimumSpend: number;
  maximumDiscount: number;

  // Gift Card Only
  giftCardAmount: number;
  balanceAmount: number;

  // Promotion Only
  promotionCategory: string;

  // Coupon Details
  couponCode: string;

  // Relations
  branchId: ObjectId[];
  serviceId: ObjectId[];

  // Validity
  validDays: string[];
  startTime: string;
  endTime: string;
  validFrom: Date;
  validTill: Date;

  // Additional Info
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  status: string;
  customerId: Types.ObjectId;
  
  // Birthday type: TODAY or UPCOMING (14 days before)
  birthdayType: "TODAY" | "UPCOMING";
  // Tracking
  usedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  initialEmailSent: boolean;
  initialEmailSentAt?: Date | null;

  thirtyDayReminderSent: boolean;
  thirtyDayReminderSentAt?: Date | null;

  expiryReminderSent: boolean;
  expiryReminderSentAt?: Date | null;

  redeemedAt?: Date | null;

  communicationLogs: {
    event: "INITIAL" | "REMINDER_30_DAYS" | "EXPIRY_REMINDER";
    sentAt: Date;
    status: "SUCCESS" | "FAILED";
  }[];
}

export interface RewardsCouponModel
  extends mongoose.Model<RewardsCouponDocument> {
  paginate: (
    filter: any,
    options: any
  ) => Promise<{
    data: RewardsCouponDocument[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
    search: string;
    dateFilter: DateFilter | undefined;
    filterBy: FilterByItem | undefined;
    rangeFilterBy: RangeFilter | undefined;
  }>;
}

const RewardsCouponSchema = new mongoose.Schema<RewardsCouponDocument>(
  {
    couponType: {
      type: String,
      enum: ["REWARD", "PROMOTION", "NORMAL", "GIFTCARD"],
      required: true,
      default: "REWARD",
    },
    customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true,
},
birthdayType: {
    type: String,
    enum: ['TODAY', 'UPCOMING'],
},
    // Basic Info
    rewardName: {
      type: String,
      required: true,
      trim: true,
    },
    rewardsPoint: {
      type: Number,
      required: true,
      min: 0,
    },
    rewardType: {
      type: String,
      enum: ["AMOUNT", "PERCENTAGE"],
      required: true,
      default: "AMOUNT",
    },
    rewardValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumSpend: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maximumDiscount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Gift Card
    giftCardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Promotion
    promotionCategory: {
      type: String,
      default: "",
    },

    // Coupon Details
    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Relations
    branchId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
      },
    ],
    serviceId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
    ],

    // Validity
    validDays: [
      {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: true,
      },
    ],
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTill: {
      type: Date,
      required: true,
    },

    // Additional Info
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Communication Tracking
    initialEmailSent: {
      type: Boolean,
      default: false,
    },

    initialEmailSentAt: {
      type: Date,
      default: null,
    },

    thirtyDayReminderSent: {
      type: Boolean,
      default: false,
    },

    thirtyDayReminderSentAt: {
      type: Date,
      default: null,
    },

    expiryReminderSent: {
      type: Boolean,
      default: false,
    },

    expiryReminderSentAt: {
      type: Date,
      default: null,
    },

    redeemedAt: {
      type: Date,
      default: null,
    },

    communicationLogs: [
      {
        event: {
          type: String,
          enum: [
            "INITIAL",
            "REMINDER_30_DAYS",
            "EXPIRY_REMINDER",
          ],
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["SUCCESS", "FAILED"],
          default: "SUCCESS",
        },
      },
    ],
    // Tracking
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add pagination and timestamp plugins
paginate(RewardsCouponSchema);
timestamp(RewardsCouponSchema);

export const allowedDateFilterKeys = ["createdAt", "updatedAt", "validFrom", "validTill"];
export const searchKeys = [
  "rewardName",
  "couponCode",
  "description",
  "promotionCategory",
];

const RewardsCoupon = mongoose.model<RewardsCouponDocument, RewardsCouponModel>(
  "RewardsCoupon",
  RewardsCouponSchema
);

export default RewardsCoupon;