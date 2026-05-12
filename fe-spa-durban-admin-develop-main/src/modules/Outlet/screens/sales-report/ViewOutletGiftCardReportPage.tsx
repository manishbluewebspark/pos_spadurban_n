import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import { useEffect } from 'react';
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
import { useGetGiftCardReportByOutletQuery, useGetGiftCardReportChartDataQuery, useGetGiftCardTableDataQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import { GiftCard } from 'src/modules/GiftCard/models/GiftCard.model';

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

const ViewOutletGiftCardReportPage = () => {
  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletIds', 'customerId', 'reportDuration', 'searchQuery']);
  const [searchParams, setSearchParams] = useSearchParams();
  console.log('------searchQuery', searchQuery)
  const { outlets } = useSelector((state: RootState) => state.auth);
  const { data, isLoading, error } = useGetGiftCardReportByOutletQuery({
    // outletId: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date,
    // page: page,
    // limit: limit,
    // sortBy: orderBy || 'createdAt',
    // sortOrder: orderValue || 'desc',
    reportDuration: appliedFilters?.[2]?.value
  });

  const { data: chartData } = useGetGiftCardReportChartDataQuery({
    outletIds: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date,
    reportDuration: appliedFilters?.[2]?.value,
  });

  const { data: tableData } = useGetGiftCardTableDataQuery({
    searchQuery,
    page, limit
    // outletIds: appliedFilters?.[0]?.value,
    //     startDate: dateFilter?.start_date,
    //     endDate: dateFilter?.end_date,
    //     reportDuration: appliedFilters?.[2]?.value
  })

  console.log('-----tableData', tableData?.data)

  const giftCardTableData = tableData?.data;
  const customerInsights = data?.data?.customerInsights || [];
  const giftCardDistribution = data?.data?.giftCardDistribution || [];
  const outletPerformance = data?.data?.outletPerformance || [];
  const datasets = chartData?.data?.datasets || [];
  const dataLabel = chartData?.data?.labels || [];
  // console.log('----chartData', chartData)


  const tableHeaders: TableHeader<GiftCard>[] = [
    {
      fieldName: 'giftCardNumber',
      headerName: 'Gift card number',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'totalSold',
      headerName: 'Total sold',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'totalRedeemed',
      headerName: 'Total redeemed',
      flex: 'flex-[1_0_0%]',
      sortable: true,
      sortKey: 'totalAmount',
    },
    {
      fieldName: 'balance',
      headerName: 'Balance',
      flex: 'flex-[1_0_0%]',
    }
  ]

  const filters: FilterType[] = [
    // {
    //   filterType: 'date',
    //   fieldName: 'createdAt',
    //   dateFilterKeyOptions: [
    //     {
    //       label: 'startDate',
    //       value: dateFilter?.start_date || '',
    //     },
    //     {
    //       label: 'endDate',
    //       value: dateFilter?.end_date || '',
    //     },
    //   ],
    // },
    // {
    //   filterType: 'multi-select',
    //   label: 'Outlets',
    //   fieldName: 'outletIds',
    //   options:
    //     outlets?.map((el) => {
    //       return {
    //         label: el?.name,
    //         value: el?._id,
    //       };
    //     }) || [],
    //   renderOption: (option) => option.label,
    //   isOptionEqualToSearchValue: (option, value) => {
    //     return option?.label.includes(value);
    //   },
    // },
    // {
    //   filterType: 'single-select',
    //   label: 'Select',
    //   fieldName: 'reportDuration',
    //   options: salesData || [],
    //   renderOption: (option) => option.label,
    //   isOptionEqualToSearchValue: (option, value) => {
    //     return option?.label.includes(value);
    //   },
    // },
  ];

  // const invoices = data?.data?.invoices || [];
  // const totalAmount = data?.data?.totalSalesData[0]?.totalSalesAmount || [];
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);

  // useEffect(() => {
  //   if (!dateFilter?.start_date && !dateFilter?.end_date) {
  //     const newSearchParams = new URLSearchParams(searchParams); // Clone existing searchParams
  //     newSearchParams.set('startDate', format(oneMonthAgo, 'yyyy-MM-dd') || '');
  //     newSearchParams.set('endDate', format(new Date(), 'yyyy-MM-dd') || '');
  //     newSearchParams.set('outletIds', outlets?.[0]._id);
  //     newSearchParams.set('reportDuration', "MONTHLY");
  //     setSearchParams(newSearchParams)
  //   }
  // }, [dateFilter, outlets]);

  // useEffect(() => {
  //   const reportDuration = (appliedFilters?.[2]?.value?.[0] as string) || "DAILY";

  //   if (!outlets?.length) return;

  //   let startDate: string;
  //   let endDate: string;

  //   switch (reportDuration) {
  //     case "MONTHLY":
  //       startDate = format(subMonths(new Date(), 1), "yyyy-MM-dd");
  //       endDate = format(new Date(), "yyyy-MM-dd");
  //       break;
  //     case "WEEKLY":
  //       startDate = format(subWeeks(new Date(), 1), "yyyy-MM-dd");
  //       endDate = format(new Date(), "yyyy-MM-dd");
  //       break;
  //     case "DAILY":
  //     default:
  //       startDate = format(startOfDay(new Date()), "yyyy-MM-dd");
  //       endDate = format(endOfDay(new Date()), "yyyy-MM-dd");
  //       break;
  //   }

  //   const currentStart = searchParams.get("startDate");
  //   const currentEnd = searchParams.get("endDate");
  //   const currentDuration = searchParams.get("reportDuration");
  //   const currentOutlet = searchParams.get("outletIds"); // 👈 already selected outlet

  //   // ✅ Agar sab already same hai to kuch mat karo
  //   if (
  //     currentStart === startDate &&
  //     currentEnd === endDate &&
  //     currentDuration === reportDuration &&
  //     currentOutlet // 👈 agar outlet already set hai, तो skip
  //   ) {
  //     return;
  //   }

  //   const newSearchParams = new URLSearchParams(searchParams.toString());
  //   newSearchParams.set("startDate", startDate);
  //   newSearchParams.set("endDate", endDate);

  //   // ✅ Sirf tabhi default outlet set karo jab user ne abhi tak outlet select nahi किया
  //   if (!currentOutlet) {
  //     newSearchParams.set("outletIds", outlets?.[0]?._id || "");
  //   }

  //   newSearchParams.set("reportDuration", reportDuration);

  //   if (newSearchParams.toString() !== searchParams.toString()) {
  //     setSearchParams(newSearchParams);
  //   }
  // }, [appliedFilters, outlets, setSearchParams]);

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

  const handleExportExcelGiftCard = (giftCardTableData: any) => {
    // Table data check
    if (!giftCardTableData?.tableData?.length) {
      alert("No data to export!");
      return;
    }

    // Format date function
    const formatDate = (date: string) => {
      if (!date) return "-";

      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Get table rows
    const tableData = giftCardTableData.tableData;

    // Convert into excel format
    const exportData = tableData.map((item: any) => ({
      "Gift Card Number": item.giftCardNumber || "-",

      "Total Sold": Number(item.totalSold || 0).toLocaleString(
        "en-ZA",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ),

      "Total Redeemed": Number(item.totalRedeemed || 0).toLocaleString(
        "en-ZA",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ),

      Balance: Number(item.balance || 0).toLocaleString(
        "en-ZA",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      ),

      "Expiry Date": formatDate(item.expiryDate),

      Status: item.isActive ? "Active" : "Inactive",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Column widths
    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Gift Cards"
    );

    // File name
    const today = new Date().toISOString().split("T")[0];

    const fileName = `GiftCards_${today}.xlsx`;

    // Generate excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Save file
    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, fileName);
  };

  // const handleExportCSV = () => {
  //   const exportData = invoices.map((inv: any) => ({
  //     InvoiceNumber: inv.invoiceNumber,
  //     CustomerName: inv.customerName,
  //     TotalAmount: inv.totalAmount,
  //     BalanceDue: inv.balanceDue,
  //     Status: inv.status || (inv.balanceDue > 0 ? 'Unpaid' : 'Paid'),
  //     Date: formatZonedDate(inv.createdAt), // you can use format() or your global time util
  //   }));

  //   const worksheet = XLSX.utils.json_to_sheet(exportData);
  //   const csv = XLSX.utils.sheet_to_csv(worksheet);

  //   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  //   const url = window.URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', 'Customer_Sales_Report.csv');
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };
  return (
    <>
      <div className="flex flex-col h-full gap-2 p-4">
        <ATMPageHeader
          heading="Gift Card Report"
          // hideButton={true}
          buttonProps={{
            label: 'Export',
            onClick: () => handleExportExcelGiftCard(giftCardTableData), // Navigate to previous page
            // position: 'left', // if your ATMPageHeader supports it
          }}
        />
        <Authorization permission="OUTLET_LIST">

          <MOLFilterBar hideSearch={false} filters={filters} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {/* Total Value Sold */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Total value sold
              </span>

              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: 0,
                  color: "#111",
                }}
              >
                R{" "}
                {Number(
                  giftCardTableData?.stats?.totalValueSold || 0
                ).toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>

            {/* Total Value Redeemed */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Total value redeemed
              </span>

              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: 0,
                  color: "#111",
                }}
              >
                R{" "}
                {Number(
                  giftCardTableData?.stats?.totalValueRedeemed || 0
                ).toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>

            {/* Outstanding Balance */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Outstanding balance
              </span>

              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: 0,
                  color: "#111",
                }}
              >
                R{" "}
                {Number(
                  giftCardTableData?.stats?.outstandingBalance || 0
                ).toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>

            {/* Gift Cards In Circulation */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Gift cards in circulation
              </span>

              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: 0,
                  color: "#111",
                }}
              >
                {Number(
                  giftCardTableData?.stats?.giftCardsInCirculation || 0
                ).toLocaleString("en-ZA")}
              </h3>
            </div>
          </div>
          {/* {datasets.length > 0 ? (
            <div className="flex flex-col overflow-auto border rounded border-slate-300 p-1">

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
                        text: 'Gift Cards Report',
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-10">
              
              <div>
                <ATMChart
                  type="pie"
                  data={{
                    labels: customerInsights.map((item: any) => item.name || "Unknown"),
                    datasets: [
                      {
                        label: "Total Purchased",
                        data: customerInsights.map((item: any) => item.totalAmount), // 💰 ya phir item.totalPurchased bhi le sakte ho
                        backgroundColor: ["#2196f3", "#4caf50", "#ff9800", "#f44336"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: "top", // ✅ labels top par aayenge
                        labels: {
                          color: "#333", // aur readable banane ke liye
                          font: {
                            size: 12,
                          },
                        },
                      },
                      title: {
                        display: true,
                        text: "Total Purchased",
                        font: {
                          size: 16,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>

              <ATMChart
                type="pie"
                data={{
                  labels: (outletPerformance ?? []).map(
                    (item: any) => item?.name || "Unknown"
                  ),
                  datasets: [
                    {
                      label: "Outlet Sales",
                      data: (outletPerformance ?? []).map(
                        (item: any) => item.totalSales
                      ),
                      backgroundColor: ["#673ab7", "#009688", "#ffc107", "#e91e63"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top", // ✅ labels top par aayenge
                      labels: {
                        color: "#333", // aur readable banane ke liye
                        font: {
                          size: 12,
                        },
                      },
                    },
                    title: {
                      display: true,
                      text: "Outlet Sales",
                      font: {
                        size: 16,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />


            
              <ATMChart
                type="pie"
                data={{
                  labels: giftCardDistribution.map((item: any) => `${item.discount}`),
                  datasets: [
                    {
                      label: "Gift Card Distribution",
                      data: giftCardDistribution.map((item: any) => item.count),
                      backgroundColor: ["#00bcd4", "#8bc34a", "#ff5722", "#9c27b0"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top", // ✅ labels top par aayenge
                      labels: {
                        color: "#333", // aur readable banane ke liye
                        font: {
                          size: 12,
                        },
                      },
                    },
                    title: {
                      display: true,
                      text: "Gift Card Distribution",
                      font: {
                        size: 16,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />

            </div>

            <div className="flex-1 mt-3">
              <MOLTable<GiftCard>
                tableHeaders={tableHeaders}
                data={giftCardTableData || []}
                getKey={(item) => item?._id}
                onEdit={undefined}
                onDelete={undefined}
                isLoading={false}
              />
            </div>

            
            <ATMPagination
              totalPages={1}
              rowCount={1}
              rows={giftCardTableData || []}
            />
          </div>) : (<> <p className="text-center text-gray-500 py-8">
                  No chart data available
                </p></>)} */}

          <div className="flex-1 mt-3">
            <MOLTable<GiftCard>
              tableHeaders={tableHeaders}
              data={giftCardTableData?.tableData || []}
              getKey={(item) => item?._id}
              onEdit={undefined}
              onDelete={undefined}
              isLoading={false}
            />
          </div>


          <ATMPagination
            totalPages={giftCardTableData?.pagination?.totalPages}
            rowCount={giftCardTableData?.pagination?.total}
            rows={giftCardTableData?.tableData || []}
          />
        </Authorization>



      </div>
    </>
  )
};

export default ViewOutletGiftCardReportPage;
