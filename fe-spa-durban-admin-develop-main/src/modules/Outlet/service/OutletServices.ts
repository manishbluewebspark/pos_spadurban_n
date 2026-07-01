import apiSlice from 'src/services/ApiSlice';

export const outletApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOutlets: builder.query({
      providesTags: ['outlets'],
      query: (body) => {
        return {
          url: '/outlet/pagination',
          method: 'GET',
          params: body,
        };
      },
    }),
    getOutlet: builder.query({
      providesTags: ['outlets'],
      query: (outletId) => {
        return {
          url: `/outlet/${outletId}`,
          method: 'GET',
        };
      },
    }),
    getOutletsByCompanyId: builder.query({
      providesTags: ['outlets'],
      query: (companyId) => {
        return {
          url: `/outlet/get-componys/${companyId}`,
          method: 'GET',
        };
      },
    }),
    addOutlet: builder.mutation({
      invalidatesTags: ['outlets'],
      query: (body) => {
        return {
          url: '/outlet/add',
          method: 'POST',
          body,
        };
      },
    }),
    updateOutlet: builder.mutation({
      invalidatesTags: ['outlets'],
      query: ({ body, outletId }) => {
        return {
          url: `/outlet/${outletId}`,
          method: 'PUT',
          body,
        };
      },
    }),
    deleteOutlet: builder.mutation({
      invalidatesTags: ['outlets'],
      query: (outletId) => {
        return {
          url: `/outlet/${outletId}`,
          method: 'DELETE',
        };
      },
    }),
    outletStatus: builder.mutation({
      invalidatesTags: ['outlets'],
      query: (outletId) => {
        return {
          url: `/outlet/toggle-status/${outletId}`,
          method: 'PUT',
        };
      },
    }),
   // OutletServices.ts - Update the query
