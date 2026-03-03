// import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
// import { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
// import ATMPageHeader from 'src/components/atoms/ATMPageHeader/ATMPageHeader';
// import ATMPagination from 'src/components/atoms/ATMPagination/ATMPagination';
// import Authorization from 'src/components/Authorization/Authorization';
// import MOLFilterBar, { FilterType } from 'src/components/molecules/MOLFilterBar/MOLFilterBar';
// import MOLTable, { TableHeader } from 'src/components/molecules/MOLTable/MOLTable';
// import { useFilterPagination } from 'src/hooks/useFilterPagination';
// import { SalesReport } from 'src/modules/Invoices/models/Invoices.model';
// import { RootState } from 'src/store';
// import { isAuthorized } from 'src/utils/authorization';
// import { useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
// import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
// import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
// import { formatZonedDate } from 'src/utils/formatZonedDate';
// import * as XLSX from 'xlsx';
// import { useFetchData } from 'src/hooks/useFetchData';
// import { IconEye } from '@tabler/icons-react';
// import ATMDialog from 'src/components/atoms/ATMDialog/ATMDialog';


// const salesData = [
//   {
//     label: 'Monthly',
//     value: 'MONTHLY',
//   },
//   {
//     label: 'Weekly',
//     value: 'WEEKLY',
//   },
//   {
//     label: 'Daily',
//     value: 'DAILY',
//   },
// ];

// const SalesReportPage = () => {
//   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//   const [open, setOpen] = useState(false);
//   const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
//     useFilterPagination(['outletIds', 'customerId', 'reportDuration']);
//   const [searchParams, setSearchParams] = useSearchParams();
//   console.log('------appliedFilters', appliedFilters)
//   const { outlets } = useSelector((state: RootState) => state.auth);
//   // const { data, isLoading, error } = useGetSalesReportByOutletQuery({
//   //   outletId: appliedFilters?.[0]?.value,
//   //   startDate: dateFilter?.start_date,
//   //   endDate: dateFilter?.end_date,
//   //   page: page,
//   //   limit: limit,
//   //   sortBy: orderBy || 'createdAt',
//   //   sortOrder: orderValue || 'desc',
//   //   reportDuration:appliedFilters?.[2]?.value
//   // });

//   const { data, isLoading, totalData, totalPages } = useFetchData(
//     useGetSalesReportByOutletQuery,
//     {
//       body: {
//         outletId: appliedFilters?.[0]?.value,
//         startDate: dateFilter?.start_date,
//         endDate: dateFilter?.end_date,
//         page,
//         limit,
//         sortBy: orderBy || 'createdAt',
//         sortOrder: orderValue || 'desc',
//         reportDuration: appliedFilters?.[2]?.value,
//       },
//     }
//   );


//   console.log('--ssss----data', data)

//   const outletId = appliedFilters?.[0]?.value || "";
//   const reportDuration = appliedFilters?.[2]?.value || "";
//   const startDate = dateFilter?.start_date || "";
//   const endDate = dateFilter?.end_date || "";

//   const { data: chartData, isFetching, refetch } = useGetSalesChartDataReportByOutletQuery(
//     {
//       outletId,
//       startDate,
//       endDate,
//       reportDuration,
//     },
//     {
//       skip: !outletId || !startDate || !endDate || !reportDuration, // ✅ Jab tak sab values na ho query skip karo
//       refetchOnMountOrArgChange: true, // ✅ har arg change par refetch karega
//     }
//   );


//   const filterValue = appliedFilters?.[2]?.value; // string[] | undefined

//   const periodLabel =
//     filterValue?.includes("MONTHLY")
//       ? "Month"
//       : filterValue?.includes("WEEKLY")
//         ? "Week"
//         : filterValue?.includes("DAILY")
//           ? "Day"
//           : "";


//   // const salesByDate = chartData?.data?.salesByDate || [];
//   const salesByPaymentMode = chartData?.data?.salesByPaymentMode || [];
//   const topCustomers = chartData?.data?.topCustomers || [];
//   const datasets = chartData?.data?.datasets || [];
//   const dataLabel = chartData?.data?.labels || [];
//   // console.log('----chartData', chartData)


