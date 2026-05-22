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

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const selectedDuration =
    (appliedFilters?.[2]?.value?.[0] as string) ||
    "DAILY";



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
          <MOLFilterBar
            hideSearch={true}
            filters={[
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
