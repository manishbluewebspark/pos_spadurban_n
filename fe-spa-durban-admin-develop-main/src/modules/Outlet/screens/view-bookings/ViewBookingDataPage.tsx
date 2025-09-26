import { format, subMonths } from 'date-fns';
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
import { useGetAllBookingsQuery, useGetBookingChartDataQuery, useGetRegisterChartDataQuery, useGetRegisterDataQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { BookingValue, Register, RegisterValue } from 'src/modules/OpenRegister/models/OpenRegister.model';
import { saveAs } from "file-saver";
import { useFetchData } from 'src/hooks/useFetchData';

const salesData = [
  {
    label: 'Monthly',
    value: 'MONTHLY',
  },
  {
    label: 'Weekly',
    value: 'WEEKLY',
  },
  {
    label: 'Daily',
    value: 'DAILY',
  },
];

const ViewBookingDataPage = () => {
  const { id } = useParams(); // outletId from URL


  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletsId', 'customerId']);
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useSelector((state: RootState) => state.auth);
  console.log('-------outlets',outlets)
  // const { data, isLoading, error, totalData, totalPages } = useGetAllBookingsQuery({
  //   // outletId: appliedFilters?.[0]?.value,
  //   startDate: dateFilter?.start_date,
  //   endDate: dateFilter?.end_date,
  //   searchValue: searchQuery,
  //   page,
  //   limit,
  // });

  const { data, isLoading, totalData, totalPages } = useFetchData(
  useGetAllBookingsQuery,
  {
    body: {
      page,
      limit,
      searchValue: searchQuery,
      startDate: dateFilter?.start_date || format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      endDate: dateFilter?.end_date || format(new Date(), 'yyyy-MM-dd'),
      filterBy: JSON.stringify(appliedFilters),
      outletId: appliedFilters?.[0]?.value, // agar chahiye
    },
  }
);


  console.log('-----data', data)

  const { data: chartData } = useGetBookingChartDataQuery({
    outletId: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date
  });

  console.log('-----chartData', chartData)


  const topByServices = chartData?.charts?.topByServices || [];
  const topByTime = chartData?.charts?.topByTime || [];


  const [selectedRegister, setSelectedRegister] = useState<any>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const handleViewPayouts = (row: any) => {
    setSelectedRegister(row);
    setShowPayoutModal(true);
  };

  const handleViewPayments = (row: any) => {
    setSelectedRegister(row);
    setShowPaymentsModal(true);
  };



  const tableHeaders: TableHeader<BookingValue>[] = [
    {
      fieldName: 'bookingNumber',
      headerName: 'Booking Number',
      flex: 'flex-[2_1_0%]'
    },
    {
      fieldName: 'invoiceNumber',
      headerName: 'Invoice Number',
      flex: 'flex-[1_1_0%]'
    },
    {
      fieldName: 'duration',
      headerName: 'Duration',
      flex: 'flex-[1_1_0%]'
    },
    {
      fieldName: 'startTime',
      headerName: 'Start Time',
      flex: 'flex-[1_1_0%]'
    },
    {
      fieldName: 'endTime',
      headerName: 'End Time',
      flex: 'flex-[1_1_0%]'
    },
    {
      fieldName: 'customerName',
      headerName: 'Customer Name',
      flex: 'flex-[3_1_0%]'
    },
    {
      fieldName: 'customerEmail',
      headerName: 'Customer Email',
      flex: 'flex-[3_1_0%]'
    },
    {
      fieldName: 'customerPhone',
      headerName: 'Customer Phone',
      flex: 'flex-[2_1_0%]'
    },
    {
      fieldName: 'branchName',
      headerName: 'Branch Name',
      flex: 'flex-[3_1_0%]'
    },
    {
      fieldName: 'services',
      headerName: 'Services',
      flex: 'flex-[3_1_0%]', // wider column if services have long names
      renderCell: (row) => {
        // row.services is an array, join with comma or line break
        return row.services?.length ? row.services.join(', ') : '-';
      }
    },
    {
          fieldName: 'createdAt',
          headerName: 'Created Date',
          flex: 'flex-[3_1_0%]',
          render: (row: any) => {
            const date = row.createdAt ? new Date(row.createdAt) : null;
            return date ? formatZonedDate(date) : '-';
          }
        }

  ];


  const filters: FilterType[] = [
    {
      filterType: 'single-select',
      label: 'Outlet',
      fieldName: 'outletsId',
      options:
        outlets?.map((el: any) => {
          return {
            label: el?.name,
            value: el?.bookingStoreId,
          };
        }) || [],
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => {
        return option?.label.includes(value);
      },
    },
    {
      filterType: 'date',
      fieldName: 'createdAt',
      dateFilterKeyOptions: [
        {
          label: 'startDate',
          value: dateFilter?.start_date || '',
        },
        {
          label: 'endDate',
          value: dateFilter?.end_date || '',
        },
      ],
    },
  ];

  const invoices = data as BookingValue[] || [];
  // const totalAmount = data && data?.data?.totalSalesData[0]?.totalSalesAmount || [];
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);

  // useEffect(() => {
  //   if (!dateFilter?.start_date && !dateFilter?.end_date) {
  //     const newSearchParams = new URLSearchParams(searchParams); // Clone existing searchParams
  //     newSearchParams.set('startDate', format(oneMonthAgo, 'yyyy-MM-dd') || '');
  //     newSearchParams.set('endDate', format(new Date(), 'yyyy-MM-dd') || '');
  //     newSearchParams.set('outletsId', outlets?.[0]._id);
  //     newSearchParams.set('reportDuration', 'MONTHLY');
  //     setSearchParams(newSearchParams)
  //   }
  // }, [dateFilter, outlets]);

  useEffect(() => {
  if (!dateFilter?.start_date && !dateFilter?.end_date && outlets?.length) {
    const today = new Date();

    const newSearchParams = new URLSearchParams(searchParams); // Clone existing searchParams
    newSearchParams.set("startDate", format(today, "yyyy-MM-dd")); // 👈 same day
    newSearchParams.set("endDate", format(today, "yyyy-MM-dd"));   // 👈 same day
    newSearchParams.set("outletIds", outlets?.[0].bookingStoreId);
    newSearchParams.set("reportDuration", "DAILY");

    setSearchParams(newSearchParams);
  }
}, [dateFilter]);


  const handleExportExcelClosureSummary = () => {
    if (!(data as any)?.data || (data as any)?.data.length === 0) {
      alert("No closure data to export!");
      return;
    }

    // Prepare export rows
    const exportData = (data as any)?.data?.map((row: any) => {
      // outletId se name find karo
      const outletName =
        outlets?.find((el: any) => el?._id === row.outletId)?.name || "N/A";

      return {
        OutletName: outletName, // 👈 outlet ka naam
        OpeningBalance: row.openingBalance,
        ClosingBalance: row.carryForwardBalance,
        BankDeposit: row.bankDeposit,
        TotalPayments: row.totalPaymentAmount,
        CashPayments: row.totalCashPayments,
        CardPayments: row.totalCardPayments,
        ManualCash: row.totalManualAmount,
        Variance: row.variance,
        Date: row.createdAt,
      };
    });


    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add top info
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Closure Summary Report"]],
      { origin: "A1" }
    );

    // Adjust column widths
    worksheet["!cols"] = [
      { wch: 28 }, // RegisterID
      { wch: 20 }, // OutletID
      { wch: 18 }, // OpeningBalance
      { wch: 18 }, // ClosingBalance
      { wch: 15 }, // BankDeposit
      { wch: 20 }, // TotalCashPayments
      { wch: 20 }, // TotalCardPayments
      { wch: 22 }, // ExpectedPhysicalCash
      { wch: 15 }, // Variance
      { wch: 15 }, // TotalPayouts
      { wch: 15 }, // CashUsage
      { wch: 10 }, // IsClosed
      { wch: 25 }, // OpenedAt
      { wch: 25 }, // ClosedAt
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ClosureSummary");

    // Save file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `ClosureSummary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <div className="flex flex-col h-full gap-2 p-4">
        <ATMPageHeader
          heading="Booking Summary Details"
          hideButton={true}
          buttonProps={{
            label: 'Export',
            onClick: () => handleExportExcelClosureSummary()
            // position: 'left', // if your ATMPageHeader supports it
          }}
        />
        <Authorization permission="OUTLET_LIST">
          {/* Table Toolbar */}
          <MOLFilterBar hideSearch={false} filters={filters} />
          <div className="flex flex-col overflow-auto border rounded border-slate-300 p-1">
           <div className="grid grid-cols-2 gap-4">

  {/* Chart 1: Top 10 Customers */}
  {topByServices.length > 0 && (
    <div className="col-span-1">
      <ATMChart
        type="bar"
        data={{
          labels: topByServices.map((item:any) => item.customerName),
          datasets: [
            // {
            //   label: 'Total Duration (hrs)',
            //   data: topByServices.map((item:any) => item.totalDuration),
            //   borderColor: '#3b82f6',
            //   backgroundColor: '#3b82f670',
            // },
            {
              label: 'Total Services Used',
              data: topByServices.map((item:any) => item.totalServices),
              borderColor: '#10b981',
              backgroundColor: '#10b98170',
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { position: 'top' } },
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true },
            x: { ticks: { autoSkip: false } },
          },
        }}
      />
    </div>
  )}

  {/* Chart 2: Top Services */}
 {topByTime.length > 0 && (
  <div className="col-span-1">
    <ATMChart
      type="bar"
      data={{
        labels: topByTime.map((item: any) => item.customerName),
        datasets: [
          {
            label: 'Total Duration (mins)',
            data: topByTime.map((item: any) => Number(item.totalDuration)),
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f670',
          },
          {
            label: 'Total Bookings',
            data: topByTime.map((item: any) => Number(item.totalBookings)),
            borderColor: '#10b981',
            backgroundColor: '#10b98170',
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { position: 'top' } },
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true },
          x: { ticks: { autoSkip: false } },
        },
      }}
    />
  </div>
)}


