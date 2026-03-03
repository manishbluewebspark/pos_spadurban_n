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
import { useGetPaymentReportsQuery, useGetRegisterChartDataQuery, useGetRegisterDataQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
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

const ViewPaymentReportsPage = () => {
  const { id } = useParams(); // outletId
  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletsId', 'customerId','reportDuration']);
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useSelector((state: RootState) => state.auth);

  const startDate = dateFilter?.start_date || format(subMonths(new Date(), 1), 'yyyy-MM-dd');
  const endDate = dateFilter?.end_date || format(new Date(), 'yyyy-MM-dd');
  const outletId = appliedFilters?.[0]?.value || id || outlets?.[0]?._id;

  const { data, isLoading } = useGetPaymentReportsQuery({
    outletId,
    startDate,
    endDate,
    reportDuration: appliedFilters?.[2]?.value
  });

  const weeks = data?.weeks || [];
  const pivotData = data?.data || [];

  const tableHeaders: TableHeader<any>[] = [
    { fieldName: 'paymentMode', headerName: 'Payment Mode', flex: 'flex-[2_1_0%]' },
    ...weeks.map((w: string) => ({
      fieldName: w,
      headerName: w,
      flex: 'flex-[1_1_0%]',
      render: (row: any) => `R ${row[w] ?? 0}`,
    })),
    {
      fieldName: 'total',
      headerName: 'Total',
      flex: 'flex-[1_1_0%]',
      render: (row: any) => `R ${row.total ?? 0}`,
    },
  ];

  const handleExportExcel = () => {
    if (!pivotData || pivotData.length === 0) {
      alert('No data to export!');
      return;
    }

    const worksheetData = pivotData.map((row: any) => {
      const obj: any = { 'Payment Mode': row.paymentMode };
      weeks.forEach((w: string) => (obj[w] = row[w] ?? 0));
      obj.Total = row.total ?? 0;
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.sheet_add_aoa(worksheet, [['Weekly Payment Report']], { origin: 'A1' });

    // Set column widths
    worksheet['!cols'] = [{ wch: 20 }, ...weeks.map(() => ({ wch: 15 })), { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PaymentReport');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `PaymentReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  return (
    <div className="flex flex-col h-full gap-2 p-4">
      <ATMPageHeader
        heading="Payment Reports"
        buttonProps={{
          label: 'Export',
          onClick: handleExportExcel,
        }}
      />

      <Authorization permission="OUTLET_LIST">
        <MOLFilterBar hideSearch={true} filters={[
          {
            filterType: 'multi-select',
            label: 'Outlet',
            fieldName: 'outletsId',
            options: outlets?.map((o: any) => ({ label: o.name, value: o._id })) || [],
            renderOption: (option) => option.label,
            isOptionEqualToSearchValue: (option, value) => option?.label.includes(value),
          },
          {
            filterType: 'date',
            fieldName: 'createdAt',
            dateFilterKeyOptions: [
              { label: 'startDate', value: startDate },
              { label: 'endDate', value: endDate },
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
        ]} />

        <div className="flex flex-col overflow-auto border rounded border-slate-300 p-1 mt-3">
          <MOLTable
            tableHeaders={tableHeaders}
            data={pivotData || []}
            getKey={(item) => item?.paymentMode}
            isLoading={isLoading}
          />
        </div>
      </Authorization>
    </div>
  );
};

export default ViewPaymentReportsPage;

