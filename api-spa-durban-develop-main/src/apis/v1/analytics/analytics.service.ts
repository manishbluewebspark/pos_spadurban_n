// ============================================
// analytics.service.ts - COMPLETE CODE
// ============================================

import { format, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import Invoice from '../invoice/schema.invoice';
import Outlet from '../outlet/schema.outlet';
import User from '../user/schema.user';
import Customer from '../customer/schema.customer';
import Register from '../register/schema.register';
import CustomerGroup from '../customerGroup/schema.customerGroup';
import PromotionCoupon from '../promotioncoupon/schema.promotioncoupon';
import PaymentMode from '../paymentMode/schema.paymentMode';

// ============================================
// INTERFACES
// ============================================

interface ComparisonData {
  currentPeriod: any[];
  previousPeriod: any[];
  comparison: {
    revenueChange: number;
    salesChange: number;
    profitChange: number;
    marginChange: number;
    percentageChange: number;
    revenuePrevious: number;
    salesPrevious: number;
    profitPrevious: number;
    marginPrevious: number;
  };
}

// ============================================
// MAIN FUNCTION - SIMPLE VERSION WITH 3 PARAMETERS
// ============================================


// ============================================
// DATE AND QUERY FUNCTIONS
// ============================================

export const buildDateQuery = (reportDuration: string, startDate: string, endDate: string) => {
  const query: any = { isDeleted: false, isActive: true };

  switch (reportDuration) {
    case 'DAILY':
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        const today = new Date();
        query.createdAt = {
          $gte: startOfDay(today),
          $lte: endOfDay(today)
        };
      }
      break;

    case 'WEEKLY':
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        query.createdAt = {
          $gte: weekStart,
          $lte: weekEnd
        };
      }
      break;

    case 'MONTHLY':
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        const today = new Date();
        query.createdAt = {
          $gte: startOfMonth(today),
          $lte: endOfMonth(today)
        };
      }
      break;

    case 'YEARLY':
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        const today = new Date();
        query.createdAt = {
          $gte: startOfYear(today),
          $lte: endOfYear(today)
        };
      }
      break;

    case 'CUSTOM':
    default:
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      break;
  }

  return query;
};

export const getPreviousPeriodDates = (
  comparison: string,
  startDate: string,
  endDate: string,
  reportDuration: string
): { startDate: string; endDate: string } => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();

  switch (comparison) {
    case 'SAME_DATE_PREVIOUS_YEAR':
      return {
        startDate: formatDate(subYears(start, 1)),
        endDate: formatDate(subYears(end, 1))
      };

    case 'SAME_PERIOD_PREVIOUS_YEAR':
      return {
        startDate: formatDate(subYears(start, 1)),
        endDate: formatDate(subYears(end, 1))
      };

    default:
      return { startDate, endDate };
  }
};

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

