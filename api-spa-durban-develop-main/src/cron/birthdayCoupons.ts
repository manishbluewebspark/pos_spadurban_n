// ============================================
// birthdayCouponCron.ts - COMPLETE FIXED VERSION
// ============================================

import cron from 'node-cron';
import { sendEmail } from '../../src/helper/sendEmail';
import RewardsCoupon, { RewardsCouponDocument } from '../apis/v1/rewardscoupon/schema.rewardscoupon';
import Customer from '../../src/apis/v1/customer/schema.customer';
import mongoose from 'mongoose';

// ============================================
// CONFIGURATION
// ============================================

const BIRTHDAY_CONFIG = {
    DAYS_BEFORE_BIRTHDAY: 14,
    REMINDER_AFTER_DAYS: 30,
    EXPIRY_REMINDER_DAYS: 14,
    COUPON_VALIDITY_MONTHS: 3,
    DISCOUNT_PERCENTAGE: 25,
    BATCH_SIZE: 100,
    MAX_RETRIES: 3,
};

// ============================================
// LOGGER
// ============================================

const logger = {
    info: (message: string, data?: any) => {
        console.log(`[${new Date().toISOString()}] [INFO] ${message}`, data || '');
    },
    error: (message: string, error?: any) => {
        console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, error || '');
    },
    warn: (message: string, data?: any) => {
        console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, data || '');
    },
    success: (message: string, data?: any) => {
        console.log(`[${new Date().toISOString()}] [SUCCESS] ✅ ${message}`, data || '');
    },
};

// ============================================
// MAIN CRON JOB
// ============================================

export const startBirthdayCouponCron = () => {
    cron.schedule('1 0 * * *', async () => {
        logger.info('Birthday Coupon Cron: Started');
        try {
            await processBirthdayCoupons();
            logger.success('Birthday Coupon Cron: Completed successfully');
        } catch (error) {
            logger.error('Birthday Coupon Cron: Failed', error);
        }
    });
    logger.info('Birthday Coupon Cron: Scheduled (daily at 12:01 AM)');
};

// ============================================
// MAIN PROCESSOR
// ============================================

const processBirthdayCoupons = async () => {
    const today = new Date();
    const targetDate = getTargetDate(today);

    logger.info(`Processing birthday coupons for date: ${targetDate.toDateString()}`);

    try {
        await processTodayBirthdayCoupons();
        await processUpcomingBirthdayCoupons(targetDate);
        await processReminders();
        await processExpiryReminders();
        logger.info('All birthday coupon processes completed');
    } catch (error) {
        logger.error('Error in processBirthdayCoupons', error);
        throw error;
    }
};

// ============================================
// STEP 1: TODAY'S BIRTHDAY COUPONS
// ============================================

const processTodayBirthdayCoupons = async () => {
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    logger.info(`Checking today's birthday: Day ${todayDay}, Month ${todayMonth}`);

    try {
        const customers = await getCustomersByBirthday(todayDay, todayMonth);

        if (customers.length === 0) {
            logger.info('No customers with birthday today');
            return;
        }

        logger.info(`Found ${customers.length} customers with birthday today`);

        for (const customer of customers) {
            await processCustomerBirthdayToday(customer);
        }
    } catch (error) {
        logger.error('Error processing today\'s birthday coupons', error);
    }
};

// ============================================
// STEP 2: UPCOMING BIRTHDAY COUPONS (14 days before)
// ============================================

const processUpcomingBirthdayCoupons = async (targetDate: Date) => {
    const targetDay = targetDate.getDate();
    const targetMonth = targetDate.getMonth() + 1;

    logger.info(`Checking upcoming birthday (14 days): Day ${targetDay}, Month ${targetMonth}`);

    try {
        const customers = await getCustomersByBirthday(targetDay, targetMonth);

        if (customers.length === 0) {
            logger.info('No customers with upcoming birthday in 14 days');
            return;
        }

        logger.info(`Found ${customers.length} customers with upcoming birthday in 14 days`);

        for (const customer of customers) {
            await processCustomerBirthdayUpcoming(customer);
        }
    } catch (error) {
        logger.error('Error processing upcoming birthday coupons', error);
    }
};