//   const tableHeaders: TableHeader<SalesReport>[] = [
//     {
//       fieldName: 'invoiceNumber',
//       headerName: 'Invoice N0.',
//       flex: 'flex-[1_0_0%]',
//     },
//     {
//       fieldName: 'customerName',
//       headerName: 'Customer Name',
//       flex: 'flex-[1_0_0%]',
//     },
//     {
//       fieldName: 'cashBackDiscount',
//       headerName: 'Discount',
//       flex: 'flex-[1_0_0%]',
//     },
//     {
//       fieldName: 'totalAmount',
//       headerName: 'Total Amount',
//       flex: 'flex-[1_0_0%]',
//       sortable: true,
//       sortKey: 'totalAmount',
//     },
//     {
//       fieldName: 'balanceDue',
//       headerName: 'Balance Due',
//       flex: 'flex-[1_0_0%]',
//     },
//     {
//       fieldName: 'createdAt',
//       headerName: 'Date',
//       flex: 'flex-[1_1_0%]',
//       sortable: true,
//       sortKey: 'createdAt',
//       extraClasses: () => '',
//       stopPropagation: true,
//       render: (row: any) => {
//         const date = row.createdAt ? new Date(row.createdAt) : null;
//         // return date ? format(date, 'dd-MM-yyyy') : '-';
//         return date ? formatZonedDate(date) : '-';
//       },
//     },
//     {
//       fieldName: 'status',
//       headerName: 'Status',
//       align: 'center',
//       flex: 'flex-[1_1_0%]',
//       renderCell: (item) => (
//         <div>
//           {item.status && item.status.trim() !== '' ? (
//             <span className="text-red-700 bg-red-100 py-[3px] font-medium px-2 rounded-lg border-slate-300">
//               {item.status}
//             </span>
//           ) : item?.balanceDue > 0 ? (
//             <span className="text-yellow-700 bg-yellow-100 py-[3px] font-medium px-2 rounded-lg border-slate-300">
//               Unpaid
//             </span>
//           ) : (
//             <span className="text-green-700 bg-green-100 py-[3px] font-medium px-2 rounded-lg border-slate-300">
//               Paid
//             </span>
//           )}
//         </div>
//       ),
//     },
//     {
//   fieldName: 'actions',
//   headerName: 'Actions',
//   flex: 'flex-[1_0_0%]',
//   align: 'center',
//   renderCell: (item) => (
//     <div className="flex justify-center items-center">
//       <IconEye
//       color='#006972'
//         onClick={() => {
//           setSelectedInvoice(item);
//           setOpen(true);
//         }}
//         size={18}
//         className="cursor-pointer text-blue-600 hover:text-blue-800"
//       />
//     </div>
//   ),
// }

//   ]

//   const filters: FilterType[] = [
//     {
//       filterType: 'date',
//       fieldName: 'createdAt',
//       dateFilterKeyOptions: [
//         {
//           label: 'startDate',
//           value: dateFilter?.start_date || '',
//         },
//         {
//           label: 'endDate',
//           value: dateFilter?.end_date || '',
//         },
//       ],
//     },
//     {
//       filterType: 'single-select',
//       label: 'Outlets',
//       fieldName: 'outletIds',
//       options:
//         outlets?.map((el) => {
//           return {
//             label: el?.name,
//             value: el?._id,
//           };
//         }) || [],
//       renderOption: (option) => option.label,
//       isOptionEqualToSearchValue: (option, value) => {
//         return option?.label.includes(value);
//       },
//     },
//     {
//       filterType: 'single-select',
//       label: 'Select',
//       fieldName: 'reportDuration',
//       options: salesData || [],
//       renderOption: (option) => option.label,
//       isOptionEqualToSearchValue: (option, value) => {
//         return option?.label.includes(value);
//       },
//     },
//   ];

//   const invoices = (data as any)?.invoices || [];
//   const totalAmount = (data as any)?.totalSalesData?.[0]?.totalSalesAmount || 0;



//   const today = new Date();
//   const oneMonthAgo = subMonths(today, 1);

//   // useEffect(() => {
//   //   if (!dateFilter?.start_date && !dateFilter?.end_date) {
//   //     const newSearchParams = new URLSearchParams(searchParams); // Clone existing searchParams
//   //     newSearchParams.set('startDate', format(oneMonthAgo, 'yyyy-MM-dd') || '');
//   //     newSearchParams.set('endDate', format(new Date(), 'yyyy-MM-dd') || '');
//   //     newSearchParams.set('outletIds', outlets?.[0]._id);
//   //     newSearchParams.set('reportDuration', "MONTHLY");
//   //     setSearchParams(newSearchParams)
//   //   }
//   // }, [dateFilter, outlets]);

