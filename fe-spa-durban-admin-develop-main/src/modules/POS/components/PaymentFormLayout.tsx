import { IconCheck, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { FieldArray, FormikProps } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import ATMCheckbox from 'src/components/atoms/FormElements/ATMCheckbox/ATMCheckbox';
import ATMNumberField from 'src/components/atoms/FormElements/ATMNumberField/ATMNumberField';
import ATMSelect from 'src/components/atoms/FormElements/ATMSelect/ATMSelect';
import ATMTextField from 'src/components/atoms/FormElements/ATMTextField/ATMTextField';
import MOLFormDialog from 'src/components/molecules/MOLFormDialog/MOLFormDialog';
import { useFetchData } from 'src/hooks/useFetchData';
import { useGetPaymntModesQuery } from 'src/modules/PaymentMode/service/PaymentModeServices';
import { useGetAllTypeCouponsQuery } from 'src/modules/PromotionCoupons/service/PromotionCouponsServices';
import { CURRENCY } from 'src/utils/constants';
import { showToast } from 'src/utils/showToaster';

type Props = {
  formikProps: FormikProps<any>;
  onClose: () => void;
  payAbleAmount: number;
  handleApplyPayment: any;
  onDraft: any;
  previewData: any;
  isPreviewed: boolean;
  onModify: () => void;
  previewIsLoading: boolean;
  isDraftSubmitting: boolean;
  loyaltyPoints: number;
};

type Coupon = {
  type: 'GiftCard' | 'Promotional' | 'Birthday' | 'Reward'
  code: string
  discount?: number
  discountPercent?: number
  validTill: string
}


const PaymentFormLayout = ({
  formikProps,
  onClose,
  onDraft,
  payAbleAmount,
  handleApplyPayment,
  previewData,
  isPreviewed,
  onModify,
  previewIsLoading,
  loyaltyPoints,
  isDraftSubmitting
}: Props) => {
  const { values, setFieldValue, isSubmitting } = formikProps;
  const customerId = values?.customer?._id;
  const serviceIds = values?.items.map((item: any) => item._id);
  const { data: allCoupans, isLoading, refetch } = useGetAllTypeCouponsQuery({ customerId, items: serviceIds });


  const [showEFTModal, setShowEFTModal] = useState(false);
  const [currentIndexForEFT, setCurrentIndexForEFT] = useState<number | null>(null);
  const [eftTxnNumber, setEftTxnNumber] = useState('');

  const { data: paymentData, isLoading: paymentLoading } = useFetchData(
    useGetPaymntModesQuery,
    {
      body: {
        isPaginationRequired: false,
        filterBy: JSON.stringify([
          {
            fieldName: 'isActive',
            value: true,
          },
        ]),
      },
    },
  );

  const calculateGivenChange = () => {
    const total = previewData?.invoiceData?.totalAmount || 0;
    const received = calculateTotalReceived();
    const change = received - total;
    return change > 0 ? change : 0;
  };


  const calculateTotalReceived = useCallback(() => {
    return values.amountReceived.reduce(
      (total: number, payment: any) => total + (Number(payment.amount) || 0),
      0,
    );
  }, [values.amountReceived]);

  // console.log('-------calculateTotalReceived', calculateTotalReceived())
  const isLastPaymentModeFilled = () => {
    if (values?.amountReceived?.length === 0) {
      return true;
    }
    const lastPaymentMode =
      values?.amountReceived?.[values.amountReceived.length - 1];
    return (
      lastPaymentMode && lastPaymentMode.paymentModeId && lastPaymentMode.amount
    );
  };

  // Get the paymentModeId for Cash
  const showPaymentData = () => {
    const totalAmount = previewData?.invoiceData?.totalAmount || 0;

    // Get all non-cash payments and sum them
    const nonCashTotal = values.amountReceived.reduce(
      (acc: number, curr: any) => {
        const modeType = paymentData?.find(
          (mode: any) => mode._id === curr.paymentModeId?._id,
        )?.type;

        const amount = parseFloat(curr.amount) || 0;

        if (modeType !== 'cash') {
          return acc + amount;
        }

        return acc;
      },
      0,
    );

    return nonCashTotal > totalAmount;
  };

  const [selectedCode, setSelectedCode] = useState<string>('')

  useEffect(() => {
    refetch()
  }, [])

  const isButtonDisabled =
    calculateTotalReceived() < previewData?.invoiceData?.totalAmount;
  return (
    <>
      <MOLFormDialog
        title="Payment"
        onClose={onClose}
        isSubmitting={isSubmitting}
        isSubmitButtonDisabled={isButtonDisabled}
        isDraftSubmitting={isDraftSubmitting}
        draftbtn
        onDraft={() => onDraft(values)}
      >
        <div className="flex gap-4">
          <div className="border rounded-lg  w-[500px] h-[500px] flex flex-col justify-between overflow-x-auto">
            <div className="flex flex-col gap-2">
              {/* payAbleAmount */}
              <div className="flex items-center justify-between p-2 text-sm font-medium tracking-wide border-b">
                <span> Summary</span>
                <span>
                  {' '}
                  {/* Modify */}
                  {isPreviewed && (
                    <div className="flex justify-end text-xs font-medium text-blue-500 ">
                      <div
                        className="flex gap-1 cursor-pointer"
                        onClick={() => {
                          onModify();
                          setFieldValue('amountReceived', [
                            { paymentModeId: '', amount: '' },
                          ]);
                        }}
                      >
                        <IconEdit size={18} /> Modify
                      </div>
                    </div>
                  )}
                </span>
              </div>

              {/* Shipping Charges */}
              <div className="flex flex-col gap-1 px-2">
                <div className="flex items-center justify-between p-1 text-xs font-regular">
                  <div className=" text-neutral-40"> Sub Total</div>{' '}
                  <div className="font-medium">
                    {CURRENCY} {payAbleAmount?.toFixed(2)}
                  </div>
                </div>
                {/* <div className="">
                  {isPreviewed ? (
                    <div className="flex items-center justify-between p-1 text-xs font-regular">
                      <div className=" text-neutral-40"> Shipping Charges</div>{' '}
                      <div className="font-medium">
                        {CURRENCY} {values?.shippingCharges}
                      </div>
                    </div>
                  ) : (
                    <ATMNumberField
                      name="shippingCharges"
                      value={values?.shippingCharges}
                      onChange={(newValue) =>
                        setFieldValue('shippingCharges', newValue)
                      }
                      placeholder="Enter Shipping Charges"
                      label="Shipping Charges"
                    />
                  )}
                </div> */}

                {/* Coupon Discount */}
                <div className="">
                  {isPreviewed ? (
                    previewData?.invoiceData?.couponDiscount ? (
                      <div className="flex justify-between p-1 text-xs font-regular">
                        <div className="flex flex-col gap-1 text-neutral-40">
                          Coupon Applied{' '}
                          <div className="px-2 py-[2px] font-semibold text-green-800 bg-green-100 rounded-md w-fit text-[10px]">
                            {values?.couponCode}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium text-green-600">
                            - {CURRENCY}{' '}
                            {previewData?.invoiceData?.couponDiscount?.toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <ATMTextField
                      name="couponCode"
                      value={values?.couponCode}
                      onChange={(e) => {
                        setFieldValue('couponCode', e.target.value)
                        // setFieldValue('useCashBackAmount', false)

                      }}
                      placeholder="Enter Coupon Code"
                      label="Coupon Code"
                    />
                  )}
                </div>

               

                {!isPreviewed && allCoupans?.data?.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Available Coupons</span>
                      <span className="text-[10px] text-gray-400">{allCoupans.data.length} coupon(s)</span>
                    </div>

                    <div className="flex flex-nowrap gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {allCoupans.data.map((coupon: any, index: number) => {
                        const isSelected = selectedCode === coupon.code;
                        const couponType = coupon.couponType || coupon.type || 'COUPON';

                        // Get coupon type details
                        const getTypeDetails = () => {
                          const type = couponType.toUpperCase();
                          if (type === 'REWARD') {
                            return {
                              icon: '🏅',
                              label: 'Reward',
                              color: '#6c5ce7',
                              bgColor: '#f3f0ff'
                            };
                          } else if (type === 'GIFTCARD') {
                            return {
                              icon: '🎁',
                              label: 'Gift Card',
                              color: '#006972',
                              bgColor: '#eef9f8'
                            };
                          } else if (type === 'PROMOTION') {
                            return {
                              icon: '💥',
                              label: 'Promotion',
                              color: '#e17055',
                              bgColor: '#fef0ed'
                            };
                          } else {
                            return {
                              icon: '🏷️',
                              label: 'Coupon',
                              color: '#636e72',
                              bgColor: '#f5f5f5'
                            };
                          }
                        };

                        const typeDetails = getTypeDetails();
                        const isReward = couponType.toUpperCase() === 'REWARD';
                        const isGiftCard = couponType.toUpperCase() === 'GIFTCARD';
                        const isPromotion = couponType.toUpperCase() === 'PROMOTION';

                        return (
                          <label
                            key={index}
                            className={`min-w-[220px] max-w-[280px] rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 flex-shrink-0 ${isSelected
                                ? 'border-[#006972] shadow-lg scale-[1.02]'
                                : 'border-gray-200 bg-white hover:border-[#006972] hover:shadow-md hover:scale-[1.01]'
                              }`}
                            style={{
                              borderColor: isSelected ? typeDetails.color : undefined,
                              background: isSelected ? typeDetails.bgColor : '#ffffff'
                            }}
                          >
                            <div className="flex gap-2">
                              {/* Radio Button */}
                              <div className="flex-shrink-0 pt-0.5">
                                <input
                                  type="radio"
                                  name="coupon"
                                  value={coupon.code}
                                  checked={isSelected}
                                  onChange={() => {
                                    // Reset all coupon fields
                                    setFieldValue('couponCode', '');
                                    setFieldValue('giftCardCode', '');
                                    setFieldValue('promotionCoupanCode', '');
                                    setFieldValue('rewardCoupan', '');
                                    setFieldValue('useLoyaltyPoints', false);

                                    // Set the selected coupon based on type
                                    const type = couponType.toUpperCase();
                                   setFieldValue("couponCode", coupon.code);
                                    setSelectedCode(coupon.code);
                                  }}
                                  className="accent-[#006972] w-4 h-4 cursor-pointer"
                                />
                              </div>

                              {/* Coupon Content */}
                              <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{typeDetails.icon}</span>
                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: typeDetails.color }}
                                    >
                                      {typeDetails.label}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#006972] text-white whitespace-nowrap">
                                      ✓ Selected
                                    </span>
                                  )}
                                </div>

                                {/* Reward Name */}
                                <div className="text-xs font-medium text-gray-700 truncate mt-0.5">
                                  {coupon.rewardName || coupon.title || 'Coupon'}
                                </div>

                                {/* Coupon Code */}
                                <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded mt-1 truncate">
                                  {coupon.code}
                                </div>

                                {/* Tags */}
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {/* Discount Tag */}
                                  {coupon.rewardType === 'PERCENTAGE' ? (
                                    <span
                                      className="text-[9px] text-white px-2 py-0.5 rounded font-medium"
                                      style={{ background: typeDetails.color }}
                                    >
                                      {coupon.rewardValue || coupon.discountPercent || coupon.discount}% OFF
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[9px] text-white px-2 py-0.5 rounded font-medium"
                                      style={{ background: typeDetails.color }}
                                    >
                                      R {coupon.rewardValue || coupon.discount || 0} OFF
                                    </span>
                                  )}

                                  {/* Reward Points - Only for REWARD type */}
                                  {isReward && coupon.rewardsPoint > 0 && (
                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                      {coupon.rewardsPoint} Pts
                                    </span>
                                  )}

                                  {/* Minimum Spend */}
                                  {coupon.minimumSpend > 0 && (
                                    <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                                      Min R{coupon.minimumSpend}
                                    </span>
                                  )}

                                  {/* Maximum Discount */}
                                  {coupon.maximumDiscount > 0 && (
                                    <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                                      Max R{coupon.maximumDiscount}
                                    </span>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className="mt-2 flex items-center justify-between text-[9px] text-gray-400">
                                  <span>{coupon.validTill ? new Date(coupon.validTill).toLocaleDateString() : 'N/A'}</span>
                                  {coupon.validDays && coupon.validDays.length > 0 && coupon.validDays.length < 7 && (
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                                      {coupon.validDays.map((d: string) => d.slice(0, 3)).join(', ')}
                                    </span>
                                  )}
                                  {coupon.validDays && coupon.validDays.length === 7 && (
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[8px]">
                                      All Days
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Selected coupon info */}
                    {selectedCode && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconCheck size={16} className="text-green-600" />
                          <span className="text-xs text-green-700">
                            Coupon <strong>{selectedCode}</strong> applied successfully!
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCode('');
                            setFieldValue('couponCode', '');
                            setFieldValue('giftCardCode', '');
                            setFieldValue('promotionCoupanCode', '');
                            setFieldValue('rewardCoupan', '');
                            setFieldValue('useLoyaltyPoints', false);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 p-1"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}



                {/* <div className="">
                  {isPreviewed ? (
                    previewData?.invoiceData?.usedCashBackAmount ? (
                      <div className="flex items-center justify-between p-1 text-xs font-regular">
                        <div className=" text-neutral-40">
                          Cash Back Discount
                        </div>
                        <span className="font-medium text-green-600">
                          - {CURRENCY}{' '}
                          {previewData?.invoiceData?.usedCashBackAmount?.toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    ) : null
                  ) : (
                    <div className="flex items-center justify-between">
                      <ATMCheckbox
                        checked={values?.useCashBackAmount}
                        onChange={() => {
                          const newUseCashBackAmount =
                            !values?.useCashBackAmount; // Toggle value
                          setFieldValue(
                            'useCashBackAmount',
                            newUseCashBackAmount,
                          );

                          setFieldValue(
                            'usedCashBackAmount',
                            newUseCashBackAmount
                              ? cashBackAmount?.toFixed(2)
                              : 0,
                          );
                        }}
                        size="small"
                        label="Use Cash Back"
                        disabled={isPreviewed}
                      />
                      <div className="text-[12px] font-medium text-blue-800">
                        {!values?.useCashBackAmount && cashBackAmount
                          ? cashBackAmount?.toFixed(2)
                          : null}
                        {values?.useCashBackAmount && (
                          <ATMNumberField
                            name="usedCashBackAmount"
                            value={values?.usedCashBackAmount}
                            onChange={(newValue) =>
                              setFieldValue('usedCashBackAmount', newValue)
                            }
                            placeholder="Enter Amount"
                            className={'!w-[80px]'}
                            isAllowDecimal={true}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div> */}
              </div>
            </div>


            <div>
              {/* Loyalty Points Earned */}
              {isPreviewed && previewData?.invoiceData?.totalDiscount ? (
                <div className="px-4 py-1 text-xs font-medium text-green-900">
                  Discount Applied : R {Number(previewData?.invoiceData?.totalDiscount).toFixed(2)}
                </div>
              ) : null}


              {/* Payable Amount APPLY BUTTON */}
              <div>
                {isPreviewed && previewData?.invoiceData?.totalAmount ? (
                  <div className="flex gap-2 px-4 py-2 text-sm bg-yellow-100 rounded-b-lg">
                    <div className="flex-1 font-medium ">Payable Amount</div>
                    <div className="min-w-[60px]  font-medium text-slate-800 text-right">
                      {CURRENCY}{' '}
                      {previewData?.invoiceData?.totalAmount?.toFixed(2) || 0}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end px-2 mb-2 mt-1">
                    <ATMButton
                      onClick={() => {
                        handleApplyPayment(values, setFieldValue);
                      }}
                      isLoading={previewIsLoading}
                      disabled={payAbleAmount === 0}
                    >
                      Apply
                    </ATMButton>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!isPreviewed ? (
            <div className=" w-[500px]"></div>
          ) : (
            <div className="flex flex-col justify-between p-2 border rounded-lg w-[500px]">
              <div className="flex flex-col gap-2 ">
                {/* Amount Received */}
                <div className="pb-2 text-sm font-medium tracking-wide border-b border-dashed text-slate-500">
                  Amount Received
                </div>
                <div className="grid items-end grid-cols-2 gap-2 text-xs font-medium tracking-wide text-slate-500 ">
                  <div className="col-span-1 ">Payment Mode</div>
                  <div className="">Amount</div>
                </div>
                {/* FieldArray For PaymentMode */}
                <FieldArray name="amountReceived">
                  {({ insert, remove, push }) => (
                    <div className="flex flex-col gap-5 ">
                      {values.amountReceived.length > 0 &&
                        values.amountReceived.map(
                          (payment: any, index: number) => (
                            <div
                              key={index}
                              className="grid items-end grid-cols-2 gap-2"
                            >
                              <div className="col-span-1">
                                <ATMSelect
                                  name={`amountReceived.${index}.paymentModeId`}
                                  value={
                                    values.amountReceived[index].paymentModeId
                                  }
                                  onChange={(newValue) => {
                                    // console.log(newValue, 'new value');
                                    const selectedMode = newValue?.modeName?.toLowerCase();

                                    if (selectedMode === 'eft') {
                                      setCurrentIndexForEFT(index);        // Track which row this EFT is for
                                      setShowEFTModal(true);               // Open modal
                                    }
                                    setFieldValue(
                                      `amountReceived.${index}.paymentModeId`,
                                      newValue,
                                    );
                                  }}
                                  label=""
                                  options={paymentData}
                                  valueAccessKey="_id"
                                  placeholder="Payment mode"
                                  getOptionLabel={(option: any) =>
                                    option?.modeName
                                  }
                                  isOptionDisabled={(option) => {
                                    return (
                                      values?.amountReceived?.findIndex(
                                        (modes: any) =>
                                          modes?.paymentModeId?._id ===
                                          option._id,
                                      ) > -1
                                    );
                                  }}
                                  isLoading={paymentLoading}
                                />
                                {/* <h2>
                                  <strong>Amount to Pay</strong>
                                </h2> */}
                              </div>
                              <div className="flex items-center gap-2">
                                <ATMNumberField
                                  name={`amountReceived.${index}.amount`}
                                  value={values.amountReceived[index].amount}
                                  onChange={(newValue) => {
                                    setFieldValue(
                                      `amountReceived.${index}.amount`,
                                      newValue,
                                    );
                                  }}
                                  label=""
                                  placeholder="Enter Payment"
                                  isAllowDecimal
                                />
                                <div className="">
                                  <ATMButton
                                    type="button"
                                    onClick={() => remove(index)}
                                    variant="text"
                                    extraClasses=" text-red-500"
                                  >
                                    <IconTrash />
                                  </ATMButton>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      <div>
                        {showPaymentData() ? (
                          <div className="text-xs font-semibold text-red-500">
                            Total received amount cannot be greater than payable
                            amount.
                          </div>
                        ) : null}
                      </div>

                      <div
                        className={`flex items-center justify-center gap-1 py-2 border border-dashed rounded cursor-pointer bg-gray-50  ${!isLastPaymentModeFilled()
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                          }`}
                        onClick={() => {
                          if (isLastPaymentModeFilled()) {
                            push({ paymentModeId: '', amount: '' });
                          }
                        }}
                      >
                        <IconPlus className="size-[0.75rem]" />
                        <span className="text-xs font-semibold">
                          Add Payment Mode
                        </span>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>
              {/* <div className="flex flex-wrap col-span-4 gap-4 py-4 h-fit">
                {paymentData?.map((product) => {
                  // console.log('product', product);
                  console.log('product', values?.amountReceived);

                  return (
                    <div
                      key={product?._id}
                      onClick={() => {
                        setFieldValue(
                          `amountReceived.${0}.paymentModeId`,
                          product,
                        );
                      }}
                      className=" rounded-md cursor-pointer min-w-[140px] max-w-[140px] shadow"
                    >
                      <div
                        className={`flex flex-col gap-2 px-2 py-1 pb-2 rounded-md ${values?.amountReceived && values?.amountReceived[0].paymentModeId?._id === product._id ? 'bg-[#b7b7b7]' : 'bg-[#3a1bff]'}  rounded-b-md h-[60px]`}
                      >
                        <div
                          title={product?.modeName}
                          className="flex items-center justify-center text-[12px] text-white line-clamp-2 font-medium capitalize h-full text-center"
                        >
                          {product?.modeName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div> */}
              {/*due balance */}
              <div className="flex items-center justify-end gap-2 pt-2 text-sm font-medium tracking-wide text-red-500 ">
                <div>
                  {(previewData?.invoiceData?.totalAmount -
                    calculateTotalReceived() || 0) < 0
                    ? 'Give Change : '
                    : 'Balance Due :'}
                </div>
                <div>
                  {CURRENCY}{' '}
                  {Math.abs(
                    previewData?.invoiceData?.totalAmount -
                    calculateTotalReceived() || 0,
                  )?.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {showEFTModal && currentIndexForEFT !== null && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-lg font-semibold mb-3">Enter EFT Transaction Number</h2>
                <input
                  required
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Txn / UTR / Reference Number"
                  value={eftTxnNumber}
                  onChange={(e) => setEftTxnNumber(e.target.value)}
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowEFTModal(false);
                      setEftTxnNumber('');
                      setCurrentIndexForEFT(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-1 rounded"
                  >
                    Cancel
                  </button>

                  <ATMButton
                    onClick={() => {
                      if (!eftTxnNumber.trim()) {
                        showToast("error", "Transaction number is required for EFT.");
                        return;
                      }
                      // console.log('--------------currentIndexForEFT-----', currentIndexForEFT)

                      // Set the value in Formik
                      setFieldValue(`amountReceived.${currentIndexForEFT}.txnNumber`, eftTxnNumber);

                      setShowEFTModal(false);
                      setCurrentIndexForEFT(null);
                      setEftTxnNumber('');
                    }}

                  >
                    Save
                  </ATMButton>
                </div>
              </div>
            </div>
          )}

        </div>
      </MOLFormDialog>
    </>
  );
};

export default PaymentFormLayout;
