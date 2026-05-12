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
import { useGetGiftCardReportByOutletQuery, useGetGiftCardReportChartDataQuery, useGetRetailDashboardDataQuery, useGetRetailDashboardProductsSoldQuery, useGetRetailDashboardTopSalesPeopleQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";

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

const ViewReatailDashboardPage = () => {
  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletIds', 'customerId', 'reportDuration']);
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useSelector((state: RootState) => state.auth);


  const { data } = useGetRetailDashboardDataQuery({
    outletIds: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date,
    reportDuration: appliedFilters?.[2]?.value
  });

  const { data: productSoldData,isLoading } =
  useGetRetailDashboardProductsSoldQuery({
    outletIds: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date,
    reportDuration: appliedFilters?.[2]?.value
  });


const { data: topSalesPeopleData } =
  useGetRetailDashboardTopSalesPeopleQuery({
    outletIds: appliedFilters?.[0]?.value,
    startDate: dateFilter?.start_date,
    endDate: dateFilter?.end_date,
    reportDuration: appliedFilters?.[2]?.value
  });

  console.log('----ProductSoldData',productSoldData)

  const durationLabel =
    (appliedFilters?.[2]?.value?.[0] as string) === "DAILY"
      ? "Previous Day"
      : (appliedFilters?.[2]?.value?.[0] as string) === "WEEKLY"
        ? "Previous Week"
        : (appliedFilters?.[2]?.value?.[0] as string) === "MONTHLY"
          ? "Previous Month"
          : "";


  console.log('----------ffff', data)

  const filters: FilterType[] = [
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
      filterType: 'multi-select',
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
      label: 'Select',
      fieldName: 'reportDuration',
      options: salesData || [],
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => {
        return option?.label.includes(value);
      },
    },
  ];

 

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
  //     outlets.forEach(o => {
  //       newSearchParams.append("outletIds", o._id);
  //     });

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


  type StatCardProps = {
    title: string;
    total: number;
    percent: number;
    previousLabel?: string;
    outlets: { outletId: string; outletName: string; value: number }[];
  };

  const StatCard = ({ title, total, percent, previousLabel = "Previous Month", outlets }: StatCardProps) => (
    <div className="flex-1 min-w-[250px] bg-white shadow rounded-xl p-4">
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>

      <div className="flex items-center gap-4 mt-2">
        {title === "Customer Count" || title === "Sale Count" ? (
          <span className="text-3xl font-bold text-slate-900">{total}</span>
        ) : (
          <span className="text-3xl font-bold text-slate-900">R {total}k</span>
        )}


        <div className="flex flex-col items-center justify-center">
          {percent >= 0 ? (
            <span className="text-green-600 flex items-center text-sm font-medium">▲ {percent}%</span>
          ) : (
            <span className="text-red-600 flex items-center text-sm font-medium">▼ {Math.abs(percent)}%</span>
          )}
          <span className="text-xs text-slate-500">{durationLabel}</span>
        </div>
      </div>

      <div className="w-full space-y-2 rounded-full mt-3">
        {outlets.map((o) => {
          const percentWidth = total ? (o.value / total) * 100 : 0;
          return (
            <div key={o.outletId} className="relative w-full h-5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentWidth}%`,
                  background: 'linear-gradient(to right, #76bd74ff, #6dd765ff)',
                }}
              ></div>
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-slate-900 truncate">
                {o.outletName}
              </span>
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-slate-900">
                {o.value}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-start mt-3">
      <div
        onClick={() => navigate('/outlet/sales-report')}
        className="text-blue-600 text-xs font-medium cursor-pointer hover:underline"
      >
        View Report
      </div>
    </div>
    </div>
  );

  const handleExportExcelRetailDashboard = () => {
    if (!data?.data || !data?.data?.outlets || data?.data?.outlets.length === 0) {
      alert("No data to export!");
      return;
    }

    const exportData = data.data.outlets.map((row: any) => ({
      Outlet: row.outletName,
      CustomerCount: row.customerCount,
      Revenue: row.revenue,
      SaleCount: row.saleCount,
      GrossProfit: row.grossProfit,
      RevenuePercent: row.revenuePercent,
      SaleCountPercent: row.saleCountPercent,
      GrossProfitPercent: row.grossProfitPercent,
      CustomerCountPercent: row.customerCountPercent,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add top info rows
    // XLSX.utils.sheet_add_aoa(worksheet, [["Retail Dashboard Report"]], { origin: "A1" });
    // XLSX.utils.sheet_add_aoa(
    //   worksheet,
    //   [[`Date Range: ${dateFilter?.start_date || ""} to ${dateFilter?.end_date || ""}`]],
    //   { origin: "A2" }
    // );

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Column A (Outlet) width 30
      { wch: 15 }, // Column B
      { wch: 15 }, // Column C
      { wch: 15 }, // Column D
      { wch: 15 }, // Column E
      { wch: 15 }, // Column F
      { wch: 15 }, // Column G
      { wch: 15 }, // Column H
      { wch: 15 }, // Column I
    ];


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RetailDashboard");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // Filename with duration & date
    const durationLabel = appliedFilters?.[2]?.value || "";
    const startDateStr = dateFilter?.start_date || "";
    const endDateStr = dateFilter?.end_date || "";
    const fileName = `RetailDashboard_${durationLabel}_${startDateStr}_to_${endDateStr}.xlsx`;

    saveAs(blob, fileName);
  };





  return (
    <>
      <div className="flex flex-col h-full gap-2 p-4">
        <ATMPageHeader
          heading="Retail Dashboard"
          // hideButton={true}
          buttonProps={{
            label: 'Export',
            onClick: () => handleExportExcelRetailDashboard()
            // onClick: () => navigate('/outlets'), // Navigate to previous page
            // position: 'left', // if your ATMPageHeader supports it
          }}
        />
        <Authorization permission="OUTLET_LIST">
          <MOLFilterBar hideSearch={true} filters={filters} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 border rounded border-slate-300">
            <StatCard
              title="Revenue"
              total={data?.data?.totalRevenue?.value || 0}
              percent={data?.data?.totalRevenue?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.revenue,
                })) || []
              }
            />

            <StatCard
              title="Sale Count"
              total={data?.data?.totalSaleCount?.value || 0}
              percent={data?.data?.totalSaleCount?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.saleCount,
                })) || []
              }
            />

            <StatCard
              title="Customer Count"
              total={data?.data?.totalCustomerCount?.value || 0}
              percent={data?.data?.totalCustomerCount?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.customerCount,
                })) || []
              }
            />

            <StatCard
              title="Gross Profit"
              total={data?.data?.totalGrossProfit?.value || 0}
              percent={data?.data?.totalGrossProfit?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.grossProfit,
                })) || []
              }
            />

            <StatCard
              title="Discounted"
              total={data?.data?.totalDiscounted?.value || 0}
              percent={data?.data?.totalDiscounted?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.discounted,
                })) || []
              }
            />

            <StatCard
              title="Discounted %"
              total={data?.data?.totalDiscountedPercent?.value || 0}
              percent={data?.data?.totalDiscountedPercent?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.discountedPercent,
                })) || []
              }
            />

            <StatCard
              title="Avg. sale value"
              total={data?.data?.totalAvgSaleValue?.value || 0}
              percent={data?.data?.totalAvgSaleValue?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.avgSaleValue,
                })) || []
              }
            />

            <StatCard
              title="Avg. items per sale"
              total={data?.data?.totalAvgItemsPerSale?.value || 0}
              percent={data?.data?.totalAvgItemsPerSale?.percent || 0}
              outlets={
                data?.data?.outlets?.map((o: any) => ({
                  outletId: o.outletId,
                  outletName: o.outletName,
                  value: o.avgItemsPerSale,
                })) || []
              }
            />
          </div>
          <div>
          </div>

           {/* ================= PRODUCTS SOLD TABLE ================= */}