</div>


            <div className="flex-1 mt-3">
              <MOLTable<BookingValue>
                tableHeaders={tableHeaders}
                data={invoices || []}
                getKey={(item) => item?.bookingId}
                onEdit={undefined}
                onDelete={undefined}
                isLoading={isLoading}
              />
            </div>

            {/* Pagination */}
            <ATMPagination
              totalPages={totalPages}
              rowCount={totalData}
              rows={invoices || []}
            />
          </div>
        </Authorization>
        {/* {invoices.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 text-lg font-semibold">
            <span>Total Sales Amount: R {totalAmount?.toFixed(2)}</span>
            <ATMButton onClick={() => handleExportCSV()}>
              Export CSV
            </ATMButton>
          </div>
        )} */}
        {showPayoutModal && selectedRegister && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-6 rounded-xl shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-800">Cash Usage Payouts</h2>
                <ATMButton variant="outlined" onClick={() => setShowPayoutModal(false)}>Close</ATMButton>
              </div>

              {selectedRegister?.cashUsage?.length > 0 ? (
                <ul className="space-y-4">
                  {Object.entries(
                    selectedRegister.cashUsage.reduce((acc: any, entry: any) => {
                      const dateKey = new Date(entry.createdAt).toLocaleDateString("en-GB");
                      if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push(entry);
                      return acc;
                    }, {})
                  ).map(([date, entries]: [any, any]) => (
                    <ul key={date}>
                      {/* ✅ Date ek hi baar dikhayenge */}
                      <h3 className="text-sm font-bold mb-2 text-gray-700">{date}</h3>

                      {entries.map((entry: any, idx: number) => (
                        <li
                          key={idx}
                          className="border rounded-lg p-4 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center"
                        >
                          <div>
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Reason:</strong> {entry.reason}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Amount:</strong> R {entry.amount}
                            </p>
                          </div>
                          {entry.proofUrl && (
                            <img
                              src={`${process.env.REACT_APP_BASE_URL}/${entry.proofUrl}`}
                              alt="Proof"
                              className="mt-3 sm:mt-0 w-16 h-16 object-contain rounded border"
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No cash usage entries found.</p>
              )}

            </div>
          </div>
        )}

        {showPaymentsModal && selectedRegister && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-xl w-full p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Payment Summary</h2>
                <ATMButton variant="outlined" onClick={() => setShowPaymentsModal(false)}>Close</ATMButton>
              </div>

              {selectedRegister?.closeRegister?.length > 0 ? (
                selectedRegister.closeRegister.map((entry: any, dateIndex: number) => (
                  <div key={dateIndex} className="mb-4">
                    <h3 className="text-sm font-bold mb-2 text-gray-700">
                      {new Date(entry.date).toLocaleDateString('en-GB')}
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      {entry.payments?.map((payment: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-medium capitalize">{payment.paymentModeName}</span>: Total: R{" "}
                          {payment.totalAmount?.toFixed(2)} | Manual: R {payment.manual || '0'}
                          {payment.reason && (
                            <span className="text-orange-600 ml-1">(Reason: {payment.reason})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No payment summary available.</p>
              )}
            </div>
          </div>
        )}


      </div>
    </>
  )
};

export default ViewBookingDataPage;