export const fetchSalesData = async (query: any) => {
  try {
    const invoices = await Invoice.find(query)
      .populate('outletId', 'name address phone email city region')
      .populate('customerId', 'customerName email phone loyaltyPoints cashBackAmount')
      .populate('employeeId', 'name email phone')
      .populate('registerId', 'name openingBalance isOpened isClosed')
      .populate('customerGroupId', 'customerGroupName')
      .populate('promotionId', 'couponCode discountByPercentage startDate endDate')
      .lean();

    return invoices.map((invoice: any) => {
      let costOfGoodsSold = 0;
      if (invoice.items && invoice.items.length > 0) {
        costOfGoodsSold = invoice.items.reduce((sum: number, item: any) => {
          const costPrice = item.costPrice || item.sellingPrice * 0.6;
          return sum + (costPrice * (item.quantity || 1));
        }, 0);
      }

      let totalTax = 0;
      if (invoice.taxes && invoice.taxes.length > 0) {
        totalTax = invoice.taxes.reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0);
      }

      const payments = invoice.amountReceived || [];
      const paymentModes = payments.map((payment: any) => ({
        paymentModeName: payment.paymentModeId?.modeName || 'Unknown',
        totalAmount: payment.amount || 0
      }));

      return {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceDate: invoice.invoiceDate || invoice.createdAt,
        createdAt: invoice.createdAt,

        customerId: invoice.customerId?._id || invoice.customerId,
        customerName: invoice.customerId?.customerName || 'Walk-in Customer',
        customerEmail: invoice.customerId?.email || '',
        customerPhone: invoice.customerId?.phone || '',
        loyaltyPoints: invoice.customerId?.loyaltyPoints || 0,
        cashBackAmount: invoice.customerId?.cashBackAmount || 0,

        outletId: invoice.outletId?._id || invoice.outletId,
        outletName: invoice.outletId?.name || 'Unknown Outlet',
        outletAddress: invoice.outletId?.address || '',
        outletPhone: invoice.outletId?.phone || '',
        outletEmail: invoice.outletId?.email || '',
        outletCity: invoice.outletId?.city || '',
        outletRegion: invoice.outletId?.region || '',

        userId: invoice.employeeId?._id || invoice.employeeId,
        userName: invoice.employeeId?.name || 'Unknown User',
        userEmail: invoice.employeeId?.email || '',
        userPhone: invoice.employeeId?.phone || '',

        registerId: invoice.registerId?._id || invoice.registerId,
        registerName: invoice.registerId?.name || 'Unknown Register',
        registerOpeningBalance: invoice.registerId?.openingBalance || 0,

        customerGroupId: invoice.customerGroupId?._id || invoice.customerGroupId,
        customerGroupName: invoice.customerGroupId?.customerGroupName || 'Unknown Group',

        promotionId: invoice.promotionId?._id || invoice.promotionId,
        promotionName: invoice.promotionId?.couponCode || 'No Promotion',
        promotionDiscount: invoice.promotionId?.discountByPercentage || 0,

        items: invoice.items || [],
        totalItems: invoice.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
        itemCount: invoice.items?.length || 0,

        totalAmount: invoice.totalAmount || 0,
        amountPaid: invoice.amountPaid || 0,
        balanceDue: invoice.balanceDue || 0,
        totalDiscount: invoice.totalDiscount || 0,
        cashBackDiscount: invoice.cashBackDiscount || 0,
        couponDiscount: invoice.couponDiscount || 0,
        giftCardDiscount: invoice.giftCardDiscount || 0,
        loyaltyPointsDiscount: invoice.loyaltyPointsDiscount || 0,
        referralDiscount: invoice.referralDiscount || 0,

        taxes: invoice.taxes || [],
        tax: totalTax,

        amountReceived: invoice.amountReceived || [],
        payments: paymentModes,

        status: invoice.status || (invoice.balanceDue > 0 ? 'Unpaid' : 'Paid'),
        isDeleted: invoice.isDeleted || false,
        isActive: invoice.isActive !== undefined ? invoice.isActive : true,

        costOfGoodsSold: costOfGoodsSold,
        grossProfit: (invoice.totalAmount || 0) - costOfGoodsSold,
        margin: invoice.totalAmount > 0 ? ((invoice.totalAmount - costOfGoodsSold) / invoice.totalAmount) * 100 : 0,

        loyaltyPointsEarned: invoice.loyaltyPointsEarned || 0,
        useLoyaltyPoints: invoice.useLoyaltyPoints || false,

        cashBackEarned: invoice.cashBackEarned || 0,
        useCashBackAmount: invoice.useCashBackAmount || false,

        couponCode: invoice.couponCode || '',
        notes: invoice.notes || '',
        shippingCharges: invoice.shippingCharges || 0,
        voidNote: invoice.voidNote || '',
        giftCardCode: invoice.giftCardCode || '',
        referralCode: invoice.referralCode || '',
      };
    });

  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};

export const getDailyOutletReport = async (startDate?: string, endDate?: string) => {
  const query = buildDateQuery('DAILY', startDate || '', endDate || '');
  return await fetchSalesData(query);
};

export const getWeeklyOutletReport = async (startDate?: string, endDate?: string) => {
  const query = buildDateQuery('WEEKLY', startDate || '', endDate || '');
  return await fetchSalesData(query);
};

export const getMonthlyOutletReport = async (startDate?: string, endDate?: string) => {
  const query = buildDateQuery('MONTHLY', startDate || '', endDate || '');
  return await fetchSalesData(query);
};

export const getOutletReportByDateRange = async (startDate: string, endDate: string) => {
  const query = buildDateQuery('CUSTOM', startDate, endDate);
  return await fetchSalesData(query);
};

export const getDailyOutletReportSingleDay = async (date: string) => {
  const start = new Date(date);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const query = {
    createdAt: {
      $gte: start,
      $lte: end
    },
    isDeleted: false,
    isActive: true
  };

  return await fetchSalesData(query);
};