<div className="bg-white rounded-xl shadow border p-4 mt-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-slate-700">
      Products Sold
    </h2>
  </div>

  <div className="flex-1 overflow-auto">
    <MOLTable<any>
      isLoading={false}
      tableHeaders={[
        {
          fieldName: 'productName',
          headerName: 'Product',
          flex: 'flex-[3_1_0%]',
        },
        {
          fieldName: 'revenue',
          headerName: 'Revenue',
          flex: 'flex-[1_1_0%]',
          renderCell: (item) => (
            <div>
              R {Number(item?.revenue || 0).toFixed(2)}
            </div>
          ),
        },
        {
          fieldName: 'itemsSold',
          headerName: 'Items Sold',
          flex: 'flex-[1_1_0%]',
        },
        {
          fieldName: 'discounted',
          headerName: 'Discounted',
          flex: 'flex-[1_1_0%]',
          renderCell: (item) => (
            <div>
              R {Number(item?.discounted || 0).toFixed(2)}
            </div>
          ),
        },
      ]}
      data={productSoldData?.data || []}
      getKey={(item) => item?._id}
    />
  </div>

  <ATMPagination
    totalPages={1}
    rowCount={productSoldData?.data?.length || 0}
    rows={productSoldData?.data || []}
  />

  <div
  onClick={() => navigate('/outlet/sales-report')}
  className="text-blue-600 text-xs font-medium cursor-pointer hover:underline"
  style={{
    display: 'flex',
    justifyContent: 'center',
    marginTop: 10,
    border: '1px solid black',
    padding: '2px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: 400,
    fontSize:10
  }}
