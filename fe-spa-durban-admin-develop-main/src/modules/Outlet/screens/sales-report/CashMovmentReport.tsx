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

import { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import ATMPageHeader from "src/components/atoms/ATMPageHeader/ATMPageHeader";

import ATMPagination from "src/components/atoms/ATMPagination/ATMPagination";

import Authorization from "src/components/Authorization/Authorization";

import MOLFilterBar, {
  FilterType,
} from "src/components/molecules/MOLFilterBar/MOLFilterBar";

import MOLTable, {
  TableHeader,
} from "src/components/molecules/MOLTable/MOLTable";

import { useFilterPagination } from "src/hooks/useFilterPagination";

import { SalesReport } from "src/modules/Invoices/models/Invoices.model";

import { RootState } from "src/store";

import { useGetCashMovementReportQuery } from "../../service/OutletServices";

import { useFetchData } from "src/hooks/useFetchData";

import * as XLSX from "xlsx";

import { saveAs } from "file-saver";

import { ATMButton } from "src/components/atoms/ATMButton/ATMButton";

// ======================================================
// SALES DATA
// ======================================================

const salesData = [
  {
    label: "Daily",
    value: "DAILY",
  },
  {
    label: "Weekly",
    value: "WEEKLY",
  },
  {
    label: "Monthly",
    value: "MONTHLY",
  },
  {
    label: "Yearly",
    value: "YEARLY",
  },
  {
    label: "Custum",
    value: "CUSTUM",
  },
];

// ======================================================
// CASH TYPES
// ======================================================

const cashTypes = [
  {
    label: "All types",
    value: "ALL",
  },
  {
    label: "Cash in",
    value: "cash_in",
  },
  {
    label: "Cash out",
    value: "cash_out",
  },
  {
    label: "Petty cash in",
    value: "petty_cash_in",
  },
  {
    label: "Petty cash out",
    value: "petty_cash_out",
  },
];

// ======================================================
// COMPONENT
// ======================================================

const ViewCashMovementReportPage = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const { outlets } = useSelector(
    (state: RootState) => state.auth
  );

  // ======================================================
  // FILTER PAGINATION
  // ======================================================

  const {
    limit,
    page,
    dateFilter,
    orderBy,
    orderValue,
    appliedFilters,
  } = useFilterPagination([
    "outletIds",
    "customerId",
    "reportDuration",
    "cashTypes",
  ]);

  // ======================================================
  // FILTER VALUES
  // ======================================================

  const selectedOutlet =
    appliedFilters?.find(
      (f) => f.fieldName === "outletIds"
    )?.value?.[0] || "ALL";

  const selectedDuration =
    appliedFilters?.find(
      (f) => f.fieldName === "reportDuration"
    )?.value?.[0] || "DAILY";

  const selectedCashType =
    appliedFilters?.find(
      (f) => f.fieldName === "cashTypes"
    )?.value?.[0] || "ALL";

  // ======================================================
  // CURRENT DATE
  // ======================================================

  const [currentDate, setCurrentDate] =
    useState(new Date());

  // ======================================================
  // FETCH DATA
  // ======================================================

  const {
    data,
    isLoading,
    totalPages,
  } = useFetchData(
    useGetCashMovementReportQuery,
    {
      body: {
        outletId: selectedOutlet,

        startDate:
          dateFilter?.start_date,

        endDate:
          dateFilter?.end_date,

        page,

        limit,

        sortBy:
          orderBy || "createdAt",

        sortOrder:
          orderValue || "desc",

        reportDuration:
          selectedDuration,

        cashTypes:
          selectedCashType,
      },
    }
  );

  // ======================================================
  // TABLE DATA
  // ======================================================


  console.log('-------data',data)
  const invoices =
    (data as any) || [];

  // ======================================================
  // TABLE HEADERS
  // ======================================================

  const tableHeaders: TableHeader<SalesReport>[] =
    [
      {
        fieldName: "type",
        headerName: "Type",
        flex: "flex-[1_0_0%]",
      },
      {
        fieldName: "cashAdded",
        headerName: "Cash Added",
        flex: "flex-[1_0_0%]",
      },
      {
        fieldName: "cashRemoved",
        headerName: "Cash Removed",
        flex: "flex-[1_0_0%]",
      },
      {
        fieldName: "amount",
        headerName: "Amount",
        flex: "flex-[1_0_0%]",
      },
    ];

  // ======================================================
  // FILTERS
  // ======================================================

  const filters: FilterType[] = [
    // CASH TYPES
    {
      filterType: "single-select",

      label: "Cash Types",

      fieldName: "cashTypes",

      options: cashTypes,

      renderOption: (option) =>
        option.label,

      isOptionEqualToSearchValue: (
        option,
        value
      ) => {
        return option?.label
          ?.toLowerCase()
          ?.includes(
            value?.toLowerCase()
          );
      },
    },

    // OUTLET
    {
      filterType: "single-select",

      label: "Outlet",

      fieldName: "outletIds",

      options: [
        {
          label: "All Outlets",
          value: "ALL",
        },

        ...(outlets?.map(
          (el: any) => ({
            label: el?.name,
            value: el?._id,
          })
        ) || []),
      ],

      renderOption: (option) =>
        option.label,

      isOptionEqualToSearchValue: (
        option,
        value
      ) => {
        return option?.label
          ?.toLowerCase()
          ?.includes(
            value?.toLowerCase()
          );
      },
    },

    // DATE FILTER
    ...(selectedDuration ===
    "CUSTUM"
      ? [
          {
            filterType:
              "date" as const,

            fieldName:
              "createdAt",

            dateFilterKeyOptions:
              [
                {
                  label:
                    "startDate",

                  value:
                    dateFilter?.start_date ||
                    "",
                },

                {
                  label:
                    "endDate",

                  value:
                    dateFilter?.end_date ||
                    "",
                },
              ],
          },
        ]
      : []),

    // REPORT DURATION
    {
      filterType: "single-select",

      label: "Select",

      fieldName:
        "reportDuration",

      options: salesData,

      renderOption: (option) =>
        option.label,

      isOptionEqualToSearchValue: (
        option,
        value
      ) => {
        return option?.label
          ?.toLowerCase()
          ?.includes(
            value?.toLowerCase()
          );
      },
    },
  ];

  // ======================================================
  // DATE LABEL
  // ======================================================

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
        return format(
          currentDate,
          "yyyy"
        );

      default:
        return "";
    }
  };

  // ======================================================
  // PREVIOUS
  // ======================================================

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
    }
  };

  // ======================================================
  // NEXT
  // ======================================================

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
    }
  };

  // ======================================================
  // DATE SYNC
  // ======================================================

  useEffect(() => {
    if (!outlets?.length) return;

    if (
      selectedDuration === "CUSTUM"
    ) {
      return;
    }

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
    }

    const currentStart =
      searchParams.get("startDate");

    const currentEnd =
      searchParams.get("endDate");

    const currentDuration =
      searchParams.get(
        "reportDuration"
      );

    // ✅ PREVENT LOOP
    if (
      currentStart === startDate &&
      currentEnd === endDate &&
      currentDuration ===
        selectedDuration
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        searchParams
      );

    params.set(
      "startDate",
      startDate
    );

    params.set(
      "endDate",
      endDate
    );

    params.set(
      "reportDuration",
      selectedDuration
    );

    // ✅ DEFAULT VALUES
    if (
      !params.get("outletIds")
    ) {
      params.set(
        "outletIds",
        "ALL"
      );
    }

    if (
      !params.get("cashTypes")
    ) {
      params.set(
        "cashTypes",
        "ALL"
      );
    }

    setSearchParams(params);
  }, [
    currentDate,
    selectedDuration,
    outlets,
  ]);

  // ======================================================
  // EXPORT EXCEL
  // ======================================================

  const handleExportExcel =
    () => {
      if (!invoices?.length) {
        alert("No data found");
        return;
      }

      const exportData =
        invoices.map(
          (item: any) => ({
            Type:
              item?.type || "-",

            CashAdded:
              item?.cashAdded ||
              0,

            CashRemoved:
              item?.cashRemoved ||
              0,

            Amount:
              item?.amount || 0,
          })
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          exportData
        );

      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "CashMovementReport"
      );

      const excelBuffer =
        XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

      const blob = new Blob(
        [excelBuffer],
        {
          type: "application/octet-stream",
        }
      );

      saveAs(
        blob,
        `CashMovementReport_${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.xlsx`
      );
    };

  // ======================================================
  // RETURN
  // ======================================================

  return (
    <div className="flex flex-col h-full gap-2 p-4">
      <ATMPageHeader
        heading="Cash Movement Report"
        hideButton={true}
      />

      <Authorization permission="OUTLET_LIST">
        {/* DATE NAVIGATION */}

        <div className="flex items-center justify-between bg-white border rounded-xl px-4 py-3 mb-4">
          <button
            onClick={
              handlePrevious
            }
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

        {/* FILTERS */}

        <MOLFilterBar
          hideSearch={true}
          filters={filters}
        />

        {/* EXPORT BUTTON */}

        <div className="flex justify-end mt-3">
          <ATMButton
            onClick={
              handleExportExcel
            }
          >
            Export Excel
          </ATMButton>
        </div>

        {/* TABLE */}

        <div className="flex-1 mt-3">
          <MOLTable<SalesReport>
            tableHeaders={
              tableHeaders
            }
            data={invoices}
            getKey={(item) =>
              item?._id
            }
            isLoading={
              isLoading
            }
            onEdit={
              undefined
            }
            onDelete={
              undefined
            }
          />
        </div>

        {/* PAGINATION */}

        <ATMPagination
          totalPages={
            totalPages
          }
          rowCount={
            (data as any)
              ?.totalCount || 0
          }
          rows={invoices}
        />
      </Authorization>
    </div>
  );
};

export default ViewCashMovementReportPage;