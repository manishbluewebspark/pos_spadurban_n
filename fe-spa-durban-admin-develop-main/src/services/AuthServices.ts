import apiSlice from './ApiSlice';
import { v4 as uuid } from 'uuid';

const deviceId = localStorage.getItem('deviceId') || uuid();

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation({
      query: (body: { email: string; password: string }) => {
        return {
          url: '/auth/login',
          method: 'POST',
          headers: {
            'device-id': deviceId,
          },
          body,
        };
      },
      transformResponse: (response: any) => {
        return { ...response, data: { ...response?.data, deviceId } };
      },
    }),
    loginAuto: builder.mutation({
      query: (body: { bookingUserId: string }) => {
        return {
          url: '/auth/login/auto',
          method: 'POST',
          headers: {
            'device-id': deviceId,
          },
          body,
        };
      },
      transformResponse: (response: any) => {
        return { ...response, data: { ...response?.data, deviceId } };
      },
    }),

    // Get Access Token
    getAccessToken: builder.mutation({
      query: (body) => {
        return {
          url: '/auth/refresh',
          method: 'POST',
          headers: {
            'device-id': deviceId,
          },
          body,
        };
      },
    }),

    // Change Password
    changePassword: builder.mutation({
      query: (body) => {
        return {
          url: '/auth/changePassword',
          method: 'POST',
          headers: {
            'device-id': deviceId,
          },
          body,
        };
      },
    }),
    checkEmailExists: builder.mutation({
      query: (body: { email: string }) => {
        return {
          url: '/auth/check-email',
          method: 'POST',
          headers: {
            'device-id': deviceId,
          },
          body,
        };
      }}),
      sendOtp: builder.mutation({
      query: (body: { email: string }) => {
        return {
          url: '/auth/send-otp',
          method: 'POST',
          body,
        };
      },
    }),
    verifyOtp: builder.mutation({
      query: (body: { email: string; otp: string }) => {
        return {
          url: '/auth/verify-otp',
          method: 'POST',
          body,
        };
      }}),
      resendOtp: builder.mutation({
      query: (body: { email: string }) => {
        return {
          url: '/auth/resend-otp',
          method: 'POST',
          body,
        };
      },
    }),

  }),
});

export const {
  useLoginMutation,
  useGetAccessTokenMutation,
  useChangePasswordMutation,
  useLoginAutoMutation,
  useCheckEmailExistsMutation,
  useVerifyOtpMutation,
  useSendOtpMutation
} = authApi;
