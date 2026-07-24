// RewardsCoupon.model.ts

export type RewardsCoupon = {
  rewardsPoint: string;
  status: string;
  couponCode: string;
  _id: string;
  isActive: boolean;
  createdAt: Date;
  rewardName?: string;
  rewardType?: 'AMOUNT' | 'PERCENTAGE';
  rewardValue?: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  branchId?: string[];
  validDays?: string[];
  startTime?: string;
  endTime?: string;
  validFrom?: Date | string;
  validTill?: Date | string;
  description?: string;
  serviceId?: any;
};

export type RewardsCouponFormValues = {
  // Basic Info
  rewardName: string;
  rewardsPoint: string;
  rewardType: 'AMOUNT' | 'PERCENTAGE';
  rewardValue: number;
  minimumSpend: number;
  maximumDiscount: number;
  
  // Coupon Details
  couponCode: string;
  
  // Branch & Service
  branchId: any[];
  serviceId: any[];
  
  // Validity
  validDays: string[];
  startTime: string;
  endTime: string;
  validFrom: Date | string | null;
  validTill: Date | string | null;
  
  // Additional Info
  description: string;
  isActive: boolean;
  status: string;
};

export type BranchOption = {
  _id: string;
  branchName: string;
  branchCode: string;
  address: string;
};

export type ServiceOption = {
  _id: string;
  itemName: string;
  categoryId: string;
};