>
  View Full Report
</div>
</div>



{/* ================= TOP SALES PEOPLE TABLE ================= */}

<div className="bg-white rounded-xl shadow border p-4 mt-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-slate-700">
      Top Sales People
    </h2>
  </div>

  <div className="flex-1 overflow-auto">
    <MOLTable<any>
      isLoading={false}
      tableHeaders={[
        {
          fieldName: 'userName',
          headerName: 'User',
          flex: 'flex-[2_1_0%]',
        },
        {
          fieldName: 'revenue',
          headerName: 'Revenue',
          flex: 'flex-[1_1_0%]',
          renderCell: (item) => (
            <div>
              R {Number(item?.revenue || 0).toFixed(2)}
            </div>
          ),
        },
        {
          fieldName: 'saleCount',
          headerName: 'Sale Count',
          flex: 'flex-[1_1_0%]',
        },
        {
          fieldName: 'itemsSold',
          headerName: 'Items Sold',
          flex: 'flex-[1_1_0%]',
        },
        {
          fieldName: 'avgSaleValue',
          headerName: 'Avg. Sale Value',
          flex: 'flex-[1_1_0%]',
          renderCell: (item) => (
            <div>
              R {Number(item?.avgSaleValue || 0).toFixed(2)}
            </div>
          ),
        },
        {
          fieldName: 'avgItemsPerSale',
          headerName: 'Avg. Items / Sale',
          flex: 'flex-[1_1_0%]',
          renderCell: (item) => (
            <div>
              {Number(item?.avgItemsPerSale || 0).toFixed(2)}
            </div>
          ),
        },
      ]}
      data={topSalesPeopleData?.data || []}
      getKey={(item) => item?._id}
    />
  </div>

  <ATMPagination
    totalPages={1}
    rowCount={topSalesPeopleData?.data?.length || 0}
    rows={topSalesPeopleData?.data || []}
  />
  <div
  className="text-blue-600 text-xs font-medium cursor-pointer hover:underline"
  onClick={() => navigate('/outlet/sales-report')}
  style={{
    display: 'flex',
    justifyContent: 'center',
    marginTop: 10,
    border: '1px solid black',
    padding: '2px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: 400,
    fontSize:10
  }}
>
  View Full Report
</div>
</div>

        </Authorization >
      </div >
    </>
  )
};

export default ViewReatailDashboardPage;
