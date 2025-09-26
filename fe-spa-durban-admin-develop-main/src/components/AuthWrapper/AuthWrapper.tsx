// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
// import ATMCircularProgress from '../atoms/ATMCircularProgress/ATMCircularProgress';
// import { AppDispatch, RootState } from '../../store';
// import { useFetchData } from '../../hooks/useFetchData';
// import { useGetRolesOfAnAdminQuery } from '../../modules/AdminRole/service/AdminRoleServices';
// import {
//   setIsLogin,
//   setOutlet,
//   setOutlets,
//   setPermissions,
//   setReturnUrl,
//   setUserData,
//   setAccessToken,
//   setRefreshToken,
// } from '../../slices/AuthSlice';
// import { useLoginAutoMutation } from '../../services/AuthServices';
// import { showToast } from '../../utils/showToaster';
// import {
//   authTokenKeyName,
//   refreshTokenKeyName,
// } from '../../utils/configs/authConfig';

// type Props = {
//   children: JSX.Element;
// };

// const AuthWrapper = ({ children }: Props) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { isLogin } = useSelector((state: RootState) => state.auth);
//   const { pathname } = useLocation();
//   const [searchParams] = useSearchParams();
//   const [isChecking, setIsChecking] = useState(true);
//   const [login] = useLoginAutoMutation();
//   const bookingUserId = searchParams.get('bookingUserId');

//   const { data, isLoading } = useFetchData(useGetRolesOfAnAdminQuery, {
//     dataType: 'VIEW',
//   });

//   const afterLogin = (res: any) => {
//     const userData = {
//       userName: res?.user?.userName,
//       name: res?.user?.name,
//       userId: res?.user?._id,
//       userType: res?.user?.userType,
//       email: res?.user?.email,
//     };

//     // console.log('-resssssssss authwr---',res)
//     dispatch(setUserData(userData));
//     dispatch(setOutlets(res?.outlets));
//     dispatch(setOutlet(res?.outlets?.[0]));
//     dispatch(setIsLogin(true));
//     dispatch(setAccessToken(res?.access));
//     dispatch(setRefreshToken(res?.refresh));

//     // Use localStorage to keep this login in the current tab only
//     localStorage.setItem(authTokenKeyName, res?.access);
//     localStorage.setItem(refreshTokenKeyName, res?.refresh);
//     localStorage.setItem('isLogin', 'true');
//     localStorage.setItem('deviceId', res?.deviceId);

//     showToast('success', 'Auto-login successful');
//     setIsChecking(false);
//   };

//   useEffect(() => {
//     const sessionAlreadyLoggedIn = localStorage.getItem('isLogin') === 'true';

//     if (!sessionAlreadyLoggedIn && pathname.startsWith('/pos') && bookingUserId) {
//       // console.log('Auto-login with bookingUserId:', bookingUserId);

//       login({ bookingUserId }).then((res: any) => {
//         if (res.error) {
//           showToast('error', res?.error?.data?.message);
//           setIsChecking(false);
//         } else if (res?.data?.status) {
//           afterLogin(res?.data?.data);
//         } else {
//           showToast('error', res?.data?.message);
//           setIsChecking(false);
//         }
//       });

//       return;
//     }

//     // For users already logged in (shared or admin login)
//     if (!isLoading) {
//       const userData = {
//         userName: (data as any)?.data?.userdata?.userName,
//         name: (data as any)?.data?.userdata?.name,
//         userId: (data as any)?.data?.userdata?.userID,
//         userType: (data as any)?.data?.userdata?.userType,
//         email: (data as any)?.data?.userdata?.email,
//         mobile: (data as any)?.data?.userdata?.phone,
//       };

//       // console.log('--------data-------- ',data)

//       dispatch(setOutlets((data as any)?.data?.outlets));
//       dispatch(setOutlet((data as any)?.data?.outlets?.[0]));
//       dispatch(setUserData(userData));
//       dispatch(setPermissions((data as any)?.data?.permissions));

//       setTimeout(() => {
//         setIsChecking(false);
//       }, 500);
//     } else {
//       setIsChecking(true);
//     }
//   }, [isLoading, data, pathname, bookingUserId]);

//   if (isChecking) {
//     return (
//       <div className="flex flex-col items-center justify-center w-screen h-screen">
//         <ATMCircularProgress />
//         <div className="text-center">
//           Please wait, We are checking your authentication
//         </div>
//       </div>
//     );
//   }

//   // Check current tab session login
//   if (!localStorage.getItem('isLogin')) {
//     dispatch(setReturnUrl(pathname));
//     return <Navigate to={'/login'} />;
//   }

//   return children;
// };

// export default AuthWrapper;

///----------


// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
// import ATMCircularProgress from '../atoms/ATMCircularProgress/ATMCircularProgress';
// import { AppDispatch, RootState } from '../../store';
// import { useFetchData } from '../../hooks/useFetchData';
// import { useGetRolesOfAnAdminQuery } from '../../modules/AdminRole/service/AdminRoleServices';
// import {
//   setIsLogin,
//   setOutlet,
//   setOutlets,
//   setPermissions,
//   setReturnUrl,
//   setUserData,
//   setAccessToken,
//   setRefreshToken,
// } from '../../slices/AuthSlice';
// import { useLoginAutoMutation, useGetAccessTokenMutation } from '../../services/AuthServices';
// import { showToast } from '../../utils/showToaster';
// import {
//   authTokenKeyName,
//   refreshTokenKeyName,
// } from '../../utils/configs/authConfig';
// import {jwtDecode} from 'jwt-decode';

// interface DecodedToken {
//   exp: number;
//   [key: string]: any;
// }

// type Props = { children: JSX.Element };

// const AuthWrapper = ({ children }: Props) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { pathname } = useLocation();
//   const [searchParams] = useSearchParams();
//   const [isChecking, setIsChecking] = useState(true);
//   const [login] = useLoginAutoMutation();
//   const [getAccessToken] = useGetAccessTokenMutation();
//   const bookingUserId = searchParams.get('bookingUserId');

//   const { data, isLoading } = useFetchData(useGetRolesOfAnAdminQuery, { dataType: 'VIEW' });

//   // Decode and check token expiration
//   const isTokenExpired = (token: string | null) => {
//     if (!token) return true;
//     try {
//       const decoded: DecodedToken = jwtDecode(token);
//       return decoded.exp < Date.now() / 1000;
//     } catch {
//       return true;
//     }
//   };

//   // Handle logout and redirect
//   const logoutAndRedirect = () => {
//     localStorage.removeItem(authTokenKeyName);
//     localStorage.removeItem(refreshTokenKeyName);
//     localStorage.removeItem('isLogin');
//     dispatch(setIsLogin(false));
//     dispatch(setReturnUrl(pathname));
//     window.location.href = '/login';
//   };

//   // Auto-refresh logic
//   useEffect(() => {
//   const interval = setInterval(async () => {
//     const accessToken = localStorage.getItem(authTokenKeyName);
//     const refreshToken = localStorage.getItem(refreshTokenKeyName);

//     // Step 1: Check if access token expired
//     if (isTokenExpired(accessToken)) {
//       console.warn("⏱ Access token expired");

//       // Step 2: Use refresh token to get new access token
//       if (refreshToken) {
//         try {
//           const res: any = await getAccessToken({ refreshToken }).unwrap(); 
//           // Here we send only the refresh token in body, backend will verify it
//           localStorage.setItem(authTokenKeyName, res.access);
//           dispatch(setAccessToken(res.access));
//           console.log("🔄 Access token refreshed");
//         } catch (err) {
//           console.error("❌ Refresh token failed", err);
//           // If refresh also fails → logout
//           // logoutAndRedirect();
//         }
//       } else {
//         // No refresh token → logout
//         // logoutAndRedirect();
//       }
//     }
//   }, 5000);

//   return () => clearInterval(interval);
// }, [dispatch, pathname, getAccessToken]);


//   // Initial auth check
//   useEffect(() => {
//     const sessionAlreadyLoggedIn = localStorage.getItem('isLogin') === 'true';

//     if (!sessionAlreadyLoggedIn && pathname.startsWith('/pos') && bookingUserId) {
//       login({ bookingUserId }).then((res: any) => {
//         if (res.error) {
//           showToast('error', res?.error?.data?.message);
//           setIsChecking(false);
//         } else if (res?.data?.status) {
//           const r = res?.data?.data;
//           dispatch(setUserData(r.user));
//           dispatch(setOutlets(r.outlets));
//           dispatch(setOutlet(r.outlets?.[0]));
//           dispatch(setIsLogin(true));
//           dispatch(setAccessToken(r.access));
//           dispatch(setRefreshToken(r.refresh));

//           localStorage.setItem(authTokenKeyName, r.access);
//           localStorage.setItem(refreshTokenKeyName, r.refresh);
//           localStorage.setItem('isLogin', 'true');
//           localStorage.setItem('deviceId', r.deviceId);

//           showToast('success', 'Auto-login successful');
//           setIsChecking(false);
//         } else {
//           showToast('error', res?.data?.message);
//           setIsChecking(false);
//         }
//       });
//       return;
//     }

//     if (!isLoading) {
//       const userData = (data as any)?.data?.userdata;
//       dispatch(setUserData(userData));
//       dispatch(setOutlets((data as any)?.data?.outlets));
//       dispatch(setOutlet((data as any)?.data?.outlets?.[0]));
//       dispatch(setPermissions((data as any)?.data?.permissions));
//       setIsChecking(false);
//     }
//   }, [data, isLoading, pathname, bookingUserId, dispatch, login]);