// ============================================
// 🔥 FIXED: GET CUSTOMERS BY BIRTHDAY - No duplicate properties
// ============================================

const getCustomersByBirthday = async (day: number, month: number): Promise<any[]> => {
    try {
        // 🔥 Use $nin with array instead of multiple $ne
        // const customers = await Customer.find({
        //     isDeleted: false,
        //     isActive: true,
        //     email: { $nin: [null, ''] },
        //     dateOfBirth: {
        //         $nin: [null, '', '0', '00/00/0000', 'Invalid Date']
        //     }
        // });

        const customers = await Customer.find({
            _id: {
                $in: [
                    new mongoose.Types.ObjectId("6a0c22d765b2f744892635bb"),
                    new mongoose.Types.ObjectId("67c6b282e9ff880e680ec0bf"),
                ],
            },

            isDeleted: false,
            isActive: true,
            email: { $nin: [null, ''] },
            dateOfBirth: {
                $nin: [null, '', '0', '00/00/0000', 'Invalid Date']
            }
        });

        // Filter customers by birthday
        const filteredCustomers = customers.filter((customer: any) => {
            try {
                let dob: Date | null = null;

                if (customer.dateOfBirth instanceof Date) {
                    dob = customer.dateOfBirth;
                } else if (typeof customer.dateOfBirth === 'string') {
                    const parsed = new Date(customer.dateOfBirth);
                    if (!isNaN(parsed.getTime()) && customer.dateOfBirth !== '0') {
                        dob = parsed;
                    }
                }

                if (!dob) return false;

                const birthDay = dob.getDate();
                const birthMonth = dob.getMonth() + 1;

                return birthDay === day && birthMonth === month;

            } catch (error) {
                logger.warn(`Error parsing date for customer ${customer._id}: ${customer.dateOfBirth}`);
                return false;
            }
        });

        logger.info(`Found ${filteredCustomers.length} customers with birthday ${day}/${month}`);

        return filteredCustomers.map((customer: any) => ({
            _id: customer._id,
            customerName: customer.customerName,
            email: customer.email,
            dateOfBirth: customer.dateOfBirth,
            phone: customer.phone,
        }));

    } catch (error) {
        logger.error('Error fetching customers by birthday', error);
        return [];
    }
};

// ============================================
// PROCESS CUSTOMER BIRTHDAY - TODAY
// ============================================

const processCustomerBirthdayToday = async (customer: any) => {
    const customerId = customer._id.toString();
    const customerEmail = customer.email;
    const customerName = customer.customerName || 'Customer';

    if (!customerEmail) {
        logger.warn(`No email for customer ${customerId}`);
        return;
    }

    logger.info(`🎉 Processing today's birthday: ${customerName} (${customerId})`);

    try {
        const existingCoupon = await getExistingBirthdayCoupon(customerId);

        if (existingCoupon) {
            logger.info(`Coupon already exists for ${customerId}`);
            return;
        }

        const coupon = await createBirthdayCouponForCustomer(customer, 'TODAY');

        if (!coupon) {
            logger.error(`Failed to create coupon for ${customerId}`);
            return;
        }

        await sendBirthdayTodayEmail({
            customerName,
            email: customerEmail,
            couponCode: coupon.couponCode,
            validTill: coupon.validTill,
        });

        coupon.initialEmailSent = true;
        coupon.initialEmailSentAt = new Date();
        coupon.communicationLogs.push({
            event: 'INITIAL',
            sentAt: new Date(),
            status: 'SUCCESS',
        });
        await coupon.save();

        logger.success(`✅ Birthday coupon sent to ${customerEmail} (Today)`);

    } catch (error) {
        logger.error(`Error processing customer ${customerId}`, error);
    }
};

