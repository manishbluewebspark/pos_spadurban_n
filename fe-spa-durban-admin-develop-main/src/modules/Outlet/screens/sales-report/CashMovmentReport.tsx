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
import { useGetCashMovementReportQuery, useGetSalesChartDataReportByOutletQuery, useGetSalesReportByOutletQuery } from '../../service/OutletServices';
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

const ViewCashMovementReportPage = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const { searchQuery, limit, page, dateFilter, orderBy, orderValue, appliedFilters } =
    useFilterPagination(['outletIds', 'customerId', 'reportDuration']);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { outlets } = useSelector((state: RootState) => state.auth);

  const { data, isLoading, totalData, totalPages } = useFetchData(
    useGetCashMovementReportQuery,
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

  const filterValue = appliedFilters?.[2]?.value;

  const periodLabel =
    filterValue?.includes("MONTHLY")
      ? "Month"
      : filterValue?.includes("WEEKLY")
        ? "Week"
        : filterValue?.includes("DAILY")
          ? "Day"
          : "";


  const tableHeaders: TableHeader<SalesReport>[] = [
    {
      fieldName: 'type',
      headerName: 'Type',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'cashAdded',
      headerName: 'Cash added',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'cashRemoved',
      headerName: 'Cash removed',
      flex: 'flex-[1_0_0%]',
    },
    {
      fieldName: 'amount',
      headerName: 'Amount',
      flex: 'flex-[1_0_0%]',
      sortable: true,
      sortKey: 'totalAmount',
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

  console.log('--------data',data)

  const invoices = data as any || [];
  const totalAmount = (data as any)?.totalSalesData?.[0]?.totalSalesAmount || 0;

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

  const navigate = useNavigate();

  

  return (
    <>
      <div className="flex flex-col h-full gap-2 p-4">
        <ATMPageHeader
          heading="Cash Movment Report"
          hideButton={true}
          buttonProps={{
            label: 'Back',
            onClick: () => navigate('/outlets'),
          }}
        />
        
      
        <Authorization permission="OUTLET_LIST">
          <MOLFilterBar hideSearch={true} filters={filters} />
          

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
        </Authorization>

       

       
      </div>
    </>
  )
};

export default ViewCashMovementReportPage;