//   useEffect(() => {
//     const reportDuration =
//       (appliedFilters?.[2]?.value?.[0] as string) || "DAILY";

//     if (!outlets?.length) return;

//     let startDate = searchParams.get("startDate");
//     let endDate = searchParams.get("endDate");
//     let shouldUpdateDates = false;

//     // ✅ Agar duration dropdown select hua hai toh hamesha dates override karo
//     switch (reportDuration) {
//       case "MONTHLY":
//         startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
//         endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");
//         shouldUpdateDates = true;
//         break;
//       case "WEEKLY":
//         startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
//         endDate = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
//         shouldUpdateDates = true;
//         break;
//       case "DAILY":
//       default:
//         // ✅ Agar manually set nahi hai toh hi daily set karo
//         if (!startDate || !endDate) {
//           startDate = format(startOfDay(new Date()), "yyyy-MM-dd");
//           endDate = format(endOfDay(new Date()), "yyyy-MM-dd");
//           shouldUpdateDates = true;
//         }
//         break;
//     }

//     const currentStart = searchParams.get("startDate");
//     const currentEnd = searchParams.get("endDate");
//     const currentDuration = searchParams.get("reportDuration");
//     const currentOutlet = searchParams.get("outletIds");

//     // ✅ Agar kuch change hi nahi hai toh skip
//     if (
//       currentStart === startDate &&
//       currentEnd === endDate &&
//       currentDuration === reportDuration &&
//       currentOutlet
//     ) {
//       return;
//     }

//     const newSearchParams = new URLSearchParams(searchParams.toString());

//     if (shouldUpdateDates || !startDate || !endDate) {
//       newSearchParams.set("startDate", startDate!);
//       newSearchParams.set("endDate", endDate!);
//     }

//     if (!currentOutlet) {
//       newSearchParams.set("outletIds", outlets?.[0]?._id || "");
//     }

//     newSearchParams.set("reportDuration", reportDuration);

//     if (newSearchParams.toString() !== searchParams.toString()) {
//       setSearchParams(newSearchParams);
//     }
//   }, [appliedFilters, outlets, setSearchParams]);









//   const navigate = useNavigate();


//   const handleExportCSV = () => {
//     const exportData = invoices.map((inv: any) => ({
//       InvoiceNumber: inv.invoiceNumber,
//       CustomerName: inv.customerName,
//       TotalAmount: inv.totalAmount,
//       BalanceDue: inv.balanceDue,
//       Status: inv.status || (inv.balanceDue > 0 ? 'Unpaid' : 'Paid'),
//       Date: formatZonedDate(inv.createdAt), // you can use format() or your global time util
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const csv = XLSX.utils.sheet_to_csv(worksheet);

//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'Customer_Sales_Report.csv');
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };
//   return (
//     <>
//       <div className="flex flex-col h-full gap-2 p-4">
//         <ATMPageHeader
//           heading="Outlet Sales Report"
//           hideButton={true}
//           buttonProps={{
//             label: 'Back',
//             onClick: () => navigate('/outlets'), // Navigate to previous page
//             // position: 'left', // if your ATMPageHeader supports it
//           }}
//         />
//         <Authorization permission="OUTLET_LIST">
//           {/* Table Toolbar */}
//           <MOLFilterBar hideSearch={true} filters={filters} />
//           <div className="flex flex-col overflow-auto border rounded border-slate-300 p-1">

//             <div>{datasets.length > 0 && (
//               <div className="col-span">
//                 <ATMChart
//                   type="line"
//                   data={{
//                     labels: dataLabel,
//                     datasets: datasets
//                   }}
//                   options={{
//                     responsive: true,
//                     plugins: {
//                       legend: { position: 'top' },
//                       title: {
//                         display: true,
//                         text: `Last ${periodLabel} vs Current ${periodLabel} Sales (EOD)`,
//                       },
//                       tooltip: {
//                         mode: 'index',
//                         intersect: false,
//                       },
//                     },
//                     interaction: {
//                       mode: 'nearest',
//                       axis: 'x',
//                       intersect: false,
//                     },
//                     maintainAspectRatio: false,
//                   }}
//                 />
//               </div>

