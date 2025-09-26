export type Register = {
  registerId: string;
  openingBalance: number;
  _id: string;
};

export type OpenRegisterFormValues = {
  registerId?: any;
  openingBalance: string;
  reason:string;
};

export type PaymentMode = {
  manual: any;
  _id: string;
  totalAmount: number;
  paymentModeName: string;
  bankDeposit: any;
  reasons: any;
 cashUsages: [{
    reason: string;
    amount: string;
    proofUrl: string;
    createdAt: Date;
  }];
};

export type RegisterValue = {
  openedAt: Date;
  closedAt:Date;
  _id: string;
  openingBalance: number;
  carryForwardBalance: number;
  closeRegister: any;
  registerStatus: string;
  bankDeposit: number;
  totalPayouts:number;
  totalManualAmount:number;
  cashAmount: number;
  cashUsageProofUrl:string;
  cashUsageReason:string;
  actions:any;
   cashUsages: [{
    reason: string;
    amount: string;
    proofUrl: string;
    createdAt: Date;
  }];
};

export type BookingValue = {
  bookingId:string;
  bookingNumber:string;
  invoiceNumber:string;
  startTime:string;
  endTime:string;
  duration:string;
  customerName:string;
  customerEmail:string;
  customerPhone:string;
  branchName:string;
  services?:[];
  createdAt:Date;
}