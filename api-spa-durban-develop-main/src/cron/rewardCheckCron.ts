// ============================================
// rewardCheckCron.ts - COMPLETE FIXED VERSION
// ============================================

import { sendEmail } from "../helper/sendEmail";
import Customer from "../apis/v1/customer/schema.customer";
import RewardsCoupon from "../apis/v1/rewardscoupon/schema.rewardscoupon";
import Service from "../apis/v1/service/schema.service";
import mongoose from "mongoose";
import cron from 'node-cron';

// ============================================
// CONFIGURATION
// ============================================

const REWARD_CONFIG = {
    // Points thresholds
    MIN_POINTS_FOR_REWARD: 3000,
    FREE_MASSAGE_POINTS: 20000,

    // Coupon validity
    COUPON_VALIDITY_MONTHS: 3,

    // Reminder settings
    REMINDER_AFTER_DAYS: 30,
    EXPIRY_REMINDER_DAYS: 14,

    // Batch processing
    BATCH_SIZE: 100,
    MAX_RETRIES: 3,
};

// ============================================
// CONSTANTS
// ============================================

const FULL_BODY_MASSAGE_SERVICE_ID = new mongoose.Types.ObjectId("67c5c5b888910b9e3e672d0f");

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

export const runRewardCheck = () => {
    // Run daily at 12:01 AM
    cron.schedule("1 0 * * *", async () => {
        logger.info('Reward Check Cron: Started');
        try {
            await processRewards();
            logger.success('Reward Check Cron: Completed successfully');
        } catch (error) {
            logger.error('Reward Check Cron: Failed', error);
        }
    });
    logger.info('Reward Check Cron: Scheduled (daily at 12:01 AM)');
};

// ============================================
// MAIN PROCESSOR
// ============================================

const processRewards = async () => {
    try {
        // Step 1: Generate new rewards for eligible customers
        await generateRewardCoupons();

        // Step 2: Send 30-day reminders for unused coupons
        await processThirtyDayReminders();

        // Step 3: Send expiry reminders
        await processExpiryReminders();

        logger.info('All reward processes completed');
    } catch (error) {
        logger.error('Error in processRewards', error);
        throw error;
    }
};

// ============================================
// STEP 1: GENERATE REWARD COUPONS
// ============================================

const generateRewardCoupons = async () => {
    try {
        // Get all active reward templates (master rewards without customerId)
        const rewardTemplates = await RewardsCoupon.find({
            isActive: true,
            isDeleted: false,
            customerId: { $exists: false },
        });

        if (rewardTemplates.length === 0) {
            logger.info('No reward templates found');
            return;
        }

        logger.info(`Found ${rewardTemplates.length} reward templates`);

        // Get customers with sufficient points
        const customers = await Customer.find({
            isDeleted: false,
            isActive: true,
            email: { $nin: [null, ''] },
            loyaltyPoints: { $gte: REWARD_CONFIG.FREE_MASSAGE_POINTS },
        });

        if (customers.length === 0) {
            logger.info('No customers with sufficient points');
            return;
        }

        logger.info(`Processing ${customers.length} customers with sufficient points`);

        for (const customer of customers) {
            await generateCustomerRewards(customer, rewardTemplates);
        }

    } catch (error) {
        logger.error('Error generating reward coupons', error);
    }
};

// ============================================
// GENERATE CUSTOMER REWARDS
// ============================================

const generateCustomerRewards = async (customer: any, rewardTemplates: any[]) => {
    const customerId = customer._id;
    const customerEmail = customer.email;
    const customerName = customer.customerName || 'Customer';
    const loyaltyPoints = customer.loyaltyPoints || 0;

    try {
        // Filter eligible rewards based on customer points
        const eligibleRewards = rewardTemplates.filter(
            (reward) => loyaltyPoints >= reward.rewardsPoint
        );

        if (eligibleRewards.length === 0) {
            return;
        }

        logger.info(`Customer ${customerName} eligible for ${eligibleRewards.length} rewards`);

        const generatedRewards = [];

        for (const template of eligibleRewards) {
            // Check if reward already exists for this customer
            let customerReward = await RewardsCoupon.findOne({
                customerId: customerId,
                rewardName: template.rewardName,
                couponType: "REWARD",
                isDeleted: false,
                isActive: true,
                validTill: { $gte: new Date() }, // Still valid
            });

            // If reward doesn't exist, create it
            if (!customerReward) {
                customerReward = await createCustomerReward(customer, template);
                if (customerReward) {
                    generatedRewards.push(customerReward);
                }
            }
        }

        // Send email if new rewards were generated
        if (generatedRewards.length > 0) {
            await sendRewardEmail(customer, generatedRewards);
            logger.success(`✅ Reward email sent to ${customerEmail} (${generatedRewards.length} rewards)`);
        }

    } catch (error) {
        logger.error(`Error generating rewards for customer ${customerId}`, error);
    }
};

