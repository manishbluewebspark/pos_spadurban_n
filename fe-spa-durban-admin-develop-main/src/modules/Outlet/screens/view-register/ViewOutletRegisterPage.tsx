// ✅ UPDATE IMPORTS
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
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

  // console.log('-----data', data)


  const dailySummary = chartData?.data?.dailySummary || [];
  const finalCashVsOpening = chartData?.data?.finalCashVsOpening || [];
  const paymentModeBreakdown = chartData?.data?.paymentModeBreakdown || [];
  const allInOneTable = chartData?.data?.allInOneTable || [];
  // console.log('----chartData', chartData)


  const [selectedRegister, setSelectedRegister] = useState<any>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [currentDate, setCurrentDate] =
    useState(new Date());
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const handleViewPayouts = (row: any) => {
    setSelectedRegister(row);
    setShowPayoutModal(true);
  };

  const handleViewPayments = (row: any) => {
    setSelectedRegister(row);
    setShowPaymentsModal(true);
  };

  const selectedDuration =
    (appliedFilters?.[2]?.value?.[0] as string) ||
    "DAILY";



  const handlePrevious = () => {
    switch (selectedDuration) {
      case "DAILY":
        setCurrentDate((prev) =>
          subDays(prev, 1)
        );
        break;

      case "WEEKLY":
        setCurrentDate((prev) =>
          subWeeks(prev, 1)
        );
        break;

      case "MONTHLY":
        setCurrentDate((prev) =>
          subMonths(prev, 1)
        );
        break;

      case "YEARLY":
        setCurrentDate((prev) =>
          subYears(prev, 1)
        );
        break;

      default:
        break;
    }
  };

  const handleNext = () => {
    switch (selectedDuration) {
      case "DAILY":
        setCurrentDate((prev) =>
          addDays(prev, 1)
        );
        break;

      case "WEEKLY":
        setCurrentDate((prev) =>
          addWeeks(prev, 1)
        );
        break;

      case "MONTHLY":
        setCurrentDate((prev) =>
          addMonths(prev, 1)
        );
        break;

      case "YEARLY":
        setCurrentDate((prev) =>
          addYears(prev, 1)
        );
        break;

      default:
        break;
    }
  };


  const getDateLabel = () => {
    switch (selectedDuration) {
      case "DAILY":
        return format(
          currentDate,
          "MMM d, yyyy"
        );

      case "WEEKLY":
        return `${format(
          startOfWeek(currentDate, {
            weekStartsOn: 1,
          }),
          "MMM d"
        )} - ${format(
          endOfWeek(currentDate, {
            weekStartsOn: 1,
          }),
          "MMM d, yyyy"
        )}`;

      case "MONTHLY":
        return format(
          currentDate,
          "MMMM yyyy"
        );

      case "YEARLY":
        return format(currentDate, "yyyy");

      default:
        return "";
    }
  };


  const filters: FilterType[] = [
    // ✅ OUTLET
    {
      filterType: "single-select",
      label: "Outlet",
      fieldName: "outletsId",

      options: [
        {
          label: "All Outlets",
          value: "ALL",
        },

        ...(outlets?.map((el: any) => ({
          label: el?.name,
          value: el?._id,
        })) || []),
      ],

      renderOption: (option) =>
        option.label,

      isOptionEqualToSearchValue: (
        option,
        value
      ) => {
        return option?.label
          ?.toLowerCase()
          ?.includes(value?.toLowerCase());
      },
    },

    // ✅ DATE ONLY FOR CUSTOM
    ...(selectedDuration === "CUSTUM"
      ? [
        {
          filterType: "date" as const,
          fieldName: "createdAt",

          dateFilterKeyOptions: [
            {
              label: "startDate",
              value:
                dateFilter?.start_date || "",
            },
            {
              label: "endDate",
              value:
                dateFilter?.end_date || "",
            },
          ],
        },
      ]
      : []),

    // ✅ DURATION
    {
      filterType: "single-select",
      label: "Select",
      fieldName: "reportDuration",

      options: salesData || [],

      renderOption: (option) =>
        option.label,

      isOptionEqualToSearchValue: (
        option,
        value
      ) => {
        return option?.label
          ?.toLowerCase()
          ?.includes(value?.toLowerCase());
      },
    },
  ];

  const invoices = (data as any)?.data || [];


  const allPaymentModes: string[] =
    Array.from(
      new Set<string>(
        (
          (data as any)?.data || []
        ).flatMap((row: any) =>
          (
            row?.allPayments || []
          ).map(
            (p: any) =>
              String(
                p.paymentModeName
              )
          )
        )
      )
    );

  const dynamicPaymentHeaders =
    allPaymentModes.map(
      (mode: string) => ({
        fieldName: mode,
        headerName:
          mode.toUpperCase(),

        flex: "flex-[1_1_0%]",

        render: (row: any) => {
          const payment =
            row?.allPayments?.find(
              (p: any) =>
                p.paymentModeName ===
                mode
            );

          return payment
            ? Number(
              payment.totalAmount
            ).toFixed(2)
            : "0.00";
        },
      })
    );

    const totalAmountHeader = {
  fieldName: "grandTotal",
  headerName: "TOTAL AMOUNT",
  flex: "flex-[1_1_0%]",

  render: (row: any) => {
    const total = (
      row?.allPayments || []
    ).reduce(
      (sum: number, p: any) =>
        sum +
        Number(
          p.totalAmount || 0
        ),
      0
    );

    return total.toFixed(2);
  },
};

  const tableHeaders: any = [

    {
      fieldName: 'outletName',
      headerName: 'Outlet',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => {
        const outlet =
          outlets?.find(
            (o: any) =>
              o._id === row.outletId
          );

        return outlet?.name || '-';
      },
    },

    {
      fieldName: 'register',
      headerName: 'Register',
      flex: 'flex-[1_1_0%]',
      render: () => 'Main Register',
    },

    {
      fieldName: 'openedAt',
      headerName: 'Time Opened',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => {
        return row?.openedAt
          ? formatZonedDate(
            new Date(row.openedAt)
          )
          : '-';
      },
    },

    {
      fieldName: 'closedAt',
      headerName: 'Time Closed',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => {
        return row?.closedAt
          ? formatZonedDate(
            new Date(row.closedAt)
          )
          : '-';
      },
    },

    // ✅ DYNAMIC PAYMENTS
    ...dynamicPaymentHeaders,

    {
      fieldName: 'bankDeposit',
      headerName: 'Bank Deposit',
      flex: 'flex-[1_1_0%]',
    },

    {
      fieldName: 'carryForwardBalance',
      headerName: 'C/F Balance',
      flex: 'flex-[1_1_0%]',
    },

    {
      fieldName: 'variance',
      headerName: 'Variance',
      flex: 'flex-[1_1_0%]',
    },
totalAmountHeader
  ];




  // const totalAmount = data && data?.data?.totalSalesData[0]?.totalSalesAmount || [];
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);

  useEffect(() => {
    if (!outlets?.length) return;

    let startDate = "";
    let endDate = "";

    switch (selectedDuration) {
      case "DAILY":
        startDate = format(
          startOfDay(currentDate),
          "yyyy-MM-dd"
        );

        endDate = format(
          endOfDay(currentDate),
          "yyyy-MM-dd"
        );
        break;

      case "WEEKLY":
        startDate = format(
          startOfWeek(currentDate, {
            weekStartsOn: 1,
          }),
          "yyyy-MM-dd"
        );

        endDate = format(
          endOfWeek(currentDate, {
            weekStartsOn: 1,
          }),
          "yyyy-MM-dd"
        );
        break;

      case "MONTHLY":
        startDate = format(
          startOfMonth(currentDate),
          "yyyy-MM-dd"
        );

        endDate = format(
          endOfMonth(currentDate),
          "yyyy-MM-dd"
        );
        break;

      case "YEARLY":
        startDate = format(
          startOfYear(currentDate),
          "yyyy-MM-dd"
        );

        endDate = format(
          endOfYear(currentDate),
          "yyyy-MM-dd"
        );
        break;

      case "CUSTUM":
      default:
        return;
    }

    const newSearchParams =
      new URLSearchParams(
        searchParams.toString()
      );

    newSearchParams.set(
      "startDate",
      startDate
    );

    newSearchParams.set("endDate", endDate);

    newSearchParams.set(
      "reportDuration",
      selectedDuration
    );

    if (!searchParams.get("outletsId")) {
      newSearchParams.set(
        "outletsId",
        outlets?.[0]?._id || ""
      );
    }

    setSearchParams(newSearchParams);

  }, [
    currentDate,
    selectedDuration,
    outlets,
  ]);

  // ✅ EXCEL EXPORT
