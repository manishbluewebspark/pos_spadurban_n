import httpStatus from "http-status";
import ApiError from "../../../../utilities/apiError";
import {
  tokenService,
  userService,
  redisService,
  employeeService,
  outletService,
} from "../service.index";
import config from "../../../../config/config";
import { Request } from "express";
import { sendEmail } from "../../../helper/sendEmail";
import { UserEnum } from "../../../utils/enumUtils";
import mongoose from "mongoose";
import logger from "../../../../config/logger"

/**
 * Login with userName and password
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<User>} - The authenticated user
 */
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  // Fetch the user by email
  const user: any = await userService.getUserByEmail(email);

  // Check if user exists and password matches
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect User");
  }
  if (!(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  let outletsData;
  if (user?.userType === UserEnum.Employee) {
    outletsData = await userService.getUserAggrigate([
      { $match: { _id: new mongoose.Types.ObjectId(user._id) } },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employeeData",
          pipeline: [
            {
              $project: {
                outletsId: 1,
              },
            },
            {
              $lookup: {
                from: "outlets",
                localField: "outletsId",
                foreignField: "_id",
                as: "outletsData",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          outlets: {
            $arrayElemAt: ["$employeeData.outletsData", 0],
          },
        },
      },
    ]);
  }
  return { user, outletsData };
};

const loginUserWithBookingUserId = async (bookingUserId: string) => {
  // Fetch the user by email
  const user: any = await userService.getUserByBookingUserId(bookingUserId);

  // Check if user exists and password matches
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect User");
  }
  // if (!(await user.isPasswordMatch(password))) {
  //   throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  // }
  let outletsData;
  if (user?.userType === UserEnum.Employee) {
    outletsData = await userService.getUserAggrigate([
      { $match: { _id: new mongoose.Types.ObjectId(user._id) } },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employeeData",
          pipeline: [
            {
              $project: {
                outletsId: 1,
              },
            },
            {
              $lookup: {
                from: "outlets",
                localField: "outletsId",
                foreignField: "_id",
                as: "outletsData",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          outlets: {
            $arrayElemAt: ["$employeeData.outletsData", 0],
          },
        },
      },
    ]);
  }
  return { user, outletsData };
};

/**
 * Logout user by removing tokens from Redis
 * @param {string} userId - The ID of the user
 * @param {string} deviceId - The device ID
 * @param {boolean} logOutAll - Whether to logout from all devices
 * @returns {Promise<void>}
 */
const logout = async (userId: string, deviceId: string, logOutAll: boolean) => {
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  return await redisService.removeFromRedisByKey(userId, deviceId, logOutAll);
};

/**
 * Async function to provide authentication
 * @param {object} user - The user object
 * @param {string} deviceId - The device ID
 * @returns {Promise<object>} - The authentication response
 */
const authenticationProvider = async (
  user: object,
  deviceId: string,
  outletsData?: any
) => {
  try {
    // Deep copy of user object to prevent modification of original
    const userCopy = JSON.parse(JSON.stringify(user));

    // Generate authentication tokens
    const { accessToken, refreshToken } = await tokenService.generateAuthTokens(
      userCopy
    );
    // Construct token string for Redis storage
    const tokenString = `${accessToken}***${refreshToken}`;
    // Set and get tokens from Redis
    const { tokenSet, tokenGet } = await redisService.setAndGetToRedis(
      `${userCopy._id}${deviceId}`,
      tokenString
    );
    // Check if tokens were successfully set and retrieved
    if (tokenSet && tokenGet) {
      return {
        message: "Successful!",
        data: {
          user: {
            _id: userCopy._id,
            name: userCopy.name,
            email: userCopy.email,
            userType: userCopy.userType,
            userName: userCopy.userName,
          },
          outlets: outletsData ? outletsData?.outlets : [],
          access: accessToken,
          refresh: refreshToken,
        },
        status: true,
      };
    } else {
      // Throw an error if tokens could not be set or retrieved
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Could not set or retrieve the authentication tokens."
      );
    }
  } catch (err) {
    // Catch any errors during token generation, Redis operation, or JSON parsing
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "An error occurred while processing authentication."
    );
  }
};

/**
 * Refresh authentication tokens
 * @param {string} refreshToken - The refresh token
 * @param {string} deviceId - The device ID
 * @returns {Promise<object>} - The refreshed authentication response
 */
