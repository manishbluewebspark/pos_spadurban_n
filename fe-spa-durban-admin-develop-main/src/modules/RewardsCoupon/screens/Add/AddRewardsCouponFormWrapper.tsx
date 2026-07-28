// AddRewardsCouponFormWrapper.tsx
import { Formik, FormikHelpers, Form } from 'formik';
import React from 'react';
import { RewardsCouponFormValues } from '../../models/RewardsCoupon.model';
import RewardsCouponFormLayout from '../../components/RewardsCouponFormLayout';
import { object, string, number, array, boolean, mixed, ref } from 'yup';
import { useGetOutletQuery } from 'src/modules/Outlet/service/OutletServices';
import { useFetchData } from 'src/hooks/useFetchData';
import { showToast } from 'src/utils/showToaster';
import { useAddRewardsCouponMutation } from '../../service/RewardsCouponServices';
import { useNavigate } from 'react-router-dom';

type Props = {};

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const AddRewardsCouponFormWrapper = (props: Props) => {
  const navigate = useNavigate();
  const { data } = useFetchData(useGetOutletQuery, {});
  const [addRewardsCoupon] = useAddRewardsCouponMutation();


  
  const initialValues: RewardsCouponFormValues = {
    couponType: "NORMAL",
    rewardName: '',
    rewardsPoint: '',
    rewardType: 'AMOUNT',
    rewardValue: 0,
    minimumSpend: 0,
    maximumDiscount: 0,
    couponCode: '',
    branchId: [],
    serviceId: [],
    validDays: [],
    startTime: '09:00',
    endTime: '18:00',
    validFrom: null,
    validTill: null,
    description: '',
    isActive: true,
    status: 'active',
  };

  const validationSchema = object().shape({

    couponType: string()
      .required('Reward type is required')
      .oneOf(["REWARD", "PROMOTION", "GIFTCARD", "NORMAL"], 'Invalid reward type'),
    rewardName: string()
      .required('Reward name is required')
      .min(3, 'Minimum 3 characters')
      .max(100, 'Maximum 100 characters'),

    rewardsPoint: string()
      .required('Rewards point is required')
      .matches(/^[0-9]+$/, 'Must be a valid number'),

    rewardType: string()
      .required('Reward type is required')
      .oneOf(['AMOUNT', 'PERCENTAGE'], 'Invalid reward type'),

    rewardValue: number()
      .required('Reward value is required')
      .min(0, 'Cannot be negative')
      .when('rewardType', {
        is: 'PERCENTAGE',
        then: (schema) => schema.min(1, 'Must be at least 1%').max(100, 'Cannot exceed 100%'),
        otherwise: (schema) => schema.min(0, 'Cannot be negative'),
      }),

   minimumSpend: number()
  .transform((value, originalValue) =>
    originalValue === "" ? undefined : value
  )
  .required("Minimum spend is required")
  .min(0, "Cannot be negative"),

maximumDiscount: number()
  .transform((value, originalValue) =>
    originalValue === "" ? undefined : value
  )
  .required("Maximum discount is required")
  .min(0, "Cannot be negative"),

    couponCode: string()
      .required('Coupon code is required')
      .matches(/^[A-Z0-9]+$/, 'Must be uppercase letters and numbers only')
      .min(4, 'Minimum 4 characters')
      .max(20, 'Maximum 20 characters'),

    // BranchId - Required hataye
    branchId: array()
      .nullable()
      .optional(), // Not required anymore

    // ServiceId - Required hataye
    serviceId: array()
      .nullable()
      .optional(), // Not required anymore

    validDays: array()
      .min(1, 'Select at least one valid day')
      .of(string().oneOf(weekdays)),

    startTime: string()
      .required('Start time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),

    endTime: string()
      .required('End time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
      .test('is-after-start', 'End time must be after start time', function (value) {
        const { startTime } = this.parent;
        if (!startTime || !value) return true;
        return value > startTime;
      }),

    validFrom: mixed()
      .test('valid-date', 'Valid from date is required', function (value) {
        if (!value) return false;
        const date = new Date(value as string | Date);
        return !isNaN(date.getTime());
      })
      .test('future-date', 'Date must be in the future', function (value) {
        if (!value) return false;
        const date = new Date(value as string | Date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      }),

    validTill: mixed()
      .test('valid-date', 'Valid till date is required', function (value) {
        if (!value) return false;
        const date = new Date(value as string | Date);
        return !isNaN(date.getTime());
      })
      .test('after-valid-from', 'Valid till must be after valid from', function (value) {
        const { validFrom } = this.parent;
        if (!value || !validFrom) return false;
        const fromDate = new Date(validFrom as string | Date);
        const tillDate = new Date(value as string | Date);
        return tillDate > fromDate;
      }),

    description: string()
      .max(500, 'Maximum 500 characters')
      .nullable(),

    isActive: boolean(),
    status: string(),
  });

  const handleSubmit = (
    values: RewardsCouponFormValues,
    { resetForm, setSubmitting }: FormikHelpers<RewardsCouponFormValues>,
  ) => {
    const formattedValues = {
      couponType:values?.couponType,
      rewardName: values.rewardName,
      rewardsPoint: values.rewardsPoint,
      rewardType: values.rewardType,
      rewardValue: values.rewardValue,
      minimumSpend: values.minimumSpend,
      maximumDiscount: values.maximumDiscount,
      couponCode: values.couponCode.toUpperCase(),
      branchId: Array.isArray(values.branchId)
        ? values.branchId.map((branch: any) =>
          typeof branch === 'object' ? branch._id : branch
        )
        : [],
      serviceId: Array.isArray(values.serviceId)
        ? values.serviceId.map((service: any) =>
          typeof service === 'object' ? service._id : service
        )
        : [],
      validDays: values.validDays || [],
      startTime: values.startTime,
      endTime: values.endTime,
      validFrom: values.validFrom ? new Date(values.validFrom).toISOString() : null,
      validTill: values.validTill ? new Date(values.validTill).toISOString() : null,
      description: values.description || '',
      isActive: values.isActive,
      status: values.isActive ? 'active' : 'inactive',
    };

    addRewardsCoupon(formattedValues).then((res: any) => {
      if (res?.error) {
        showToast('error', res?.error?.data?.message || 'Failed to create coupon');
      } else {
        if (res?.data?.status) {
          showToast('success', res?.data?.message || 'Coupon created successfully!');
          resetForm();
          navigate('/rewards-coupon');
        } else {
          showToast('error', res?.data?.message || 'Failed to create coupon');
        }
      }
      setSubmitting(false);
    });
  };

  return (
    <Formik<RewardsCouponFormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      enableReinitialize
    >
      {(formikProps) => (
        <Form className="h-full">
          <RewardsCouponFormLayout
            formikProps={formikProps}
            formType="ADD"
            onCancel={() => navigate('/rewards-coupon')}
          />
        </Form>
      )}
    </Formik>
  );
};

export default AddRewardsCouponFormWrapper;