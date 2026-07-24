// RewardsCouponFormLayout.tsx
import { FormikProps } from 'formik';
import React, { useState } from 'react';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import ATMMultiSelect from 'src/components/atoms/FormElements/ATMMultiSelect/ATMMultiSelect';
import ATMTextField from 'src/components/atoms/FormElements/ATMTextField/ATMTextField';
import ATMNumberField from 'src/components/atoms/FormElements/ATMNumberField/ATMNumberField';
import ATMSelect from 'src/components/atoms/FormElements/ATMSelect/ATMSelect';
import ATMDatePicker from 'src/components/atoms/FormElements/ATMDatePicker/ATMDatePicker';
import ATMCircularProgress from 'src/components/atoms/ATMCircularProgress/ATMCircularProgress';
import { RewardsCouponFormValues } from '../models/RewardsCoupon.model';
import { useGetItemsAllQuery } from 'src/modules/Product/service/ProductServices';
import { useFetchData } from 'src/hooks/useFetchData';

const rewardTypeOption = [
  { label: 'Amount (Fixed)', value: 'AMOUNT' },
  { label: 'Percentage (%)', value: 'PERCENTAGE' },
];

const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

type Props = {
  formikProps: FormikProps<RewardsCouponFormValues>;
  formType: 'ADD' | 'EDIT';
  onCancel: () => void;
  isLoading?: boolean;
  branchData?: any[];
};

