import { FormikProps } from 'formik';
import ATMTextField from 'src/components/atoms/FormElements/ATMTextField/ATMTextField';
import MOLFormDialog from 'src/components/molecules/MOLFormDialog/MOLFormDialog';
import { GiftCardFormValues } from '../models/GiftCard.model';
import ATMNumberField from 'src/components/atoms/FormElements/ATMNumberField/ATMNumberField';
import ATMSelect from 'src/components/atoms/FormElements/ATMSelect/ATMSelect';
import ATMDatePicker from 'src/components/atoms/FormElements/ATMDatePicker/ATMDatePicker';
import ATMCircularProgress from 'src/components/atoms/ATMCircularProgress/ATMCircularProgress';
import { useFetchData } from 'src/hooks/useFetchData';
import { useGetCustomersQuery } from 'src/modules/Customer/service/CustomerServices';
import AsyncSelect from 'react-select/async';
import { BASE_URL } from 'src/utils/constants';
import { useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { useCallback, useEffect, useRef, useState } from 'react';
type Props = {
  formikProps: FormikProps<GiftCardFormValues>;
  onClose: () => void;
  isLoading?: boolean;
  formType: 'ADD' | 'EDIT';
};

interface Customer {
  _id: string;
  bookingCustomerId: string;
  customerName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isDeleted: boolean;
}

interface SelectOption {
  label: string;
  value: string;
  data: Customer;
}

const GiftCardFormLayout = ({
  formikProps,
  onClose,
  isLoading = false,
  formType,
}: Props) => {
  const { values, setFieldValue, isSubmitting, handleBlur, touched, errors } =
    formikProps;


  const [loading, setLoading] = useState(false);
  const { userData, outlet, accessToken } = useSelector(
    (state: RootState) => state.auth,
  );
  const [selectedCustomer, setSelectedCustomer] = useState<SelectOption | null>(
    null,
  );

  const fetchCustomerById = async (id: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/customer/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data?.data || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadCustomer = async () => {
      if (!values.customerId) return;

      const customer = await fetchCustomerById(values.customerId?._id);

      if (customer) {
        setSelectedCustomer({
          label: `${customer.customerName} - ${customer.phone}`,
          value: customer._id,
          data: customer,
        });
      }
    };

    loadCustomer();
  }, [values.customerId]);

  const { data: customerData, isLoading: customerIsLoading } = useFetchData(
    useGetCustomersQuery,
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

  const fetchOptions = async (inputValue: string): Promise<SelectOption[]> => {
    // console.log('-------calling o');
    if (!inputValue?.trim()) return [];

    const query = inputValue.trim();
    let filterBy: any[] = [];

    const isEmail = query.includes('@'); // ✅ Check email first
    const isNumber = /^\d+$/.test(query);

    if (isEmail) {
      filterBy = [{ fieldName: 'email', value: query }];
    } else if (isNumber) {
      filterBy = [{ fieldName: 'phone', value: query }];
    } else {
      filterBy = [{ fieldName: 'customerName', value: query }];
    }

    try {
      const response = await fetch(
        `${BASE_URL}/customer/pagination?isPaginationRequired=false&filterBy=${encodeURIComponent(
          JSON.stringify(filterBy)
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      return (data?.data || []).map((item: any) => ({
        label: `${item.customerName || 'Unknown'} - ${item.phone || ''} - ${item.email || ''}`,
        value: item._id,
        data: item,
      }));
    } catch (error) {
      // console.error('❌ Error fetching options:', error);
      return [];
    }
  };


  const useDebounce = (callback: Function, delay: number) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
      (...args: any[]) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
      [callback, delay],
    );
  };

  const debouncedLoadOptions = useDebounce(
    async (inputValue: any, callback: (arg0: any[]) => void) => {
      setLoading(true);
      const options = await fetchOptions(inputValue);
      console.log('------options', options)
      setLoading(false);
      callback(options);
    },
    1000,
  );



  const formHeading = formType === 'ADD' ? 'Add Gift-Card' : 'Edit Gift-Card';
  return (
    <MOLFormDialog
      title={formHeading}
      onClose={onClose}
      isSubmitting={isSubmitting}
    >
      {isLoading ? (
        <div className="flex justify-center items-center  h-[185px]">
          <ATMCircularProgress />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-[15px] text-slate-500 font-medium">
            <div>Select Type</div>
            <div className="flex gap-5 mt-2">
              <label>
                <input
                  type="radio"
                  name="type"
                  value="WHOEVER_BOUGHT"
                  checked={values?.type === 'WHOEVER_BOUGHT'}
                  onChange={() => setFieldValue('type', 'WHOEVER_BOUGHT')}
                />
              </label>
              <div className="text-[15px] font-semibold">Whoever Bought</div>
              <label>
                <input
                  type="radio"
                  name="type"
                  value="SPECIFIC_CUSTOMER"
                  checked={values?.type === 'SPECIFIC_CUSTOMER'}
                  onChange={() => setFieldValue('type', 'SPECIFIC_CUSTOMER')}
                />
              </label>
              <div className="text-[15px] font-semibold">Specific Customer</div>
            </div>
          </div>
          {/* Select Customer */}
          {values?.type === 'SPECIFIC_CUSTOMER' ? (
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={debouncedLoadOptions}
              value={selectedCustomer}
              onChange={(selectedOption: any) => {
                setSelectedCustomer(selectedOption);

                setFieldValue(
                  'customerId',
                  selectedOption ? selectedOption.data : null
                );
              }}
              placeholder="Search by name, email or mobile"
              isLoading={loading}
              isClearable
            />
          ) : null}

          {/* GiftCardAmount */}
          <div>
            <ATMNumberField
              required
              name="giftCardAmount"
              value={values.giftCardAmount}
              onChange={(e) => setFieldValue('giftCardAmount', e)}
              label="Gift Card Amount"
              placeholder="Enter Gift Card Amount"
              onBlur={handleBlur}
            />
          </div>

          {/* GiftCard Code */}
          <div className="">
            <ATMTextField
              required
              name="giftCardName"
              value={values.giftCardName}
              onChange={(e) => setFieldValue('giftCardName', e.target.value)}
              label="Gift Card Code"
              placeholder="Enter Gift Card Code"
              onBlur={handleBlur}
              isTouched={touched?.giftCardName}
              errorMessage={errors?.giftCardName}
              isValid={!errors?.giftCardName}
            />
          </div>

          {/* Expiry Date */}
          <div className="">
            <ATMDatePicker
              required
              name="giftCardExpiryDate"
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              value={values?.giftCardExpiryDate}
              onChange={(newValue) =>
                setFieldValue('giftCardExpiryDate', newValue)
              }
              label="Gift Card Expiry Date"
              placeholder="dd/MM/yyyy"
            />
          </div>
        </div>
      )}
    </MOLFormDialog>
  );
};

export default GiftCardFormLayout;
