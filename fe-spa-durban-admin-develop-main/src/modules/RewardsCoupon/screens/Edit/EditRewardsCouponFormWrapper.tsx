// EditRewardsCouponFormWrapper.tsx
import { Formik, FormikHelpers, Form } from 'formik';
import React from 'react';
import { RewardsCouponFormValues } from '../../models/RewardsCoupon.model';
import RewardsCouponFormLayout from '../../components/RewardsCouponFormLayout';
import { object, string, number, array, boolean, mixed } from 'yup';
import { useGetOutletQuery } from 'src/modules/Outlet/service/OutletServices';
import { useFetchData } from 'src/hooks/useFetchData';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetRewardsCouponQuery,
  useUpdateRewardsCouponMutation,
} from '../../service/RewardsCouponServices';
import { showToast } from 'src/utils/showToaster';

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

const EditRewardsCouponFormWrapper = (props: Props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [updateRewardsCoupon] = useUpdateRewardsCouponMutation();

  const { data: rewardsCouponData, isLoading } = useFetchData(
    useGetRewardsCouponQuery,
    {
      body: id,
      dataType: 'VIEW',
    },
  );

  const couponData = (rewardsCouponData as any)?.data || {};

  const initialValues: RewardsCouponFormValues = {
    rewardName: couponData?.rewardName || '',
    rewardsPoint: couponData?.rewardsPoint || '',
    rewardType: couponData?.rewardType || 'AMOUNT',
    rewardValue: couponData?.rewardValue || 0,
    minimumSpend: couponData?.minimumSpend || 0,
    maximumDiscount: couponData?.maximumDiscount || 0,
    couponCode: couponData?.couponCode || '',
    branchId: couponData?.branchId || [],
    serviceId: couponData?.serviceId || [],
    validDays: couponData?.validDays || [],
    startTime: couponData?.startTime || '09:00',
    endTime: couponData?.endTime || '18:00',
    validFrom: couponData?.validFrom ? new Date(couponData.validFrom) : null,
    validTill: couponData?.validTill ? new Date(couponData.validTill) : null,
    description: couponData?.description || '',
    isActive: couponData?.isActive ?? true,
    status: couponData?.status || 'active',
  };

  const validationSchema = object().shape({
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
      .required('Minimum spend is required')
      .min(0, 'Cannot be negative'),

    maximumDiscount: number()
      .required('Maximum discount is required')
      .min(0, 'Cannot be negative'),

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

    updateRewardsCoupon({
      body: formattedValues,
      rewardsCouponId: id
    }).then((res: any) => {
      if (res?.error) {
        showToast('error', res?.error?.data?.message || 'Failed to update coupon');
      } else {
        if (res?.data?.status) {
          showToast('success', res?.data?.message || 'Coupon updated successfully!');
          resetForm();
          navigate('/rewards-coupon');
        } else {
          showToast('error', res?.data?.message || 'Failed to update coupon');
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
            formType="EDIT"
            onCancel={() => navigate('/rewards-coupon')}
            isLoading={isLoading}
          />
        </Form>
      )}
    </Formik>
  );
};

export default EditRewardsCouponFormWrapper;