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
import { useGetRegisterChartDataQuery, useGetRegisterDataQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { Register, RegisterValue } from 'src/modules/OpenRegister/models/OpenRegister.model';
import { saveAs } from "file-saver";
import { useFetchData } from 'src/hooks/useFetchData';

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

const ViewOutletRegisterPage = () => {
  const { id } = useParams(); // outletId from URL


  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletsId', 'customerId', 'reportDuration']);
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useSelector((state: RootState) => state.auth);
  // const { data, isLoading, error } = useGetRegisterDataQuery({
  //   outletId: appliedFilters?.[0]?.value,
  //   startDate: dateFilter?.start_date,
  //   endDate: dateFilter?.end_date,
  //   page: page,
  //   limit: limit,
  //   sortBy: orderBy || 'createdAt',
  //   sortOrder: orderValue || 'desc',
  // });

  const { data, isLoading, totalData, totalPages } = useFetchData(
    useGetRegisterDataQuery,
    {
      body: {
        outletId: appliedFilters?.[0]?.value,
        startDate: dateFilter?.start_date,
        endDate: dateFilter?.end_date,
        page,
        limit,
        sortBy: orderBy || 'createdAt',
        sortOrder: orderValue || 'desc',
        reportDuration: appliedFilters?.[2]?.value
      },
    }
  );




  const { data: chartData } = useGetRegisterChartDataQuery({
    outletId: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date,
    reportDuration: appliedFilters?.[2]?.value
  });

  console.log('-----data', data)


  const dailySummary = chartData?.data?.dailySummary || [];
  const finalCashVsOpening = chartData?.data?.finalCashVsOpening || [];
  const paymentModeBreakdown = chartData?.data?.paymentModeBreakdown || [];
  const allInOneTable = chartData?.data?.allInOneTable || [];
  // console.log('----chartData', chartData)


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



  const tableHeaders: TableHeader<RegisterValue>[] = [
    {
      fieldName: 'openedAt',
      headerName: 'Time Opened',
      flex: 'flex-[1_1_0%]',
      sortable: true,
      sortKey: 'openedAt',
      extraClasses: () => '',
      stopPropagation: true,
      render: (row: any) => {
        const date = row.openedAt ? new Date(row.openedAt) : null;
        return date ? formatZonedDate(date) : '-';
      }
    },
    {
      fieldName: 'closedAt',
      headerName: 'Time Closed',
      flex: 'flex-[1_1_0%]',
      sortable: true,
      sortKey: 'closedAt',
      extraClasses: () => '',
      stopPropagation: true,
      render: (row: any) => {
        const date = row.closedAt ? new Date(row.closedAt) : null;
        return date ? formatZonedDate(date) : '-';
      }
    },
    {
      fieldName: 'openingBalance',
      headerName: 'Cash',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row?.openingBalance ?? '-'}
          </span>

          <span
            className={`text-sm ${row?.totalCashAmount < 0
                ? 'text-red-500'
                : 'text-green-600'
              }`}
          >
            {row?.totalCashAmount
              ? `${row.totalCashAmount > 0 ? '+' : ''}${row.totalCashAmount}`
              : '-'}
          </span>
        </div>
      ),
    },
    {
      fieldName: 'bankDeposit',
      headerName: 'Bank Deposite',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => (row?.bankDeposit ? row.bankDeposit : '-'),
    },
    {
      fieldName: 'totalPayouts',
      headerName: 'Total Payout',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => (row?.totalPayouts ? row.totalPayouts : '-'),
    },

    {
      fieldName: 'carryForwardBalance',
      headerName: 'C/F Balance',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => (row?.carryForwardBalance ? row.carryForwardBalance : '-'),
    },
    // {
    //   fieldName: 'closeRegister',
    //   headerName: 'Payment Summary',
    //   flex: 'flex-[3_1_0%]',
    //   render: (row: any) => {
    //     if (!Array.isArray(row?.closeRegister)) return '-';

    //     return (
    //       <div className="space-y-2 text-sm">
    //         {row.closeRegister.map((entry: any, index: number) => (
    //           <div key={index} className="border rounded p-2 bg-gray-50">
    //             {/* <div className="font-semibold">
    //             {new Date(entry.date).toLocaleDateString('en-GB')}
    //           </div> */}
    //             <ul className="list-disc pl-4 mt-1 space-y-1">
    //               {entry.payments?.map((payment: any, i: number) => (
    //                 <li key={i}>
    //                   <span className="capitalize font-medium">{payment.paymentModeName}</span>:
    //                   Total: R {payment.totalAmount?.toFixed(2)} | Manual: R {payment.manual || '0'}
    //                   {payment.reason && (
    //                     <span className="text-orange-600 ml-1">
    //                       (Reason: {payment.reason})
    //                     </span>
    //                   )}
    //                 </li>
    //               ))}
    //             </ul>
    //           </div>
    //         ))}
    //       </div>
    //     );
    //   }
    // },
    // {
    //   fieldName: 'registerStatus',
    //   headerName: 'Register Status',
    //   flex: 'flex-[1_1_0%]',
    //   render: (row: any) => {
    //     if (row.isClosed) return 'Closed';
    //     if (row.isOpened) return 'Opened';
    //     return 'Not Opened';
    //   }
    // },
    {
      fieldName: 'closeRegister',
      headerName: 'Payment Summary',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => (
        <button
          className="text-white px-3 py-1 rounded hover:opacity-90"
          style={{ backgroundColor: '#006972' }}
          onClick={() => handleViewPayments(row)}
        >
          View Payments
        </button>
      ),
    },


    // {
    //   fieldName: 'cashUsageReason',
    //   headerName: 'Cash Usage Reason',
    //   flex: 'flex-[1_1_0%]',
    // },
    {
      fieldName: 'actions',
      headerName: 'Payouts',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => (
        <button
          className="text-white px-3 py-1 rounded hover:opacity-90"
          style={{ backgroundColor: '#006972' }}
          onClick={() => handleViewPayouts(row)}
        >
          View Payouts
        </button>
      ),
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
            value: el?._id,
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
    {
      filterType: 'single-select',
      label: 'Select',
      fieldName: 'reportDuration',
      options: salesData || [],
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => {
        return option?.label.includes(value);
      },
    },
  ];

  const invoices = (data as any)?.data || [];

  // const totalAmount = data && data?.data?.totalSalesData[0]?.totalSalesAmount || [];
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);

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

  const handleExportExcelClosureSummary = () => {
    if (!(data as any)?.data || (data as any)?.data.length === 0) {
      alert("No closure data to export!");
      return;
    }

    const exportData = (data as any)?.data?.map((row: any) => {
      const outletName =
        outlets?.find((el: any) => el?._id === row.outletId)?.name || "N/A";

      // 🔹 Dynamic payment mode totals
      const paymentTotals: any = {};

      (row?.allPayments || []).forEach((payment: any) => {
        const mode = payment?.paymentModeName || "Unknown";

        if (!paymentTotals[mode]) {
          paymentTotals[mode] = {
            total: 0,
            manual: 0,
          };
        }

        paymentTotals[mode].total += Number(payment?.totalAmount || 0);
        paymentTotals[mode].manual += Number(payment?.manual || 0);
      });

      // 🔹 Dynamic columns
      const paymentColumns: any = {};

      Object.keys(paymentTotals).forEach((mode) => {
        const formattedMode = mode
          .replace(/\s+/g, "_")
          .toUpperCase();

        paymentColumns[`${formattedMode}_TOTAL`] =
          paymentTotals[mode].total;

        paymentColumns[`${formattedMode}_MANUAL`] =
          paymentTotals[mode].manual;
      });

      return {
        Outlet: outletName,
        OpeningBalance: row.openingBalance || 0,
        BankDeposit: row.bankDeposit || 0,
        CarryForwardBalance: row.carryForwardBalance || 0,
        ExpectedPhysicalCash: row.expectedPhysicalCash || 0,
        Variance: row.variance || 0,

        // 🔹 Dynamic payment columns
        ...paymentColumns,

        TotalPayouts: row.totalPayouts || 0,
        CashUsageCash: row.cashUsageCashSum || 0,
        CashUsageCard: row.cashUsageCardSum || 0,

        OpenedAt: row.openedAt
          ? new Date(row.openedAt).toLocaleString()
          : "-",

        ClosedAt: row.closedAt
          ? new Date(row.closedAt).toLocaleString()
          : "-",

        CreatedAt: row.createdAt
          ? new Date(row.createdAt).toLocaleString()
          : "-",
      };
    });

    // 🔹 Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 🔹 Add Title
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Closure Summary Report"]],
      { origin: "A1" }
    );

    // 🔹 Auto width
    const headers = Object.keys(exportData[0] || {});

    worksheet["!cols"] = headers.map((header) => ({
      wch: Math.max(header.length + 5, 20),
    }));

    // 🔹 Workbook
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "ClosureSummary"
    );

    // 🔹 Export
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(
      blob,
      `ClosureSummary_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  return (
    <>
      <div className="flex flex-col h-full gap-2 p-4">
        <ATMPageHeader
          heading="Outlet Register Details"
          // hideButton={true}
          buttonProps={{
            label: 'Export',
            onClick: () => handleExportExcelClosureSummary()
            // position: 'left', // if your ATMPageHeader supports it
          }}
        />
        <Authorization permission="OUTLET_LIST">
          {/* Table Toolbar */}
          <MOLFilterBar hideSearch={true} filters={filters} />
          <div className="flex flex-col overflow-auto border rounded border-slate-300 p-1">


            <div className="flex-1 mt-3">
              <MOLTable<RegisterValue>
                tableHeaders={tableHeaders}
                data={invoices || []}
                getKey={(item) => item?._id}
                onEdit={undefined}
                onDelete={undefined}
                isLoading={isLoading}
              />
            </div>

            {/* Pagination */}
            <ATMPagination
              totalPages={(data as any)?.pagination?.pages}
              rowCount={(data as any)?.pagination?.total}
              rows={invoices || []}
            />


          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              {/* Chart 4: Daily Summary (Line) */}
              {dailySummary.length > 0 && (
                <div className="col-span">
                  <ATMChart
                    type="bar"
                    data={{
                      labels: dailySummary.map((item: any) => item.date),
                      datasets: [
                        {
                          label: 'Total Cash',
                          data: dailySummary.map((item: any) => item.totalCash),
                          borderColor: '#3b82f6',
                          backgroundColor: '#3b82f670',
                        },
                        {
                          label: 'Bank Deposit',
                          data: dailySummary.map((item: any) => item.bankDeposit),
                          borderColor: '#10b981',
                          backgroundColor: '#10b98170',
                        },
                        {
                          label: 'Carry Forward',
                          data: dailySummary.map((item: any) => item.carryForwardBalance),
                          borderColor: '#f59e0b',
                          backgroundColor: '#f59e0b70',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'top' } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              )}

              {/* Chart 5: Final Cash vs Opening Balance (Bar) */}
              {finalCashVsOpening.length > 0 && (
                <div className="col-span">
                  <ATMChart
                    type="pie"
                    data={{
                      labels: ['Opening Balance', 'Final Cash', 'Payout Cash'],
                      datasets: [
                        {
                          label: finalCashVsOpening[0].date, // show date in tooltip
                          data: [
                            finalCashVsOpening[0].openingBalance,
                            finalCashVsOpening[0].finalCash,
                            finalCashVsOpening[0].payoutCash,
                          ],
                          backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b'],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'top' } },
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              )}

            </div>
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

export default ViewOutletRegisterPage;