//             )}
//             </div>
//             <div className="grid grid-cols-2 gap-4 mt-5 border border-slate-300 p-2">
//               {/* Chart 1: Sales by Date (Bar) */}


//               {/* Chart 2: Sales by Payment Mode (Pie) */}
//               {salesByPaymentMode.length > 0 && (
//                 <div className="col-6">
//                   <ATMChart
//                     type="pie"
//                     data={{
//                       labels: salesByPaymentMode.map((item: any) => item._id),
//                       datasets: [
//                         {
//                           label: 'Payment Modes',
//                           data: salesByPaymentMode.map((item: any) => item.total),
//                           backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
//                         },
//                       ],
//                     }}
//                     options={{
//                       responsive: true,
//                       plugins: { legend: { position: 'right' } },
//                       maintainAspectRatio: false,
//                     }}
//                   />
//                 </div>
//               )}

//               {/* Chart 3: Top Customers (Doughnut) */}
//               {topCustomers.length > 0 && (
//                 <div className="col-6">
//                   <ATMChart
//                     type="doughnut"
//                     data={{
//                       labels: topCustomers.map((item: any) => item.customerName || 'Unnamed'),
//                       datasets: [
//                         {
//                           label: 'Top Customers',
//                           data: topCustomers.map((item: any) => item.total),
//                           backgroundColor: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
//                         },
//                       ],
//                     }}
//                     options={{
//                       responsive: true,
//                       plugins: { legend: { position: 'right' } },
//                       maintainAspectRatio: false,
//                     }}
//                   />
//                 </div>
//               )}
//             </div>



//             <div className="flex-1 mt-3">
//               <MOLTable<SalesReport>
//                 tableHeaders={tableHeaders}
//                 data={invoices || []}
//                 getKey={(item) => item?._id}
//                 onEdit={undefined}
//                 onDelete={undefined}
//                 isLoading={isLoading}
//               />
//             </div>

//             {/* Pagination */}
//             <ATMPagination
//               totalPages={totalPages}
//               rowCount={(data as any)?.totalCount}
//               rows={invoices || []}
//             />
//           </div>
//         </Authorization>
//         {invoices.length > 0 && (
//           <div className="flex items-center justify-between px-4 py-3 text-lg font-semibold">
//             <span>Total Sales Amount: R {totalAmount?.toFixed(2)}</span>
//             <ATMButton onClick={() => handleExportCSV()}>
//               Export CSV
//             </ATMButton>
//           </div>
//         )}


//         {open && selectedInvoice && (
//           <ATMDialog onClose={() => setOpen(false)}>
//             <div className="p-6 w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg">
//               {/* Header */}
//               <div className="flex justify-between items-center border-b pb-3 mb-4">
//                 <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
//                 <button
//                   className="text-gray-500 hover:text-gray-700"
//                   onClick={() => setOpen(false)}
//                 >
//                   ✕
//                 </button>
//               </div>

//               {/* Customer Info */}
//               <div className="grid grid-cols-2 gap-4 text-sm mb-4">
//                 <div className="space-y-1">
//                   <p><span className="font-medium">Invoice No:</span> {selectedInvoice.invoiceNumber || "-"}</p>
//                   <p><span className="font-medium">Customer:</span> {selectedInvoice.customerName || "Walk-in"}</p>
//                   <p><span className="font-medium">Phone:</span> {selectedInvoice.customerPhone || "-"}</p>
//                 </div>
//                 <div className="space-y-1 text-right">
//                   <p><span className="font-medium">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
//                   <p><span className="font-medium">Outlet:</span> {selectedInvoice.outletName}</p>
//                   <p><span className="font-medium">Status:</span>
//                     {selectedInvoice.balanceDue > 0 ? (
//                       <span className="ml-1 text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs">Unpaid</span>
//                     ) : (
//                       <span className="ml-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">Paid</span>
//                     )}
//                   </p>
//                 </div>
//               </div>