export const groupByOutlet = async (data: any[]) => {
  const map = new Map();

  data.forEach((item) => {
    const key = item.outletId?.toString() || "unknown";

    if (!map.has(key)) {
      map.set(key, {
        outletId: item.outletId,
        outletName: item.outletName,
        revenue: 0,
        saleCount: 0,
        grossProfit: 0,
        tax: 0,
        totalItems: 0,
      });
    }

    const row = map.get(key);

    row.revenue += Number(item.totalAmount || 0);
    row.saleCount += 1;
    row.grossProfit += Number(item.grossProfit || 0);
    row.tax += Number(item.tax || 0);
    row.totalItems += Number(item.totalItems || 0);
  });

  return Array.from(map.values());
};

export const groupByCustomer = async (data: any[]) => {
  const map = new Map();

  data.forEach((item) => {
    const key = item.customerId?.toString() || "unknown";

    if (!map.has(key)) {
      map.set(key, {
        customerId: item.customerId,
        customerName: item.customerName,
        revenue: 0,
        saleCount: 0,
        grossProfit: 0,
        tax: 0,
        totalItems: 0,
      });
    }

    const row = map.get(key);

    row.revenue += Number(item.totalAmount || 0);
    row.saleCount += 1;
    row.grossProfit += Number(item.grossProfit || 0);
    row.tax += Number(item.tax || 0);
    row.totalItems += Number(item.totalItems || 0);
  });

  return Array.from(map.values());
};

export const groupByUser = async (data: any[]) => {
  const map = new Map();

  data.forEach((item) => {
    const key = item.userId?.toString() || "unknown";

    if (!map.has(key)) {
      map.set(key, {
        userId: item.userId,
        userName: item.userName,
        revenue: 0,
        saleCount: 0,
        grossProfit: 0,
        tax: 0,
      });
    }

    const row = map.get(key);

    row.revenue += Number(item.totalAmount || 0);
    row.saleCount += 1;
    row.grossProfit += Number(item.grossProfit || 0);
    row.tax += Number(item.tax || 0);
  });

  return Array.from(map.values());
};

export const groupByRegister = async (data: any[]) => {
  const map = new Map();

  data.forEach((item) => {
    const key = item.registerId?.toString() || "unknown";

    if (!map.has(key)) {
      map.set(key, {
        registerId: item.registerId,
        registerName: item.registerName,
        revenue: 0,
        saleCount: 0,
        grossProfit: 0,
      });
    }

    const row = map.get(key);

    row.revenue += Number(item.totalAmount || 0);
    row.saleCount += 1;
    row.grossProfit += Number(item.grossProfit || 0);
  });

  return Array.from(map.values());
};

export const groupByPromotion = async (data: any[]) => {
  const map = new Map();

  data.forEach((item) => {
    const key = item.promotionId?.toString() || "unknown";

    if (!map.has(key)) {
      map.set(key, {
        promotionId: item.promotionId,
        promotionName: item.promotionName,
        revenue: 0,
        saleCount: 0,
        grossProfit: 0,
      });
    }

    const row = map.get(key);

    row.revenue += Number(item.totalAmount || 0);
    row.saleCount += 1;
    row.grossProfit += Number(item.grossProfit || 0);
  });

  return Array.from(map.values());
};

// ============================================
// CALCULATION FUNCTIONS
// ============================================

export const calculateTotals = (data: any[]) => {
  let revenue = 0;
  let saleCount = 0;
  let grossProfit = 0;
  let cost = 0;
  let tax = 0;
  let totalItems = 0;

  data.forEach((item) => {
    revenue += Number(item.revenue ?? item.totalAmount ?? 0);
    saleCount += Number(item.saleCount ?? 1);
    grossProfit += Number(item.grossProfit ?? 0);
    cost += Number(item.costOfGoodsSold ?? 0);
    tax += Number(item.tax ?? 0);
    totalItems += Number(item.totalItems ?? 0);
  });

  return {
    revenue,
    saleCount,
    grossProfit,
    cost,
    tax,
    totalItems,
    margin:
      revenue > 0
        ? Number(((grossProfit / revenue) * 100).toFixed(2))
        : 0,
    avgItemsPerSale:
      saleCount > 0
        ? Number((totalItems / saleCount).toFixed(2))
        : 0,
  };
};

// ============================================
// CHART AND ANALYTICS FUNCTIONS
// ============================================

