// SalesReportPage.tsx
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
import { useSearchParams } from 'react-router-dom';
import ATMPageHeader from 'src/components/atoms/ATMPageHeader/ATMPageHeader';
import ATMPagination from 'src/components/atoms/ATMPagination/ATMPagination';
import Authorization from 'src/components/Authorization/Authorization';
import MOLFilterBar, { FilterType } from 'src/components/molecules/MOLFilterBar/MOLFilterBar';
import MOLTable, { TableHeader } from 'src/components/molecules/MOLTable/MOLTable';
import { useFilterPagination } from 'src/hooks/useFilterPagination';
import { RootState } from 'src/store';
import { useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { useFetchData } from 'src/hooks/useFetchData';
import { IconEye } from '@tabler/icons-react';
import ATMDialog from 'src/components/atoms/ATMDialog/ATMDialog';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';

// Report Types
const reportTypes = [
  { label: 'Sales Summary', value: 'SALES_SUMMARY' },
  { label: 'User', value: 'USER' },
  { label: 'Outlet', value: 'OUTLET' },
  { label: 'Register', value: 'REGISTER' },
  { label: 'Customer', value: 'CUSTOMER' },
  { label: 'Customer Group', value: 'CUSTOMER_GROUP' },
  { label: 'Promotion', value: 'PROMOTION' },
];

// Measure Types
const measureTypes = [
  { label: 'Avg. items per sale', value: 'AVG_ITEMS_PER_SALE' },
  { label: 'Avg. Sale value', value: 'AVG_SALE_VALUE' },
  { label: 'Customer count', value: 'CUSTOMER_COUNT' },
  { label: 'Discounted', value: 'DISCOUNTED' },
  { label: 'Discounted %', value: 'DISCOUNTED_PERCENT' },
  { label: 'Sale Count', value: 'SALE_COUNT' },
  { label: 'Sale With Customer', value: 'SALE_WITH_CUSTOMER' },
  { label: 'Revenue', value: 'REVENUE' },
];

// Comparison Types
const comparisonTypes = [
  { label: 'No comparison', value: 'NO_COMPARISON' },
  { label: 'Same Date in Previous year', value: 'SAME_DATE_PREVIOUS_YEAR' },
  { label: 'Same period in previous year', value: 'SAME_PERIOD_PREVIOUS_YEAR' },
];

// Time Period Types
const timePeriods = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom', value: 'CUSTOM' },
];

const SalesReportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useSelector((state: RootState) => state.auth);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const { appliedFilters, dateFilter, page, limit, orderBy, orderValue } = useFilterPagination([
    'reportType', 
    'outletId', 
    'measure', 
    'comparison', 
    'timePeriod'
  ]);

  // Get filter values
  const selectedReportType = appliedFilters?.[0]?.value?.[0] || 'SALES_SUMMARY';
  const selectedOutlet = appliedFilters?.[1]?.value?.[0] || outlets?.[0]?._id || '';
  const selectedMeasure = appliedFilters?.[2]?.value?.[0] || 'AVG_ITEMS_PER_SALE';
  const selectedComparison = appliedFilters?.[3]?.value?.[0] || 'NO_COMPARISON';
  const selectedTimePeriod = appliedFilters?.[4]?.value?.[0] || 'DAILY';

  // Get date range
  const startDate = dateFilter?.start_date || '';
  const endDate = dateFilter?.end_date || '';

  // Fetch sales report data
  const { data, isLoading, totalData, totalPages } = useFetchData(
    useGetSalesReportByOutletQuery,
    {
      body: {
        outletId: selectedOutlet,
        startDate: startDate,
        endDate: endDate,
        page,
        limit,
        sortBy: orderBy || 'revenue',
        sortOrder: orderValue || 'desc',
        reportDuration: selectedTimePeriod,
        reportType: selectedReportType,
        measure: selectedMeasure,
        comparison: selectedComparison,
      },
    }
  );

  // Process data for display
  const reportData = (data as any)?.data?.reportData || [];
  const chartData = (data as any)?.data?.chartData || null;
  const totalRevenue = (data as any)?.data?.totalRevenue || 0;
  const totalCost = (data as any)?.data?.totalCost || 0;
  const totalProfit = (data as any)?.data?.totalProfit || 0;
  const totalSales = (data as any)?.data?.totalSales || 0;

  // Update dates when time period changes
  useEffect(() => {
    if (!outlets?.length) return;

    let newStartDate = '';
    let newEndDate = '';

    if (selectedTimePeriod === 'CUSTOM') {
      // Custom dates are handled by the date filter
      return;
    }

    switch (selectedTimePeriod) {
      case "DAILY":
        newStartDate = format(startOfDay(currentDate), "yyyy-MM-dd");
        newEndDate = format(endOfDay(currentDate), "yyyy-MM-dd");
        break;
      case "WEEKLY":
        newStartDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
        newEndDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "MONTHLY":
        newStartDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
        newEndDate = format(endOfMonth(currentDate), "yyyy-MM-dd");
        break;
      case "YEARLY":
        newStartDate = format(startOfYear(currentDate), "yyyy-MM-dd");
        newEndDate = format(endOfYear(currentDate), "yyyy-MM-dd");
        break;
      default:
        return;
    }

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("startDate", newStartDate);
    newSearchParams.set("endDate", newEndDate);
    
    if (!searchParams.get("outletId")) {
      newSearchParams.set("outletId", outlets?.[0]?._id || "");
    }

    setSearchParams(newSearchParams);
  }, [currentDate, selectedTimePeriod, outlets]);

  const handlePrevious = () => {
    switch (selectedTimePeriod) {
      case "DAILY": setCurrentDate(prev => subDays(prev, 1)); break;
      case "WEEKLY": setCurrentDate(prev => subWeeks(prev, 1)); break;
      case "MONTHLY": setCurrentDate(prev => subMonths(prev, 1)); break;
      case "YEARLY": setCurrentDate(prev => subYears(prev, 1)); break;
      default: break;
    }
  };

  const handleNext = () => {
    switch (selectedTimePeriod) {
      case "DAILY": setCurrentDate(prev => addDays(prev, 1)); break;
      case "WEEKLY": setCurrentDate(prev => addWeeks(prev, 1)); break;
      case "MONTHLY": setCurrentDate(prev => addMonths(prev, 1)); break;
      case "YEARLY": setCurrentDate(prev => addYears(prev, 1)); break;
      default: break;
    }
  };

  const getDateLabel = () => {
    switch (selectedTimePeriod) {
      case "DAILY": return format(currentDate, "MMM d, yyyy");
      case "WEEKLY": return `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`;
      case "MONTHLY": return format(currentDate, "MMMM yyyy");
      case "YEARLY": return format(currentDate, "yyyy");
      case "CUSTOM": return `${startDate} to ${endDate}`;
      default: return "";
    }
  };

  // Build dynamic table headers based on report type
  const getTableHeaders = (): TableHeader<any>[] => {
    const baseHeaders: TableHeader<any>[] = [];

    // Add primary column based on report type
    switch (selectedReportType) {
      case 'SALES_SUMMARY':
        baseHeaders.push(
          { fieldName: 'outlet', headerName: 'Outlet', flex: 'flex-[1_1_0%]' },
          { fieldName: 'register', headerName: 'Register', flex: 'flex-[1_1_0%]' }
        );
        break;
      case 'USER':
        baseHeaders.push({ fieldName: 'user', headerName: 'User', flex: 'flex-[1_1_0%]' });
        break;
      case 'OUTLET':
        // Add hour columns for outlet report
        for (let hour = 8; hour <= 23; hour++) {
          const timeSlot = `${hour}-${hour + 1} ${hour < 12 ? 'AM' : 'PM'}`;
          baseHeaders.push({
            fieldName: `hour_${hour}`,
            headerName: timeSlot,
            flex: 'flex-[0.5_1_0%]',
            render: (row: any) => row.hourlyData?.[hour] || 0
          });
        }
        baseHeaders.push({ fieldName: 'outlet', headerName: 'Outlet', flex: 'flex-[1_1_0%]' });
        break;
      case 'REGISTER':
        baseHeaders.push({ fieldName: 'register', headerName: 'Register', flex: 'flex-[1_1_0%]' });
        break;
      case 'CUSTOMER':
        baseHeaders.push({ fieldName: 'customer', headerName: 'Customer', flex: 'flex-[1_1_0%]' });
        break;
      case 'CUSTOMER_GROUP':
        baseHeaders.push({ fieldName: 'customerGroup', headerName: 'Customer Group', flex: 'flex-[1_1_0%]' });
        break;
      case 'PROMOTION':
        baseHeaders.push({ fieldName: 'promotion', headerName: 'Promotion', flex: 'flex-[1_1_0%]' });
        break;
      default:
        baseHeaders.push({ fieldName: 'name', headerName: 'Name', flex: 'flex-[1_1_0%]' });
    }

    // Add measure columns based on selected measure
    const measureHeaders: TableHeader<any>[] = [];

    if (selectedMeasure === 'AVG_ITEMS_PER_SALE' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'avgItemsPerSale',
        headerName: 'Avg. items per sale',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.avgItemsPerSale?.toFixed(1) || '-'
      });
    }

    if (selectedMeasure === 'AVG_SALE_VALUE' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'avgSaleValue',
        headerName: 'Avg. Sale value',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.avgSaleValue ? `R ${row.avgSaleValue.toFixed(2)}` : '-'
      });
    }

    if (selectedMeasure === 'CUSTOMER_COUNT' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'customerCount',
        headerName: 'Customer count',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.customerCount || 0
      });
    }

    if (selectedMeasure === 'DISCOUNTED' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'discounted',
        headerName: 'Discounted',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.discounted ? `R ${row.discounted.toFixed(2)}` : 'R 0.00'
      });
    }

    if (selectedMeasure === 'DISCOUNTED_PERCENT' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'discountedPercent',
        headerName: 'Discounted %',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.discountedPercent ? `${row.discountedPercent}%` : '0%'
      });
    }

    if (selectedMeasure === 'SALE_COUNT' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'saleCount',
        headerName: 'Sale Count',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.saleCount || 0
      });
    }

    if (selectedMeasure === 'SALE_WITH_CUSTOMER' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'saleWithCustomer',
        headerName: 'Sale With Customer',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.saleWithCustomer || 0
      });
    }

    if (selectedMeasure === 'REVENUE' || selectedMeasure === 'ALL') {
      measureHeaders.push({
        fieldName: 'revenue',
        headerName: 'Revenue',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.revenue ? `R ${row.revenue.toFixed(2)}` : '-'
      });
    }

    // Always show these columns
    const defaultHeaders: TableHeader<any>[] = [
      {
        fieldName: 'costOfGoodsSold',
        headerName: 'Cost of goods sold',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.costOfGoodsSold ? `R ${row.costOfGoodsSold.toFixed(2)}` : '-'
      },
      {
        fieldName: 'grossProfit',
        headerName: 'Gross profit',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.grossProfit ? `R ${row.grossProfit.toFixed(2)}` : '-'
      },
      {
        fieldName: 'margin',
        headerName: 'Margin (%)',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.margin ? `${row.margin}%` : '-'
      },
      {
        fieldName: 'tax',
        headerName: 'Tax',
        flex: 'flex-[1_1_0%]',
        render: (row: any) => row.tax ? `R ${row.tax.toFixed(2)}` : 'R 0.00'
      }
    ];

    return [...baseHeaders, ...measureHeaders, ...defaultHeaders];
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!reportData.length) {
      alert("No data to export!");
      return;
    }

    const exportData = reportData.map((row: any) => {
      const flatRow: any = {};
      
      // Flatten the row data
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'object' && row[key] !== null) {
          if (key === 'hourlyData') {
            Object.entries(row[key]).forEach(([hour, value]) => {
              flatRow[`${hour}:00`] = value;
            });
          } else {
            flatRow[key] = JSON.stringify(row[key]);
          }
        } else {
          flatRow[key] = row[key];
        }
      });
      
      return flatRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalesReport_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters configuration
  const filters: FilterType[] = [
    {
      filterType: "single-select",
      label: "Report type",
      fieldName: "reportType",
      options: reportTypes,
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => 
        option?.label?.toLowerCase()?.includes(value?.toLowerCase()),
    },
    {
      filterType: "single-select",
      label: "Outlet",
      fieldName: "outletId",
      options: [
        { label: "All Outlets", value: "ALL" },
        ...(outlets?.map((el: any) => ({
          label: el?.name,
          value: el?._id,
        })) || []),
      ],
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => 
        option?.label?.toLowerCase()?.includes(value?.toLowerCase()),
    },
    {
      filterType: "single-select",
      label: "Measure",
      fieldName: "measure",
      options: measureTypes,
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => 
        option?.label?.toLowerCase()?.includes(value?.toLowerCase()),
    },
    ...(selectedTimePeriod === "CUSTOM" ? [{
      filterType: "date" as const,
      fieldName: "createdAt",
      dateFilterKeyOptions: [
        { label: "Start Date", value: startDate },
        { label: "End Date", value: endDate },
      ],
    }] : []),
    {
      filterType: "single-select",
      label: "Comparison",
      fieldName: "comparison",
      options: comparisonTypes,
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => 
        option?.label?.toLowerCase()?.includes(value?.toLowerCase()),
    },
    {
      filterType: "single-select",
      label: "Time Period",
      fieldName: "timePeriod",
      options: timePeriods,
      renderOption: (option) => option.label,
      isOptionEqualToSearchValue: (option, value) => 
        option?.label?.toLowerCase()?.includes(value?.toLowerCase()),
    },
  ];

  return (
    <div className="flex flex-col h-full gap-2 p-4">
      <ATMPageHeader
        heading="Sales Report"
        buttonProps={{
          label: 'Export Excel',
          onClick: handleExportExcel
        }}
      />

      <Authorization permission="SALES_LEDGER">
        <div className="bg-white rounded-xl border p-4">
          {/* Date Navigation */}
          {selectedTimePeriod !== 'CUSTOM' && (
            <div className="flex items-center justify-between bg-gray-50 border rounded-xl px-4 py-3 mb-4">
              <button
                onClick={handlePrevious}
                className="border rounded px-3 py-1 hover:bg-gray-100"
              >
                ←
              </button>
              <div className="font-semibold text-lg">
                {getDateLabel()}
              </div>
              <button
                onClick={handleNext}
                className="border rounded px-3 py-1 hover:bg-gray-100"
              >
                →
              </button>
            </div>
          )}

          {/* Filters */}
          <MOLFilterBar hideSearch={true} filters={filters} />

          {/* Active Filters Display */}
          <div className="mt-2 p-2 bg-gray-50 rounded border text-sm">
            <span className="font-medium">Active Filters: </span>
            Report: {reportTypes.find(r => r.value === selectedReportType)?.label} | 
            Outlet: {selectedOutlet === 'ALL' ? 'All Outlets' : outlets?.find(o => o._id === selectedOutlet)?.name || 'All'} | 
            Measure: {measureTypes.find(m => m.value === selectedMeasure)?.label} | 
            Comparison: {comparisonTypes.find(c => c.value === selectedComparison)?.label} | 
            Period: {getDateLabel()}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600">Total Revenue</p>
              <p className="text-xl font-bold">R {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600">Total Sales</p>
              <p className="text-xl font-bold">{totalSales}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600">Total Profit</p>
              <p className="text-xl font-bold">R {totalProfit.toFixed(2)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-600">Margin</p>
              <p className="text-xl font-bold">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>

          {/* Chart Section */}
          {chartData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <ATMChart 
                data={chartData} 
                type={selectedReportType === 'OUTLET' ? 'bar' : 'line'}
                height={300}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: {
                      display: true,
                      text: `Sales Overview - ${selectedReportType}`,
                    },
                  },
                }}
              />
            </div>
          )}

          {/* Table Section */}
          <div className="flex flex-col overflow-auto border rounded border-slate-300 mt-4">
            <div className="flex-1">
              <MOLTable
                tableHeaders={getTableHeaders()}
                data={reportData || []}
                getKey={(item) => item?._id || item?.id || Math.random().toString()}
                isLoading={isLoading}
              />
            </div>

            {/* Pagination */}
            <ATMPagination
              totalPages={totalPages || 1}
              rowCount={totalData || 0}
              rows={reportData || []}
            />
          </div>
        </div>
      </Authorization>
    </div>
  );
};

export default SalesReportPage;