// ============================================
// CREATE CUSTOMER REWARD
// ============================================

const createCustomerReward = async (customer: any, template: any) => {
    try {
        const validTill = new Date();
        validTill.setMonth(validTill.getMonth() + REWARD_CONFIG.COUPON_VALIDITY_MONTHS);

        // 🔥 Special handling for Full Body Massage (20,000 points)
        let serviceId = template.serviceId || [];
        let rewardName = template.rewardName;
        let description = template.description;

        // If customer has 20,000+ points, add Full Body Massage
        if (customer.loyaltyPoints >= REWARD_CONFIG.FREE_MASSAGE_POINTS) {
            // Check if Full Body Massage is not already in serviceId
            const hasMassage = serviceId.some((id: any) =>
                id.toString() === FULL_BODY_MASSAGE_SERVICE_ID.toString()
            );

            if (!hasMassage) {
                serviceId.push(FULL_BODY_MASSAGE_SERVICE_ID);
                rewardName = `${template.rewardName} + Full Body Massage`;
                description = `${template.description} Includes a complimentary Full Body Massage.`;
                logger.info(`🎯 Added Full Body Massage for customer ${customer.customerName} (20,000+ points)`);
            }
        }

        const couponData = {
            couponType: "REWARD",
            customerId: customer._id,
            rewardName: rewardName,
            rewardsPoint: template.rewardsPoint,
            rewardType: template.rewardType || 'PERCENTAGE',
            rewardValue: template.rewardValue || 0,
            minimumSpend: template.minimumSpend || 0,
            maximumDiscount: template.maximumDiscount || 0,
            giftCardAmount: template.giftCardAmount || 0,
            balanceAmount: template.balanceAmount || 0,
            promotionCategory: template.promotionCategory || '',
            couponCode: generateRewardCouponCode(),
            branchId: template.branchId || [],
            serviceId: serviceId,
            validDays: template.validDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            startTime: template.startTime || '00:00',
            endTime: template.endTime || '23:59',
            validFrom: new Date(),
            validTill: validTill,
            description: description || template.description || '',
            status: "active",
            isActive: true,
            isDeleted: false,
            usedBy: [],
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
        logger.info(`Coupon created: ${coupon.couponCode} for ${customer.customerName}`);
        return coupon;

    } catch (error) {
        logger.error(`Error creating reward for customer ${customer._id}`, error);
        return null;
    }
};

// ============================================
// STEP 2: 30-DAY REMINDER FOR UNUSED COUPONS
// ============================================

const processThirtyDayReminders = async () => {
    const today = new Date();

    // Calculate date 30 days ago
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() - REWARD_CONFIG.REMINDER_AFTER_DAYS);

    // Start and end of that day
    const startOfDay = new Date(reminderDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reminderDate);
    endOfDay.setHours(23, 59, 59, 999);

    logger.info(`Checking 30-day reminders for rewards created on ${reminderDate.toDateString()}`);

    try {
        // Find unused coupons created exactly 30 days ago
        const unusedCoupons = await RewardsCoupon.find({
            couponType: "REWARD",
            isDeleted: false,
            isActive: true,
            customerId: { $exists: true, $ne: null },
            usedBy: { $size: 0 }, // Not used
            thirtyDayReminderSent: false,
            validTill: { $gte: today }, // Still valid
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('customerId', 'customerName email phone loyaltyPoints');

        if (unusedCoupons.length === 0) {
            logger.info('No coupons needing 30-day reminder');
            return;
        }

        logger.info(`Found ${unusedCoupons.length} coupons needing 30-day reminder`);

        for (const coupon of unusedCoupons) {
            const customer = coupon.customerId as any;

            if (!customer || !customer.email) {
                logger.warn(`No customer found for coupon ${coupon.couponCode}`);
                continue;
            }

            // Send 30-day reminder
            await sendThirtyDayReminderEmail(coupon, customer);

            // Update coupon
            coupon.thirtyDayReminderSent = true;
            coupon.thirtyDayReminderSentAt = new Date();
            coupon.communicationLogs = coupon.communicationLogs || [];
            coupon.communicationLogs.push({
                event: 'REMINDER_30_DAYS',
                sentAt: new Date(),
                status: 'SUCCESS',
            });
            await coupon.save();

            logger.info(`✅ 30-day reminder sent to ${customer.email} for coupon ${coupon.couponCode}`);
        }

    } catch (error) {
        logger.error('Error processing 30-day reminders', error);
    }
};

// ============================================
// STEP 3: EXPIRY REMINDERS (14 days before expiry)
// ============================================

const processExpiryReminders = async () => {
    const today = new Date();
    const expiryReminderDate = new Date(today);
    expiryReminderDate.setDate(today.getDate() + REWARD_CONFIG.EXPIRY_REMINDER_DAYS);

    logger.info(`Checking expiry reminders for coupons expiring on or before ${expiryReminderDate.toDateString()}`);

    try {
        const expiringCoupons = await RewardsCoupon.find({
            couponType: "REWARD",
            isDeleted: false,
            isActive: true,
            customerId: { $exists: true, $ne: null },
            usedBy: { $size: 0 }, // Not used
            expiryReminderSent: false,
            validTill: {
                $gte: today, // Still valid
                $lte: expiryReminderDate, // Expiring within 14 days
            },
        }).populate('customerId', 'customerName email phone loyaltyPoints');

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

            // Send expiry reminder
            await sendExpiryReminderEmail(coupon, customer);

            // Update coupon
            coupon.expiryReminderSent = true;
            coupon.expiryReminderSentAt = new Date();
            coupon.communicationLogs = coupon.communicationLogs || [];
            coupon.communicationLogs.push({
                event: 'EXPIRY_REMINDER',
                sentAt: new Date(),
                status: 'SUCCESS',
            });
            await coupon.save();

            logger.info(`Expiry reminder sent to ${customer.email} for coupon ${coupon.couponCode}`);
        }

    } catch (error) {
        logger.error('Error processing expiry reminders', error);
    }
};

// ============================================
// EMAIL FUNCTIONS
// ============================================

const sendRewardEmail = async (customer: any, rewards: any[]) => {
    try {
        let rewardHTML = '';

        for (const reward of rewards) {
            // Get services for this reward
            const services = await Service.find({
                _id: { $in: reward.serviceId },
            });

            const serviceList = services.length > 0
                ? services.map((s: any) => `<li>${s.serviceName}</li>`).join('')
                : '<li>All services</li>';

            // Check if this is a Full Body Massage reward
            const isMassage = reward.serviceId.some((id: any) =>
                id.toString() === FULL_BODY_MASSAGE_SERVICE_ID.toString()
            );

            const specialBadge = isMassage ? '🎯 FREE FULL BODY MASSAGE INCLUDED!' : '';

            rewardHTML += `
                <div style="padding: 15px; border: 1px solid #ddd; margin-bottom: 15px; border-radius: 8px; background: ${isMassage ? '#f0f8ff' : '#f9f9f9'};">
                    <h3 style="color: #2E8B57; margin: 0 0 10px 0;">${reward.rewardName}</h3>
                    ${specialBadge ? `<p style="color: #e17055; font-weight: bold; margin: 5px 0;">${specialBadge}</p>` : ''}
                    <p><b>Required Points:</b> ${reward.rewardsPoint}</p>
                    <p><b>Coupon Code:</b></p>
                    <h2 style="color: #2E8B57; letter-spacing: 2px;">${reward.couponCode}</h2>
                    <p><b>Valid Till:</b> ${new Date(reward.validTill).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p><b>Services:</b></p>
                    <ul>${serviceList}</ul>
                    ${reward.description ? `<p><b>Description:</b> ${reward.description}</p>` : ''}
                </div>
            `;
        }

        const emailData = {
            sendTo: customer.email,
            emailSubject: "🎉 Your Spa Rewards are Ready!",
            emailBody: getRewardEmailHTML(customer, rewardHTML),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);

    } catch (error) {
        logger.error(`Failed to send reward email to ${customer.email}`, error);
    }
};

const sendThirtyDayReminderEmail = async (coupon: any, customer: any) => {
    try {
        const emailData = {
            sendTo: customer.email,
            emailSubject: "⏰ Don't Forget! Your Reward Coupon is Waiting",
            emailBody: getReminderEmailHTML(coupon, customer, 'REDEEM'),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);

    } catch (error) {
        logger.error(`Failed to send 30-day reminder to ${customer.email}`, error);
    }
};

const sendExpiryReminderEmail = async (coupon: any, customer: any) => {
    const daysLeft = Math.ceil((new Date(coupon.validTill).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    try {
        const emailData = {
            sendTo: customer.email,
            emailSubject: `⚠️ Your Reward Coupon Expires in ${daysLeft} Days!`,
            emailBody: getReminderEmailHTML(coupon, customer, 'EXPIRY', daysLeft),
        };

        const outlet = {};
        await sendEmail(emailData, outlet);

    } catch (error) {
        logger.error(`Failed to send expiry reminder to ${customer.email}`, error);
    }
};

// ============================================
// EMAIL HTML TEMPLATES
// ============================================

const getRewardEmailHTML = (customer: any, rewardHTML: string) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #006972, #004d54); border-radius: 10px 10px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
                <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">Your rewards are ready to claim</p>
            </div>
            
            <div style="padding: 30px 20px;">
                <p style="font-size: 18px; color: #2d3436;">Dear <strong>${customer.customerName || 'Customer'}</strong>,</p>
                <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                    You currently have <b style="color: #006972;">${customer.loyaltyPoints || 0}</b> loyalty points.
                </p>
                <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                    You can now redeem these rewards:
                </p>
                
                ${rewardHTML}
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.FRONTEND_URL}/rewards/LoyaltyPage" 
                       style="display: inline-block; padding: 12px 40px; background: #006972; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        View All Rewards
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">
                    ⚠️ All coupons are valid for ${REWARD_CONFIG.COUPON_VALIDITY_MONTHS} months from the date of issue.
                </p>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #e8ecf1; font-size: 12px; color: #999;">
                <p>© ${new Date().getFullYear()} Spa Durban. All rights reserved.</p>
                <p style="font-size: 11px; color: #bbb; margin-top: 4px;">This is an automated email. Please do not reply.</p>
            </div>
        </div>
    `;
};

const getReminderEmailHTML = (coupon: any, customer: any, type: 'REDEEM' | 'EXPIRY', daysLeft?: number) => {
    const days = daysLeft || 0;
    const customerName = customer.customerName || 'Customer';
    const couponCode = coupon.couponCode;
    const validTill = new Date(coupon.validTill).toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Check if this is a Full Body Massage coupon
    const isMassage = coupon.serviceId && coupon.serviceId.some((id: any) =>
        id.toString() === FULL_BODY_MASSAGE_SERVICE_ID.toString()
    );
    const massageBadge = isMassage ? '🎯 Includes FREE Full Body Massage! ' : '';

    if (type === 'REDEEM') {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #fdcb6e, #f39c12); border-radius: 10px 10px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Don't Forget!</h1>
                    <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">Your reward coupon is waiting</p>
                </div>
                
                <div style="padding: 30px 20px;">
                    <p style="font-size: 18px; color: #2d3436;">Dear <strong>${customerName}</strong>,</p>
                    <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                        It's been 30 days since we sent you your reward coupon, and we noticed you haven't redeemed it yet! 🎁
                    </p>
                    <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                        ${massageBadge}Your coupon for <strong style="color: #f39c12;">${coupon.rewardName}</strong> is still waiting for you.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #f39c12;">
                        <p style="font-size: 14px; color: #636e72; margin: 0;">Your Coupon Code</p>
                        <p style="font-size: 32px; font-weight: bold; color: #f39c12; letter-spacing: 4px; margin: 10px 0; font-family: monospace;">
                            ${couponCode}
                        </p>
                        <p style="font-size: 12px; color: #999; margin: 0;">
                            Valid until: <strong>${validTill}</strong>
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #e17055; text-align: center;">
                        ⚠️ Don't miss out! This coupon expires on ${validTill}.
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
                    <p style="color: #ffffff; opacity: 0.9; margin: 5px 0 0;">Your reward coupon expires soon</p>
                </div>
                
                <div style="padding: 30px 20px;">
                    <p style="font-size: 18px; color: #2d3436;">Dear <strong>${customerName}</strong>,</p>
                    <p style="font-size: 16px; color: #636e72; line-height: 1.6;">
                        Your reward coupon is about to expire! ⏰
                    </p>
                    <p style="font-size: 16px; color: #e17055; font-weight: bold;">
                        Only ${days} day${days > 1 ? 's' : ''} left to use your ${coupon.rewardName} coupon!
                    </p>
                    <p style="font-size: 14px; color: #636e72;">
                        ${massageBadge}
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fef3f2; border-radius: 10px; border: 2px solid #e17055;">
                        <p style="font-size: 14px; color: #636e72; margin: 0;">Your Coupon Code</p>
                        <p style="font-size: 32px; font-weight: bold; color: #e17055; letter-spacing: 4px; margin: 10px 0; font-family: monospace;">
                            ${couponCode}
                        </p>
                        <p style="font-size: 12px; color: #999; margin: 0;">
                            Expires: <strong>${validTill}</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${process.env.FRONTEND_URL}/rewards/LoyaltyPage" 
                           style="display: inline-block; padding: 12px 40px; background: #e17055; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Use Your Coupon Now!
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #636e72; text-align: center;">
                        Don't miss out on your reward! 🎁
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
// HELPER FUNCTIONS
// ============================================

const generateRewardCouponCode = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `RW-${timestamp}-${random}`;
};

// ============================================
// MANUAL TEST FUNCTION
// ============================================

export const runRewardCheckNow = async () => {
    logger.info('🔥 Running reward check manually...');
    await processRewards();
    logger.success('✅ Manual run completed');
};

// ============================================
// EXPORT
// ============================================

export default runRewardCheck;