const RewardsCouponFormLayout = ({
  formikProps,
  formType,
  onCancel,
  isLoading,
  branchData,
}: Props) => {
  const { values, setFieldValue, isSubmitting, handleBlur, touched, errors } =
    formikProps;

  const [searchValue, setSearchValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch services/products
  const { data: serviceData, isLoading: servicesLoading } = useFetchData(
    useGetItemsAllQuery,
    {
      body: {
        searchValue: searchValue,
        filterBy: JSON.stringify([
          {
            fieldName: 'categoryId',
            value: [],
          },
        ]),
      },
      options: {
        skip: false,
      },
    }
  );

  // Handle day selection
  const handleDayToggle = (day: string) => {
    const currentDays = values.validDays || [];
    if (currentDays.includes(day)) {
      setFieldValue(
        'validDays',
        currentDays.filter((d) => d !== day)
      );
    } else {
      setFieldValue('validDays', [...currentDays, day]);
    }
  };

  // Render day checkboxes
  const renderDayCheckboxes = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {weekdays.map((day) => {
          const isSelected = values.validDays?.includes(day) || false;
          return (
            <label
              key={day}
              className={`flex items-center justify-center p-2 border rounded cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleDayToggle(day)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{day.slice(0, 3)}</span>
            </label>
          );
        })}
      </div>
    );
  };

  // Helper to check if field has error
  const hasError = (field: keyof RewardsCouponFormValues) => {
    return touched[field] && errors[field] ? true : false;
  };

  // 🔥 FIX: Convert string to Date for ATMDatePicker
  const getDateValue = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  if (isLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <ATMCircularProgress />
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        {/* Sticky Header */}
        <div className="sticky -top-2 flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 bg-white z-[10000] border-b border-gray-200">
          <span className="text-lg font-semibold text-slate-700">
            {formType === 'ADD' ? 'Add' : 'Edit'} Rewards Coupon
          </span>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <ATMButton variant="outlined" onClick={onCancel}>
              Cancel
            </ATMButton>
            <ATMButton type="submit" isLoading={isSubmitting}>
              {formType === 'ADD' ? 'Submit' : 'Update'}
            </ATMButton>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Reward Name */}
          <div className="md:col-span-2">
            <ATMTextField
              required
              name="rewardName"
              label="Reward Name"
              value={values.rewardName}
              onChange={(e) => setFieldValue('rewardName', e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter reward name"
              isTouched={touched.rewardName}
              errorMessage={touched.rewardName && errors.rewardName ? String(errors.rewardName) : undefined}
              isValid={!hasError('rewardName')}
            />
          </div>

          {/* Rewards Point */}
          <div>
            <ATMNumberField
              required
              label="Rewards Point"
              name="rewardsPoint"
              value={values.rewardsPoint}
              onChange={(newValue) => setFieldValue('rewardsPoint', newValue)}
              placeholder="Enter rewards point"
              onBlur={handleBlur}
              isTouched={touched.rewardsPoint}
              errorMessage={touched.rewardsPoint && errors.rewardsPoint ? String(errors.rewardsPoint) : undefined}
              isValid={!hasError('rewardsPoint')}
            />
          </div>

          {/* Coupon Code */}
          <div>
            <ATMTextField
              required
              name="couponCode"
              label="Coupon Code"
              value={values.couponCode}
              onChange={(e) => setFieldValue('couponCode', e.target.value.toUpperCase())}
              onBlur={handleBlur}
              placeholder="Enter coupon code (e.g., SUMMER2024)"
              isTouched={touched.couponCode}
              errorMessage={touched.couponCode && errors.couponCode ? String(errors.couponCode) : undefined}
              isValid={!hasError('couponCode')}
              helperText="Uppercase letters and numbers only"
            />
          </div>

          {/* Reward Type */}
          <div>
            <ATMSelect
              required
              name="rewardType"
              label="Reward Type"
              value={values.rewardType}
              onChange={(newValue) => setFieldValue('rewardType', newValue)}
              options={rewardTypeOption}
              valueAccessKey="value"
              placeholder="Select reward type"
            />
            {touched.rewardType && errors.rewardType && (
              <p className="mt-1 text-sm text-red-600">{String(errors.rewardType)}</p>
            )}
          </div>

          {/* Reward Value */}
          <div>
            <ATMNumberField
              required
              name="rewardValue"
              label="Reward Value"
              value={String(values.rewardValue)}
              onChange={(newValue) => setFieldValue('rewardValue', Number(newValue))}
              placeholder={
                values.rewardType === 'PERCENTAGE'
                  ? 'Enter percentage (1-100)'
                  : 'Enter amount'
              }
              onBlur={handleBlur}
              isTouched={touched.rewardValue}
              errorMessage={touched.rewardValue && errors.rewardValue ? String(errors.rewardValue) : undefined}
              isValid={!hasError('rewardValue')}
            />
          </div>

          {/* Minimum Spend */}
          <div>
            <ATMNumberField
              required
              name="minimumSpend"
              label="Minimum Spend"
              value={String(values.minimumSpend)}
              onChange={(newValue) => setFieldValue('minimumSpend', Number(newValue))}
              placeholder="Enter minimum spend amount"
              onBlur={handleBlur}
              isTouched={touched.minimumSpend}
              errorMessage={touched.minimumSpend && errors.minimumSpend ? String(errors.minimumSpend) : undefined}
              isValid={!hasError('minimumSpend')}
            />
          </div>

          {/* Maximum Discount */}
          <div>
            <ATMNumberField
              required
              name="maximumDiscount"
              label="Maximum Discount"
              value={String(values.maximumDiscount)}
              onChange={(newValue) => setFieldValue('maximumDiscount', Number(newValue))}
              placeholder="Enter maximum discount limit"
              onBlur={handleBlur}
              isTouched={touched.maximumDiscount}
              errorMessage={touched.maximumDiscount && errors.maximumDiscount ? String(errors.maximumDiscount) : undefined}
              isValid={!hasError('maximumDiscount')}
              helperText="Set 0 for no limit"
            />
          </div>

          {/* 🔥 FIXED: Valid From - Convert null/string to Date */}
          <div>
            <ATMDatePicker
              required
              name="validFrom"
              label="Valid From"
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              value={getDateValue(values.validFrom)}
              onChange={(newValue: Date | null) => {
                setFieldValue('validFrom', newValue);
              }}
              placeholder="dd/MM/yyyy"
              isTouched={touched.validFrom}
              errorMessage={touched.validFrom && errors.validFrom ? String(errors.validFrom) : undefined}
              isValid={!hasError('validFrom')}
            />
          </div>

          {/* 🔥 FIXED: Valid Till - Convert null/string to Date */}
          <div>
            <ATMDatePicker
              required
              name="validTill"
              label="Valid Till"
              dateFormat="dd/MM/yyyy"
              minDate={getDateValue(values.validFrom) || new Date()}
              value={getDateValue(values.validTill)}
              onChange={(newValue: Date | null) => {
                setFieldValue('validTill', newValue);
              }}
              placeholder="dd/MM/yyyy"
              isTouched={touched.validTill}
              errorMessage={touched.validTill && errors.validTill ? String(errors.validTill) : undefined}
              isValid={!hasError('validTill')}
            />
          </div>

          {/* Start Time */}
          <div>
            <ATMTextField
              required
              name="startTime"
              label="Start Time"
              value={values.startTime}
              onChange={(e) => setFieldValue('startTime', e.target.value)}
              onBlur={handleBlur}
              placeholder="HH:MM"
              isTouched={touched.startTime}
              errorMessage={touched.startTime && errors.startTime ? String(errors.startTime) : undefined}
              isValid={!hasError('startTime')}
            />
          </div>

          {/* End Time */}
          <div>
            <ATMTextField
              required
              name="endTime"
              label="End Time"
              value={values.endTime}
              onChange={(e) => setFieldValue('endTime', e.target.value)}
              onBlur={handleBlur}
              placeholder="HH:MM"
              isTouched={touched.endTime}
              errorMessage={touched.endTime && errors.endTime ? String(errors.endTime) : undefined}
              isValid={!hasError('endTime')}
            />
          </div>

          {/* Valid Days */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid Days <span className="text-red-500">*</span>
            </label>
            {renderDayCheckboxes()}
            {touched.validDays && errors.validDays && (
              <p className="mt-1 text-sm text-red-600">{String(errors.validDays)}</p>
            )}
          </div>

          {/* Branches */}
          <div className="md:col-span-2">
            <ATMMultiSelect
              name="branchId"
              label="Branches"
              value={values.branchId || []}
              onChange={(newValue) => setFieldValue('branchId', newValue)}
              options={branchData || []}
              getOptionLabel={(option) => option?.branchName || option?.name || ''}
              valueAccessKey="_id"
              placeholder="Select branches"
            />
            {touched.branchId && errors.branchId && (
              <p className="mt-1 text-sm text-red-600">{String(errors.branchId)}</p>
            )}
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <ATMMultiSelect
              name="serviceId"
              label="Services"
              value={values.serviceId || []}
              onChange={(newValue) => setFieldValue('serviceId', newValue)}
              options={serviceData || []}
              getOptionLabel={(option) => option?.itemName || option?.name || ''}
              valueAccessKey="_id"
              placeholder="Select services"
            />
            {touched.serviceId && errors.serviceId && (
              <p className="mt-1 text-sm text-red-600">{String(errors.serviceId)}</p>
            )}
          </div>

          {/* Advanced Settings Toggle */}
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdvanced ? (
                <>
                  <IconChevronUp size={20} />
                  Hide Advanced Settings
                </>
              ) : (
                <>
                  <IconChevronDown size={20} />
                  Show Advanced Settings
                </>
              )}
            </button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <>
              {/* Status */}
              <div>
                <ATMSelect
                  required
                  name="isActive"
                  label="Status"
                  value={values.isActive}
                  onChange={(newValue) => setFieldValue('isActive', newValue)}
                  options={statusOptions}
                  valueAccessKey="value"
                  placeholder="Select status"
                />
                {touched.isActive && errors.isActive && (
                  <p className="mt-1 text-sm text-red-600">{String(errors.isActive)}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <ATMTextField
                  name="description"
                  label="Description"
                  value={values.description}
                  onChange={(e) => setFieldValue('description', e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter description (optional)"
                  isTouched={touched.description}
                  errorMessage={touched.description && errors.description ? String(errors.description) : undefined}
                  isValid={!hasError('description')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RewardsCouponFormLayout;