import { Formik, FormikHelpers, Form } from 'formik';
import React, { useState } from 'react';
import { EmployeeFormValues } from '../../models/Employee.model';
import EmployeeFormLayout from '../../components/EmployeeFormLayout';
import { array, mixed, number, object, string } from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAddEmployeeMutation } from '../../service/EmployeeServices';
import { showToast } from 'src/utils/showToaster';
import { useFetchData } from 'src/hooks/useFetchData';
import { useGetOutletsQuery } from 'src/modules/Outlet/service/OutletServices';

const AddEmployeeFormWrapper = () => {
  const navigate = useNavigate();
  const [addEmployee] = useAddEmployeeMutation();


  const { data: outletsData } = useFetchData(
  useGetOutletsQuery,
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
  }
);


   const [outletOrBranchOutlet, setOutletOrBranchOutlet] = useState('')
  const initialValues: EmployeeFormValues = {
    userName: '',
    email: '',
    password: '',
    userRoleId: '',
    name: '',
    outletsId: [],
    address: '',
    city: '',
    region: '',
    country: '',
    phone: '',
    companyId: []
  };

  const userNameRegex = /^[a-z0-9]*$/;
  const passwordRegex = /^[a-zA-Z0-9@$!]*$/;

  const validationSchema = object().shape({
    userName: string()
      .matches(userNameRegex, {
        message: 'Only lowercase letters and numbers are allowed',
      })
      .required('Please enter user name'),
    email: string().required('Please enter email'),
    password: string()
      .matches(
        passwordRegex,
        'Password can only contain letters, numbers, @, and $',
      )
      .min(6, 'Password must be at least 6 characters')
      .max(20, 'Password must be at most 20 characters')
      .required('Please enter password'),
    userRoleId: object().required('Please select user role'),
    name: string().required('Please enter name'),
    address: string().required('Please enter address'),
    city: string().required('Please enter city'),
    region: string().required('Please enter region'),
    country: object().required('Please enter country'),
    phone: string().required('Please enter phone number'),

  })

  const handleSubmit = (
  values: EmployeeFormValues,
  { resetForm, setSubmitting }: FormikHelpers<EmployeeFormValues>,
) => {
  const formattedValues: any = {
    userName: values?.userName,
    email: values?.email,
    password: values?.password,
    userRoleId: values?.userRoleId?._id,
    name: values?.name,
    address: values?.address,
    city: values?.city,
    region: values?.region,
    country: values?.country?.label,
    phone: values?.phone,
  };

  // =====================================================
  // COMPANY
  // =====================================================

  if (
    outletOrBranchOutlet === 'company' &&
    Array.isArray(values.companyId) &&
    values.companyId.length > 0
  ) {
    // Company IDs
    const selectedCompanyIds = values.companyId.map(
      (x: any) => x._id || x
    );

    // Save selected company IDs
    formattedValues.companyId = selectedCompanyIds;

    // ===================================================
    // FIND OUTLETS OF SELECTED COMPANIES
    // ===================================================

    const companyOutlets = (outletsData || []).filter(
      (outlet: any) =>
        selectedCompanyIds.includes(
          outlet?.companyId?._id || outlet?.companyId
        )
    );

    // ===================================================
    // GET OUTLET IDS
    // ===================================================

    formattedValues.outletsId = companyOutlets.map(
      (outlet: any) => outlet._id
    );
  }

  // =====================================================
  // DIRECT OUTLET
  // =====================================================

  else if (
    outletOrBranchOutlet === 'outlet' &&
    Array.isArray(values.outletsId) &&
    values.outletsId.length > 0
  ) {
    formattedValues.outletsId = values.outletsId.map(
      (x: any) => x._id || x
    );
  }

  console.log('FINAL PAYLOAD:', formattedValues);

  addEmployee(formattedValues).then((res: any) => {
    if (res?.error) {
      showToast('error', res?.error?.data?.message);
    } else {
      if (res?.data?.status) {
        showToast(
          'success',
          'Employee added successfully'
        );

        resetForm();
        navigate('/employee');
      } else {
        showToast(
          'error',
          res?.data?.message
        );
      }
    }

    setSubmitting(false);
  });
};

//   const handleSubmit = (
//     values: EmployeeFormValues,
//     { resetForm, setSubmitting }: FormikHelpers<EmployeeFormValues>,
//   ) => {

//  const formattedValues: any = {
//   userName: values?.userName,
//   email: values?.email,
//   password: values?.password,
//   userRoleId: values?.userRoleId?._id,
//   name: values?.name,
//   address: values?.address,
//   city: values?.city,
//   region: values?.region,
//   country: values?.country?.label,
//   phone: values?.phone,
// };

// // ✅ Conditionally add either companyId or outletsId based on state
// if (
//   outletOrBranchOutlet === 'company' &&
//   Array.isArray(values.companyId) &&
//   values.companyId.length > 0
// ) {
//   formattedValues.companyId = values.companyId.map((x: any) => x._id || x);
// } else if (
//   outletOrBranchOutlet === 'outlet' &&
//   Array.isArray(values.outletsId) &&
//   values.outletsId.length > 0
// ) {
//   formattedValues.outletsId = values.outletsId.map((x: any) => x._id || x);
// }


    

//     // console.log('-----formattedValues', formattedValues)
//     addEmployee(formattedValues).then((res: any) => {
//       if (res?.error) {
//         showToast('error', res?.error?.data?.message);
//       } else {
//         if (res?.data?.status) {
//           showToast('success', 'Employee added successfully');
//           resetForm();
//           navigate('/employee');
//         } else {
//           showToast('error', res?.data?.message);
//         }
//       }
//       setSubmitting(false);
//     });
//   };

  return (
    <Formik<EmployeeFormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {(formikProps) => (
        <Form>
          <EmployeeFormLayout
            formikProps={formikProps}
            onCancel={() => navigate('/employee')}
            formType="ADD"
            setOutletOrBranchOutlet={setOutletOrBranchOutlet}
            outletOrBranchOutlet={outletOrBranchOutlet}
          />
        </Form>
      )}
    </Formik>
  );
};

export default AddEmployeeFormWrapper;