const handleExportExcelClosureSummary =
  () => {
    const rows =
      (data as any)?.data || [];

    if (!rows.length) {
      alert("No data to export!");
      return;
    }

    // ✅ ALL MODES
    const allPaymentModes: string[] =
      Array.from(
        new Set(
          rows.flatMap((row: any) =>
            (
              row?.allPayments || []
            ).map(
              (p: any) =>
                p.paymentModeName
            )
          )
        )
      );

    const exportData = rows.map(
      (row: any) => {
        const outletName =
          outlets?.find(
            (el: any) =>
              el?._id ===
              row.outletId
          )?.name || "-";

        const paymentColumns: any =
          {};

        let grandTotal = 0;

        // ✅ EACH PAYMENT MODE
        allPaymentModes.forEach(
          (mode: string) => {
            const total = (
              row?.allPayments || []
            )
              .filter(
                (p: any) =>
                  p.paymentModeName ===
                  mode
              )
              .reduce(
                (
                  sum: number,
                  p: any
                ) =>
                  sum +
                  Number(
                    p.totalAmount ||
                      0
                  ),
                0
              );

            grandTotal += total;

            paymentColumns[
              mode.toUpperCase()
            ] = total.toFixed(2);
          }
        );

        return {
          Outlet: outletName,

          OpenedAt: row?.openedAt
            ? formatZonedDate(
                new Date(
                  row.openedAt
                )
              )
            : "-",

          ClosedAt: row?.closedAt
            ? formatZonedDate(
                new Date(
                  row.closedAt
                )
              )
            : "-",

          OpeningCash:
            row?.openingBalance ||
            0,

          BankDeposit:
            row?.bankDeposit || 0,

          CarryForward:
            row?.carryForwardBalance ||
            0,

          // ✅ DYNAMIC
          ...paymentColumns,

          // ✅ GRAND TOTAL
          TotalAmount:
            grandTotal.toFixed(2),
        };
      }
    );

    // ✅ SHEET
    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );

    // ✅ AUTO WIDTH
    worksheet["!cols"] =
      Object.keys(
        exportData[0]
      ).map((key) => ({
        wch: Math.max(
          key.length + 5,
          18
        ),
      }));

    // ✅ WORKBOOK
    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "RegisterClosure"
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

    const blob = new Blob(
      [excelBuffer],
      {
        type:
          "application/octet-stream",
      }
    );

    saveAs(
      blob,
      `RegisterClosure_${new Date()
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

          <div className="flex items-center justify-between bg-white border rounded-xl px-4 py-3 mb-4">

            <button
              onClick={handlePrevious}
              className="border rounded px-3 py-1"
            >
              ←
            </button>

            <div className="font-semibold text-lg">
              {getDateLabel()}
            </div>

            <button
              onClick={handleNext}
              className="border rounded px-3 py-1"
            >
              →
            </button>

          </div>
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