// ============================================
// PROCESS CUSTOMER BIRTHDAY - UPCOMING
// ============================================

const processCustomerBirthdayUpcoming = async (customer: any) => {
    const customerId = customer._id.toString();
    const customerEmail = customer.email;
    const customerName = customer.customerName || 'Customer';

    if (!customerEmail) {
        logger.warn(`No email for customer ${customerId}`);
        return;
    }

    logger.info(`📅 Processing upcoming birthday (14 days): ${customerName} (${customerId})`);

    try {
        const existingCoupon = await getExistingBirthdayCoupon(customerId);

        if (existingCoupon) {
            logger.info(`Coupon already exists for ${customerId}`);
            return;
        }

        const coupon = await createBirthdayCouponForCustomer(customer, 'UPCOMING');

        if (!coupon) {
            logger.error(`Failed to create coupon for ${customerId}`);
            return;
        }

        await sendBirthdayEarlyEmail({
            customerName,
            email: customerEmail,
            couponCode: coupon.couponCode,
            validTill: coupon.validTill,
        });

        coupon.initialEmailSent = true;
        coupon.initialEmailSentAt = new Date();
        coupon.communicationLogs.push({
            event: 'INITIAL',
            sentAt: new Date(),
            status: 'SUCCESS',
        });
        await coupon.save();

        logger.success(`✅ Early birthday coupon sent to ${customerEmail} (14 days before)`);

    } catch (error) {
        logger.error(`Error processing customer ${customerId}`, error);
    }
};

// ============================================
// CREATE BIRTHDAY COUPON
// ============================================

const createBirthdayCouponForCustomer = async (customer: any, type: 'TODAY' | 'UPCOMING') => {
    const customerId = customer._id.toString();
    const customerName = customer.customerName || 'Customer';

    try {
        const couponCode = generateCouponCode(customerId);
        const validTill = getCouponValidityDate();
        const issuedAt = new Date();

        const couponData = {
            couponType: 'NORMAL',
            rewardName: `Birthday Special - ${customerName}`,
            rewardsPoint: 0,
            rewardType: 'PERCENTAGE',
            rewardValue: BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE,
            minimumSpend: 0,
            maximumDiscount: 0,
            couponCode: couponCode,
            branchId: [],
            serviceId: [],
            validDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            startTime: '00:00',
            endTime: '23:59',
            validFrom: issuedAt,
            validTill: validTill,
            description: `Birthday coupon - ${BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE}% off. Valid for 3 months.`,
            isActive: true,
            isDeleted: false,
            status: 'active',
            usedBy: [],
            customerId: new mongoose.Types.ObjectId(customerId),
            birthdayType: type,
            initialEmailSent: false,
            initialEmailSentAt: null,
            thirtyDayReminderSent: false,
            thirtyDayReminderSentAt: null,
            expiryReminderSent: false,
            expiryReminderSentAt: null,
            redeemedAt: null,
            communicationLogs: [],
        };

        const coupon = await RewardsCoupon.create(couponData);
        logger.info(`Coupon created: ${couponCode} for ${customerName}`);
        return coupon;

    } catch (error) {
        logger.error(`Error creating coupon for ${customerId}`, error);
        return null;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTargetDate = (today: Date): Date => {
    const target = new Date(today);
    target.setDate(today.getDate() + BIRTHDAY_CONFIG.DAYS_BEFORE_BIRTHDAY);
    return target;
};

const getExistingBirthdayCoupon = async (customerId: string): Promise<RewardsCouponDocument | null> => {
    try {
        return await RewardsCoupon.findOne({
            couponType: 'NORMAL',
            couponCode: { $regex: /^BDAY-/ },
            isDeleted: false,
            isActive: true,
            validTill: { $gte: new Date() },
            customerId: new mongoose.Types.ObjectId(customerId),
        });
    } catch (error) {
        logger.error('Error checking existing coupon', error);
        return null;
    }
};

const generateCouponCode = (customerId: string): string => {
    const shortId = customerId.slice(-5);
    const timestamp = Date.now().toString().slice(-6);
    return `BDAY-${shortId}-${timestamp}`;
};

const getCouponValidityDate = (): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() + BIRTHDAY_CONFIG.COUPON_VALIDITY_MONTHS);
    return date;
};