const refreshAuth = async (refreshToken: string, deviceId: string) => {
  try {
    // Verify the refresh token
    const refreshTokenDoc = (await tokenService.verifyToken(
      refreshToken,
      config.jwt_secret_refresh
    )) as { Id: string };

    const userId = refreshTokenDoc.Id;
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    // Fetch the user by ID
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
    }

    // Logout the user
    await logout(userId, deviceId, false);

    // Provide new authentication tokens
    let resposeData = await authenticationProvider(user, deviceId);
    return resposeData;
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Change the user's password
 * @param {string} deviceId - The device ID
 * @param {string} userId - The ID of the user
 * @param {string} password - The new password
 * @returns {Promise<object>} - The response data after changing the password
 */
const changePassword = async (
  deviceId: string,
  userId: string,
  password: string
) => {
  // Update the user's password
  const updated = await userService.updateUserById(userId, {
    password: password,
  });

  // Logout the user from all devices
  await logout(userId, deviceId, true);

  // Provide new authentication tokens
  let responseData = await authenticationProvider(updated, deviceId);
  return responseData;
};

/**
 * Extract the token from the request headers
 * @param {Request} req - The HTTP request
 * @returns {string} - The extracted token
 */
const fetchToken = (req: Request) => {
  if (!req.headers.authorization) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication Failed");
  }

  const authHeader = req.headers.authorization;
  if (!authHeader.startsWith("Bearer ")) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication Failed");
  }

  // Check Authorization header if token is not found in cookies
  const token = authHeader.split(" ")[1];
  return token;
};

/**
 * Extract the device ID from the request headers
 * @param {Request} req - The HTTP request
 * @returns {string} - The extracted device ID
 */
const fetchDeviceId = (req: Request) => {
  let deviceId = req.headers["device-id"]
    ? (req.headers["device-id"] as string)
    : "";

  if (!deviceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Device ID is required");
  }
  return deviceId;
};

/**
 * forgot password
 * @param {string} email - The email of the user
 * @returns {boolean} - The authenticated user
 */
const forgotPassword = async (email: string) => {
  // Fetch the user by email
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found.");
  }
  const userData = JSON.parse(JSON.stringify(user));
  const accessToken = await tokenService.generatePasswordResetToken(userData);
  let emailData = {
    emailSubject: "Reset Password Link",
    emailBody: accessToken,
    sendTo: email,
    sendFrom: config.smtp_mail_email,
    attachments: [],
  };

  const outletData = {};
  const sendEmailResult = await sendEmail(emailData, outletData);

  //create otp and store in respective database
  //send email
  //send sms

  return user;
};


export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyOTP = (
  storedOtp: string | undefined,
  storedExpiry: number | undefined,
  inputOtp: string
): boolean => {
  console.log('----storedOtp', storedOtp, storedExpiry, inputOtp)
  // Check if OTP exists
  if (!storedOtp || !storedExpiry) {
    return false;
  }

  // Check if OTP matches
  if (storedOtp !== inputOtp) {
    return false;
  }

  // Check if OTP is expired
  if (Date.now() > storedExpiry) {
    return false;
  }

  return true;
};


export const getOtpRemainingTime = (otpExpiry: number): number => {
  const remaining = Math.max(0, otpExpiry - Date.now());
  return Math.ceil(remaining / 60000); // Return in minutes
};


export const sendOTPEmail = async (
  email: string,
  otp: string,
  name: string = 'Customer',
  outlet: any = null
): Promise<boolean> => {
  try {
    // Simple HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: #006972;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .greeting strong {
            color: #006972;
          }
          .message {
            color: #666;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .otp-box {
            background: #f8f9fa;
            border: 2px dashed #006972;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #006972;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .otp-label {
            color: #999;
            font-size: 14px;
            margin-top: 5px;
          }
          .expiry {
            color: #856404;
            background: #fff3cd;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #eee;
          }
          .footer a {
            color: #006972;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
         
          <div class="content">
            <div class="greeting">
              Hello <strong>${name}</strong>!
            </div>
            <p class="message">
              You have requested to verify your email address. 
              Please use the OTP below to complete your verification.
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Your One-Time Password</div>
            </div>
            <div class="expiry">
              This OTP is valid for 10 minutes
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
      Verify Your Email - OTP Verification
      
      Hello ${name}!
      
      You have requested to verify your email address.
      Your OTP is: ${otp}
      
      This OTP is valid for 10 minutes.
      
      If you didn't request this, please ignore this email.
      
      © ${new Date().getFullYear()}. All rights reserved.
    `;

    // Email data
    const emailData = {
      sendTo: email,
      emailSubject: 'Your OTP for Email Verification',
      text: textContent,
      emailBody: htmlContent,
    };

    // Send email using existing sendEmail function
    const isEmailSent = await sendEmail(emailData, outlet);

    if (isEmailSent) {
      logger.info(`OTP sent successfully to ${email}`);
      return true;
    } else {
      logger.error(`Failed to send OTP to ${email}`);
      return false;
    }

  } catch (error) {
    logger.error('Error in sendOTPEmail:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send OTP email. Please try again.'
    );
  }
};

export {
  loginUserWithEmailAndPassword,
  refreshAuth,
  authenticationProvider,
  logout,
  changePassword,
  fetchToken,
  fetchDeviceId,
  forgotPassword,
  loginUserWithBookingUserId,
};
