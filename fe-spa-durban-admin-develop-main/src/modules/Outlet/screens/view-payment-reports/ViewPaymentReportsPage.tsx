
import { format, subMonths } from 'date-fns';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import Authorization from 'src/components/Authorization/Authorization';
import MOLFilterBar from 'src/components/molecules/MOLFilterBar/MOLFilterBar';
import MOLTable, {
  TableHeader,
} from 'src/components/molecules/MOLTable/MOLTable';

import { ATMButton } from 'src/components/atoms/ATMButton/ATMButton';

import { useFilterPagination } from 'src/hooks/useFilterPagination';

import { RootState } from 'src/store';

import {
  useGetPaymentReportsQuery,
} from '../../service/OutletServices';

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

const currencyFormat = (amount: number) => {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ViewPaymentReportsPage = () => {
  const { id } = useParams();

  const { appliedFilters, dateFilter } =
    useFilterPagination([
      'outletsId',
      'customerId',
      'reportDuration',
    ]);

  const [searchParams, setSearchParams] =
    useSearchParams();

  const { outlets } = useSelector(
    (state: RootState) => state.auth
  );

  const startDate =
    dateFilter?.start_date ||
    format(subMonths(new Date(), 1), 'yyyy-MM-dd');

  const endDate =
    dateFilter?.end_date ||
    format(new Date(), 'yyyy-MM-dd');

  const outletId =
    appliedFilters?.[0]?.value ||
    id ||
    outlets?.[0]?._id;

  const { data, isLoading } =
    useGetPaymentReportsQuery({
      outletId,
      startDate,
      endDate,
      reportDuration:
        appliedFilters?.[2]?.value,
    });

  const weeks = data?.weeks || [];
  const pivotData = data?.data || [];

  const tableHeaders: TableHeader<any>[] = [
    {
      fieldName: 'paymentMode',
      headerName: 'Payment type',
      flex: 'flex-[2_1_0%]',
    },

    ...weeks.map((w: string) => ({
      fieldName: w,
      headerName: w,
      flex: 'flex-[1_1_0%]',
      render: (row: any) =>
        currencyFormat(row[w]),
    })),

    {
      fieldName: 'total',
      headerName: 'TOTAL',
      flex: 'flex-[1_1_0%]',
      render: (row: any) =>
        currencyFormat(row.total),
    },
  ];

  const handleExportExcel = () => {
    if (!pivotData || pivotData.length === 0) {
      alert('No data to export!');
      return;
    }

    const worksheetData = pivotData.map(
      (row: any) => {
        const obj: any = {
          'Payment Mode': row.paymentMode,
        };

        weeks.forEach((w: string) => {
          obj[w] = row[w] ?? 0;
        });

        obj.Total = row.total ?? 0;

        return obj;
      }
    );

    const worksheet =
      XLSX.utils.json_to_sheet(worksheetData);

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [['Payment Report']],
      {
        origin: 'A1',
      }
    );

    worksheet['!cols'] = [
      { wch: 25 },
      ...weeks.map(() => ({ wch: 18 })),
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'PaymentReport'
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(
      blob,
      `PaymentReport_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  useEffect(() => {
    const selectedDuration =
      (appliedFilters?.[2]?.value?.[0] as string) ||
      'DAILY';

    if (!outlets?.length) return;

    const now = new Date();

    let startDate =
      searchParams.get('startDate');

    let endDate =
      searchParams.get('endDate');

    let reportDurationToSend =
      selectedDuration;

    let shouldUpdateDates = false;

    switch (selectedDuration) {
      case 'YEARLY': {
        const pastYear = new Date();

        pastYear.setFullYear(
          now.getFullYear() - 1
        );

        startDate = format(
          pastYear,
          'yyyy-MM-dd'
        );

        endDate = format(now, 'yyyy-MM-dd');

        shouldUpdateDates = true;

        break;
      }

      case 'MONTHLY': {
        const pastMonth = new Date();

        pastMonth.setMonth(
          now.getMonth() - 1
        );

        startDate = format(
          pastMonth,
          'yyyy-MM-dd'
        );

        endDate = format(now, 'yyyy-MM-dd');

        shouldUpdateDates = true;

        break;
      }

      case 'WEEKLY': {
        const pastWeek = new Date(now);

        pastWeek.setDate(now.getDate() - 7);

        startDate = format(
          pastWeek,
          'yyyy-MM-dd'
        );

        endDate = format(now, 'yyyy-MM-dd');

        shouldUpdateDates = true;

        break;
      }

      case 'CUSTUM':
        reportDurationToSend = 'CUSTUM';
        shouldUpdateDates = false;
        break;

      case 'DAILY':
      default:
        startDate = format(now, 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
        shouldUpdateDates = true;
        break;
    }

    const currentStart =
      searchParams.get('startDate');

    const currentEnd =
      searchParams.get('endDate');

    const currentDuration =
      searchParams.get('reportDuration');

    const currentOutlet =
      searchParams.get('outletIds');

    if (
      currentStart === startDate &&
      currentEnd === endDate &&
      currentDuration ===
        reportDurationToSend &&
      currentOutlet
    ) {
      return;
    }

    const newSearchParams =
      new URLSearchParams(
        searchParams.toString()
      );

    if (
      shouldUpdateDates &&
      startDate &&
      endDate
    ) {
      newSearchParams.set(
        'startDate',
        startDate
      );

      newSearchParams.set(
        'endDate',
        endDate
      );
    }

    if (!currentOutlet) {
      newSearchParams.set(
        'outletIds',
        outlets?.[0]?._id || ''
      );
    }

    newSearchParams.set(
      'reportDuration',
      reportDurationToSend
    );

    setSearchParams(newSearchParams);
  }, [appliedFilters, outlets]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1d1d1f]">
            Payment report
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Get an overview of your payment reports.
          </p>
        </div>

        <ATMButton onClick={handleExportExcel}>
          Export
        </ATMButton>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <Authorization permission="OUTLET_LIST">
          <MOLFilterBar
            hideSearch={true}
            filters={[
              {
                filterType: 'multi-select',
                label: 'Outlet',
                fieldName: 'outletsId',
                options:
                  outlets?.map((o: any) => ({
                    label: o.name,
                    value: o._id,
                  })) || [],

                renderOption: (option) =>
                  option.label,

                isOptionEqualToSearchValue:
                  (option, value) => {
                    return option?.label.includes(
                      value
                    );
                  },
              },

              {
                filterType: 'date',
                fieldName: 'createdAt',
                dateFilterKeyOptions: [
                  {
                    label: 'startDate',
                    value: startDate,
                  },
                  {
                    label: 'endDate',
                    value: endDate,
                  },
                ],
              },

              {
                filterType: 'single-select',
                label: 'Select',
                fieldName: 'reportDuration',
                options: salesData || [],

                renderOption: (option) =>
                  option.label,

                isOptionEqualToSearchValue:
                  (option, value) => {
                    return option?.label.includes(
                      value
                    );
                  },
              },
            ]}
          />
        </Authorization>
      </div>

      {/* Format Results */}
      <div className="flex items-center gap-2 text-[#4f46e5] text-sm font-semibold cursor-pointer w-fit">
        <span>⚙</span>
        <span>Format results</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <MOLTable
          tableHeaders={tableHeaders}
          data={pivotData || []}
          getKey={(item) => item?.paymentMode}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ViewPaymentReportsPage;