//               {/* Items Table */}
//               {selectedInvoice.items?.length > 0 && (
//                 <div className="mb-4">
//                   <h3 className="font-semibold mb-2 text-gray-700">Items</h3>
//                   <table className="w-full border text-sm rounded-lg overflow-hidden">
//                     <thead className="bg-gray-100 text-gray-700">
//                       <tr>
//                         <th className="border px-3 py-2 text-left">Name</th>
//                         <th className="border px-3 py-2 text-center">Qty</th>
//                         <th className="border px-3 py-2 text-right">Price</th>
//                         <th className="border px-3 py-2 text-right">Total</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {selectedInvoice.items.map((item: any, idx: number) => (
//                         <tr key={idx} className="hover:bg-gray-50">
//                           <td className="border px-3 py-2">{item.itemName}</td>
//                           <td className="border px-3 py-2 text-center">{item.quantity}</td>
//                           <td className="border px-3 py-2 text-right">{item.sellingPrice}</td>
//                           <td className="border px-3 py-2 text-right">{item.sellingPrice * item.quantity}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}

//               {/* Discounts */}
//               <div className="mb-4">
//                 <h3 className="font-semibold mb-2 text-gray-700">Discounts</h3>
//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   {[
//                     { label: 'Coupon', value: selectedInvoice.couponDiscount },
//                     { label: 'Gift Card', value: selectedInvoice.giftCardDiscount },
//                     { label: 'Cashback', value: selectedInvoice.cashBackDiscount },
//                     { label: 'Loyalty', value: selectedInvoice.loyaltyPointsDiscount },
//                     { label: 'Referral', value: selectedInvoice.referralDiscount },
//                   ].map((d, i) => (
//                     <div
//                       key={i}
//                       className="flex justify-between px-3 py-1 border rounded-md bg-gray-50"
//                     >
//                       <span>{d.label}</span>
//                       <span className={d.value > 0 ? "font-semibold text-green-600" : "text-gray-400"}>
//                         {d.value > 0 ? `R${d.value}` : "-"}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Amount Summary */}
//               <div className="border-t pt-3 text-sm space-y-1">
//                 <div className="flex justify-between">
//                   <span>Subtotal</span>
//                   <span>R {selectedInvoice.totalAmount}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Amount Paid</span>
//                   <span className="text-green-600">R {selectedInvoice.amountPaid}</span>
//                 </div>
//                 <div className="flex justify-between font-semibold">
//                   <span>Balance Due</span>
//                   <span className={selectedInvoice.balanceDue > 0 ? "text-red-600" : "text-green-600"}>
//                     R {selectedInvoice.balanceDue}
//                   </span>
//                 </div>
//               </div>

//               {/* Footer Buttons */}
//               {/* <div className="mt-6 flex justify-end gap-3">
//                 <ATMButton
//                 variant='outlined'
//                   // className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
//                   onClick={() => setOpen(false)}
//                 >
//                   Close
//                 </ATMButton>
//                 <ATMButton
//                   // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//                 >
//                   Print
//                 </ATMButton>
//               </div> */}
//             </div>
//           </ATMDialog>
//         )}




//       </div>
//     </>
//   )
// };

// export default SalesReportPage;

