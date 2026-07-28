import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    IconGift,
    IconFlame,
    IconStar,
    IconTicket,
    IconTag,
    IconLock,
    IconCrown,
    IconCalendar,
    IconCirclePlus,
    IconCircleMinus,
    IconRefresh,
    IconEye,
    IconEyeOff,
    IconCards,
    IconHistory,
    IconMail,
    IconX,
    IconCheck,
    IconLoader2,
    IconArrowRight,
    IconLogout,
    IconCoin,
    IconDiscount,
    IconBuildingStore,
    IconCopy,
} from '@tabler/icons-react';
import './LoyaltyPage.css';
import { useFetchData } from 'src/hooks/useFetchData';
import { useGetCustomerQuery } from 'src/modules/Customer/service/CustomerServices';
import { useGetCouponsByCustomerQuery, useGetLoyaltyHistoryQuery } from 'src/modules/Coupon/service/CouponServices';
import { useCheckEmailExistsMutation, useVerifyOtpMutation, useSendOtpMutation } from 'src/services/AuthServices';

interface Coupon {
    id: string;
    type: 'birthday' | 'promotion' | 'rewards' | 'giftcard' | 'coupon';
    title: string;
    code: string;
    description: string;
    expiryDate?: string;
    discount?: string;
    pointsRequired: number;
    serviceId?: string;

    // ✅ New fields
    rewardsPoint: number;
    isAvailable?: boolean;
    minimumSpend: number;
    maximumDiscount: number;
    rewardType?: string; // 'AMOUNT' | 'PERCENTAGE'
    rewardValue?: number;
    validDays?: string[]; // ['Monday', 'Tuesday', ...]
    startTime?: string; // '09:00'
    endTime?: string; // '18:00'
    validFrom?: string;
    validTill?: string;
    services?: string[]; // Service names
    branchCount?: number;
    couponType?: string; // 'REWARD' | 'PROMOTION' | 'GIFTCARD' | 'COUPON'
    usedBy?: string[];
    createdAt?: string;
    updatedAt?: string;
}

interface LoyaltyTransaction {
    id: string;
    date: string;
    description: string;
    couponCode: string;
    points: number;
    amountPaid: number;
    type: 'earned' | 'redeemed' | 'used';
}

interface CustomerData {
    id: string;
    name: string;
    email: string;
    totalPoints: number;
    cashback: number;
    usedCashback: number;
    joinDate: string;
    tier: string;
    rewards?: any[];
}

// ============= OTP INPUT COMPONENT =============
const OtpInput = ({
    value,
    onChange,
    onComplete
}: {
    value: string;
    onChange: (value: string) => void;
    onComplete: () => void;
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [otp, setOtp] = useState<string[]>(value.split('').concat(Array(6 - value.length).fill('')));

    const handleChange = (index: number, val: string) => {
        if (val.length > 1) return;
        if (!/^\d*$/.test(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);
        onChange(newOtp.join(''));

        // Move to next input
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit when all digits filled
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            onComplete();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
            onComplete();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d*$/.test(pastedData)) {
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = pastedData[i] || '';
            }
            setOtp(newOtp);
            onChange(newOtp.join(''));
            if (newOtp.every(digit => digit !== '')) {
                onComplete();
            }
        }
    };

    return (
        <div className="otp-container">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="otp-input"
                    autoFocus={index === 0}
                />
            ))}
        </div>
    );
};