// ============================================
// EMAIL TEMPLATES
// ============================================

const sendBirthdayTodayEmail = async (data: {
    customerName: string;
    email: string;
    couponCode: string;
    validTill: Date;
}) => {
    try {
        const emailData = {
            sendTo: data.email,
            emailSubject: `🎉 Happy Birthday! ${BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE}% Off Just for You`,
            emailBody: getBirthdayEmailHTML(data, 'TODAY'),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);
        logger.info(`Today's birthday email sent to ${data.email}`);
    } catch (error) {
        logger.error(`Failed to send today's birthday email to ${data.email}`, error);
    }
};

const sendBirthdayEarlyEmail = async (data: {
    customerName: string;
    email: string;
    couponCode: string;
    validTill: Date;
}) => {
    try {
        const emailData = {
            sendTo: data.email,
            emailSubject: `🎉 Happy Early Birthday! ${BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE}% Off Just for You`,
            emailBody: getBirthdayEmailHTML(data, 'UPCOMING'),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);
        logger.info(`Early birthday email sent to ${data.email}`);
    } catch (error) {
        logger.error(`Failed to send early birthday email to ${data.email}`, error);
    }
};

const getBirthdayEmailHTML = (data: {
    customerName: string;
    couponCode: string;
    validTill: Date;
}, type: 'TODAY' | 'UPCOMING') => {
    const title = type === 'TODAY' ? 'Happy Birthday!' : 'Happy Early Birthday!';
    const subtitle = type === 'TODAY' ? 'Today is your special day!' : 'Your birthday is coming up!';
    const message = type === 'TODAY'
        ? 'Wishing you a very happy birthday! 🎂🎉'
        : 'Your birthday is just around the corner, and we\'ve got a special gift for you! 🎁';

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #006972, #004d54); border-radius: 10px 10px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 ${title}</h1>
                <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">${subtitle}</p>
            </div>
            
            <div style="padding: 30px 20px;">
                <p style="font-size: 18px; color: #2d3436;">Dear <strong>${data.customerName}</strong>,</p>
                <p style="font-size: 16px; color: #636e72; line-height: 1.6;">${message}</p>
                <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                    Enjoy <strong style="color: #006972;">${BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE}% off</strong> on your next visit with this exclusive birthday coupon.
                </p>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #006972;">
                    <p style="font-size: 14px; color: #636e72; margin: 0;">Your Coupon Code</p>
                    <p style="font-size: 32px; font-weight: bold; color: #006972; letter-spacing: 4px; margin: 10px 0; font-family: monospace;">
                        ${data.couponCode}
                    </p>
                    <p style="font-size: 12px; color: #999; margin: 0;">
                        Valid until: <strong>${data.validTill.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </p>
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.FRONTEND_URL}/rewards/LoyaltyPage" 
                       style="display: inline-block; padding: 12px 40px; background: #006972; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Claim Your Gift
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #e8ecf1; font-size: 12px; color: #999;">
                <p>© ${new Date().getFullYear()} Spa Durban. All rights reserved.</p>
                <p style="font-size: 11px; color: #bbb; margin-top: 4px;">This is an automated email. Please do not reply.</p>
            </div>
        </div>
    `;
};

// ============================================
// STEP 3: REMINDERS FOR UNREDEEMED COUPONS
// ============================================

const processReminders = async () => {
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() - BIRTHDAY_CONFIG.REMINDER_AFTER_DAYS);

    logger.info(`Checking 30-day reminders for coupons created before ${reminderDate.toDateString()}`);

    try {
        const unredeemedCoupons = await RewardsCoupon.find({
            couponType: 'NORMAL',
            couponCode: { $regex: /^BDAY-/ },
            isDeleted: false,
            isActive: true,
            initialEmailSent: true,
            thirtyDayReminderSent: false,
            usedBy: { $size: 0 },
            validTill: { $gte: today },
            createdAt: { $lte: reminderDate },
        }).populate('customerId', 'customerName email');

        if (unredeemedCoupons.length === 0) {
            logger.info('No coupons needing 30-day reminder');
            return;
        }

        logger.info(`Found ${unredeemedCoupons.length} coupons needing 30-day reminder`);

        for (const coupon of unredeemedCoupons) {
            const customer = coupon.customerId as any;

            if (!customer || !customer.email) {
                logger.warn(`No customer found for coupon ${coupon.couponCode}`);
                continue;
            }

            await sendRedeemReminderEmail(coupon, customer);

            coupon.thirtyDayReminderSent = true;
            coupon.thirtyDayReminderSentAt = new Date();
            coupon.communicationLogs.push({
                event: 'REMINDER_30_DAYS',
                sentAt: new Date(),
                status: 'SUCCESS',
            });
            await coupon.save();

            logger.info(`30-day reminder sent to ${customer.email}`);
        }
    } catch (error) {
        logger.error('Error processing 30-day reminders', error);
    }
};

// ============================================
// STEP 4: EXPIRY REMINDERS
// ============================================

const processExpiryReminders = async () => {
    const today = new Date();
    const expiryReminderDate = new Date(today);
    expiryReminderDate.setDate(today.getDate() + BIRTHDAY_CONFIG.EXPIRY_REMINDER_DAYS);

    logger.info(`Checking expiry reminders for coupons expiring on ${expiryReminderDate.toDateString()}`);

    try {
        const expiringCoupons = await RewardsCoupon.find({
            couponType: 'NORMAL',
            couponCode: { $regex: /^BDAY-/ },
            isDeleted: false,
            isActive: true,
            usedBy: { $size: 0 },
            expiryReminderSent: false,
            validTill: {
                $gte: today,
                $lte: expiryReminderDate,
            },
        }).populate('customerId', 'customerName email');

        if (expiringCoupons.length === 0) {
            logger.info('No coupons needing expiry reminder');
            return;
        }

        logger.info(`Found ${expiringCoupons.length} coupons needing expiry reminder`);

        for (const coupon of expiringCoupons) {
            const customer = coupon.customerId as any;

            if (!customer || !customer.email) {
                logger.warn(`No customer found for coupon ${coupon.couponCode}`);
                continue;
            }

            await sendExpiryReminderEmail(coupon, customer);

            coupon.expiryReminderSent = true;
            coupon.expiryReminderSentAt = new Date();
            coupon.communicationLogs.push({
                event: 'EXPIRY_REMINDER',
                sentAt: new Date(),
                status: 'SUCCESS',
            });
            await coupon.save();

            logger.info(`Expiry reminder sent to ${customer.email}`);
        }
    } catch (error) {
        logger.error('Error processing expiry reminders', error);
    }
};

// ============================================
// REMINDER EMAILS
// ============================================

const sendRedeemReminderEmail = async (coupon: RewardsCouponDocument, customer: any) => {
    try {
        const emailData = {
            sendTo: customer.email,
            emailSubject: `⏰ Don't Forget! Your Birthday Coupon is Waiting`,
            emailBody: getReminderEmailHTML(coupon, customer, 'REDEEM'),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);
    } catch (error) {
        logger.error(`Failed to send redeem reminder to ${customer.email}`, error);
    }
};