//   if (isChecking) {
//     return (
//       <div className="flex flex-col items-center justify-center w-screen h-screen">
//         <ATMCircularProgress />
//         <div className="text-center">
//           Please wait, We are checking your authentication
//         </div>
//       </div>
//     );
//   }

//   // if (!localStorage.getItem('isLogin')) {
//   //   dispatch(setReturnUrl(pathname));
//   //   return <Navigate to="/login" />;
//   // }

//   return children;
// };

// export default AuthWrapper;

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import ATMCircularProgress from '../atoms/ATMCircularProgress/ATMCircularProgress';
import { AppDispatch, RootState } from '../../store';
import { useFetchData } from '../../hooks/useFetchData';
import { useGetRolesOfAnAdminQuery } from '../../modules/AdminRole/service/AdminRoleServices';
import {
  setIsLogin,
  setOutlet,
  setOutlets,
  setPermissions,
  setReturnUrl,
  setUserData,
  setAccessToken,
  setRefreshToken,
} from '../../slices/AuthSlice';
import { useLoginAutoMutation, useGetAccessTokenMutation } from '../../services/AuthServices';
import { showToast } from '../../utils/showToaster';
import { authTokenKeyName, refreshTokenKeyName } from '../../utils/configs/authConfig';
import {jwtDecode} from 'jwt-decode';

type Props = { children: JSX.Element };

interface DecodedToken { exp: number; [key: string]: any }

const AuthWrapper = ({ children }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [login] = useLoginAutoMutation();
  const [getAccessToken] = useGetAccessTokenMutation();
  const bookingUserId = searchParams.get('bookingUserId');

  const { data, isLoading } = useFetchData(useGetRolesOfAnAdminQuery, { dataType: 'VIEW' });

  const afterLogin = (res: any) => {
    dispatch(setUserData(res.user));
    dispatch(setOutlets(res.outlets));
    dispatch(setOutlet(res.outlets?.[0]));
    dispatch(setIsLogin(true));
    dispatch(setAccessToken(res.access));
    dispatch(setRefreshToken(res.refresh));
    localStorage.setItem(authTokenKeyName, res.access);
    localStorage.setItem(refreshTokenKeyName, res.refresh);
    localStorage.setItem('isLogin', 'true');
    localStorage.setItem('deviceId', res.deviceId);
    setIsChecking(false);
    showToast('success', 'Login successful');
  };

  const isTokenExpired = (token: string | null) => {
    if (!token) return true;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch { return true; }
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem('isLogin');
    localStorage.removeItem(authTokenKeyName);
    localStorage.removeItem(refreshTokenKeyName);
    dispatch(setIsLogin(false));
    dispatch(setReturnUrl(pathname));
    window.location.href = '/login';
  };

  // Auto refresh access token if expired
  useEffect(() => {
    const interval = setInterval(async () => {
      const accessToken = localStorage.getItem(authTokenKeyName);
      const refreshToken = localStorage.getItem(refreshTokenKeyName);

      if (isTokenExpired(accessToken)) {
        if (refreshToken) {
          try {
            const res: any = await getAccessToken({ refreshToken }).unwrap();
            localStorage.setItem(authTokenKeyName, res.access);
            dispatch(setAccessToken(res.access));
            console.log('🔄 Access token refreshed');
          } catch (err) {
            console.error('❌ Refresh failed', err);
            logoutAndRedirect();
          }
        } else {
          logoutAndRedirect();
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch, pathname, getAccessToken]);

  useEffect(() => {
    const sessionAlreadyLoggedIn = localStorage.getItem('isLogin') === 'true';

    if (!sessionAlreadyLoggedIn && pathname.startsWith('/pos') && bookingUserId) {
      login({ bookingUserId }).then((res: any) => {
        if (res.error) { showToast('error', res.error.data?.message); setIsChecking(false); }
        else if (res.data?.status) afterLogin(res.data.data);
        else { showToast('error', res.data?.message); setIsChecking(false); }
      });
      return;
    }

    if (!isLoading) {
      const userData = (data as any)?.data?.userdata || {};
      dispatch(setUserData(userData));
      dispatch(setOutlets((data as any)?.data?.outlets));
      dispatch(setOutlet((data as any)?.data?.outlets?.[0]));
      dispatch(setPermissions((data as any)?.data?.permissions));
      setTimeout(() => setIsChecking(false), 500);
    } else { setIsChecking(true); }
  }, [isLoading, data, pathname, bookingUserId, dispatch]);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen">
        <ATMCircularProgress />
        <div className="text-center">Please wait, We are checking your authentication</div>
      </div>
    );
  }

  if (!localStorage.getItem('isLogin')) {
    dispatch(setReturnUrl(pathname));
    return <Navigate to="/login" />;
  }

  return children;
};

export default AuthWrapper;