// ============= EMAIL VERIFICATION WITH OTP =============
const EmailVerification = ({
    onVerified
}: {
    onVerified: (customerData: CustomerData) => void;
}) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [customerData, setCustomerData] = useState<any>(null);

    const [checkEmailExists] = useCheckEmailExistsMutation();
    const [sendOtp] = useSendOtpMutation();
    const [verifyOtp] = useVerifyOtpMutation();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Check if email exists
            const response = await checkEmailExists({ email }).unwrap();

            if (response.success && response.data) {
                setCustomerData(response.data);

                // Send OTP
                const otpResponse = await sendOtp({ email }).unwrap();

                if (otpResponse.success) {
                    setSuccess('OTP sent to your email! Please check your inbox.');
                    setShowOtpInput(true);
                    setEmailVerified(true);
                    setError('');
                } else {
                    setError(otpResponse.message || 'Failed to send OTP');
                }
            } else {
                setError('Email not found in our system. Please register first.');
            }
        } catch (err: any) {
            setError(err?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setError('Please enter complete 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await verifyOtp({ email, otp }).unwrap();

            if (response.success && response.data) {
                setSuccess('OTP verified successfully!');

                // Use customer data from email check
                const customer = customerData;

                setTimeout(() => {
                    onVerified({
                        id: customer?._id || '',
                        name: customer?.customerName || customer?.name || 'Valued Customer',
                        email: customer?.email || email,
                        totalPoints: customer?.loyaltyPoints || customer?.totalPoints || 0,
                        cashback: customer?.cashBackAmount || 0,
                        usedCashback: customer?.usedCashback || 0,
                        joinDate: customer?.joinDate || new Date().toISOString(),
                        tier: customer?.customerGroup || 'Silver Member',
                        rewards: customer?.rewards || [],
                    });
                }, 500);
            } else {
                setError(response.message || 'Invalid OTP. Please try again.');
            }
        } catch (err: any) {
            setError(err?.data?.message || 'OTP verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await sendOtp({ email }).unwrap();

            if (response.success) {
                setSuccess('New OTP sent to your email!');
                setOtp('');
            } else {
                setError(response.message || 'Failed to send OTP');
            }
        } catch (err: any) {
            setError(err?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="verification-container">
            <div className="verification-card">
                <div className="verification-header">
                    <IconMail size={48} className="email-icon" />
                    <h2>Verify Your Email</h2>
                    <p className="verification-subtitle">
                        {!showOtpInput
                            ? 'Enter your registered email to access your loyalty rewards'
                            : 'Enter the 6-digit OTP sent to your email'}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <IconX size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {/* <IconCheck size={10} /> */}
                        <span>{success}</span>
                    </div>
                )}

                {!showOtpInput ? (
                    <form onSubmit={handleSendOtp} className="verification-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                disabled={isLoading}
                                className="email-input"
                                autoFocus
                            />
                            <p className="field-hint">
                                We'll send a 6-digit OTP to verify your identity
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !email}
                        >
                            {isLoading ? (
                                <>
                                    <IconLoader2 size={20} className="spinning" />
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    <IconMail size={20} />
                                    Send OTP
                                    <IconArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="verification-form">
                        <div className="form-group">
                            <label>Enter 6-Digit OTP</label>
                            <OtpInput
                                value={otp}
                                onChange={setOtp}
                                onComplete={handleVerifyOtp}
                            />
                            <p className="field-hint">
                                OTP sent to <strong>{email}</strong>
                            </p>
                        </div>

                        <div className="otp-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleVerifyOtp}
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? (
                                    <>
                                        <IconLoader2 size={20} className="spinning" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <IconCheck size={20} />
                                        Verify OTP
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleResendOtp}
                                disabled={isLoading}
                            >
                                <IconRefresh size={16} />
                                Resend OTP
                            </button>

                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowOtpInput(false);
                                    setOtp('');
                                    setError('');
                                    setSuccess('');
                                }}
                            >
                                <IconArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                                Change Email
                            </button>
                        </div>
                    </div>
                )}

                {/* <div className="verification-footer">
                    <p className="footer-text">
                        By continuing, you agree to our
                        <a href="/terms">Terms of Service</a> and
                        <a href="/privacy">Privacy Policy</a>
                    </p>
                </div> */}
            </div>
        </div>
    );
};