getSalesReportByOutlet: builder.query({
  query: ({ outletId, startDate, endDate, page = 1, limit = 10, sortBy, sortOrder, reportDuration, reportType, measure, comparison }) => {
    const params = new URLSearchParams({
      outletId: outletId || '',
      startDate: startDate || '',
      endDate: endDate || '',
      page: String(page),
      limit: String(limit),
      sortBy: sortBy || 'revenue',
      sortOrder: sortOrder || 'desc',
      reportDuration: reportDuration || 'DAILY',
      reportType: reportType || 'SALES_SUMMARY',
      measure: measure || 'AVG_ITEMS_PER_SALE',
      comparison: comparison || 'NO_COMPARISON'
    });

    return {
      url: `/analytics/new/outlet/sales-report?${params.toString()}`,
      method: 'GET',
    };
  },
}),
    // ================================
    // RTK QUERY API
    // ================================

    getCashMovementReport: builder.query({
      query: ({
        outletId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy,
        sortOrder,
        cashTypes
      }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          sortBy,
          sortOrder,
          cashTypes
        });

        return {
          url: `/analytics/new/outlet/cash-movement-report?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetSalesChartDataReportByOutlet: builder.query({
      query: ({ outletId, startDate, endDate, page = 1, limit = 10, reportDuration }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          reportDuration
        });

        return {
          url: `/analytics/new/outlet/sales-chart-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    getSalesReportByCustomer: builder.query({
      query: ({ customerId, startDate, endDate, page = 1, limit = 10, sortBy, sortOrder }) => {
        const params = new URLSearchParams({
          customerId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          sortBy,
          sortOrder
        });

        return {
          url: `/analytics/new/customer/sales-report?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    getSalesChartDataReportByCustomer: builder.query({
      query: ({ customerId, startDate, endDate, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          customerId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit)
        });

        return {
          url: `/analytics/new/customer/sales-chart-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    getSalesByOutletCsvData: builder.query({
      query: (outletId) => ({
        url: '/analytics/new/outlet/sales-csv-data',
        method: 'POST',
        body: outletId, // sends { outletId: '...' } in JSON body
        responseHandler: (response) => response.blob(), // for CSV
      }),
    }),
    getRegisterChartData: builder.query({
      query: ({ outletId, startDate, endDate, page = 1, limit = 10, reportDuration }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          reportDuration
          // page: String(page),
          // limit: String(limit)
        });

        return {
          url: `/analytics/register-chart-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    getRegisterData: builder.query({
      query: ({ outletId, startDate, endDate, page = 1, limit = 10, reportDuration }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          reportDuration
        });

        return {
          url: `/analytics/register-table-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetOutletsChartData: builder.query({
      query: ({ outletIds, startDate, endDate, page = 1, limit = 10, reportDuration }) => {
        const params = new URLSearchParams({
          outletIds,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          reportDuration
        });

        return {
          url: `/analytics/new/outlets-chart-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetGiftCardReportChartData: builder.query({
      query: ({ outletIds, startDate, endDate, page = 1, limit = 10, reportDuration }) => {
        const params = new URLSearchParams({
          outletIds,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          reportDuration
        });

        return {
          url: `/analytics/new/gift-card-chart-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetGiftCardTableData: builder.query({
      query: ({ searchQuery, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          search: searchQuery,
          page,
          limit
        });

        return {
          url: `/analytics/new/gift-table-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetGiftCardReportByOutlet: builder.query({
      query: ({ outletId, startDate, endDate, page = 1, limit = 10, sortBy, sortOrder, reportDuration }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          sortBy,
          sortOrder,
          reportDuration
        });

        return {
          url: `/analytics/new/gift-card-report?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetRetailDashboardData: builder.query({
      query: ({ outletIds, startDate, endDate, reportDuration }) => {
        const params = new URLSearchParams({
          outletIds,
          startDate,
          endDate,
          reportDuration
        });

        return {
          url: `/analytics/new/retail-dashboard?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    // services/OutletServices.ts

    // ✅ Products Sold API
    GetRetailDashboardProductsSold: builder.query({
      query: ({ outletIds, startDate, endDate, reportDuration }) => {
        const params = new URLSearchParams({
          outletIds,
          startDate,
          endDate,
          reportDuration
        });

        return {
          url: `/analytics/new/retail-dashboard/products-sold?${params.toString()}`,
          method: 'GET',
        };
      },
    }),


    // ✅ Top Sales People API
    GetRetailDashboardTopSalesPeople: builder.query({
      query: ({ outletIds, startDate, endDate, reportDuration }) => {
        const params = new URLSearchParams({
          outletIds,
          startDate,
          endDate,
          reportDuration
        });

        return {
          url: `/analytics/new/retail-dashboard/top-sales-people?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    GetAllBookings: builder.query({
      query: ({ outletId, startDate, endDate, page = 1, limit = 25, searchValue }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          page,
          limit,
          searchValue
        });
        return {
          url: `/new/get-all-bookings?${params.toString()}`,
          method: 'GET',
        };
      },
    }),


    GetDataByQueryBuilder: builder.query({
      query: ({ query }) => {

        return {
          url: `/new/query-builder/run`,
          method: 'POST',
          body: { query }
        };
      },
    }),
    getBookingChartData: builder.query({
      query: ({ outletId, startDate, endDate, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          // page: String(page),
          // limit: String(limit)
        });

        return {
          url: `/new/get-chart-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    getPaymentReports: builder.query({
      query: ({ outletId, startDate, endDate, reportDuration }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          reportDuration
          // page: String(page),
          // limit: String(limit)
        });

        return {
          url: `/analytics/new/payment-reports-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
    getSalesLedgerReports: builder.query({
      query: ({ outletId, startDate, endDate, page, limit, reportDuration }) => {
        const params = new URLSearchParams({
          outletId,
          startDate,
          endDate,
          page: String(page),
          limit: String(limit),
          reportDuration
        });

        return {
          url: `/analytics/new/sales-ledger-report-data?${params.toString()}`,
          method: 'GET',
        };
      },
    }),
  }),
});

export const {
  useGetOutletsQuery,
  useGetOutletQuery,
  useAddOutletMutation,
  useUpdateOutletMutation,
  useDeleteOutletMutation,
  useOutletStatusMutation,
  useGetOutletsByCompanyIdQuery,
  useGetSalesReportByOutletQuery,
  useGetSalesReportByCustomerQuery,
  useGetSalesChartDataReportByOutletQuery,
  useGetSalesChartDataReportByCustomerQuery,
  useGetSalesByOutletCsvDataQuery,
  useGetRegisterChartDataQuery,
  useGetRegisterDataQuery,
  useGetOutletsChartDataQuery,
  useGetGiftCardReportChartDataQuery,
  useGetGiftCardTableDataQuery,
  useGetGiftCardReportByOutletQuery,
  useGetRetailDashboardDataQuery,
  useGetAllBookingsQuery,
  useGetDataByQueryBuilderQuery,
  useGetBookingChartDataQuery,
  useGetPaymentReportsQuery,
  useGetSalesLedgerReportsQuery,
  useGetRetailDashboardProductsSoldQuery,
  useGetRetailDashboardTopSalesPeopleQuery,
  useGetCashMovementReportQuery
} = outletApi;