export const prepareChartData = (data: any[], reportDuration: string, reportType?: string) => {
  if (!data || data.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

  let labels: string[] = [];

  if (reportType === 'OUTLET') {
    labels = ['8-9 AM', '9-10 AM', '10-11 AM', '11-12 PM', '12-1 PM', '1-2 PM', '2-3 PM', '3-4 PM', '4-5 PM', '5-6 PM', '6-7 PM', '7-8 PM', '8-9 PM', '9-10 PM', '10-11 PM', '11-12 AM'];
  } else {
    const primaryField = getPrimaryField(reportType);
    labels = data.map(item => item[primaryField] || `Item ${data.indexOf(item) + 1}`);
  }

  const datasets = [
    {
      label: 'Revenue',
      data: data.map(item => Number((item.revenue || 0).toFixed(2))),
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Gross Profit',
      data: data.map(item => Number((item.grossProfit || 0).toFixed(2))),
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Sales Count',
      data: data.map(item => item.saleCount || 0),
      borderColor: '#ff9800',
      backgroundColor: 'rgba(255, 152, 0, 0.2)',
      fill: true,
      tension: 0.4,
    }
  ];

  return {
    labels,
    datasets
  };
};

const getPrimaryField = (reportType?: string): string => {
  switch (reportType) {
    case 'USER': return 'user';
    case 'OUTLET': return 'outlet';
    case 'REGISTER': return 'register';
    case 'CUSTOMER': return 'customer';
    case 'CUSTOMER_GROUP': return 'customerGroup';
    case 'PROMOTION': return 'promotion';
    default: return 'name';
  }
};

export const getPaymentModeBreakdown = (data: any[]) => {
  const paymentMap = new Map();

  data.forEach((item) => {
    if (item.payments && Array.isArray(item.payments)) {
      item.payments.forEach((payment: any) => {
        const mode = payment.paymentModeName || 'Unknown';
        const amount = payment.totalAmount || 0;

        if (!paymentMap.has(mode)) {
          paymentMap.set(mode, 0);
        }
        paymentMap.set(mode, paymentMap.get(mode) + amount);
      });
    }
  });

  return Array.from(paymentMap.entries()).map(([mode, total]) => ({
    _id: mode,
    total: Number(total.toFixed(2))
  }));
};

export const getTopCustomers = (data: any[]) => {
  const customerMap = new Map();

  data.forEach((item) => {
    const customerId = item.customerId?.toString();
    if (!customerId) return;

    const customerName = item.customerName || 'Unknown';

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        customerId,
        customerName,
        customerEmail: item.customerEmail || '',
        customerPhone: item.customerPhone || '',
        total: 0,
        count: 0
      });
    }

    const customerData = customerMap.get(customerId);
    customerData.total += item.totalAmount || 0;
    customerData.count += 1;
  });

  return Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(item => ({
      ...item,
      total: Number(item.total.toFixed(2))
    }));
};

export const getTopCustomer = getTopCustomers;

export const getTopOutletss = (data: any[]) => {
  const outletMap = new Map();

  data.forEach((item) => {
    const outletId = item.outletId?.toString() || 'unknown';
    const outletName = item.outletName || 'Unknown Outlet';

    if (!outletMap.has(outletId)) {
      outletMap.set(outletId, {
        outletId,
        outletName,
        outletAddress: item.outletAddress || '',
        totalRevenue: 0,
        saleCount: 0
      });
    }

    const outletData = outletMap.get(outletId);
    outletData.totalRevenue += item.totalAmount || 0;
    outletData.saleCount += 1;
  });

  return Array.from(outletMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map(item => ({
      ...item,
      totalRevenue: Number(item.totalRevenue.toFixed(2))
    }));
};

export const getTopProductsss = (data: any[]) => {
  const productMap = new Map();

  data.forEach((item) => {
    if (item.items && Array.isArray(item.items)) {
      item.items.forEach((product: any) => {
        const productId = product.itemId?.toString() || product._id?.toString() || 'unknown';
        const productName = product.itemName || 'Unknown Product';

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName,
            quantity: 0,
            totalRevenue: 0
          });
        }

        const productData = productMap.get(productId);
        const quantity = product.quantity || 1;
        const price = product.sellingPrice || 0;

        productData.quantity += quantity;
        productData.totalRevenue += price * quantity;
      });
    }
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map(item => ({
      ...item,
      totalRevenue: Number(item.totalRevenue.toFixed(2))
    }));
};

export const getHourlyData = (data: any[]) => {
  const hourlyMap: any = {};

  for (let hour = 8; hour <= 23; hour++) {
    hourlyMap[hour] = 0;
  }

  data.forEach((item) => {
    if (item.createdAt) {
      const hour = new Date(item.createdAt).getHours();
      if (hour >= 8 && hour <= 23) {
        hourlyMap[hour] += 1;
      }
    }
  });

  return hourlyMap;
};