// ============= MAIN LOYALTY PAGE =============
const LoyaltyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const customerId = searchParams.get('customerId');
    const [hoveredCoupon, setHoveredCoupon] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'coupons' | 'history'>('coupons');
    const [isVerified, setIsVerified] = useState(false);
    const [customerData, setCustomerData] = useState<CustomerData>({
        id: '',
        name: '',
        email: '',
        totalPoints: 0,
        cashback: 0,
        usedCashback: 0,
        joinDate: '',
        tier: 'Silver',
    });

    // ===== ALL HOOKS AT TOP LEVEL =====

    // Check session on load
    useEffect(() => {
        if (!customerId) {
            const saved = sessionStorage.getItem('loyaltyCustomer');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    setCustomerData(data);
                    setIsVerified(true);
                } catch (e) {
                    console.error('Failed to parse saved data');
                }
            }
        }
    }, [customerId]);

    // If customerId is in URL, use it directly
    useEffect(() => {
        if (customerId) {
            setIsVerified(true);
        }
    }, [customerId]);

    // Get the ID to fetch
    const fetchId = customerId || customerData.id;

    // ===== API HOOKS - Always called with proper params =====
    const {
        data: customerResponse,
        isLoading: customerLoading,
    } = useFetchData(useGetCustomerQuery, {
        body: fetchId,
        dataType: 'VIEW',
    });

    useEffect(() => {
        if (!customerId || customerLoading) return;

        const customer = (customerResponse as any)?.data;

        if (!customer) {
            sessionStorage.removeItem('loyaltyCustomer');
            navigate("/rewards/LoyaltyPage", { replace: true });
            setIsVerified(false)
        }
    }, [customerId, customerLoading, customerResponse, navigate]);

    const {
        data: rewardsResponse,
        isLoading: rewardsLoading,
    } = useFetchData(useGetCouponsByCustomerQuery, {
        body: fetchId,
        dataType: 'VIEW',
    });

    const {
        data: loyaltyHistoryResponse,
        isLoading: loyaltyHistoryLoading,
    } = useFetchData(useGetLoyaltyHistoryQuery, {
        body: fetchId,
        dataType: "VIEW",
    });

    const loyaltyHistory: LoyaltyTransaction[] =
        (loyaltyHistoryResponse as any)?.data ?? [];

    // Update customer data from API response
    useEffect(() => {
        if (customerResponse && (isVerified || customerId)) {
            const customer = (customerResponse as any)?.data;
            if (customer) {
                setCustomerData({
                    id: customer._id || customerId || '',
                    name: customer.customerName || customer.name || 'Valued Customer',
                    email: customer.email || 'customer@example.com',
                    totalPoints: customer.loyaltyPoints || customer.totalPoints || 0,
                    cashback: customer.cashBackAmount || 0,
                    usedCashback: customer.usedCashback || 0,
                    joinDate: customer.joinDate || new Date().toISOString(),
                    tier: customer.customerGroup || 'Silver Member',
                    rewards: customer.rewards || [],
                });
            }
        }
    }, [customerResponse, customerId, isVerified]);

    // All useMemo hooks at top level
    const allCoupons = useMemo<Coupon[]>(() => {
        return (rewardsResponse as any)?.data ?? [];
    }, [rewardsResponse]);

    const sortedCoupons = useMemo(() => {
        return [...allCoupons].sort((a, b) =>
            (a.pointsRequired || 0) - (b.pointsRequired || 0)
        );
    }, [allCoupons]);

    // ===== LOGOUT FUNCTION =====
    const handleLogout = () => {
        sessionStorage.removeItem('loyaltyCustomer');
        setCustomerData({
            id: '',
            name: '',
            email: '',
            totalPoints: 0,
            cashback: 0,
            usedCashback: 0,
            joinDate: '',
            tier: 'Silver',
        });
        setIsVerified(false);
        setActiveTab('coupons');
        window.location.reload();
    };

    // Handle verification
    const handleVerification = (data: CustomerData) => {
        setCustomerData(data);
        setIsVerified(true);
        sessionStorage.setItem('loyaltyCustomer', JSON.stringify(data));
    };

    // Helper functions
    const getCouponIcon = (type: string) => {
        switch (type) {
            case 'birthday': return <IconGift size={20} />;
            case 'promotion': return <IconFlame size={20} />;
            case 'rewards': return <IconStar size={20} />;
            case 'giftcard': return <IconCards size={20} />;
            case 'coupon': return <IconTag size={20} />;
            default: return <IconTicket size={20} />;
        }
    };

    const getCouponColor = (type: string) => {
        switch (type) {
            case 'birthday': return '#FF6B6B';
            case 'promotion': return '#FF9F43';
            case 'rewards': return '#FECA57';
            case 'giftcard': return '#48DBFB';
            case 'coupon': return '#A29BFE';
            default: return '#006972';
        }
    };

    const getPointsNeeded = (pointsRequired: number = 0) => {
        const needed = pointsRequired - customerData.totalPoints;
        return needed > 0 ? needed : 0;
    };

    const isCouponAvailable = (pointsRequired?: number) => {
        return (pointsRequired || 0) <= customerData.totalPoints;
    };

    // ===== CONDITIONAL RENDER (AFTER ALL HOOKS) =====
    if (!isVerified && !customerId) {
        return <EmailVerification onVerified={handleVerification} />;
    }

    // If loading and no data yet
    if ((customerLoading || rewardsLoading || loyaltyHistoryLoading) && !customerData.id) {
        return (
            <div className="verification-container">
                <div className="verification-card" style={{ textAlign: 'center' }}>
                    <IconLoader2 size={48} className="spinning" style={{ color: '#006972' }} />
                    <h2 style={{ marginTop: '16px', color: '#2d3436' }}>Loading...</h2>
                    <p style={{ color: '#636e72' }}>Please wait while we fetch your rewards</p>
                </div>
            </div>
        );
    }

    // ===== MAIN RENDER =====
    return (
        <div className="loyalty-container">
            {/* Header */}
            <div className="loyalty-header">
                <div className="header-top">
                    <div>
                        <h1>Loyalty Rewards</h1>
                        <p className="welcome-text">Welcome back, <strong>{customerData?.name?.toUpperCase()}</strong></p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="tier-badge">
                            <IconCrown size={20} />
                            {customerData?.tier?.toUpperCase()}
                        </div>
                        <button
                            className="logout-btn"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <IconLogout size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-icon"><IconStar size={24} /></span>
                        <div>
                            <div className="stat-value">{customerData?.totalPoints?.toFixed(2)}</div>
                            <div className="stat-label">Your Points</div>
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon"><IconTicket size={24} /></span>
                        <div>
                            <div className="stat-value">{allCoupons.filter(c => isCouponAvailable(c.pointsRequired)).length}</div>
                            <div className="stat-label">Available</div>
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon"><IconLock size={24} /></span>
                        <div>
                            <div className="stat-value">{allCoupons.filter(c => !isCouponAvailable(c.pointsRequired)).length}</div>
                            <div className="stat-label">Locked</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Points Progress */}
            {allCoupons.some(c => !isCouponAvailable(c.pointsRequired)) && (
                <div className="progress-section">
                    <h3> Points Progress</h3>
                    <div className="progress-grid">
                        {allCoupons
                            .filter(c => !isCouponAvailable(c.pointsRequired))
                            .slice(0, 3)
                            .map((coupon) => {
                                const progress = Math.min((customerData.totalPoints / (coupon.pointsRequired || 1)) * 100, 100);
                                const color = getCouponColor(coupon.type);

                                return (
                                    <div key={coupon.id} className="progress-card">
                                        <div className="progress-header">
                                            <span>{coupon.title}</span>
                                            <span>{customerData?.totalPoints?.toFixed(2)}/{coupon?.pointsRequired?.toFixed(2)} pts</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
                                        </div>
                                        <div className="progress-footer">
                                            <span>{Math.round(progress)}%</span>
                                            <span>{getPointsNeeded(coupon.pointsRequired)} more needed</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'coupons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coupons')}
                >
                    <IconTicket size={18} />
                    <span>All Coupons ({allCoupons.length})</span>
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <IconHistory size={18} />
                    <span>History</span>
                </button>
            </div>

            {/* Coupons */}
            {activeTab === 'coupons' && (
                <div className="coupons-section">
                    <div className="section-header">
                        <h3>All Coupons & Offers</h3>
                        <p className="section-subtitle">
                            <IconStar size={14} /> You have <strong>{customerData?.totalPoints?.toFixed(2)}</strong> points •
                            <span className="available-text"> {allCoupons.filter(c => isCouponAvailable(c.pointsRequired)).length} available</span>
                            <span className="locked-text"> • {allCoupons.filter(c => !isCouponAvailable(c.pointsRequired)).length} locked</span>
                        </p>
                    </div>

                    {allCoupons.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><IconTicket size={48} /></div>
                            <h3>No Coupons Available</h3>
                            <p>Check back later for new offers!</p>
                        </div>
                    ) : (
                        <div className="coupons-grid">
                            {sortedCoupons.map((coupon) => {
                                const isHovered = hoveredCoupon === coupon.id;
                                const color = getCouponColor(coupon.type);
                                const isFree = coupon.pointsRequired === 0;
                                const isAvailable = isCouponAvailable(coupon.pointsRequired);
                                const pointsNeeded = getPointsNeeded(coupon.pointsRequired || 0);
                                const progress = Math.min((customerData.totalPoints / (coupon.pointsRequired || 1)) * 100, 100);

                                return (
                                    <div
                                        key={coupon.id}
                                        className={`coupon-card ${!isAvailable ? 'locked' : ''} ${isHovered ? 'hovered' : ''}`}
                                        style={{
                                            borderColor: isAvailable ? color : '#e8ecf1',
                                            opacity: isAvailable ? 1 : 0.6,
                                            cursor: isAvailable ? 'default' : 'not-allowed',
                                        }}
                                        onMouseEnter={() => isAvailable && setHoveredCoupon(coupon.id)}
                                        onMouseLeave={() => setHoveredCoupon(null)}
                                    >
                                        {/* 🔥 Ribbon Badge */}
                                        {isAvailable && !isFree && (
                                            <div className="coupon-ribbon" style={{ background: color }}>
                                                {coupon.type?.toUpperCase()}
                                            </div>
                                        )}
                                        {isFree && (
                                            <div className="coupon-ribbon" style={{ background: '#00b894' }}>
                                                Free
                                            </div>
                                        )}
                                        {!isAvailable && (
                                            <div className="coupon-ribbon locked-ribbon">
                                                Locked
                                            </div>
                                        )}

                                        {/* Card Header with Gradient */}
                                        <div
                                            className="coupon-header"
                                            style={{
                                                background: isAvailable
                                                    ? `linear-gradient(135deg, ${color}, ${color}dd)`
                                                    : 'linear-gradient(135deg, #b2bec3, #dfe6e9)'
                                            }}
                                        >
                                            <div className="coupon-header-left">
                                                <span className="coupon-icon-wrapper">
                                                    {getCouponIcon(coupon.type)}
                                                </span>
                                                <div className="coupon-header-info">
                                                    <span className="coupon-type">{coupon.title?.toUpperCase()}</span>
                                                    {/* <span className="coupon-code-badge coupon-type">{coupon.code}</span> */}
                                                </div>
                                            </div>
                                            <div className="coupon-header-right">
                                                {coupon.pointsRequired !== undefined && coupon.pointsRequired > 0 && (
                                                    <span className="points-badge">
                                                        <IconStar size={12} />
                                                        {coupon.pointsRequired} pts
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="coupon-body">
                                            {/* <h4 className="coupon-title">{coupon.title}</h4>
                                            <p className="coupon-desc">{coupon.description}</p> */}

                                            {/* 🔥 Discount Badge */}
                                            {coupon.discount && (
                                                <div className="discount-badge" style={{ background: color }}>
                                                    {coupon.discount}
                                                </div>
                                            )}

                                            {/* 🔥 Coupon Details Grid */}
                                            <div className="coupon-details-grid">
                                                {coupon.rewardType && (
                                                    <div className="detail-chip">
                                                        <IconTag size={12} />
                                                        <span>
                                                            {coupon.rewardType === 'PERCENTAGE'
                                                                ? `${coupon.rewardValue}% OFF`
                                                                : `R${coupon.rewardValue} OFF`}
                                                        </span>
                                                    </div>
                                                )}
                                                {coupon.minimumSpend && coupon.minimumSpend > 0 && (
                                                    <div className="detail-chip">
                                                        <IconCoin size={12} />
                                                        <span>Min R{coupon.minimumSpend}</span>
                                                    </div>
                                                )}
                                                {coupon.maximumDiscount && coupon.maximumDiscount > 0 && (
                                                    <div className="detail-chip">
                                                        <IconDiscount size={12} />
                                                        <span>Max R{coupon.maximumDiscount}</span>
                                                    </div>
                                                )}
                                                {coupon.services && coupon.services.length > 0 && (
                                                    <div className="detail-chip">
                                                        <IconBuildingStore size={12} />
                                                        <span>{coupon.services.length} service(s)</span>
                                                    </div>
                                                )}
                                                {coupon.validDays && coupon.validDays.length > 0 && coupon.validDays.length < 7 && (
                                                    <div className="detail-chip">
                                                        <IconCalendar size={12} />
                                                        <span>{coupon.validDays.map(day => day.slice(0, 3)).join(', ')}</span>
                                                    </div>
                                                )}
                                                {coupon.validDays && coupon.validDays.length === 7 && (
                                                    <div className="detail-chip">
                                                        <IconCalendar size={12} />
                                                        <span>All Days</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 🔥 Points Progress */}
                                            {/* {!isFree && coupon.pointsRequired && coupon.pointsRequired > 0 && (
                                                <div className="points-progress">
                                                    <div className="points-progress-header">
                                                        <span>Progress</span>
                                                        <span>{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="points-progress-bar">
                                                        <div
                                                            className="points-progress-fill"
                                                            style={{
                                                                width: `${Math.min(progress, 100)}%`,
                                                                background: `linear-gradient(90deg, ${color}, ${color}dd)`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="points-progress-text">
                                                        <span>
                                                            <IconStar size={12} /> {customerData.totalPoints} pts
                                                        </span>
                                                        <span>
                                                            {isAvailable
                                                                ? '✅ Ready to redeem!'
                                                                : `${(coupon.pointsRequired - customerData.totalPoints)} more needed`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )} */}

                                            {/* 🔥 Lock Overlay */}
                                            {/* {!isAvailable && (
                                                <div className="lock-overlay">
                                                    <div className="lock-icon-wrapper">
                                                        <IconLock size={32} />
                                                    </div>
                                                    <span className="lock-text">Need {pointsNeeded} more points</span>
                                                    <div className="lock-progress">
                                                        <div
                                                            className="lock-progress-fill"
                                                            style={{
                                                                width: `${Math.min(progress, 100)}%`,
                                                                background: color
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="lock-progress-text">{Math.round(progress)}% complete</span>
                                                </div>
                                            )} */}

                                            {/* 🔥 Code Box */}
                                            <div className="code-box">
                                                <div className="code-box-header">
                                                    <div className="code-box-left">
                                                        <IconTag size={14} />
                                                        <span>Coupon Code</span>
                                                    </div>
                                                    <span className="code-hint">
                                                        {/* {isAvailable ? (
                                    isHovered ? (
                                        <span className="hint-visible">👁️ Visible</span>
                                    ) : (
                                        <span className="hint-hover">🔄 Hover to reveal</span>
                                    )
                                ) : (
                                    <span className="hint-locked">🔒 Locked</span>
                                )} */}
                                                    </span>
                                                </div>
                                                <div className="code-row">
                                                    <span className={`code ${isHovered && isAvailable ? 'show' : 'hide'}`}>
                                                        {isHovered && isAvailable ? coupon.code : '••••••••••'}
                                                    </span>
                                                    {isAvailable && (
                                                        <button
                                                            className="copy-btn"
                                                            onClick={() => {
                                                                if (isAvailable) {
                                                                    navigator.clipboard.writeText(coupon.code);
                                                                    // Show toast notification
                                                                }
                                                            }}
                                                            title="Copy code"
                                                        >
                                                            <IconCopy size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 🔥 Footer */}
                                            {/* Footer */}
                                            <div className="coupon-footer">
                                                <div className="footer-left">
                                                    <div className="tags">
                                                        {coupon.discount && (
                                                            <span className="tag discount" style={{ background: isAvailable ? color : '#b2bec3' }}>
                                                                {coupon.discount}
                                                            </span>
                                                        )}
                                                        {isFree && <span className="tag free">🎉 Free</span>}
                                                        {!isAvailable && (
                                                            <span className="tag needed">
                                                                Need {pointsNeeded} points more
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* 🔥 All Details - Left Side */}
                                                 <div className="footer-details">
    {/* Minimum Spend */}
    {coupon?.minimumSpend > 0 && (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>Minimum Spend: <strong>R {coupon.minimumSpend}</strong></span>
        </div>
    )}

    {/* Discount */}
    {coupon?.rewardType === "PERCENTAGE" ? (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>
                <strong>{coupon.rewardValue}% OFF</strong>
                {coupon?.maximumDiscount > 0 &&
                    ` (Max Discount: R ${coupon.maximumDiscount})`}
            </span>
        </div>
    ) : (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>Discount: <strong>R {coupon.rewardValue}</strong></span>
        </div>
    )}

    {/* Reward Points */}
    {coupon.couponType === "REWARD" && coupon.rewardsPoint > 0 && (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>Requires <strong>{coupon.rewardsPoint}</strong> Loyalty Points</span>
        </div>
    )}

    {/* Gift Card */}
    {coupon.couponType === "GIFTCARD" && (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>Gift Card Value: <strong>R {coupon.rewardValue}</strong></span>
        </div>
    )}

    {/* 🔥 Services - Applicable Services */}
    {coupon.services && coupon.services.length > 0 && (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>
                Applicable Services: <strong>{coupon.services.join(', ')}</strong>
            </span>
        </div>
    )}

   {coupon?.pointsRequired > 0 && (
  <div className="detail-line">
    <span className="bullet">•</span>
    <span>
      Required Points: <strong>{coupon.pointsRequired}</strong>
    </span>
  </div>
)}

    {/* Valid Till */}
    {coupon.validTill && (
        <div className="detail-line">
            <span className="bullet">•</span>
            <span>
                Valid Till: <strong>
                    {new Date(coupon.validTill).toLocaleDateString("en-ZA", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                </strong>
            </span>
        </div>
    )}
</div>
                                                </div>

                                                <div className="footer-right">
                                                    {/* Points & Expiry */}
                                                    <div className="footer-info-group">
                                                        {/* {coupon.pointsRequired !== undefined && coupon.pointsRequired > 0 && (
                                                            <div className={`points-info ${isAvailable ? 'available' : 'locked'}`}>
                                                                <IconStar size={12} />
                                                                <span className="points-text">{coupon.pointsRequired} pts</span>
                                                                {isAvailable ? (
                                                                    <span className="points-status available">✓</span>
                                                                ) : (
                                                                    <span className="points-status locked">🔒</span>
                                                                )}
                                                            </div>
                                                        )} */}

                                                        {/* {coupon.pointsRequired !== undefined && coupon.pointsRequired > 0 && coupon.expiryDate && (
                                                            <span className="info-separator">•</span>
                                                        )} */}

                                                        {/* {coupon.expiryDate && (
                <div className="expiry">
                    <IconCalendar size={12} />
                    <span>
                        {new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </span>
                </div>
            )} */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* History */}
           {activeTab === 'history' && (
    <div className="history-section">
        {/* History Stats */}
        <div className="history-stats">
            <div className="history-stat">
                <span>Total Earned</span>
                <span className="positive">
                    +{loyaltyHistory
                        .filter(t => t.type === 'earned')
                        .reduce((sum, t) => sum + (t.points || 0), 0)
                        ?.toFixed(0)}
                </span>
            </div>
            <div className="history-stat">
                <span>Total Redeemed</span>
                <span className="negative">
                    {loyaltyHistory
                        .filter(t => t.type === 'redeemed')
                        .reduce((sum, t) => sum + (t.points || 0), 0)
                        ?.toFixed(0)}
                </span>
            </div>
            <div className="history-stat">
                <span>Total Used</span>
                <span className="negative">
                    {loyaltyHistory
                        .filter(t => t.type === 'used')
                        .reduce((sum, t) => sum + (t.points || 0), 0)
                        ?.toFixed(0)}
                </span>
            </div>
            <div className="history-stat">
                <span>Balance</span>
                <span className="positive">{customerData?.totalPoints?.toFixed(0) || 0}</span>
            </div>
        </div>

        {/* History List */}
        <div className="history-list">
            {loyaltyHistory.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <IconHistory size={48} />
                    </div>
                    <h3>No History Yet</h3>
                    <p>Start earning points to see your history here.</p>
                </div>
            ) : (
                loyaltyHistory.map((item) => {
                    const isPositive = item.type === 'earned';
                    const isRedeemed = item.type === 'redeemed';
                    const isUsed = item.type === 'used';
                    
                    // Get icon based on type
                    const getIcon = () => {
                        if (isPositive) return <IconCirclePlus size={18} />;
                        if (isRedeemed) return <IconRefresh size={18} />;
                        if (isUsed) return <IconCircleMinus size={18} />;
                        return <IconCirclePlus size={18} />;
                    };
                    
                    // Get status label
                    const getStatusLabel = () => {
                        if (isPositive) return 'Earned';
                        if (isRedeemed) return 'Redeemed';
                        if (isUsed) return 'Used';
                        return '';
                    };
                    
                    // Get status color
                    const getStatusColor = () => {
                        if (isPositive) return '#00B894';
                        if (isRedeemed) return '#F59E0B';
                        if (isUsed) return '#EF4444';
                        return '#636E72';
                    };
                    
                    return (
                        <div key={item.id} className="history-item">
                            <div 
                                className="history-icon" 
                                style={{ background: getStatusColor() }}
                            >
                                {getIcon()}
                            </div>
                            
                            <div className="history-info">
                                <div className="history-description">
                                    {item.description || getStatusLabel()}
                                    <span 
                                        className="history-status"
                                        style={{ 
                                            background: getStatusColor() + '20',
                                            color: getStatusColor()
                                        }}
                                    >
                                        {/* {getStatusLabel()} */}
                                    </span>
                                </div>
                                <div className="history-date">
                                    <IconCalendar size={14} /> 
                                    {item.date ? new Date(item.date).toLocaleDateString('en-IN', { 
                                        day: '2-digit', 
                                        month: 'short', 
                                        year: 'numeric' 
                                    }) : 'N/A'}
                                </div>
                            </div>
                            
                            <div className="history-right">
                                {item.points !== undefined && item.points !== 0 && (
                                    <div className={`history-points ${isPositive ? 'positive' : 'negative'}`}>
                                        {isPositive ? '+' : ''}{item.points} pts
                                    </div>
                                )}
                                
                                {item.amountPaid > 0 && (
                                    <div className="history-amount">
                                        R {item.amountPaid.toFixed(2)}
                                    </div>
                                )}
                                
                                {item.couponCode && (
                                    <div className="history-coupon-code">
                                        Code: {item.couponCode}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
)}
        </div>
    );
};

export default LoyaltyPage;