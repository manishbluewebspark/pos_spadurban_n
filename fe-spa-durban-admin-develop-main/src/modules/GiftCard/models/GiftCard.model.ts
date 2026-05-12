export type GiftCard = {
  customerName: string;
  totalRedeemed:number;
  balance:number;
  totalSold:Number;
  type: string;
  giftCardName: string;
  giftCardNumber:Number;
  giftCardAmount: number;
  createdAt: string;
  giftCardExpiryDate: string;
  giftCardCode: string;
  isActive: boolean;
  status: any;
  _id: string;
};

export type GiftCardFormValues = {
  type: string;
  customerId: any;
  giftCardName: string;
  giftCardAmount: string;
  giftCardExpiryDate: any;
};