import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ATMPageHeader from 'src/components/atoms/ATMPageHeader/ATMPageHeader';
import ATMPagination from 'src/components/atoms/ATMPagination/ATMPagination';
import Authorization from 'src/components/Authorization/Authorization';
import MOLFilterBar, { FilterType } from 'src/components/molecules/MOLFilterBar/MOLFilterBar';
import MOLTable, { TableHeader } from 'src/components/molecules/MOLTable/MOLTable';
import { useFilterPagination } from 'src/hooks/useFilterPagination';
import { SalesReport } from 'src/modules/Invoices/models/Invoices.model';
import { RootState } from 'src/store';
import { isAuthorized } from 'src/utils/authorization';
import { useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { useFetchData } from 'src/hooks/useFetchData';
import { IconEye } from '@tabler/icons-react';
import ATMDialog from 'src/components/atoms/ATMDialog/ATMDialog';

const salesData = [
  {
    label: 'Daily',
    value: 'DAILY',
  },
  {
    label: 'Weekly',
    value: 'WEEKLY',
  },
  {
    label: 'Monthly',
    value: 'MONTHLY',
  },
  {
    label: 'Yearly',
    value: 'YEARLY',
  },
   {
    label: 'Custum',
    value: 'CUSTUM',
  },
];

const SalesReportPage = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletIds', 'customerId', 'reportDuration']);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { outlets } = useSelector((state: RootState) => state.auth);

  const { data, isLoading, totalData, totalPages } = useFetchData(
    useGetSalesReportByOutletQuery,
    {
      body: {
        outletId: appliedFilters?.[0]?.value,
        startDate: dateFilter?.start_date,
        endDate: dateFilter?.end_date,
        page,
        limit,
        sortBy: orderBy || 'createdAt',
        sortOrder: orderValue || 'desc',
        reportDuration: appliedFilters?.[2]?.value,
      },
    }
  );

  const outletId = appliedFilters?.[0]?.value || "";
  const reportDuration = appliedFilters?.[2]?.value || "";
  const startDate = dateFilter?.start_date || "";
  const endDate = dateFilter?.end_date || "";

  const { data: chartData, isFetching, refetch } = useGetSalesChartDataReportByOutletQuery(
    {
      outletId,
      startDate,
      endDate,
      reportDuration,
    },
    {
      skip: !outletId || !startDate || !endDate || !reportDuration,
      refetchOnMountOrArgChange: true,
    }
  );

  const filterValue = appliedFilters?.[2]?.value;

  const periodLabel =
    filterValue?.includes("MONTHLY")
      ? "Month"
      : filterValue?.includes("WEEKLY")
        ? "Week"
        : filterValue?.includes("DAILY")
          ? "Day"
          : "";

  const salesByPaymentMode = chartData?.data?.salesByPaymentMode || [];
  const topCustomers = chartData?.data?.topCustomers || [];
  const datasets = chartData?.data?.datasets || [];
  const dataLabel = chartData?.data?.labels || [];

  const tableHeaders: TableHeader<SalesReport>[] = [
    {
      fieldName: 'invoiceNumber',
      headerName: 'Invoice N0.',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'customerName',
      headerName: 'Customer Name',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'cashBackDiscount',
      headerName: 'Discount',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'totalAmount',
      headerName: 'Total Amount',
      flex: 'flex-[1_0_0%]',
      sortable: true,
      sortKey: 'totalAmount',
    },
    {
      fieldName: 'balanceDue',
      headerName: 'Balance Due',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'createdAt',
      headerName: 'Date',
      flex: 'flex-[1_1_0%]',
      sortable: true,
      sortKey: 'createdAt',
      extraClasses: () => '',
      stopPropagation: true,
      render: (row: any) => {
        const date = row.createdAt ? new Date(row.createdAt) : null;
        return date ? formatZonedDate(date) : '-';
      },
    },
    {
      fieldName: 'status',
      headerName: 'Status',
      align: 'center',
      flex: 'flex-[1_1_0%]',
      renderCell: (item) => (
        <div>
          {item.status && item.status.trim() !== '' ? (
            <span className="text-red-700 bg-red-100 py-[3px] font-medium px-2 rounded-lg border-slate-300">
              {item.status}
            </span>
          ) : item?.balanceDue > 0 ? (
            <span className="text-yellow-700 bg-yellow-100 py-[3px] font-medium px-2 rounded-lg border-slate-300">
              Unpaid
            </span>
          ) : (
            <span className="text-green-700 bg-green-100 py-[3px] font-medium px-2 rounded-lg border-slate-300">
              Paid
            </span>
          )}
        </div>
      ),
    },
    {
      fieldName: 'actions',
      headerName: 'Actions',
      flex: 'flex-[1_0_0%]',
      align: 'center',
      renderCell: (item) => (
        <div className="flex justify-center items-center">
          <IconEye
            color='#006972'
            onClick={() => {
              setSelectedInvoice(item);
              setOpen(true);
            }}
            size={18}
            className="cursor-pointer text-blue-600 hover:text-blue-800"
          />
        </div>
      ),
    }
  ];

  const filters: FilterType[] = [
    {
      filterType: 'date',
      fieldName: 'createdAt',
      dateFilterKeyOptions: [
        {
          label: 'Start Date',
          value: dateFilter?.start_date || '',
        },
        {
          label: 'End Date',
          value: dateFilter?.end_date || '',
        },
      ],
    },
    {
      filterType: 'single-select',
      label: 'Outlets',
      fieldName: 'outletIds',
      options:
        outlets?.map((el) => {
          return {
            label: el?.name,
            value: el?._id,
          };
        }) || [],
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => {
        return option?.label.includes(value);
      },
    },
    {
      filterType: 'single-select',
      label: 'View By',
      fieldName: 'reportDuration',
      options: salesData || [],
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => {
        return option?.label.includes(value);
      },
    },
  ];

  const invoices = (data as any)?.invoices || [];
  const totalAmount = (data as any)?.totalSalesData?.[0]?.totalSalesAmount || 0;

  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);

  // Reset to Daily with Today's date
  const handleReset = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('startDate', format(startOfDay(new Date()), 'yyyy-MM-dd'));
    newSearchParams.set('endDate', format(endOfDay(new Date()), 'yyyy-MM-dd'));
    newSearchParams.set('reportDuration', 'DAILY');
    if (outlets?.[0]?._id && !newSearchParams.get('outletIds')) {
      newSearchParams.set('outletIds', outlets[0]._id);
    }
    setSearchParams(newSearchParams);
  };

  useEffect(() => {
    const selectedDuration =
      (appliedFilters?.[2]?.value?.[0] as string) || "DAILY";

    if (!outlets?.length) return;

    const now = new Date();

    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");

    let reportDurationToSend = selectedDuration;
    let shouldUpdateDates = false;

    switch (selectedDuration) {
      case "YEARLY": {
        const pastYear = new Date();
        pastYear.setFullYear(now.getFullYear() - 1);

        startDate = format(pastYear, "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");
        shouldUpdateDates = true;
        break;
      }

      case "MONTHLY": {
        const pastMonth = new Date();
        pastMonth.setMonth(now.getMonth() - 1);

        startDate = format(pastMonth, "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");
        shouldUpdateDates = true;
        break;
      }

      case "WEEKLY": {
        const pastWeek = new Date(now);
        pastWeek.setDate(now.getDate() - 7);

        startDate = format(pastWeek, "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");

        shouldUpdateDates = true;
        break;
      }

      case "CUSTUM":
        // 🔥 Custom case
        reportDurationToSend = "CUSTUM"; // backend grouping month-wise
        shouldUpdateDates = false; // dates free
        break;

      case "DAILY":
      default:
        startDate = format(now, "yyyy-MM-dd");
        endDate = format(now, "yyyy-MM-dd");
        shouldUpdateDates = true;
        break;
    }

    const currentStart = searchParams.get("startDate");
    const currentEnd = searchParams.get("endDate");
    const currentDuration = searchParams.get("reportDuration");
    const currentOutlet = searchParams.get("outletIds");

    if (
      currentStart === startDate &&
      currentEnd === endDate &&
      currentDuration === reportDurationToSend &&
      currentOutlet
    ) {
      return;
    }

    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (shouldUpdateDates && startDate && endDate) {
      newSearchParams.set("startDate", startDate);
      newSearchParams.set("endDate", endDate);
    }

    if (!currentOutlet) {
      newSearchParams.set("outletIds", outlets?.[0]?._id || "");
    }

    newSearchParams.set("reportDuration", reportDurationToSend);

    setSearchParams(newSearchParams);

  }, [appliedFilters, outlets]);

  const navigate = useNavigate();

  const handleExportCSV = () => {
    const exportData = invoices.map((inv: any) => ({
      InvoiceNumber: inv.invoiceNumber,
      CustomerName: inv.customerName,
      TotalAmount: inv.totalAmount,
      BalanceDue: inv.balanceDue,
      Status: inv.status || (inv.balanceDue > 0 ? 'Unpaid' : 'Paid'),
      Date: formatZonedDate(inv.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Customer_Sales_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex flex-col h-full gap-2 p-4">
        <ATMPageHeader
          heading="Outlet Sales Report"
          hideButton={true}
          buttonProps={{
            label: 'Back',
            onClick: () => navigate('/outlets'),
          }}
        />
        
        {/* Reset Button */}
        <div className="flex justify-end">
          <ATMButton onClick={handleReset} variant="outlined">
            Reset to Daily
          </ATMButton>
        </div>

        <Authorization permission="OUTLET_LIST">
          <MOLFilterBar hideSearch={true} filters={filters} />
          
          {/* Active Filters Display */}
          <div className="mt-2 p-2 bg-gray-50 rounded border text-sm">
            <span className="font-medium">Active: </span>
            {startDate} to {endDate} | View: {periodLabel}
          </div>

          <div className="flex flex-col overflow-auto border rounded border-slate-300 p-1 mt-3">
            <div>{datasets.length > 0 && (
              <div className="col-span">
                <ATMChart
                  type="line"
                  data={{
                    labels: dataLabel,
                    datasets: datasets
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: {
                        display: true,
                        text: `Sales (${periodLabel} Wise)`,
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      },
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false,
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5 border border-slate-300 p-2">
              {salesByPaymentMode.length > 0 && (
                <div className="col-6">
                  <ATMChart
                    type="pie"
                    data={{
                      labels: salesByPaymentMode.map((item: any) => item._id),
                      datasets: [
                        {
                          label: 'Payment Modes',
                          data: salesByPaymentMode.map((item: any) => item.total),
                          backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'right' } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              )}

              {topCustomers.length > 0 && (
                <div className="col-6">
                  <ATMChart
                    type="doughnut"
                    data={{
                      labels: topCustomers.map((item: any) => item.customerName || 'Unnamed'),
                      datasets: [
                        {
                          label: 'Top Customers',
                          data: topCustomers.map((item: any) => item.total),
                          backgroundColor: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'right' } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 mt-3">
              <MOLTable<SalesReport>
                tableHeaders={tableHeaders}
                data={invoices || []}
                getKey={(item) => item?._id}
                onEdit={undefined}
                onDelete={undefined}
                isLoading={isLoading}
              />
            </div>

            <ATMPagination
              totalPages={totalPages}
              rowCount={(data as any)?.totalCount}
              rows={invoices || []}
            />
          </div>
        </Authorization>

        {invoices.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 text-lg font-semibold">
            <span>Total Sales Amount: R {totalAmount?.toFixed(2)}</span>
            <ATMButton onClick={() => handleExportCSV()}>
              Export CSV
            </ATMButton>
          </div>
        )}

        {open && selectedInvoice && (
          <ATMDialog onClose={() => setOpen(false)}>
            <div className="p-6 w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="space-y-1">
                  <p><span className="font-medium">Invoice No:</span> {selectedInvoice.invoiceNumber || "-"}</p>
                  <p><span className="font-medium">Customer:</span> {selectedInvoice.customerName || "Walk-in"}</p>
                  <p><span className="font-medium">Phone:</span> {selectedInvoice.customerPhone || "-"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="font-medium">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                  <p><span className="font-medium">Outlet:</span> {selectedInvoice.outletName}</p>
                  <p><span className="font-medium">Status:</span>
                    {selectedInvoice.balanceDue > 0 ? (
                      <span className="ml-1 text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs">Unpaid</span>
                    ) : (
                      <span className="ml-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">Paid</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedInvoice.items?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 text-gray-700">Items</h3>
                  <table className="w-full border text-sm rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="border px-3 py-2 text-left">Name</th>
                        <th className="border px-3 py-2 text-center">Qty</th>
                        <th className="border px-3 py-2 text-right">Price</th>
                        <th className="border px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="border px-3 py-2">{item.itemName}</td>
                          <td className="border px-3 py-2 text-center">{item.quantity}</td>
                          <td className="border px-3 py-2 text-right">{item.sellingPrice}</td>
                          <td className="border px-3 py-2 text-right">{item.sellingPrice * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Discounts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Coupon', value: selectedInvoice.couponDiscount },
                    { label: 'Gift Card', value: selectedInvoice.giftCardDiscount },
                    { label: 'Cashback', value: selectedInvoice.cashBackDiscount },
                    { label: 'Loyalty', value: selectedInvoice.loyaltyPointsDiscount },
                    { label: 'Referral', value: selectedInvoice.referralDiscount },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="flex justify-between px-3 py-1 border rounded-md bg-gray-50"
                    >
                      <span>{d.label}</span>
                      <span className={d.value > 0 ? "font-semibold text-green-600" : "text-gray-400"}>
                        {d.value > 0 ? `R${d.value}` : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R {selectedInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid</span>
                  <span className="text-green-600">R {selectedInvoice.amountPaid}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due</span>
                  <span className={selectedInvoice.balanceDue > 0 ? "text-red-600" : "text-green-600"}>
                    R {selectedInvoice.balanceDue}
                  </span>
                </div>
              </div>
            </div>
          </ATMDialog>
        )}
      </div>
    </>
  )
};

export default SalesReportPage;
