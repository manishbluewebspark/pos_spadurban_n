import JoiBase, { ObjectSchema } from "joi";
import JoiDate from "@joi/date";
import JoiObjectId from "joi-objectid";
import { objectId, dateFormat } from "../../../helper/commonValidation";

// Extend Joi with date and objectId
const Joi = JoiBase.extend(JoiDate);
(Joi as any).joiDate = JoiDate(JoiBase);
(Joi as any).joiObjectId = JoiObjectId(JoiBase);

/**
 * Create CashBack Validation Schema
 */
// validation.ts

export const create: { body: ObjectSchema } = {
  body: Joi.object().keys({
    // Basic Info
    rewardName: Joi.string().trim().required().min(3).max(100),
    rewardsPoint: Joi.number().required().min(0).integer(),
    rewardType: Joi.string().valid('AMOUNT', 'PERCENTAGE').required(),
    rewardValue: Joi.number().required().min(0)
      .when('rewardType', {
        is: 'PERCENTAGE',
        then: Joi.number().min(1).max(100),
        otherwise: Joi.number().min(0)
      }),
    minimumSpend: Joi.number().default(0).min(0),
    maximumDiscount: Joi.number().default(0).min(0),
    
    // Coupon Details
    couponCode: Joi.string().trim().uppercase().required().min(4).max(20),
    
    // Relations - Optional now (empty = all)
    branchId: Joi.array()
      .items(Joi.string().custom(objectId))
      .optional()
      .default([]),
    serviceId: Joi.array()
      .items(Joi.string().custom(objectId))
      .optional()
      .default([]),
    
    // Validity
    validDays: Joi.array()
      .items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
      .min(1)
      .required(),
    startTime: Joi.string()
      .required()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.pattern.base': 'Start time must be in HH:MM format'
      }),
    endTime: Joi.string()
      .required()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.pattern.base': 'End time must be in HH:MM format'
      })
      .custom((value:any, helpers:any) => {
        const { startTime } = helpers.state.ancestors[0];
        if (startTime && value <= startTime) {
          return helpers.error('any.invalid', {
            message: 'End time must be after start time'
          });
        }
        return value;
      }),
    validFrom: Joi.date().required().min('now'),
    validTill: Joi.date().required()
      .custom((value:any, helpers:any) => {
        const { validFrom } = helpers.state.ancestors[0];
        if (validFrom && value <= validFrom) {
          return helpers.error('any.invalid', {
            message: 'Valid till must be after valid from'
          });
        }
        return value;
      }),
    
    // Additional Info
    description: Joi.string().max(500).allow('').optional(),
    isActive: Joi.boolean().default(true),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

export const update: { body: ObjectSchema } = {
  body: Joi.object().keys({
    rewardName: Joi.string().trim().min(3).max(100),
    rewardsPoint: Joi.number().min(0).integer(),
    rewardType: Joi.string().valid('AMOUNT', 'PERCENTAGE'),
    rewardValue: Joi.number().min(0)
      .when('rewardType', {
        is: 'PERCENTAGE',
        then: Joi.number().min(1).max(100),
        otherwise: Joi.number().min(0)
      }),
    minimumSpend: Joi.number().min(0),
    maximumDiscount: Joi.number().min(0),
    couponCode: Joi.string().trim().uppercase().min(4).max(20),
    branchId: Joi.array()
      .items(Joi.string().custom(objectId))
      .optional(),
    serviceId: Joi.array()
      .items(Joi.string().custom(objectId))
      .optional(),
    validDays: Joi.array()
      .items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
      .min(1),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.pattern.base': 'Start time must be in HH:MM format'
      }),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.pattern.base': 'End time must be in HH:MM format'
      })
      .custom((value:any, helpers:any) => {
        const { startTime } = helpers.state.ancestors[0];
        if (startTime && value && value <= startTime) {
          return helpers.error('any.invalid', {
            message: 'End time must be after start time'
          });
        }
        return value;
      }),
    validFrom: Joi.date(),
    validTill: Joi.date()
      .custom((value:any, helpers:any) => {
        const { validFrom } = helpers.state.ancestors[0];
        if (validFrom && value && value <= validFrom) {
          return helpers.error('any.invalid', {
            message: 'Valid till must be after valid from'
          });
        }
        return value;
      }),
    description: Joi.string().max(500).allow(''),
    isActive: Joi.boolean(),
    status: Joi.string().valid('active', 'inactive'),
  }),
};

/**
 * Filter and Pagination API Validation
 */
export const getAllFilter: { query: ObjectSchema } = {
  query: Joi.object().keys({
    searchIn: Joi.array().items(Joi.string().required()),
    searchValue: Joi.string().allow(""),
    dateFilter: Joi.object()
      .keys({
        startDate: Joi.string().custom(dateFormat).allow(""),
        endDate: Joi.string().custom(dateFormat).allow(""),
        dateFilterKey: Joi.string().allow(""),
      })
      .default({}),
    rangeFilterBy: Joi.object()
      .keys({
        rangeFilterKey: Joi.string().allow(""),
        rangeInitial: Joi.string().allow(""),
        rangeEnd: Joi.string().allow(""),
      })
      .default({})
      .optional(),
    orderBy: Joi.string().allow(""),
    orderByValue: Joi.number().valid(1, -1).allow(""),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    filterBy: Joi.array().items(
      Joi.object().keys({
        fieldName: Joi.string().allow(""),
        value: Joi.alternatives().try(
          Joi.string().allow(""),
          Joi.number().allow(""),
          Joi.boolean().allow(""),
          Joi.array().items(Joi.string()).default([]),
          Joi.array().items(Joi.number()).default([]),
          Joi.array().items(Joi.boolean()).default([]),
          Joi.array().default([])
        ),
      })
    ),
    isPaginationRequired: Joi.boolean().default(true).optional(),
  }),
};

/**
 * Get by ID Validation
 */
export const getById: { params: ObjectSchema } = {
  params: Joi.object().keys({
    rewardsCouponId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Delete a Document Validation
 */
export const deleteDocument: { params: ObjectSchema } = {
  params: Joi.object().keys({
    rewardsCouponId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Change Status of Document Validation
 */
export const changeStatus: { params: ObjectSchema } = {
  params: Joi.object().keys({
    rewardsCouponId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Toggle Status of Document Validation
 */
export const toggleStatusDocument = {
  params: Joi.object().keys({
    rewardsCouponId: Joi.string().required(),
  }),
};
