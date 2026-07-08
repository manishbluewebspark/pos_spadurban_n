import apiSlice from 'src/services/ApiSlice';

export const couponApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCoupons: builder.query({
      providesTags: ['coupon'],
      query: (body) => {
        return {
          url: '/coupon/pagination',
          method: 'GET',
          params: body,
        };
      },
    }),
    getCoupon: builder.query({
      providesTags: ['coupon'],
      query: (couponId) => {
        return {
          url: `/coupon/${couponId}`,
          method: 'GET',
        };
      },
    }),
     getCouponsByCustomer: builder.query({
      providesTags: ['coupon'],
      query: (customerId) => {
        return {
          url: `/coupon/customer/${customerId}`,
          method: 'GET',
        };
      },
    }),
      getLoyaltyHistory: builder.query({
      providesTags: ['coupon'],
      query: (customerId) => {
        return {
          url: `/coupon/loyalty-history/${customerId}`,
          method: 'GET',
        };
      },
    }),
    addCoupon: builder.mutation({
      invalidatesTags: ['coupon'],
      query: (body) => {
        return {
          url: '/coupon/add',
          method: 'POST',
          body,
        };
      },
    }),
    updateCoupon: builder.mutation({
      invalidatesTags: ['coupon'],
      query: ({ body, couponId }) => {
        return {
          url: `/coupon/${couponId}`,
          method: 'PUT',
          body,
        };
      },
    }),
    deleteCoupon: builder.mutation({
      invalidatesTags: ['coupon'],
      query: (couponId) => {
        return {
          url: `/coupon/${couponId}`,
          method: 'DELETE',
        };
      },
    }),
    couponStatus: builder.mutation({
      invalidatesTags: ['coupon'],
      query: (couponId) => {
        return {
          url: `/coupon/toggle-status/${couponId}`,
          method: 'PUT',
        };
      },
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useAddCouponMutation,
  useGetCouponQuery,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useCouponStatusMutation,
  useGetCouponsByCustomerQuery,
  useGetLoyaltyHistoryQuery
} = couponApi;
