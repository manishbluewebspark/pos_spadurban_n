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
import { useGetPaymentReportsQuery, useGetRegisterChartDataQuery, useGetRegisterDataQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesLedgerReportsQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
import ATMChart from 'src/components/atoms/ATMChart/ATMChart';
import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';
import { formatZonedDate } from 'src/utils/formatZonedDate';
import * as XLSX from 'xlsx';
import { Register, RegisterValue } from 'src/modules/OpenRegister/models/OpenRegister.model';
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

const ViewSalesLedgerPage = () => {
  const { id } = useParams(); // outletId
  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletsId', 'customerId']);
  const [searchParams, setSearchParams] = useSearchParams();
  const { outlets } = useSelector((state: RootState) => state.auth);

  const startDate = dateFilter?.start_date || format(subMonths(new Date(), 1), 'yyyy-MM-dd');
  const endDate = dateFilter?.end_date || format(new Date(), 'yyyy-MM-dd');
  const outletId = appliedFilters?.[0]?.value || id || outlets?.[0]?._id;

  const { data, isLoading } = useGetSalesLedgerReportsQuery({
    outletId,
    startDate,
    endDate,
    page,
    limit
  });

  const weeks = data?.weeks || [];
  const pivotData = data?.data || [];

  const tableHeaders: TableHeader<any>[] = [
    {
      fieldName: 'date',
      headerName: 'Date',
      flex: 'flex-[1_1_0%]'
    },
     {
      fieldName: 'user',
      headerName: 'User',
      flex: 'flex-[1_1_0%]'
    },
     {
      fieldName: 'register',
      headerName: 'Register',
      flex: 'flex-[1_1_0%]'
    },
     {
      fieldName: 'customer',
      headerName: 'Customer',
      flex: 'flex-[1_1_0%]'
    },
     {
      fieldName: 'note',
      headerName: 'Note',
      flex: 'flex-[1_1_0%]'
    },
     {
      fieldName: 'status',
      headerName: 'Status',
      flex: 'flex-[1_1_0%]'
    },
      {
      fieldName: 'total',
      headerName: 'Total',
      flex: 'flex-[1_1_0%]'
    },
    {
      fieldName: 'invoiceNumber',
      headerName: 'Invoice No',
      flex: 'flex-[1_1_0%]'
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Ledger');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Sales Ledger${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-2 p-4 text-center justify-center text-xl">
    
      <ATMPageHeader
        heading="Sales Ledger"
        buttonProps={{
          label: 'Export',
          onClick: handleExportExcel,
        }}
      />

      <Authorization permission="OUTLET_LIST">
        <MOLFilterBar hideSearch={true} filters={[
          {
            filterType: 'single-select',
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

export default ViewSalesLedgerPage;