const sendExpiryReminderEmail = async (coupon: RewardsCouponDocument, customer: any) => {
    const daysLeft = Math.ceil((new Date(coupon.validTill).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    try {
        const emailData = {
            sendTo: customer.email,
            emailSubject: `⚠️ Your Birthday Coupon Expires in ${daysLeft} Days!`,
            emailBody: getReminderEmailHTML(coupon, customer, 'EXPIRY', daysLeft),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);
    } catch (error) {
        logger.error(`Failed to send expiry reminder to ${customer.email}`, error);
    }
};

const getReminderEmailHTML = (
    coupon: RewardsCouponDocument,
    customer: any,
    type: 'REDEEM' | 'EXPIRY',
    daysLeft?: number
) => {
    const days = daysLeft || 0;

    if (type === 'REDEEM') {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #fdcb6e, #f39c12); border-radius: 10px 10px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Don't Forget!</h1>
                    <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">Your birthday coupon is waiting</p>
                </div>
                
                <div style="padding: 30px 20px;">
                    <p style="font-size: 18px; color: #2d3436;">Dear <strong>${customer.customerName || 'Customer'}</strong>,</p>
                    <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                        We noticed you haven't redeemed your birthday coupon yet! 🎁
                    </p>
                    <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                        Your coupon for <strong style="color: #f39c12;">${BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE}% off</strong> is still waiting for you.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #f39c12;">
                        <p style="font-size: 14px; color: #636e72; margin: 0;">Your Coupon Code</p>
                        <p style="font-size: 32px; font-weight: bold; color: #f39c12; letter-spacing: 4px; margin: 10px 0; font-family: monospace;">
                            ${coupon.couponCode}
                        </p>
                        <p style="font-size: 12px; color: #999; margin: 0;">
                            Valid until: <strong>${new Date(coupon.validTill).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #e17055; text-align: center;">
                        ⚠️ Hurry! This coupon expires soon.
                    </p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL}/rewards/LoyaltyPage" 
                           style="display: inline-block; padding: 12px 40px; background: #f39c12; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Redeem Now
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 20px; border-top: 1px solid #e8ecf1; font-size: 12px; color: #999;">
                    <p>© ${new Date().getFullYear()} Spa Durban. All rights reserved.</p>
                </div>
            </div>
        `;
    } else {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #e17055, #d63031); border-radius: 10px 10px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Last Chance!</h1>
                    <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">Your coupon expires soon</p>
                </div>
                
                <div style="padding: 30px 20px;">
                    <p style="font-size: 18px; color: #2d3436;">Dear <strong>${customer.customerName || 'Customer'}</strong>,</p>
                    <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                        Your birthday coupon is about to expire! ⏰
                    </p>
                    <p style="font-size: 16px; color: #e17055; font-weight: bold;">
                        Only ${days} day${days > 1 ? 's' : ''} left to use your ${BIRTHDAY_CONFIG.DISCOUNT_PERCENTAGE}% off coupon!
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fef3f2; border-radius: 10px; border: 2px solid #e17055;">
                        <p style="font-size: 14px; color: #636e72; margin: 0;">Your Coupon Code</p>
                        <p style="font-size: 32px; font-weight: bold; color: #e17055; letter-spacing: 4px; margin: 10px 0; font-family: monospace;">
                            ${coupon.couponCode}
                        </p>
                        <p style="font-size: 12px; color: #999; margin: 0;">
                            Expires: <strong>${new Date(coupon.validTill).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL}/rewards/LoyaltyPage" 
                           style="display: inline-block; padding: 12px 40px; background: #e17055; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Use Your Coupon Now!
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #636e72; text-align: center;">
                        Don't miss out on your birthday treat! 🎂
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; border-top: 1px solid #e8ecf1; font-size: 12px; color: #999;">
                    <p>© ${new Date().getFullYear()} Spa Durban. All rights reserved.</p>
                </div>
            </div>
        `;
    }
};

// ============================================
// MANUAL TEST FUNCTION
// ============================================

export const runBirthdayCouponNow = async () => {
    logger.info('🔥 Running birthday coupon cron manually...');
    await processBirthdayCoupons();
    logger.success('✅ Manual run completed');
};

// ============================================
// EXPORT
// ============================================

export default startBirthdayCouponCron;