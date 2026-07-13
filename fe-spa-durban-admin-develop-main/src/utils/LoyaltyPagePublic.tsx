// src/pages/LoyaltyPage.tsx - Updated Coupons Section

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    IconGift,
    IconFlame,
    IconStar,
    IconTicket,
    IconTag,
    IconReceiptTax,
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
    IconCurrencyRupee,
    IconLockOpen,
    IconCurrency,
} from '@tabler/icons-react';
import './LoyaltyPage.css';
import { useFetchData } from 'src/hooks/useFetchData';
import { useGetCustomerQuery } from 'src/modules/Customer/service/CustomerServices';
import { useGetCouponsByCustomerQuery, useGetLoyaltyHistoryQuery } from 'src/modules/Coupon/service/CouponServices';

interface Coupon {
    id: string;
    type: 'birthday' | 'promotion' | 'rewards' | 'giftcard' | 'coupon';
    title: string;
    code: string;
    description: string;
    expiryDate?: string;
    discount?: string;
    pointsRequired?: number;
    serviceId?: string;
}

interface LoyaltyTransaction {
    id: string;
    date: string;
    description: string;
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

const LoyaltyPage = () => {
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('customerId');
    const [hoveredCoupon, setHoveredCoupon] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'coupons' | 'history'>('coupons');
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


    const {
        data: customerResponse,
        isLoading: customerLoading
    } = useFetchData(useGetCustomerQuery, {
        body: customerId,
        dataType: 'VIEW',
    });

    const {
        data: rewardsResponse,
        isLoading: rewardsLoading,
    } = useFetchData(useGetCouponsByCustomerQuery, {
        body: customerId,
        dataType: 'VIEW',
    });

    const {
        data: loyaltyHistoryResponse,
        isLoading: loyaltyHistoryLoading,
    } = useFetchData(useGetLoyaltyHistoryQuery, {
        body: customerId,
        dataType: "VIEW",
    });

    const loyaltyHistory: LoyaltyTransaction[] =
        (loyaltyHistoryResponse as any)?.data ?? [];

    useEffect(() => {
        if (customerResponse) {
            const customer = (customerResponse as any)?.data;
            if (customer) {
                setCustomerData({
                    id: customer.id || customerId || 'CUST001',
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
    }, [customerResponse, customerId]);
    // Dummy Coupons Data
    const allCoupons = useMemo<Coupon[]>(() => {
        return (rewardsResponse as any)?.data ?? [];
    }, [rewardsResponse]);

    // Sort coupons by points required (lowest to highest)
    const sortedCoupons = [...allCoupons].sort((a, b) =>
        (a.pointsRequired || 0) - (b.pointsRequired || 0)
    );



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

    return (
        <div className="loyalty-container">
            {/* Header */}
            <div className="loyalty-header">
                <div className="header-top">
                    <div>
                        <h1>Loyalty Rewards</h1>
                        <p className="welcome-text">Welcome back, <strong>{customerData?.name?.toUpperCase()}</strong></p>
                    </div>
                    <div className="tier-badge">
                        <IconCrown size={20} />
                        {customerData?.tier?.toUpperCase()}
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-icon"><IconStar size={24} /></span>
                        <div>
                            <div className="stat-value">{customerData?.totalPoints}</div>
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
                    <div className="stat-item">
                        <span className="stat-icon" style={{ fontWeight: 'bold' }}>R</span>
                        <div>
                            <div className="stat-value">{customerData.cashback}</div>
                            <div className="stat-label">Cashback</div>
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
                                            <span>{customerData.totalPoints}/{coupon.pointsRequired} pts</span>
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

            {/* Coupons - All in one grid with grayed out locked ones */}
            {activeTab === 'coupons' && (
                <div className="coupons-section">
                    <div className="section-header">
                        <h3>All Coupons & Offers</h3>
                        <p className="section-subtitle">
                            <IconStar size={14} /> You have <strong>{customerData.totalPoints}</strong> points •
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

                                return (
                                    <div
                                        key={coupon.id}
                                        className={`coupon-card ${!isAvailable ? 'locked' : ''}`}
                                        style={{
                                            borderColor: isAvailable ? color : '#e8ecf1',
                                            opacity: isAvailable ? 1 : 0.6,
                                            cursor: isAvailable ? 'default' : 'not-allowed'
                                        }}
                                        onMouseEnter={() => isAvailable && setHoveredCoupon(coupon.id)}
                                        onMouseLeave={() => setHoveredCoupon(null)}
                                    >
                                        <div className="coupon-header" style={{ background: isAvailable ? color : '#b2bec3' }}>
                                            <span className="coupon-icon-wrapper">{getCouponIcon(coupon.type)}</span>
                                            <span className="coupon-type">{coupon.type}</span>
                                            {isFree && <span className="free-tag">FREE</span>}
                                            {!isAvailable && (
                                                <span className="locked-tag">
                                                    <IconLock size={12} /> Locked
                                                </span>
                                            )}
                                            {isAvailable && !isFree && (
                                                <span className="available-tag">✓ Available</span>
                                            )}
                                        </div>

                                        <div className="coupon-content">
                                            <h4 className="coupon-title">{coupon.title}</h4>
                                            <p className="coupon-desc">{coupon.description}</p>

                                            {/* Show lock overlay if not available */}
                                            {!isAvailable && (
                                                <div className="lock-overlay">
                                                    <IconLock size={32} />
                                                    <span>Need {pointsNeeded} more points</span>
                                                </div>
                                            )}

                                            <div className="code-box" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                                                <span className="code-label">
                                                    <IconTag size={14} />
                                                    <span>Coupon Code</span>
                                                </span>
                                                <div className="code-row">
                                                    <span className={`code ${isHovered && isAvailable ? 'show' : 'hide'}`}>
                                                        {isHovered && isAvailable ? coupon.code : '••••••••••'}
                                                    </span>
                                                    <span className="hint">
                                                        {isAvailable ? (
                                                            isHovered ? (
                                                                <><IconEye size={14} /><span>Visible</span></>
                                                            ) : (
                                                                <><IconEyeOff size={14} /><span>Hover</span></>
                                                            )
                                                        ) : (
                                                            <><IconLock size={12} /><span>Locked</span></>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="coupon-footer">
                                                <div className="tags">
                                                    {coupon.discount && (
                                                        <span className="tag discount" style={{ background: isAvailable ? color : '#b2bec3' }}>
                                                            {coupon.discount}
                                                        </span>
                                                    )}
                                                    {coupon.pointsRequired !== undefined && coupon.pointsRequired > 0 && (
                                                        <span className={`tag points ${!isAvailable ? 'locked-tag' : ''}`}>
                                                            <IconStar size={12} />
                                                            <span>{coupon.pointsRequired} pts</span>
                                                        </span>
                                                    )}
                                                    {isFree && <span className="tag free">🎉 Free</span>}
                                                    {!isAvailable && (
                                                        <span className="tag needed">
                                                            Need {pointsNeeded} more
                                                        </span>
                                                    )}
                                                </div>
                                                {coupon.expiryDate && (
                                                    <div className="expiry" style={{ opacity: isAvailable ? 1 : 0.5 }}>
                                                        <IconCalendar size={12} />
                                                        <span>{new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                )}
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
                    <div className="history-stats">
                        <div className="history-stat">
                            <span>Total Earned</span>
                            <span className="positive">+{loyaltyHistory.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.points, 0)}</span>
                        </div>
                        <div className="history-stat">
                            <span>Total Redeemed</span>
                            <span className="negative">{loyaltyHistory.filter(t => t.type === 'redeemed').reduce((sum, t) => sum + t.points, 0)}</span>
                        </div>
                        <div className="history-stat">
                            <span>Total Used</span>
                            <span className="negative">{loyaltyHistory.filter(t => t.type === 'used').reduce((sum, t) => sum + t.points, 0)}</span>
                        </div>
                        <div className="history-stat">
                            <span>Balance</span>
                            <span className="positive">{customerData.totalPoints}</span>
                        </div>
                    </div>

                    <div className="history-list">
                        {loyaltyHistory.map((item) => {
                            const isPositive = item.type === 'earned';
                            const colors = { earned: '#00B894', redeemed: '#FDCB6E', used: '#E17055' };

                            return (
                                <div key={item.id} className="history-item">
                                    <div className="history-icon" style={{ background: colors[item.type] }}>
                                        {item.type === 'earned' ? <IconCirclePlus size={16} /> :
                                            item.type === 'redeemed' ? <IconRefresh size={16} /> :
                                                <IconCircleMinus size={16} />}
                                    </div>
                                    <div className="history-info">
                                        <div>{item.description}</div>
                                        <div className="history-date">
                                            <IconCalendar size={12} /> {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="history-right">
                                        <div className={`history-points ${isPositive ? 'positive' : 'negative'}`}>
                                            {isPositive ? '+' : ''}
                                            {item.points} pts
                                        </div>

                                        {item.amountPaid > 0 && (
                                            <div className="history-amount">
                                                Spent R{item.amountPaid}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


        </div>
    );
};

export default LoyaltyPage;