import { Request, Response } from "express";
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  isBefore,
  startOfMonth,
  endOfMonth,
  startOfYear,
  startOfWeek,
  endOfYear,
  endOfWeek,
} from "date-fns";
import httpStatus from "http-status";
import ApiError from "../../../../utilities/apiError";
import catchAsync from "../../../../utilities/catchAsync";
import { analyticsService } from "../service.index";
import { DateFilter, AuthenticatedRequest } from "../../../utils/interface";
import mongoose, { PipelineStage, Types } from "mongoose";
import Invoice, { searchKeys, allowedDateFilterKeys } from "../invoice/schema.invoice";
import {
  getFilterQuery,
  getRangeQuery,
  getSearchQuery,
  checkInvalidParams,
} from "../../../utils/utils";
import { pick } from "../../../../utilities/pick";
import CloseRegister from "../register/schema.closereegister";
import SalesRegister from "../register/schema.salesreegister";
import { pipeline } from "stream";
import Outlet from "../outlet/schema.outlet";
import Customer from "../customer/schema.customer";
import PaymentMode from "../paymentMode/schema.paymentMode";

//-----------------------------------------------

const getTopItems = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const limit = (req.query.limit ? req.query.limit : 10) as number;
    const page = (req.query.page ? req.query.page : 1) as number;
    const sortByValue = (
      req.query.sortByValue ? req.query.sortByValue : -1
    ) as number;

    let startDate = req.query.startDate as string;
    let endDate = req.query.endDate as string;
    let dateFilterKey = req.query.dateFilterKey as string;
    let outletId = req.query.outletId as string;
    let itemType = req.query.itemType as string[];
    let matchArray = [];

    if (outletId && outletId !== "") {
      matchArray.push({
        outletId: new mongoose.Types.ObjectId(outletId),
      });
    }

    if (!startDate || startDate === "") {
      startDate = format(new Date(), "yyyy-MM-dd");
    }

    if (!endDate || endDate === "") {
      endDate = format(new Date(), "yyyy-MM-dd");
    }

    if (!dateFilterKey || dateFilterKey === "") {
      dateFilterKey = "createdAt";
    }

    //date filter
    const datefilterQuery = await analyticsService.getDateFilterQuery(
      {
        startDate,
        endDate,
        dateFilterKey,
      },
      allowedDateFilterKeys
    );

    if (!datefilterQuery || !datefilterQuery.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "something went wrong");
    }

    matchArray.push(...datefilterQuery);

    let matchQuery = { $and: matchArray };

    let result = await analyticsService.getTopProducts(
      matchQuery,
      itemType,
      limit,
      page,
      sortByValue
    );
    return res.status(httpStatus.OK).send({
      message: "All OK",
      status: true,
      ...result,
    });
  }
);
//-----------------------------------------------

const getTopCustomer = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const limit = (req.query.limit ? req.query.limit : 10) as number;
    const page = (req.query.page ? req.query.page : 1) as number;
    const sortByValue = (
      req.query.sortByValue ? req.query.sortByValue : -1
    ) as number;

    let startDate = req.query.startDate as string;
    let endDate = req.query.endDate as string;
    let dateFilterKey = req.query.dateFilterKey as string;
    let outletId = req.query.outletId as string;
    let matchArray = [];
    matchArray.push({
      isDeleted: false,
    });

    if (outletId && outletId !== "") {
      matchArray.push({
        outletId: new mongoose.Types.ObjectId(outletId),
      });
    }

    if (!startDate || startDate === "") {
      startDate = format(new Date(), "yyyy-MM-dd");
    }

    if (!endDate || endDate === "") {
      endDate = format(new Date(), "yyyy-MM-dd");
    }

    if (!dateFilterKey || dateFilterKey === "") {
      dateFilterKey = "createdAt";
    }

    //date filter
    const datefilterQuery = await analyticsService.getDateFilterQuery(
      {
        startDate,
        endDate,
        dateFilterKey,
      },
      allowedDateFilterKeys
    );

    if (!datefilterQuery || !datefilterQuery.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "something went wrong");
    }

    matchArray.push(...datefilterQuery);
    let matchQuery = { $and: matchArray };
    let result = await analyticsService.getTopCustomer(
      matchQuery,
      limit,
      page,
      sortByValue
    );
    return res.status(httpStatus.OK).send({
      message: "All OK",
      status: true,
      ...result,
    });
  }
);
//-----------------------------------------------

const getTopOutlet = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const limit = (req.query.limit ? req.query.limit : 10) as number;
    const page = (req.query.page ? req.query.page : 1) as number;
    const sortByValue = (
      req.query.sortByValue ? req.query.sortByValue : -1
    ) as number;

    let startDate = req.query.startDate as string;
    let endDate = req.query.endDate as string;
    let dateFilterKey = req.query.dateFilterKey as string;
    let matchArray = [];
    matchArray.push({
      isDeleted: false,
    });

    if (!startDate || startDate === "") {
      startDate = format(new Date(), "yyyy-MM-dd");
    }

    if (!endDate || endDate === "") {
      endDate = format(new Date(), "yyyy-MM-dd");
    }

    if (!dateFilterKey || dateFilterKey === "") {
      dateFilterKey = "createdAt";
    }

    //date filter
    const datefilterQuery = await analyticsService.getDateFilterQuery(
      {
        startDate,
        endDate,
        dateFilterKey,
      },
      allowedDateFilterKeys
    );

    if (!datefilterQuery || !datefilterQuery.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "something went wrong");
    }

    matchArray.push(...datefilterQuery);
    let matchQuery = { $and: matchArray };
    let result = await analyticsService.getTopOutlet(
      matchQuery,
      limit,
      page,
      sortByValue
    );
    return res.status(httpStatus.OK).send({
      message: "All OK",
      status: true,
      ...result,
    });
  }
);
//-----------------------------------------------

const getOutletReport = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const reportDuration = req.query.reportDuration as string;
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    let result = await analyticsService.getOutletReportData(reportDuration, startDate, endDate);
    //

    res.status(httpStatus.OK).send({
      message: "Successfull!",
      data: result,
      status: true,
    });
  }
);

const getOutletDailyReport = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const reportDuration = req.query.reportDuration as string;
    const { outletId } = req.query;
    let result = await analyticsService.getDailyOutletReportSingleDay(outletId);
    //

    res.status(httpStatus.OK).send({
      message: "Successfull!",
      data: result,
      status: true,
    });
  }
);


const getSalesReportByOutlet = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      outletId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      reportDuration,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(outletId as string)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid outletId");
    }

    const skip = (Number(page) - 1) * Number(limit);
    const today = new Date();

    let calculatedStartDate: Date | undefined;
    let calculatedEndDate: Date | undefined;

    // ✅ CUSTOM Handling
    if (reportDuration === "CUSTUM") {
      if (!startDate || !endDate) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "startDate and endDate are required for CUSTUM report"
        );
      }

      calculatedStartDate = new Date(startDate as string);
      calculatedEndDate = new Date(endDate as string);
      calculatedEndDate.setHours(23, 59, 59, 999);
    }

    // ✅ Other Durations
    else if (reportDuration && !startDate && !endDate) {
      switch (reportDuration) {
        case "YEARLY":
          calculatedStartDate = startOfYear(today);
          calculatedEndDate = endOfYear(today);
          break;

        case "MONTHLY":
          calculatedStartDate = startOfMonth(today);
          calculatedEndDate = endOfMonth(today);
          break;

        case "WEEKLY":
          calculatedStartDate = startOfWeek(today, { weekStartsOn: 1 });
          calculatedEndDate = endOfWeek(today, { weekStartsOn: 1 });
          break;

        case "DAILY":
        default:
          calculatedStartDate = startOfDay(today);
          calculatedEndDate = endOfDay(today);
          break;
      }
    }

    // ✅ Construct invoiceDate filter
    const invoiceDateFilter: Record<string, any> = {};

    if (startDate && reportDuration !== "CUSTUM") {
      invoiceDateFilter.$gte = new Date(startDate as string);
    } else if (calculatedStartDate) {
      invoiceDateFilter.$gte = calculatedStartDate;
    }

    if (endDate && reportDuration !== "CUSTUM") {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      invoiceDateFilter.$lte = end;
    } else if (calculatedEndDate) {
      invoiceDateFilter.$lte = calculatedEndDate;
    }

    const sortKey = (req.query.sortBy as string) || "createdAt";
    const sortOrderParam = req.query.sortOrder as string | number;

    let sortOrder: 1 | -1 = -1;
    if (
      sortOrderParam === "asc" ||
      sortOrderParam === 1 ||
      sortOrderParam === "1"
    ) {
      sortOrder = 1;
    }

    const matchStage = {
      outletId: new mongoose.Types.ObjectId(outletId as string),
      isDeleted: false,
      ...(Object.keys(invoiceDateFilter).length > 0
        ? { invoiceDate: invoiceDateFilter }
        : {}),
    };

    // ✅ Pagination Data
    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      { $sort: { [sortKey]: sortOrder } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const data = await Invoice.aggregate(pipeline);

    const totalCount = await Invoice.countDocuments(matchStage);

    const totalSalesData = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: "$totalAmount" },
          cashBackDiscount: { $sum: "$cashBackDiscount" },
        },
      },
    ]);

    return res.status(httpStatus.OK).send({
      message: "Outlet Sales fetched successfully.",
      data: {
        invoices: data,
        totalSalesData,
        page: Number(page),
        limit: Number(limit),
        totalCount,
      },
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

const getSalesReportByCustomer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { customerId, page = 1, limit = 10, startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid customerId');
  }

  const skip = (Number(page) - 1) * Number(limit);

  const invoiceDateFilter: Record<string, any> = {};
  if (startDate) invoiceDateFilter.$gte = new Date(startDate as string);
  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    invoiceDateFilter.$lte = end;
  }

  const sortKey = (req.query.sortBy as string) || 'createdAt';
  const sortOrderParam = req.query.sortOrder as string | number;

  // Convert to number: -1 or 1
  let sortOrder: 1 | -1 = -1;
  if (sortOrderParam === 'asc' || sortOrderParam === 1 || sortOrderParam === '1') {
    sortOrder = 1;
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        customerId: new mongoose.Types.ObjectId(customerId as string),
        isDeleted: false,
        ...(Object.keys(invoiceDateFilter).length > 0 ? { invoiceDate: invoiceDateFilter } : {}),
      },
    },
    {
      $lookup: {
        from: "outlets",
        localField: "outletId",
        foreignField: "_id",
        as: "outlet",
        pipeline: [
          { $match: { isDeleted: false, isActive: true } },
          { $project: { phone: 1, name: 1, logo: 1 } },
        ],
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customerDetails",
        pipeline: [
          { $match: { isDeleted: false, isActive: true } },
          { $project: { phone: 1, email: 1, address: 1, customerName: 1, loyaltyPoints: 1, cashBackAmount: 1 } },
        ],
      },
    },
    {
      $lookup: {
        from: "paymentmodes",
        localField: "amountReceived.paymentModeId",
        foreignField: "_id",
        as: "paymentModeDetails",
      },
    },
    {
      $addFields: {
        amountReceived: {
          $map: {
            input: "$amountReceived",
            as: "received",
            in: {
              $mergeObjects: [
                "$$received",
                {
                  modeName: {
                    $let: {
                      vars: {
                        paymentMode: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$paymentModeDetails",
                                as: "paymentModeDetail",
                                cond: {
                                  $and: [
                                    { $eq: ["$$paymentModeDetail._id", "$$received.paymentModeId"] },
                                    { $eq: ["$$paymentModeDetail.isDeleted", false] },
                                    { $eq: ["$$paymentModeDetail.isActive", true] },
                                  ],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: "$$paymentMode.modeName",
                    },
                  },
                },
              ],
            },
          },
        },
        customerName: { $arrayElemAt: ["$customerDetails.customerName", 0] },
        customerPhone: { $arrayElemAt: ["$customerDetails.phone", 0] },
        customerEmail: { $arrayElemAt: ["$customerDetails.email", 0] },
        customerAddress: { $arrayElemAt: ["$customerDetails.address", 0] },
        outletName: { $arrayElemAt: ["$outlet.name", 0] },
        outletPhone: { $arrayElemAt: ["$outlet.phone", 0] },
        outletLogo: { $arrayElemAt: ["$outlet.logo", 0] },
      },
    },
    { $unset: ["paymentModeDetails", "customerDetails", "outlet"] },
    {
      $project: {
        invoiceNumber: 1,
        customerName: 1,
        invoiceDate: 1,
        createdAt: 1,
        status: 1,
        totalAmount: 1,
        balanceDue: 1,
        paymentModes: {
          $map: {
            input: "$amountReceived",
            as: "item",
            in: "$$item.modeName",
          },
        },
      },
    },
    { $skip: skip },
    { $limit: Number(limit) },
  ];


  pipeline.push({ $sort: { [sortKey]: sortOrder } });

  const data = await Invoice.aggregate(pipeline);

  const totalCount = await Invoice.countDocuments({
    customerId: new mongoose.Types.ObjectId(customerId as string),
    isDeleted: false,
    ...(Object.keys(invoiceDateFilter).length > 0 ? { invoiceDate: invoiceDateFilter } : {}),
  });

  const totalSalesData = await Invoice.aggregate([
    {
      $match: {
        customerId: new mongoose.Types.ObjectId(customerId as string),
        isDeleted: false,
        ...(Object.keys(invoiceDateFilter).length > 0 ? { invoiceDate: invoiceDateFilter } : {}),
      },
    },
    {
      $group: {
        _id: null,
        totalSalesAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  return res.status(httpStatus.OK).send({
    message: 'Customer Sales fetched successfully.',
    data: {
      invoices: data,
      totalSalesData,
      page: Number(page),
      limit: Number(limit),
      totalCount,
    },
    status: true,
    code: 'OK',
    issue: null,
  });
});
//-------
const getSalesChartDataReportByOutlet = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { outletId, startDate, endDate, reportDuration } = req.query;

    if (!mongoose.Types.ObjectId.isValid(outletId as string)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid outletId");
    }

    if (!startDate || !endDate || !reportDuration) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "startDate, endDate, reportDuration are required"
      );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const differenceInDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const isCustomDaily =
      reportDuration === "CUSTUM" && differenceInDays <= 31;

    const matchFilter = {
      outletId: new mongoose.Types.ObjectId(outletId as string),
      isDeleted: false,
      invoiceDate: { $gte: start, $lte: end },
    };

    // --------------------------
    // 📌 Labels Builder
    // --------------------------
    let labels: string[] = [];

    if (reportDuration === "DAILY") {
      labels = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0") + ":00"
      );
    }

    else if (reportDuration === "WEEKLY") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(end);
        d.setDate(end.getDate() - (6 - i));
        return days[d.getDay()];
      });
    }

    else if (reportDuration === "MONTHLY") {
      let temp = new Date(start);
      while (temp <= end) {
        labels.push(temp.getDate().toString().padStart(2, "0"));
        temp.setDate(temp.getDate() + 1);
      }
    }

    else if (reportDuration === "YEARLY") {
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }

    else if (reportDuration === "CUSTUM") {
      if (isCustomDaily) {
        let temp = new Date(start);
        while (temp <= end) {
          labels.push(temp.toISOString().split("T")[0]);
          temp.setDate(temp.getDate() + 1);
        }
      } else {
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      }
    }

    // --------------------------
    // 📌 Group Logic
    // --------------------------
    const getGroupId = () => {
      if (reportDuration === "DAILY") return { $hour: "$invoiceDate" };
      if (reportDuration === "WEEKLY") return { $dayOfWeek: "$invoiceDate" };
      if (reportDuration === "MONTHLY") return { $dayOfMonth: "$invoiceDate" };
      if (reportDuration === "YEARLY") return { $month: "$invoiceDate" };

      if (reportDuration === "CUSTUM") {
        if (isCustomDaily) {
          return { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } };
        } else {
          return { $month: "$invoiceDate" };
        }
      }
    };

    const pipeline = (s: Date, e: Date): PipelineStage[] => [
      {
        $match: {
          ...matchFilter,
          invoiceDate: { $gte: s, $lte: e },
        },
      },
      {
        $group: {
          _id: getGroupId(),
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    // --------------------------
    // 📌 Last Period Calculation (Dynamic)
    // --------------------------
    let lastStart = new Date(start);
    let lastEnd = new Date(end);

    if (reportDuration === "CUSTUM") {
      lastStart.setDate(start.getDate() - differenceInDays);
      lastEnd.setDate(end.getDate() - differenceInDays);
    }

    else if (reportDuration === "DAILY") {
      lastStart.setDate(start.getDate() - 1);
      lastEnd.setDate(end.getDate() - 1);
    }

    else if (reportDuration === "WEEKLY") {
      lastStart.setDate(start.getDate() - 7);
      lastEnd.setDate(end.getDate() - 7);
    }

    else if (reportDuration === "MONTHLY") {
      lastStart.setMonth(start.getMonth() - 1);
      lastEnd.setMonth(end.getMonth() - 1);
    }

    else if (reportDuration === "YEARLY") {
      lastStart.setFullYear(start.getFullYear() - 1);
      lastEnd.setFullYear(end.getFullYear() - 1);
    }

    // --------------------------
    // 📌 Fetch Data
    // --------------------------
    const [lastPeriod, currentPeriod] = await Promise.all([
      Invoice.aggregate(pipeline(lastStart, lastEnd)),
      Invoice.aggregate(pipeline(start, end)),
    ]);

    // --------------------------
    // 📌 Format Data
    // --------------------------
    const formatData = (data: any[]) =>
      labels.map((label, idx) => {
        let keyVal: any;

        if (reportDuration === "DAILY") keyVal = idx;
        else if (reportDuration === "WEEKLY") keyVal = idx + 1;
        else if (reportDuration === "MONTHLY") keyVal = parseInt(label);
        else if (reportDuration === "YEARLY") keyVal = idx + 1;

        else if (reportDuration === "CUSTUM") {
          if (isCustomDaily) keyVal = label;
          else keyVal = idx + 1;
        }

        const found = data.find((d) => d._id === keyVal);
        return found ? found.total : 0;
      });

    const lastData = formatData(lastPeriod);
    const currentData = formatData(currentPeriod);

    const periodLabel =
      reportDuration === "DAILY"
        ? "Day"
        : reportDuration === "WEEKLY"
          ? "Week"
          : reportDuration === "MONTHLY"
            ? "Month"
            : reportDuration === "YEARLY"
              ? "Year"
              : reportDuration === "CUSTUM" && !isCustomDaily
                ? "Month"
                : "Period";

    const datasets = [
      {
        label: `Last ${periodLabel} Sales`,
        data: lastData,
        borderColor: "#6b645f",
        backgroundColor: "#6b645f",
        fill: false,
        tension: 0.4,
      },
      {
        label: `Current ${periodLabel} Sales`,
        data: currentData,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        fill: false,
        tension: 0.4,
      },
    ];

    return res.status(httpStatus.OK).send({
      message: "Sales chart data fetched successfully.",
      data: { datasets, labels },
      status: true,
      code: "OK",
      issue: null,
    });
  }
);


//-------

// const getSalesChartDataReportByOutlet = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { outletId, startDate, endDate, reportDuration } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(outletId as string)) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Invalid outletId");
//     }

//     // 📌 Build invoiceDate filter
//     const invoiceDateFilter: Record<string, any> = {};
//     if (startDate) {
//       invoiceDateFilter.$gte = new Date(startDate as string);
//     }
//     if (endDate) {
//       const end = new Date(endDate as string);
//       end.setHours(23, 59, 59, 999);
//       invoiceDateFilter.$lte = end;
//     }

//     const matchFilter = {
//       outletId: new mongoose.Types.ObjectId(outletId as string),
//       isDeleted: false,
//       ...(Object.keys(invoiceDateFilter).length
//         ? { invoiceDate: invoiceDateFilter }
//         : {}),
//     };

//     // 📌 Report Duration Formatting
//     let groupId: any = {
//       $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
//     }; // default daily

//     if (reportDuration === "DAILY") {
//       groupId = { $hour: "$invoiceDate" }; // ⏰ hourly
//     } else if (reportDuration === "WEEKLY") {
//       groupId = { $dayOfWeek: "$invoiceDate" }; // 1=Sunday, 7=Saturday
//     } else if (reportDuration === "MONTHLY") {
//       groupId = { $dayOfMonth: "$invoiceDate" }; // 1–31
//     }

//     // 1. 🟢 Sales Over Time (generic, for filtering)
//     const salesByDate = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: groupId,
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     // 2. 🔵 Sales by Payment Mode
//     const salesByPaymentMode = await Invoice.aggregate([
//       { $match: matchFilter },
//       { $unwind: "$amountReceived" },
//       {
//         $lookup: {
//           from: "paymentmodes",
//           localField: "amountReceived.paymentModeId",
//           foreignField: "_id",
//           as: "paymentMode",
//         },
//       },
//       {
//         $addFields: {
//           modeName: { $arrayElemAt: ["$paymentMode.modeName", 0] },
//         },
//       },
//       {
//         $group: {
//           _id: "$modeName",
//           total: { $sum: "$amountReceived.amount" },
//         },
//       },
//       { $sort: { total: -1 } },
//     ]);

//     // 3. 🟣 Top Customers
//     const topCustomers = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: "$customerId",
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $lookup: {
//           from: "customers",
//           localField: "_id",
//           foreignField: "_id",
//           as: "customer",
//         },
//       },
//       {
//         $project: {
//           customerName: { $arrayElemAt: ["$customer.customerName", 0] },
//           total: 1,
//         },
//       },
//       { $sort: { total: -1 } },
//       { $limit: 5 },
//     ]);

//     // 4. 📊 Labels Banane Ka Logic
//     let labels: string[] = [];

//     if (reportDuration === "DAILY") {
//       labels = Array.from({ length: 24 }, (_, i) =>
//         i.toString().padStart(2, "0") + ":00"
//       );
//     } else if (reportDuration === "WEEKLY") {
//       labels = [
//         "Sunday",
//         "Monday",
//         "Tuesday",
//         "Wednesday",
//         "Thursday",
//         "Friday",
//         "Saturday",
//       ];
//     } else if (reportDuration === "MONTHLY") {
//       const now = new Date();
//       const daysInMonth = new Date(
//         now.getFullYear(),
//         now.getMonth() + 1,
//         0
//       ).getDate();
//       labels = Array.from({ length: daysInMonth }, (_, i) =>
//         (i + 1).toString().padStart(2, "0")
//       );
//     }

//     // 🟡 Last Month & Current Month Date Range
//     const now = new Date();
//     const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//     const currentMonthEnd = new Date(
//       now.getFullYear(),
//       now.getMonth() + 1,
//       0,
//       23,
//       59,
//       59
//     );

//     const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const lastMonthEnd = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       0,
//       23,
//       59,
//       59
//     );

//     // 🟢 Pipeline Builder for Month Data
//     const monthPipeline = (start: Date, end: Date): PipelineStage[] => [
//       {
//         $match: {
//           ...matchFilter,
//           invoiceDate: { $gte: start, $lte: end },
//         },
//       },
//       {
//         $group: {
//           _id:
//             reportDuration === "DAILY"
//               ? { $hour: "$invoiceDate" }
//               : reportDuration === "WEEKLY"
//                 ? { $dayOfWeek: "$invoiceDate" }
//                 : { $dayOfMonth: "$invoiceDate" },
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $sort: { _id: 1 as 1 }, // ✅ explicitly cast as `1`
//       },
//     ];
//     // 🟢 Fetch Last & Current Month Sales
//     const [lastMonthSales, currentMonthSales] = await Promise.all([
//       Invoice.aggregate(monthPipeline(lastMonthStart, lastMonthEnd)),
//       Invoice.aggregate(monthPipeline(currentMonthStart, currentMonthEnd)),
//     ]);

//     // 🟢 Convert to arrays aligned with labels
//     const formatData = (data: any[]) =>
//       labels.map((label, idx) => {
//         let keyVal;
//         if (reportDuration === "DAILY") keyVal = idx; // 0–23
//         else if (reportDuration === "WEEKLY") keyVal = idx + 1; // 1–7
//         else if (reportDuration === "MONTHLY") keyVal = idx + 1; // 1–31
//         else keyVal = label;

//         const found = data.find((d) => d._id === keyVal || d._id === label);
//         return found ? found.total : 0;
//       });

//     const lastMonthData = formatData(lastMonthSales);
//     const currentMonthData = formatData(currentMonthSales);


//     const periodLabel =
//   reportDuration === "MONTHLY"
//     ? "Month"
//     : reportDuration === "WEEKLY"
//     ? "Week"
//     : reportDuration === "DAILY"
//     ? "Day"
//     : "";

//     // 🟢 Final Datasets
//     const datasets = [
//       {
//         label: `Last ${periodLabel} Sales`,
//         data: lastMonthData,
//         borderColor: "#6b645fff",
//         backgroundColor: "#6b645fff",
//         fill: false,
//         tension: 0.4,
//         pointRadius: 3,
//         pointHoverRadius: 6,
//       },
//       {
//         label: `Current ${periodLabel} Sales`,
//         data: currentMonthData,
//         borderColor: "#3b82f6",
//         backgroundColor: "#3b82f6",
//         fill: false,
//         tension: 0.4,
//         pointRadius: 3,
//         pointHoverRadius: 6,
//       },
//     ];

//     // 🟢 Send Response
//     return res.status(httpStatus.OK).send({
//       message: "Sales chart data fetched successfully.",
//       data: {
//         salesByDate,
//         salesByPaymentMode,
//         topCustomers,
//         datasets,
//         labels,
//       },
//       status: true,
//       code: "OK",
//       issue: null,
//     });
//   }
// );


// const getSalesChartDataReportByOutlet = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { outletId, startDate, endDate, reportDuration } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(outletId as string)) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Invalid outletId");
//     }

//     // 📌 Build invoiceDate filter
//     const invoiceDateFilter: Record<string, any> = {};
//     if (startDate) {
//       invoiceDateFilter.$gte = new Date(startDate as string);
//     }
//     if (endDate) {
//       const end = new Date(endDate as string);
//       end.setHours(23, 59, 59, 999);
//       invoiceDateFilter.$lte = end;
//     }

//     const matchFilter = {
//       outletId: new mongoose.Types.ObjectId(outletId as string),
//       isDeleted: false,
//       ...(Object.keys(invoiceDateFilter).length ? { invoiceDate: invoiceDateFilter } : {}),
//     };

//     // 📌 Report Duration Formatting
//     let groupFormat = "%Y-%m-%d"; // default daily
//     if (reportDuration === "WEEKLY") {
//       groupFormat = "%Y-%U"; // year-week
//     } else if (reportDuration === "MONTHLY") {
//       groupFormat = "%Y-%m"; // year-month
//     }

//     // 1. 🟢 Sales Over Time
//     const salesByDate = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: { $dateToString: { format: groupFormat, date: "$invoiceDate" } },
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     // 2. 🔵 Sales by Payment Mode
//     const salesByPaymentMode = await Invoice.aggregate([
//       { $match: matchFilter },
//       { $unwind: "$amountReceived" },
//       {
//         $lookup: {
//           from: "paymentmodes",
//           localField: "amountReceived.paymentModeId",
//           foreignField: "_id",
//           as: "paymentMode",
//         },
//       },
//       {
//         $addFields: {
//           modeName: { $arrayElemAt: ["$paymentMode.modeName", 0] },
//         },
//       },
//       {
//         $group: {
//           _id: "$modeName",
//           total: { $sum: "$amountReceived.amount" },
//         },
//       },
//       { $sort: { total: -1 } },
//     ]);

//     // 3. 🟣 Top Customers
//     const topCustomers = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: "$customerId",
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $lookup: {
//           from: "customers",
//           localField: "_id",
//           foreignField: "_id",
//           as: "customer",
//         },
//       },
//       {
//         $project: {
//           customerName: { $arrayElemAt: ["$customer.customerName", 0] },
//           total: 1,
//         },
//       },
//       { $sort: { total: -1 } },
//       { $limit: 5 },
//     ]);

//     // 4. 📊 Last Month vs Current Month Sales
//     const now = new Date();

//     // Current Month Range
//     const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//     const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

//     // Last Month Range
//     const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//     const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

//     const [lastMonthSales, currentMonthSales] = await Promise.all([
//       Invoice.aggregate([
//         {
//           $match: {
//             ...matchFilter,
//             invoiceDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
//           },
//         },
//         {
//           $group: {
//             _id: { $dayOfMonth: "$invoiceDate" },
//             total: { $sum: "$totalAmount" },
//           },
//         },
//         { $sort: { _id: 1 } },
//       ]),
//       Invoice.aggregate([
//         {
//           $match: {
//             ...matchFilter,
//             invoiceDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
//           },
//         },
//         {
//           $group: {
//             _id: { $dayOfMonth: "$invoiceDate" },
//             total: { $sum: "$totalAmount" },
//           },
//         },
//         { $sort: { _id: 1 } },
//       ]),
//     ]);

//     // Convert to datasets for chart.js
//     const lastMonthDays = new Date(lastMonthEnd).getDate();
//     const currentMonthDays = new Date(currentMonthEnd).getDate();
//     const maxDays = Math.max(lastMonthDays, currentMonthDays);
//   const labels = Array.from({ length: maxDays }, (_, i) =>
//   (i + 1).toString().padStart(2, "0")
// );

// // Fill data (missing days = 0)
// const lastMonthData = labels.map((label, idx) => {
//   const day = idx + 1;
//   const found = lastMonthSales.find((d) => d._id === day);
//   return found ? found.total : 0;
// });

// const currentMonthData = labels.map((label, idx) => {
//   const day = idx + 1;
//   const found = currentMonthSales.find((d) => d._id === day);
//   return found ? found.total : 0;
// });

//     const datasets = [
//       {
//         label: "Last Month Sales",
//         data: lastMonthData,
//         borderColor: "#6b645fff",
//         backgroundColor: "#6b645fff",
//         fill: false,
//         tension: 0.4,
//         pointRadius: 3,
//         pointHoverRadius: 6,
//       },
//       {
//         label: "Current Month Sales",
//         data: currentMonthData,
//         borderColor: "#3b82f6",
//         backgroundColor: "#3b82f6",
//         fill: false,
//         tension: 0.4,
//         pointRadius: 3,
//         pointHoverRadius: 6,
//       },
//     ];

//     return res.status(httpStatus.OK).send({
//       message: "Sales chart data fetched successfully.",
//       data: {
//         salesByDate,
//         salesByPaymentMode,
//         topCustomers,
//         datasets,
//         labels // ⬅️ extra field added
//       },
//       status: true,
//       code: "OK",
//       issue: null,
//     });
//   }
// );


// const getSalesChartDataReportByOutlet = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { outletId, startDate, endDate, reportDuration } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(outletId as string)) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Invalid outletId");
//     }

//     // 📌 Build invoiceDate filter
//     const invoiceDateFilter: Record<string, any> = {};
//     if (startDate) {
//       invoiceDateFilter.$gte = new Date(startDate as string);
//     }
//     if (endDate) {
//       const end = new Date(endDate as string);
//       end.setHours(23, 59, 59, 999);
//       invoiceDateFilter.$lte = end;
//     }

//     const matchFilter = {
//       outletId: new mongoose.Types.ObjectId(outletId as string),
//       isDeleted: false,
//       ...(Object.keys(invoiceDateFilter).length ? { invoiceDate: invoiceDateFilter } : {}),
//     };

//     // 📌 Report Duration Formatting
//     let groupFormat = "%Y-%m-%d"; // default daily
//     if (reportDuration === "WEEKLY") {
//       groupFormat = "%Y-%U"; // year-week (week number)
//     } else if (reportDuration === "MONTHLY") {
//       groupFormat = "%Y-%m"; // year-month
//     }

//     // 1. 🟢 Sales Over Time (Date / Week / Month)
//     const salesByDate = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: { $dateToString: { format: groupFormat, date: "$invoiceDate" } },
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     // 2. 🔵 Sales by Payment Mode
//     const salesByPaymentMode = await Invoice.aggregate([
//       { $match: matchFilter },
//       { $unwind: "$amountReceived" },
//       {
//         $lookup: {
//           from: "paymentmodes",
//           localField: "amountReceived.paymentModeId",
//           foreignField: "_id",
//           as: "paymentMode",
//         },
//       },
//       {
//         $addFields: {
//           modeName: { $arrayElemAt: ["$paymentMode.modeName", 0] },
//         },
//       },
//       {
//         $group: {
//           _id: "$modeName",
//           total: { $sum: "$amountReceived.amount" },
//         },
//       },
//       { $sort: { total: -1 } },
//     ]);

//     // 3. 🟣 Top Customers by Sales
//     const topCustomers = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: "$customerId",
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $lookup: {
//           from: "customers",
//           localField: "_id",
//           foreignField: "_id",
//           as: "customer",
//         },
//       },
//       {
//         $project: {
//           customerName: { $arrayElemAt: ["$customer.customerName", 0] },
//           total: 1,
//         },
//       },
//       { $sort: { total: -1 } },
//       { $limit: 5 },
//     ]);

//     return res.status(httpStatus.OK).send({
//       message: "Sales chart data fetched successfully.",
//       data: {
//         salesByDate,
//         salesByPaymentMode,
//         topCustomers,
//       },
//       status: true,
//       code: "OK",
//       issue: null,
//     });
//   }
// );


const getSalesChartDataReportByCustomer = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { customerId, startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid customerId');
  }

  const invoiceDateFilter: Record<string, any> = {};
  if (startDate) invoiceDateFilter.$gte = new Date(startDate as string);
  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    invoiceDateFilter.$lte = end;
  }

  const matchStage = {
    customerId: new mongoose.Types.ObjectId(customerId as string),
    isDeleted: false,
    ...(Object.keys(invoiceDateFilter).length > 0 ? { invoiceDate: invoiceDateFilter } : {}),
  };

  // 1. Sales by Date (for bar chart)
  const salesByDate = await Invoice.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } },
        total: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 2. Sales by Payment Mode (for pie chart)
  const salesByPaymentMode = await Invoice.aggregate([
    { $match: matchStage },
    { $unwind: "$amountReceived" },
    {
      $lookup: {
        from: "paymentmodes",
        localField: "amountReceived.paymentModeId",
        foreignField: "_id",
        as: "paymentModeDetail",
      },
    },
    { $unwind: "$paymentModeDetail" },
    {
      $group: {
        _id: "$paymentModeDetail.modeName",
        total: { $sum: "$amountReceived.amount" },
      },
    },
  ]);

  // 3. Sales by Outlet (for doughnut chart)
  const salesByOutlet = await Invoice.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "outlets",
        localField: "outletId",
        foreignField: "_id",
        as: "outlet",
      },
    },
    { $unwind: "$outlet" },
    {
      $group: {
        _id: "$outlet.name",
        total: { $sum: "$totalAmount" },
      },
    },
  ]);

  return res.status(httpStatus.OK).send({
    message: 'Customer sales chart data fetched successfully.',
    data: {
      salesByDate,
      salesByPaymentMode,
      salesByOutlet,
    },
    status: true,
    code: 'OK',
    issue: null,
  });
});


const getRegisterChartDataByOutlet = catchAsync(async (req: Request, res: Response) => {
  const { outletId, startDate, endDate, reportDuration } = req.query;

  if (!outletId || !startDate || !endDate) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Missing required query parameters: outletId, startDate, and endDate',
      status: false,
    });
  }

  const start = new Date(startDate as string);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  const differenceInDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 🔹 Decide grouping (AUTO for CUSTUM)
  let groupFormat: any = "%Y-%m-%d"; // default daily

  if (reportDuration === "YEARLY") {
    groupFormat = "%Y-%m";
  } else if (reportDuration === "MONTHLY") {
    groupFormat = "%Y-%m-%d";
  } else if (reportDuration === "WEEKLY") {
    groupFormat = "%Y-%m-%d";
  } else if (reportDuration === "CUSTUM") {
    groupFormat = differenceInDays <= 31 ? "%Y-%m-%d" : "%Y-%m";
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        isDeleted: false,
        outletId: new mongoose.Types.ObjectId(outletId as string),
        openedAt: { $gte: start, $lte: end },
      },
    },

    {
      $addFields: {
        formattedDate: {
          $dateToString: {
            format: groupFormat,
            date: "$openedAt",
          },
        },
      },
    },

    {
      $group: {
        _id: "$formattedDate",

        totalCash: {
          $sum: {
            $reduce: {
              input: "$closeRegister",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$$this.payments",
                            as: "p",
                            cond: {
                              $eq: [
                                { $toLower: "$$p.paymentModeName" },
                                "cash",
                              ],
                            },
                          },
                        },
                        as: "p",
                        in: { $ifNull: ["$$p.manual", 0] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },

        bankDeposit: { $sum: { $ifNull: ["$bankDeposit", 0] } },
        carryForwardBalance: { $sum: { $ifNull: ["$carryForwardBalance", 0] } },

        openingBalance: { $sum: { $ifNull: ["$openingBalance", 0] } },

        payoutCash: {
          $sum: {
            $reduce: {
              input: "$cashUsage",
              initialValue: 0,
              in: { $add: ["$$value", { $toDouble: "$$this.amount" }] },
            },
          },
        },
      },
    },

    { $sort: { _id: 1 } },
  ];

  const groupedData = await SalesRegister.aggregate(pipeline);

  // 🔹 Response Format (SAME structure as before)

  const dailySummary = groupedData.map((item) => ({
    date: item._id,
    totalCash: item.totalCash,
    bankDeposit: item.bankDeposit,
    carryForwardBalance: item.carryForwardBalance,
  }));

  const finalCashVsOpening = groupedData.map((item) => ({
    date: item._id,
    openingBalance: item.openingBalance,
    finalCash: item.totalCash,
    payoutCash: item.payoutCash,
  }));

  return res.status(httpStatus.OK).json({
    message: 'Chart data fetched successfully',
    status: true,
    data: {
      dailySummary,
      finalCashVsOpening,
      allInOneTable: groupedData,
    },
  });
});




const getRegisterDataByOutlet = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { outletId, startDate, endDate, reportDuration } = req.query;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const match: any = { isDeleted: false };

  if (outletId) {
    match.outletId = new mongoose.Types.ObjectId(outletId as string);
  }

  let start: Date;
  let end: Date;
  const today = new Date();

  // ✅ SMART DATE LOGIC
  if (startDate && endDate) {
    start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);

    end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
  } else {
    switch (reportDuration) {

      case "YEARLY":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case "MONTHLY":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case "WEEKLY": {
        const current = new Date();
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        start = new Date(current.setDate(diff));
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "DAILY":
      default:
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
    }
  }

  match.openedAt = { $gte: start, $lte: end };

  const existingOpenRegister = await SalesRegister.findOne({
    outletId,
    isOpened: true,
    isClosed: false,
    isDeleted: false,
  });

  const pipeline: PipelineStage[] = [

    { $match: match },

    // 🔹 Flatten Payments
    {
      $addFields: {
        allPayments: {
          $reduce: {
            input: { $ifNull: ["$closeRegister", []] },
            initialValue: [],
            in: { $concatArrays: ["$$value", { $ifNull: ["$$this.payments", []] }] }
          }
        },

        totalPayouts: {
          $sum: {
            $map: {
              input: { $ifNull: ["$closeRegister", []] },
              as: "cr",
              in: { $ifNull: ["$$cr.payout", 0] }
            }
          }
        },

        cashUsageCashSum: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: { $ifNull: ["$cashUsage", []] },
                  as: "cu",
                  cond: { $eq: [{ $toLower: "$$cu.paymentMode" }, "cash"] }
                }
              },
              as: "cu",
              in: { $ifNull: ["$$cu.amount", 0] }
            }
          }
        },

        cashUsageCardSum: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: { $ifNull: ["$cashUsage", []] },
                  as: "cu",
                  cond: {
                    $in: [
                      { $toLower: "$$cu.paymentMode" },
                      ["card", "credit", "debit", "debit card", "credit card", "card swipe"]
                    ]
                  }
                }
              },
              as: "cu",
              in: { $ifNull: ["$$cu.amount", 0] }
            }
          }
        }
      }
    },

    // 🔹 Payment Totals
    {
      $addFields: {

        totalCashAmount: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: { $ifNull: ["$allPayments", []] },
                  as: "p",
                  cond: { $eq: [{ $toLower: "$$p.paymentModeName" }, "cash"] }
                }
              },
              as: "p",
              in: {
                $toDouble: {
                  $replaceAll: {
                    input: { $toString: { $ifNull: ["$$p.manual", 0] } },
                    find: ",",
                    replacement: ""
                  }
                }
              }
            }
          }
        },

        totalCardPayments: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: { $ifNull: ["$allPayments", []] },
                  as: "p",
                  cond: {
                    $in: [
                      { $toLower: "$$p.paymentModeName" },
                      ["card", "credit", "debit", "debit card", "credit card", "card swipe"]
                    ]
                  }
                }
              },
              as: "p",
              in: { $ifNull: ["$$p.totalAmount", 0] }
            }
          }
        }
      }
    },

    {
      $addFields: {
        totalCardPaymentsAdjusted: {
          $subtract: [{ $ifNull: ["$totalCardPayments", 0] }, { $ifNull: ["$cashUsageCardSum", 0] }]
        }
      }
    },

    // 🔹 Expected Cash + Variance
    {
      $addFields: {
        expectedPhysicalCash: {
          $subtract: [
            { $add: [{ $ifNull: ["$openingBalance", 0] }, { $ifNull: ["$totalCashAmount", 0] }] },
            {
              $add: [
                { $ifNull: ["$totalPayouts", 0] },
                { $ifNull: ["$bankDeposit", 0] },
                { $ifNull: ["$cashUsageCashSum", 0] }
              ]
            }
          ]
        }
      }
    },

    {
      $addFields: {
        variance: {
          $subtract: [
            { $ifNull: ["$cashAmount", 0] },
            { $ifNull: ["$expectedPhysicalCash", 0] }
          ]
        }
      }
    },

    { $sort: { openedAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ];

  const registerData = await SalesRegister.aggregate(pipeline);
  const totalCount = await SalesRegister.countDocuments(match);

  res.status(200).json({
    success: true,
    existingOpenRegister,
    data: registerData,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    }
  });
});



// const getRegisterDataByOutlet = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
//   const { outletId, startDate, endDate } = req.query;

//   const page = parseInt(req.query.page as string) || 1;
//   const limit = parseInt(req.query.limit as string) || 10;
//   const skip = (page - 1) * limit;


//   const match: any = {
//     isDeleted: false,
//   };
//   if (outletId) match.outletId = new mongoose.Types.ObjectId(outletId as string);

//   if (startDate && endDate) {
//     const start = new Date(startDate as string);
//     start.setHours(0, 0, 0, 0);

//     const end = new Date(endDate as string);
//     end.setHours(23, 59, 59, 999);

//     match.openedAt = {
//       $gte: start,
//       $lte: end,
//     };
//   }

//   const pipeline: PipelineStage[] = [
//     {
//       $match: match
//     }
//   ];

//   pipeline.push(
//     { $sort: { openedAt: -1 } },
//     { $skip: skip },
//     { $limit: limit }
//   );

//   const registerData = await SalesRegister.aggregate(pipeline)

//   const totalCount = await SalesRegister.countDocuments(match);

//   res.status(200).json({
//     success: true,
//     data: registerData,
//     pagination: {
//       total: totalCount,
//       page: Number(page),
//       limit: Number(limit),
//       pages: Math.ceil(totalCount / Number(limit)),
//     }
//   });
// });

// const getSalesChartDataReportByOutlets = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { outletIds, startDate, endDate, reportDuration } = req.query;

//     if (!outletIds) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "outletIds are required");
//     }

//     const outletArray = (Array.isArray(outletIds)
//       ? outletIds
//       : (outletIds as string).split(",")
//     ).map((id: any) => new mongoose.Types.ObjectId(id));

//     // 📌 Build invoiceDate filter
//     const invoiceDateFilter: Record<string, any> = {};
//     if (startDate) {
//       invoiceDateFilter.$gte = new Date(startDate as string);
//     }
//     if (endDate) {
//       const end = new Date(endDate as string);
//       end.setHours(23, 59, 59, 999);
//       invoiceDateFilter.$lte = end;
//     }

//     const matchFilter = {
//       outletId: { $in: outletArray },
//       isDeleted: false,
//       ...(Object.keys(invoiceDateFilter).length
//         ? { invoiceDate: invoiceDateFilter }
//         : {}),
//     };

//     // 📌 Grouping key based on reportDuration
//     let groupId: any = {
//       $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
//     }; // default daily

//     if (reportDuration === "DAILY") {
//       groupId = { $hour: "$invoiceDate" };
//     } else if (reportDuration === "WEEKLY") {
//       groupId = { $dayOfWeek: "$invoiceDate" };
//     } else if (reportDuration === "MONTHLY") {
//       groupId = { $dayOfMonth: "$invoiceDate" };
//     }

//     // 📌 Aggregation: Sales by Outlet + Time
//     const salesByOutlets = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: {
//             outletId: "$outletId",
//             timeKey: groupId,
//           },
//           total: { $sum: "$totalAmount" },
//         },
//       },
//       { $sort: { "_id.timeKey": 1 } },
//       {
//         $lookup: {
//           from: "outlets",
//           localField: "_id.outletId",
//           foreignField: "_id",
//           as: "outlet",
//         },
//       },
//       { $unwind: "$outlet" },
//       {
//         $project: {
//           outletName: "$outlet.name",
//           timeKey: "$_id.timeKey",
//           total: 1,
//         },
//       },
//     ]);

//     // 📌 Generate Labels
//     let labels: string[] = [];

//     if (reportDuration === "DAILY") {
//       labels = Array.from({ length: 24 }, (_, i) =>
//         i.toString().padStart(2, "0") + ":00"
//       );
//     } else if (reportDuration === "WEEKLY") {
//       labels = [
//         "Sunday",
//         "Monday",
//         "Tuesday",
//         "Wednesday",
//         "Thursday",
//         "Friday",
//         "Saturday",
//       ];
//     } else if (reportDuration === "MONTHLY") {
//       const now = new Date();
//       const daysInMonth = new Date(
//         now.getFullYear(),
//         now.getMonth() + 1,
//         0
//       ).getDate();
//       labels = Array.from({ length: daysInMonth }, (_, i) =>
//         (i + 1).toString().padStart(2, "0")
//       );
//     }

//     const chartColors = [
//       "#FF6384", // red-pink
//       "#36A2EB", // blue
//       "#FFCE56", // yellow
//       "#4BC0C0", // teal
//       "#9966FF", // purple
//       "#FF9F40", // orange
//       "#8BC34A", // green
//       "#E91E63", // pink
//       "#00BCD4", // cyan
//     ];

//     // 📌 Format datasets (one dataset per outlet)
//     const outlets = [...new Set(salesByOutlets.map((s) => s.outletName))];
//     const datasets = outlets.map((outlet, index) => {
//       const outletData = salesByOutlets.filter(
//         (s) => s.outletName === outlet
//       );

//       const data = labels.map((_, idx) => {
//         let keyVal;
//         if (reportDuration === "DAILY") keyVal = idx;
//         else if (reportDuration === "WEEKLY") keyVal = idx + 1;
//         else if (reportDuration === "MONTHLY") keyVal = idx + 1;
//         else keyVal = labels[idx];

//         const found = outletData.find(
//           (d) => d.timeKey === keyVal || d.timeKey === labels[idx]
//         );
//         return found ? found.total : 0;
//       });

//       return {
//         label: outlet,
//         data,
//         borderColor: chartColors[index % chartColors.length], // 🔹 Assign color
//         backgroundColor: chartColors[index % chartColors.length] + "55", // 55 -> transparent shade
//         borderWidth: 2,
//         fill: false,
//         tension: 0.4,
//       };
//     });



//     return res.status(httpStatus.OK).send({
//       message: "Outlets sales chart data fetched successfully.",
//       data: {
//         labels,
//         datasets,
//       },
//       status: true,
//       code: "OK",
//       issue: null,
//     });
//   }
// );

const getSalesChartDataReportByOutlets = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { outletIds, startDate, endDate, reportDuration = "DAILY" } = req.query;

    if (!outletIds) {
      throw new ApiError(httpStatus.BAD_REQUEST, "outletIds are required");
    }

    const outletArray = (Array.isArray(outletIds)
      ? outletIds
      : (outletIds as string).split(",")
    ).map((id: any) => new mongoose.Types.ObjectId(id));

    const today = new Date();
    let start: Date;
    let end: Date;

    // ✅ CUSTOM → frontend dates mandatory
    if (reportDuration === "CUSTUM") {
      if (!startDate || !endDate) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "startDate and endDate are required for CUSTUM report"
        );
      }

      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (reportDuration) {
        case "YEARLY":
          start = startOfYear(today);
          end = endOfYear(today);
          break;

        case "MONTHLY":
          start = startOfMonth(today);
          end = endOfMonth(today);
          break;

        case "WEEKLY":
          start = startOfWeek(today, { weekStartsOn: 1 });
          end = endOfWeek(today, { weekStartsOn: 1 });
          break;

        case "DAILY":
        default:
          start = startOfDay(today);
          end = endOfDay(today);
          break;
      }
    }

    const matchFilter = {
      outletId: { $in: outletArray },
      isDeleted: false,
      invoiceDate: { $gte: start, $lte: end },
    };

    const differenceInDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // ✅ Grouping Logic
    let groupId: any;

    switch (reportDuration) {
      case "DAILY":
        groupId = { $hour: "$invoiceDate" };
        break;

      case "WEEKLY":
        groupId = { $dayOfWeek: "$invoiceDate" };
        break;

      case "MONTHLY":
        groupId = { $dayOfMonth: "$invoiceDate" };
        break;

      case "YEARLY":
        groupId = { $month: "$invoiceDate" };
        break;

      case "CUSTUM":
        if (differenceInDays <= 31) {
          // ✅ Per Day
          groupId = {
            $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
          };
        } else {
          // ✅ Month Wise
          groupId = { $month: "$invoiceDate" };
        }
        break;

      default:
        groupId = {
          $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
        };
    }

    const salesByOutlets = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            outletId: "$outletId",
            timeKey: groupId,
          },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.timeKey": 1 } },
      {
        $lookup: {
          from: "outlets",
          localField: "_id.outletId",
          foreignField: "_id",
          as: "outlet",
        },
      },
      { $unwind: "$outlet" },
      {
        $project: {
          outletName: "$outlet.name",
          timeKey: "$_id.timeKey",
          total: 1,
        },
      },
    ]);

    // ✅ Labels Generation
    let labels: string[] = [];

    switch (reportDuration) {
      case "DAILY":
        labels = Array.from({ length: 24 }, (_, i) =>
          i.toString().padStart(2, "0") + ":00"
        );
        break;

      case "WEEKLY":
        labels = [
          "Sunday", "Monday", "Tuesday", "Wednesday",
          "Thursday", "Friday", "Saturday"
        ];
        break;

      case "MONTHLY":
        const daysInMonth = end.getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) =>
          (i + 1).toString().padStart(2, "0")
        );
        break;

      case "YEARLY":
        labels = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        break;

      case "CUSTUM":
        if (differenceInDays <= 31) {
          // ✅ Per Day Labels
          const tempDate = new Date(start);
          while (tempDate <= end) {
            labels.push(tempDate.toISOString().split("T")[0]);
            tempDate.setDate(tempDate.getDate() + 1);
          }
        } else {
          // ✅ Month Labels
          labels = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];
        }
        break;
    }

    const chartColors = [
      "#FF6384", "#36A2EB", "#FFCE56",
      "#4BC0C0", "#9966FF", "#FF9F40",
      "#8BC34A", "#E91E63", "#00BCD4",
    ];

    const outlets = [...new Set(salesByOutlets.map((s) => s.outletName))];

    const datasets = outlets.map((outlet, index) => {
      const outletData = salesByOutlets.filter((s) => s.outletName === outlet);

      const data = labels.map((label, idx) => {
        let keyVal;

        switch (reportDuration) {
          case "DAILY":
            keyVal = idx;
            break;

          case "WEEKLY":
            keyVal = idx + 1;
            break;

          case "MONTHLY":
          case "YEARLY":
            keyVal = idx + 1;
            break;

          case "CUSTUM":
            if (differenceInDays <= 31) {
              keyVal = label; // date string
            } else {
              keyVal = idx + 1; // month number
            }
            break;

          default:
            keyVal = label;
        }

        const found = outletData.find((d) => d.timeKey === keyVal);
        return found ? found.total : 0;
      });

      return {
        label: outlet,
        data,
        borderColor: chartColors[index % chartColors.length],
        backgroundColor: chartColors[index % chartColors.length] + "55",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      };
    });

    return res.status(httpStatus.OK).send({
      message: "Outlets sales chart data fetched successfully.",
      data: { labels, datasets },
      status: true,
      code: "OK",
      issue: null,
    });
  }
);

const getGiftCardChartDataReportByOutlets = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const { outletIds, startDate, endDate, reportDuration } = req.query;

    if (!outletIds) {
      throw new ApiError(httpStatus.BAD_REQUEST, "outletIds are required");
    }

    const outletArray = (Array.isArray(outletIds)
      ? outletIds
      : (outletIds as string).split(",")
    ).map((id: any) => new mongoose.Types.ObjectId(id));

    if (!startDate || !endDate || !reportDuration) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "startDate, endDate, reportDuration are required"
      );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const differenceInDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const isCustomDaily =
      reportDuration === "CUSTUM" && differenceInDays <= 31;

    // --------------------------
    // 📌 Match Filter
    // --------------------------
    const matchFilter = {
      outletId: { $in: outletArray },
      isDeleted: false,
      giftCardCode: { $exists: true, $ne: null },
      invoiceDate: { $gte: start, $lte: end },
    };

    // --------------------------
    // 📌 Labels Builder
    // --------------------------
    let labels: string[] = [];

    if (reportDuration === "DAILY") {
      labels = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0") + ":00"
      );
    }

    else if (reportDuration === "WEEKLY") {
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(end);
        d.setDate(end.getDate() - (6 - i));
        return d.toLocaleDateString("en-US", { weekday: "long" });
      });
    }

    else if (reportDuration === "MONTHLY") {
      let temp = new Date(start);
      while (temp <= end) {
        labels.push(temp.getDate().toString().padStart(2, "0"));
        temp.setDate(temp.getDate() + 1);
      }
    }

    else if (reportDuration === "YEARLY") {
      labels = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];
    }

    else if (reportDuration === "CUSTUM") {
      if (isCustomDaily) {
        let temp = new Date(start);
        while (temp <= end) {
          labels.push(temp.toISOString().split("T")[0]);
          temp.setDate(temp.getDate() + 1);
        }
      } else {
        labels = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
      }
    }

    // --------------------------
    // 📌 Group Logic
    // --------------------------
    const getGroupId = () => {
      if (reportDuration === "DAILY") return { $hour: "$invoiceDate" };
      if (reportDuration === "WEEKLY") return { $dayOfWeek: "$invoiceDate" };
      if (reportDuration === "MONTHLY") return { $dayOfMonth: "$invoiceDate" };
      if (reportDuration === "YEARLY") return { $month: "$invoiceDate" };

      if (reportDuration === "CUSTUM") {
        if (isCustomDaily) {
          return { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } };
        } else {
          return { $month: "$invoiceDate" };
        }
      }
    };

    // --------------------------
    // 📌 Aggregation
    // --------------------------
    const giftCardSalesByOutlets = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            outletId: "$outletId",
            timeKey: getGroupId(),
          },
          totalGiftCard: { $sum: "$giftCardDiscount" },
        },
      },
      { $sort: { "_id.timeKey": 1 } },
      {
        $lookup: {
          from: "outlets",
          localField: "_id.outletId",
          foreignField: "_id",
          as: "outlet",
        },
      },
      { $unwind: "$outlet" },
      {
        $project: {
          outletName: "$outlet.name",
          timeKey: "$_id.timeKey",
          totalGiftCard: 1,
        },
      },
    ]);

    // --------------------------
    // 📌 Dataset Builder
    // --------------------------
    const outlets = [...new Set(giftCardSalesByOutlets.map((s) => s.outletName))];

    const chartColors = [
      "#FF6384","#36A2EB","#FFCE56",
      "#4BC0C0","#9966FF","#FF9F40",
    ];

    const datasets = outlets.map((outlet, index) => {
      const outletData = giftCardSalesByOutlets.filter(
        (s) => s.outletName === outlet
      );

      const data = labels.map((label, idx) => {
        let keyVal: any;

        if (reportDuration === "DAILY") keyVal = idx;
        else if (reportDuration === "WEEKLY") keyVal = idx + 1;
        else if (reportDuration === "MONTHLY") keyVal = parseInt(label);
        else if (reportDuration === "YEARLY") keyVal = idx + 1;

        else if (reportDuration === "CUSTUM") {
          if (isCustomDaily) keyVal = label;
          else keyVal = idx + 1;
        }

        const found = outletData.find((d) => d.timeKey === keyVal);
        return found ? found.totalGiftCard : 0;
      });

      return {
        label: outlet,
        data,
        borderColor: chartColors[index % chartColors.length],
        backgroundColor: chartColors[index % chartColors.length] + "55",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      };
    });

    return res.status(httpStatus.OK).send({
      message: "Gift card sales chart data fetched successfully.",
      data: { labels, datasets },
      status: true,
      code: "OK",
      issue: null,
    });
  }
);


// const getGiftCardChartDataReportByOutlets = catchAsync(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { outletIds, startDate, endDate, reportDuration } = req.query;

//     if (!outletIds) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "outletIds are required");
//     }

//     const outletArray = (Array.isArray(outletIds)
//       ? outletIds
//       : (outletIds as string).split(",")
//     ).map((id: any) => new mongoose.Types.ObjectId(id));

//     // 📌 Date filter
//     const invoiceDateFilter: Record<string, any> = {};
//     if (startDate) invoiceDateFilter.$gte = new Date(startDate as string);
//     if (endDate) {
//       const end = new Date(endDate as string);
//       end.setHours(23, 59, 59, 999);
//       invoiceDateFilter.$lte = end;
//     }

//     // 📌 Match invoices that have gift cards
//     const matchFilter = {
//       outletId: { $in: outletArray },
//       isDeleted: false,
//       giftCardCode: { $exists: true, $ne: null }, // ✅ only gift card invoices
//       ...(Object.keys(invoiceDateFilter).length
//         ? { invoiceDate: invoiceDateFilter }
//         : {}),
//     };

//     // 📌 Grouping key
//     let groupId: any = {
//       $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
//     };
//     if (reportDuration === "DAILY") groupId = { $hour: "$invoiceDate" };
//     else if (reportDuration === "WEEKLY") groupId = { $dayOfWeek: "$invoiceDate" };
//     else if (reportDuration === "MONTHLY") groupId = { $dayOfMonth: "$invoiceDate" };

//     // 📌 Aggregation: Gift Card Sales by Outlet + Time
//     const giftCardSalesByOutlets = await Invoice.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: {
//             outletId: "$outletId",
//             timeKey: groupId,
//           },
//           totalGiftCard: { $sum: "$giftCardDiscount" }, // 🔹 using giftCardDiscount field
//           count: { $sum: 1 }, // 🔹 number of gift card invoices
//         },
//       },
//       { $sort: { "_id.timeKey": 1 } },
//       {
//         $lookup: {
//           from: "outlets",
//           localField: "_id.outletId",
//           foreignField: "_id",
//           as: "outlet",
//         },
//       },
//       { $unwind: "$outlet" },
//       {
//         $project: {
//           outletName: "$outlet.name",
//           timeKey: "$_id.timeKey",
//           totalGiftCard: 1,
//           count: 1,
//         },
//       },
//     ]);

//     // 📌 Labels (same logic)
//     let labels: string[] = [];
//     if (reportDuration === "DAILY") {
//       labels = Array.from({ length: 24 }, (_, i) =>
//         i.toString().padStart(2, "0") + ":00"
//       );
//     } else if (reportDuration === "WEEKLY") {
//       labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//     } else if (reportDuration === "MONTHLY") {
//       const now = new Date();
//       const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
//       labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, "0"));
//     }

//     // 🎨 Colors
//     const chartColors = [
//       "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
//       "#9966FF", "#FF9F40", "#8BC34A", "#E91E63", "#00BCD4",
//     ];

//     // 📌 Format datasets (one dataset per outlet)
//     const outlets = [...new Set(giftCardSalesByOutlets.map((s) => s.outletName))];
//     const datasets = outlets.map((outlet, index) => {
//       const outletData = giftCardSalesByOutlets.filter((s) => s.outletName === outlet);

//       const data = labels.map((_, idx) => {
//         let keyVal;
//         if (reportDuration === "DAILY") keyVal = idx;
//         else if (reportDuration === "WEEKLY") keyVal = idx + 1;
//         else if (reportDuration === "MONTHLY") keyVal = idx + 1;
//         else keyVal = labels[idx];

//         const found = outletData.find(
//           (d) => d.timeKey === keyVal || d.timeKey === labels[idx]
//         );
//         return found ? found.totalGiftCard : 0;
//       });

//       return {
//         label: outlet,
//         data,
//         borderColor: chartColors[index % chartColors.length],
//         backgroundColor: chartColors[index % chartColors.length] + "55",
//         borderWidth: 2,
//         fill: false,
//         tension: 0.4,
//       };
//     });

//     return res.status(httpStatus.OK).send({
//       message: "Gift card sales chart data fetched successfully.",
//       data: {
//         labels,
//         datasets,
//       },
//       status: true,
//       code: "OK",
//       issue: null,
//     });
//   }
// );

const getGiftCardDataReportByOutlets = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate, reportDuration } = req.query;

    if (!reportDuration) {
      throw new ApiError(400, "reportDuration is required");
    }

    let start: Date;
    let end: Date;

    const today = new Date();

    // --------------------------
    // 📌 Date Range Builder
    // --------------------------
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (reportDuration) {
        case "DAILY":
          start = startOfDay(today);
          end = endOfDay(today);
          break;

        case "WEEKLY":
          start = startOfWeek(today, { weekStartsOn: 1 });
          end = endOfWeek(today, { weekStartsOn: 1 });
          break;

        case "MONTHLY":
          start = startOfMonth(today);
          end = endOfMonth(today);
          break;

        case "YEARLY":
          start = startOfYear(today);
          end = endOfYear(today);
          break;

        default:
          start = startOfMonth(today);
          end = endOfMonth(today);
      }
    }

    const differenceInDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const isCustomDaily =
      reportDuration === "CUSTUM" && differenceInDays <= 31;

    // --------------------------
    // 📌 Match Filter
    // --------------------------
    const matchFilter: any = {
      isDeleted: false,
      giftCardDiscount: { $gt: 0 },
      invoiceDate: { $gte: start, $lte: end },
    };

    // --------------------------
    // 1️⃣ Customer Insights
    // --------------------------
    const customerInsights = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$customerId",
          totalPurchased: { $sum: 1 },
          totalAmount: { $sum: "$giftCardDiscount" },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $project: {
          _id: 0,
          name: { $arrayElemAt: ["$customer.customerName", 0] },
          totalPurchased: 1,
          totalAmount: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // --------------------------
    // 2️⃣ Outlet Performance
    // --------------------------
    const outletPerformance = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$outletId",
          totalSales: { $sum: "$giftCardDiscount" },
          totalCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "outlets",
          localField: "_id",
          foreignField: "_id",
          as: "outlet",
        },
      },
      {
        $project: {
          _id: 0,
          name: { $arrayElemAt: ["$outlet.name", 0] },
          totalSales: 1,
          totalCount: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    // --------------------------
    // 3️⃣ GiftCard Distribution
    // --------------------------
    const giftCardDistribution = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$giftCardDiscount",
          count: { $sum: 1 },
          totalValue: { $sum: "$giftCardDiscount" },
        },
      },
      {
        $project: {
          _id: 0,
          discount: "$_id",
          count: 1,
          totalValue: 1,
        },
      },
      { $sort: { discount: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      period: {
        reportDuration,
        start,
        end,
        isCustomDaily,
      },
      data: {
        customerInsights,
        outletPerformance,
        giftCardDistribution,
      },
    });
  }
);

// const getRetailDashboardData = catchAsync(async (req: Request, res: Response) => {
//   const { outletIds, startDate, endDate, reportDuration } = req.query;

//   if (!startDate || !endDate || !outletIds || !reportDuration) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "outletIds, startDate, endDate and reportDuration are required"
//     );
//   }

//   const start = new Date(startDate as string);
//   const end = new Date(endDate as string);

//   // convert ids array
//   const outletObjectIds = (outletIds as string).split(",").map((id) => new mongoose.Types.ObjectId(id));

//   // 🔹 Previous period calculation
//   let prevStart: Date;
//   let prevEnd: Date;

//   if (reportDuration === "DAILY") {
//     prevStart = new Date(start);
//     prevStart.setDate(prevStart.getDate() - 1);
//     prevEnd = new Date(start);
//   } else if (reportDuration === "WEEKLY") {
//     prevStart = new Date(start);
//     prevStart.setDate(prevStart.getDate() - 7);
//     prevEnd = new Date(start);
//   } else if (reportDuration === "MONTHLY") {
//     prevStart = new Date(start);
//     prevStart.setMonth(prevStart.getMonth() - 1);
//     prevEnd = new Date(start);
//   } else {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid reportDuration (DAILY/WEEKLY/MONTHLY)");
//   }

//   // 🔹 Current revenues per outlet
//   const currentRevenues = await Invoice.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         invoiceDate: { $gte: start, $lte: end },
//       },
//     },
//     {
//       $group: {
//         _id: "$outletId",
//         revenue: { $sum: "$totalAmount" },
//       },
//     },
//     {
//       $lookup: {
//         from: "outlets", // 👈 collection ka naam check kar le
//         localField: "_id",
//         foreignField: "_id",
//         as: "outlet",
//       },
//     },
//     { $unwind: "$outlet" },
//     {
//       $project: {
//         _id: 0,
//         outletId: "$_id",
//         outletName: "$outlet.name",
//         revenue: 1,
//       },
//     },
//   ]);

//   // 🔹 Previous revenues (for comparison)
//   const prevRevenues = await Invoice.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         invoiceDate: { $gte: prevStart, $lte: prevEnd },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         revenue: { $sum: "$totalAmount" },
//       },
//     },
//   ]);

//   // Helper to calculate diff
//   const calc = (current: number, previous: number) => {
//   const diff = current - previous;
//   let percent: number;
//   if (previous === 0) {
//     percent = current === 0 ? 0 : 100;
//   } else {
//     percent = parseFloat(((diff / previous) * 100).toFixed(2));
//   }
//   return { value: current, diff, percent };
// };


// // 🔹 Total revenues
// const totalCurrentRevenue = currentRevenues.reduce((sum, o) => sum + o.revenue, 0);
// const totalPrevRevenue = prevRevenues.length > 0 ? prevRevenues[0].revenue : 0;
// const totalRevenueStats = calc(totalCurrentRevenue, totalPrevRevenue);
// console.log('--------dddd',totalCurrentRevenue,totalPrevRevenue,totalRevenueStats)

//   res.status(200).json({
//     success: true,
//     data: {
//       outlets: currentRevenues, // har outlet ka name + revenue
//       totalRevenue: totalRevenueStats, // total + diff + percent
//     },
//   });
// });

// const getRetailDashboardData = catchAsync(async (req: Request, res: Response) => {
//   const { outletIds, startDate, endDate, reportDuration } = req.query;

//   if (!startDate || !endDate || !outletIds || !reportDuration) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "outletIds, startDate, endDate and reportDuration are required"
//     );
//   }

//   const start = new Date(startDate as string);
//   const end = new Date(endDate as string);

//   // convert ids array
//   const outletObjectIds = (outletIds as string)
//     .split(",")
//     .map((id) => new mongoose.Types.ObjectId(id));

//   // Previous period calculation
//   let prevStart: Date;
//   let prevEnd: Date;

//   if (reportDuration === "DAILY") {
//     prevStart = new Date(start);
//     prevStart.setDate(prevStart.getDate() - 1);
//     prevEnd = new Date(start);
//   } else if (reportDuration === "WEEKLY") {
//     prevStart = new Date(start);
//     prevStart.setDate(prevStart.getDate() - 7);
//     prevEnd = new Date(start);
//   } else if (reportDuration === "MONTHLY") {
//     prevStart = new Date(start);
//     prevStart.setMonth(prevStart.getMonth() - 1);
//     prevEnd = new Date(start);
//   } else {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid reportDuration (DAILY/WEEKLY/MONTHLY)");
//   }

//   // 🔹 Current revenues per outlet
//   const currentRevenues = await Invoice.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         invoiceDate: { $gte: start, $lte: end },
//       },
//     },
//     {
//       $group: {
//         _id: "$outletId",
//         revenue: { $sum: "$totalAmount" },
//         saleCount: { $sum: 1 }, // <-- number of invoices = sales
//       },
//     },
//     {
//       $lookup: {
//         from: "outlets",
//         localField: "_id",
//         foreignField: "_id",
//         as: "outlet",
//       },
//     },
//     { $unwind: "$outlet" },
//     {
//       $project: {
//         _id: 0,
//         outletId: "$_id",
//         outletName: "$outlet.name",
//         revenue: 1,
//         saleCount: 1, // <-- include sale count
//       },
//     },
//   ]);

//   // 🔹 Previous revenues for comparison
//   const prevRevenues = await Invoice.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         invoiceDate: { $gte: prevStart, $lte: prevEnd },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         revenue: { $sum: "$totalAmount" },
//         saleCount: { $sum: 1 }, // <-- previous sale count
//       },
//     },
//   ]);

//   const calc = (current: number, previous: number) => {
//     const diff = current - previous;
//     let percent: number;
//     if (previous === 0) {
//       percent = current === 0 ? 0 : 100;
//     } else {
//       percent = parseFloat(((diff / previous) * 100).toFixed(2));
//     }
//     return { value: current, diff, percent };
//   };

//   // 🔹 Total revenues
//   const totalCurrentRevenue = currentRevenues.reduce((sum, o) => sum + o.revenue, 0);
//   const totalPrevRevenue = prevRevenues.length > 0 ? prevRevenues[0].revenue : 0;
//   const totalRevenueStats = calc(totalCurrentRevenue, totalPrevRevenue);

//   // 🔹 Total sale counts
//   const totalCurrentSaleCount = currentRevenues.reduce((sum, o) => sum + o.saleCount, 0);
//   const totalPrevSaleCount = prevRevenues.length > 0 ? prevRevenues[0].saleCount : 0;
//   const totalSaleCountStats = calc(totalCurrentSaleCount, totalPrevSaleCount);

//   res.status(200).json({
//     success: true,
//     data: {
//       outlets: currentRevenues, // each outlet: name, revenue, saleCount
//       totalRevenue: totalRevenueStats, // total revenue + diff + percent
//       totalSaleCount: totalSaleCountStats, // total sales + diff + percent
//     },
//   });
// });

// const getRetailDashboardData = catchAsync(async (req: Request, res: Response) => {
//   const { outletIds, startDate, endDate } = req.query;

//   if (!startDate || !endDate || !outletIds) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "outletIds, startDate and endDate are required"
//     );
//   }

//   // 🔹 Set start & end to cover full days
//   const start = new Date(startDate as string);
//   start.setHours(0, 0, 0, 0);

//   const end = new Date(endDate as string);
//   end.setHours(23, 59, 59, 999);

//   // 🔹 Convert ids array
//   const outletObjectIds = (outletIds as string)
//     .split(",")
//     .map((id) => new mongoose.Types.ObjectId(id));

//   // 🔹 Fetch all requested outlets
//   const allOutlets = await Outlet.find({ _id: { $in: outletObjectIds } });

//   // 🔹 Aggregate invoices for revenue, sales, gross profit
//   const invoiceAgg = await Invoice.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         invoiceDate: { $gte: start, $lte: end },
//       },
//     },
//     {
//       $group: {
//         _id: "$outletId",
//         revenue: { $sum: "$totalAmount" },
//         saleCount: { $sum: 1 },
//         grossProfit: { $sum: "$grossProfit" },
//       },
//     },
//   ]);

//   // 🔹 Aggregate customers
//   const customerAgg = await Customer.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         createdAt: { $gte: start, $lte: end },
//       },
//     },
//     {
//       $group: {
//         _id: "$outletId",
//         customerCount: { $sum: 1 },
//       },
//     },
//   ]);

//   // 🔹 Previous day totals for percentage
//   const prevStart = new Date(start);
//   prevStart.setDate(prevStart.getDate() - 1);
//   prevStart.setHours(0, 0, 0, 0);

//   const prevEnd = new Date(start);
//   prevEnd.setDate(prevEnd.getDate() - 1);
//   prevEnd.setHours(23, 59, 59, 999);

//   const prevInvoiceAgg = await Invoice.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         invoiceDate: { $gte: prevStart, $lte: prevEnd },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         revenue: { $sum: "$totalAmount" },
//         saleCount: { $sum: 1 },
//         grossProfit: { $sum: "$grossProfit" },
//       },
//     },
//   ]);

//   const prevCustomerAgg = await Customer.aggregate([
//     {
//       $match: {
//         outletId: { $in: outletObjectIds },
//         createdAt: { $gte: prevStart, $lte: prevEnd },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         customerCount: { $sum: 1 },
//       },
//     },
//   ]);

//   // 🔹 Helper to calculate percentage change
//   const calc = (current: number, previous: number) => {
//     const diff = current - previous;
//     let percent = 0;
//     if (previous === 0) {
//       percent = current === 0 ? 0 : 100;
//     } else {
//       percent = parseFloat(((diff / previous) * 100).toFixed(2));
//     }
//     return { value: current, diff, percent };
//   };

//   // 🔹 Merge data per outlet (default 0 if missing)
//   const outletsData = allOutlets.map((o:any) => {
//     const inv = invoiceAgg.find((i) => i._id.toString() === o._id.toString()) || {
//       revenue: 0,
//       saleCount: 0,
//       grossProfit: 0,
//     };
//     const cust = customerAgg.find((c) => c._id.toString() === o._id.toString()) || {
//       customerCount: 0,
//     };

//     return {
//       outletId: o._id,
//       outletName: o.name,
//       revenue: inv.revenue,
//       saleCount: inv.saleCount,
//       grossProfit: inv.grossProfit,
//       customerCount: cust.customerCount,
//     };
//   });

//   // 🔹 Calculate totals with percentage
//   const totalRevenueStats = calc(
//     outletsData.reduce((sum:any, o:any) => sum + o.revenue, 0),
//     prevInvoiceAgg.length > 0 ? prevInvoiceAgg[0].revenue : 0
//   );

//   const totalSaleCountStats = calc(
//     outletsData.reduce((sum:any, o:any) => sum + o.saleCount, 0),
//     prevInvoiceAgg.length > 0 ? prevInvoiceAgg[0].saleCount : 0
//   );

//   const totalCustomerCountStats = calc(
//     outletsData.reduce((sum:any, o:any) => sum + o.customerCount, 0),
//     prevCustomerAgg.length > 0 ? prevCustomerAgg[0].customerCount : 0
//   );

//   const totalGrossProfitStats = calc(
//     outletsData.reduce((sum:any, o:any) => sum + o.grossProfit, 0),
//     prevInvoiceAgg.length > 0 ? prevInvoiceAgg[0].grossProfit : 0
//   );

//   res.status(200).json({
//     success: true,
//     data: {
//       outlets: outletsData,
//       totalRevenue: totalRevenueStats,
//       totalSaleCount: totalSaleCountStats,
//       totalCustomerCount: totalCustomerCountStats,
//       totalGrossProfit: totalGrossProfitStats,
//     },
//   });
// });


const getRetailDashboardData = catchAsync(async (req: Request, res: Response) => {
  const { outletIds, startDate, endDate, reportDuration } = req.query;

  if (!startDate || !endDate || !outletIds) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "outletIds, startDate and endDate are required"
    );
  }

  // 🔹 Current Range
  const start = new Date(startDate as string);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  const differenceInDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 🔹 SMART PREVIOUS PERIOD LOGIC
  let prevStart = new Date(start);
  let prevEnd = new Date(end);

  switch (reportDuration) {
    case "YEARLY":
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      prevEnd.setFullYear(prevEnd.getFullYear() - 1);
      break;

    case "MONTHLY":
      prevStart.setMonth(prevStart.getMonth() - 1);
      prevEnd.setMonth(prevEnd.getMonth() - 1);
      break;

    case "WEEKLY":
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd.setDate(prevEnd.getDate() - 7);
      break;

    case "CUSTUM":
      prevStart.setDate(prevStart.getDate() - differenceInDays);
      prevEnd.setDate(prevEnd.getDate() - differenceInDays);
      break;

    case "DAILY":
    default:
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd.setDate(prevEnd.getDate() - 1);
      break;
  }

  prevStart.setHours(0, 0, 0, 0);
  prevEnd.setHours(23, 59, 59, 999);

  // 🔹 Convert outlet IDs
  const outletObjectIds = (outletIds as string)
    .split(",")
    .map(id => new mongoose.Types.ObjectId(id));

  const allOutlets = await Outlet.find({ _id: { $in: outletObjectIds } });

  // 🔹 CURRENT DATA
  const invoiceAgg = await Invoice.aggregate([
    { $match: { outletId: { $in: outletObjectIds }, invoiceDate: { $gte: start, $lte: end } } },
    { $group: { _id: "$outletId", revenue: { $sum: "$totalAmount" }, saleCount: { $sum: 1 } } },
  ]);

  const payoutAgg = await SalesRegister.aggregate([
    { $match: { outletId: { $in: outletObjectIds }, openedAt: { $gte: start, $lte: end } } },
    { $unwind: { path: "$cashUsage", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$outletId", totalPayout: { $sum: { $ifNull: ["$cashUsage.amount", 0] } } } },
  ]);

  const customerAgg = await Customer.aggregate([
    { $unwind: "$outlets" },
    {
      $addFields: {
        createdAtDate: {
          $cond: [
            { $eq: [{ $type: "$createdAt" }, "string"] },
            { $dateFromString: { dateString: "$createdAt", format: "%Y-%m-%d %H:%M:%S" } },
            "$createdAt"
          ]
        }
      }
    },
    {
      $match: {
        outlets: { $in: outletObjectIds },
        createdAtDate: { $gte: start, $lte: end }
      }
    },
    { $group: { _id: "$outlets", customerCount: { $sum: 1 } } }
  ]);

  // 🔹 PREVIOUS DATA
  const prevInvoiceAgg = await Invoice.aggregate([
    { $match: { outletId: { $in: outletObjectIds }, invoiceDate: { $gte: prevStart, $lte: prevEnd } } },
    { $group: { _id: "$outletId", revenue: { $sum: "$totalAmount" }, saleCount: { $sum: 1 } } },
  ]);

  const prevPayoutAgg = await SalesRegister.aggregate([
    { $match: { outletId: { $in: outletObjectIds }, openedAt: { $gte: prevStart, $lte: prevEnd } } },
    { $unwind: { path: "$cashUsage", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$outletId", totalPayout: { $sum: "$cashUsage.amount" } } },
  ]);

  const prevCustomerAgg = await Customer.aggregate([
    { $unwind: "$outlets" },
    {
      $addFields: {
        createdAtDate: {
          $cond: [
            { $eq: [{ $type: "$createdAt" }, "string"] },
            { $dateFromString: { dateString: "$createdAt", format: "%Y-%m-%d %H:%M:%S" } },
            "$createdAt"
          ]
        }
      }
    },
    {
      $match: {
        outlets: { $in: outletObjectIds },
        createdAtDate: { $gte: prevStart, $lte: prevEnd }
      }
    },
    { $group: { _id: "$outlets", customerCount: { $sum: 1 } } }
  ]);

  const calc = (current: number, previous: number) => {
    const diff = current - previous;
    const percent =
      previous === 0 ? (current === 0 ? 0 : 100)
      : parseFloat(((diff / previous) * 100).toFixed(2));
    return { value: current, diff, percent };
  };

  const outletsData = allOutlets.map((o: any) => {
    const inv = invoiceAgg.find(i => i._id.toString() === o._id.toString()) || { revenue: 0, saleCount: 0 };
    const payout = payoutAgg.find(p => p._id.toString() === o._id.toString());
    const grossProfit = inv.revenue - (payout ? payout.totalPayout : 0);

    const cust = customerAgg.find(c => c._id.toString() === o._id.toString()) || { customerCount: 0 };
    const prevInv = prevInvoiceAgg.find(i => i._id.toString() === o._id.toString()) || { revenue: 0, saleCount: 0 };
    const prevPayout = prevPayoutAgg.find(p => p._id.toString() === o._id.toString());
    const prevGrossProfit = prevInv.revenue - (prevPayout ? prevPayout.totalPayout : 0);
    const prevCust = prevCustomerAgg.find(c => c._id.toString() === o._id.toString()) || { customerCount: 0 };

    return {
      outletId: o._id,
      outletName: o.name,
      revenue: inv.revenue,
      saleCount: inv.saleCount,
      grossProfit,
      customerCount: cust.customerCount,
      revenuePercent: calc(inv.revenue, prevInv.revenue).percent,
      saleCountPercent: calc(inv.saleCount, prevInv.saleCount).percent,
      grossProfitPercent: calc(grossProfit, prevGrossProfit).percent,
      customerCountPercent: calc(cust.customerCount, prevCust.customerCount).percent,
    };
  });

  const totalRevenueStats = calc(
    outletsData.reduce((sum, o) => sum + o.revenue, 0),
    prevInvoiceAgg.reduce((sum, o) => sum + o.revenue, 0)
  );

  const totalSaleCountStats = calc(
    outletsData.reduce((sum, o) => sum + o.saleCount, 0),
    prevInvoiceAgg.reduce((sum, o) => sum + o.saleCount, 0)
  );

  const totalCustomerCountStats = calc(
    outletsData.reduce((sum, o) => sum + o.customerCount, 0),
    prevCustomerAgg.reduce((sum, o) => sum + o.customerCount, 0)
  );

  const totalGrossProfitStats = calc(
    outletsData.reduce((sum, o) => sum + o.grossProfit, 0),
    prevInvoiceAgg.reduce((sum, o) => sum + o.revenue, 0)
  );

  res.status(200).json({
    success: true,
    data: {
      outlets: outletsData,
      totalRevenue: totalRevenueStats,
      totalSaleCount: totalSaleCountStats,
      totalCustomerCount: totalCustomerCountStats,
      totalGrossProfit: totalGrossProfitStats,
    },
  });
});



// const getPaymentReports = catchAsync(
//   async (req: any, res: any) => {
//     const { startDate, endDate, outletId } = req.query;

//     if (!startDate || !endDate || !outletId) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         "startDate, endDate, and outletId are required"
//       );
//     }

//     const start = new Date(startDate as string);
//     start.setHours(0, 0, 0, 0);

//     const end = new Date(endDate as string);
//     end.setHours(23, 59, 59, 999);

//     const matchFilter = {
//       isDeleted: false,
//       outletId: new mongoose.Types.ObjectId(outletId),
//       invoiceDate: { $gte: start, $lte: end },
//     };

//     // 1️⃣ Aggregate invoices by week (Monday start) & payment mode
//     const weeklyData = await Invoice.aggregate([
//       { $match: matchFilter },
//       { $unwind: "$amountReceived" },
//       {
//         $addFields: {
//           weekStartDate: {
//             $dateTrunc: {
//               date: "$invoiceDate",
//               unit: "week",
//               startOfWeek: "Mon",
//               timezone: "Asia/Kolkata", // adjust your local timezone
//             },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             weekStartDate: "$weekStartDate",
//             paymentModeId: "$amountReceived.paymentModeId",
//           },
//           totalAmount: { $sum: "$amountReceived.amount" },
//         },
//       },
//       {
//         $lookup: {
//           from: "paymentmodes",
//           localField: "_id.paymentModeId",
//           foreignField: "_id",
//           as: "paymentMode",
//         },
//       },
//       { $unwind: "$paymentMode" },
//       {
//         $project: {
//           _id: 0,
//           weekStartDate: "$_id.weekStartDate",
//           paymentModeId: "$_id.paymentModeId",
//           paymentModeName: "$paymentMode.modeName",
//           totalAmount: 1,
//         },
//       },
//       { $sort: { paymentModeName: 1, weekStartDate: 1 } },
//     ]);

//     // 2️⃣ Generate all weeks between start and end (Monday start)
//     const weeks: string[] = [];
//     let tempDate = new Date(start);
//     while (tempDate <= end) {
//       const day = tempDate.getDay(); // 0=Sun,1=Mon
//       const diff = day === 0 ? -6 : 1 - day; // Monday start
//       const weekStart = new Date(tempDate);
//       weekStart.setDate(weekStart.getDate() + diff);
//       const weekStr = weekStart.toISOString().split("T")[0];
//       if (!weeks.includes(weekStr)) weeks.push(weekStr);
//       tempDate.setDate(tempDate.getDate() + 7);
//     }

//     // 3️⃣ Get all active payment modes
//     const paymentModes = await PaymentMode.find({
//       isDeleted: false,
//       isActive: true,
//     }).lean();

//     // 4️⃣ Pivot table: Payment Mode x Week
//     const pivotTable = paymentModes.map((pm: any) => {
//       const row: any = { paymentMode: pm.modeName };
//       let rowTotal = 0;

//       weeks.forEach((w) => {
//         const weekData = weeklyData.find(
//           (d) =>
//             d.paymentModeId.toString() === pm._id.toString() &&
//             new Date(d.weekStartDate).toISOString().split("T")[0] === w
//         );
//         row[w] = weekData ? weekData.totalAmount : 0;
//         rowTotal += weekData ? weekData.totalAmount : 0;
//       });

//       row.total = rowTotal;
//       return row;
//     });

//     res.status(httpStatus.OK).json({
//       success: true,
//       startDate,
//       endDate,
//       weeks,
//       data: pivotTable,
//     });
//   }
// );

const getPaymentReports = catchAsync(async (req: any, res: any) => {
  const { startDate, endDate, outletId, reportDuration } = req.query;

  if (!outletId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "outletId is required");
  }

  const outletObjId = new mongoose.Types.ObjectId(outletId as string);

  let start: Date;
  let end: Date;
  const today = new Date();

  // ✅ SMART DATE LOGIC
  if (startDate && endDate) {
    start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);

    end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
  } else {
    switch (reportDuration) {
      case "YEARLY":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case "MONTHLY":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case "WEEKLY": {
        const current = new Date();
        const day = current.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Monday start
        start = new Date(current.setDate(current.getDate() + diff));
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "DAILY":
      default:
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
    }
  }

  /* =========================================================
     1) INVOICE WEEKLY AGGREGATION
  ========================================================== */

  const weeklyData = await Invoice.aggregate([
    {
      $match: {
        isDeleted: false,
        outletId: outletObjId,
        invoiceDate: { $gte: start, $lte: end },
      },
    },
    { $unwind: "$amountReceived" },
    {
      $addFields: {
        weekStartDate: {
          $dateTrunc: {
            date: "$invoiceDate",
            unit: "week",
            startOfWeek: "Mon",
            timezone: "Asia/Kolkata",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          weekStartDate: "$weekStartDate",
          paymentModeId: "$amountReceived.paymentModeId",
        },
        totalAmount: { $sum: { $ifNull: ["$amountReceived.amount", 0] } },
      },
    },
  ]);

  /* =========================================================
     2) BUILD CONTINUOUS WEEKS
  ========================================================== */

  const weeks: string[] = [];
  const first = new Date(start);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  first.setDate(first.getDate() + diff);

  for (let cur = new Date(first); cur <= end; cur.setDate(cur.getDate() + 7)) {
    weeks.push(cur.toISOString().split("T")[0]);
  }

  /* =========================================================
     3) PAYMENT MODES
  ========================================================== */

  const paymentModes = await PaymentMode.find({
    isDeleted: false,
    isActive: true,
  })
    .select({ _id: 1, modeName: 1 })
    .lean();

  const totals: Record<string, Record<string, number>> = {};

  weeklyData.forEach((d) => {
    const pmId = String(d._id.paymentModeId);
    const w = new Date(d._id.weekStartDate).toISOString().split("T")[0];

    if (!totals[pmId]) totals[pmId] = {};
    totals[pmId][w] = (totals[pmId][w] || 0) + (Number(d.totalAmount) || 0);
  });

  /* =========================================================
     4) CASH USAGE WEEKLY DEDUCTION
  ========================================================== */

  const cashUsageWeekly = await SalesRegister.aggregate([
    {
      $match: {
        isDeleted: false,
        outletId: outletObjId,
      },
    },
    { $unwind: "$cashUsage" },
    {
      $match: {
        "cashUsage.createdAt": { $gte: start, $lte: end },
      },
    },
    {
      $addFields: {
        weekStartDate: {
          $dateTrunc: {
            date: "$cashUsage.createdAt",
            unit: "week",
            startOfWeek: "Mon",
            timezone: "Asia/Kolkata",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          weekStartDate: "$weekStartDate",
          paymentMode: { $toLower: "$cashUsage.paymentMode" },
        },
        totalUsage: { $sum: { $ifNull: ["$cashUsage.amount", 0] } },
      },
    },
  ]);

  const isCardish = (s: string) => {
    const t = s.toLowerCase();
    return t.includes("card") || t.includes("credit") || t.includes("debit");
  };

  let cashPmId: string | null = null;
  let cardPmId: string | null = null;

  for (const pm of paymentModes) {
    if (!cashPmId && pm.modeName.toLowerCase() === "cash") {
      cashPmId = String(pm._id);
    }
    if (!cardPmId && isCardish(pm.modeName)) {
      cardPmId = String(pm._id);
    }
  }

  cashUsageWeekly.forEach((u) => {
    const w = new Date(u._id.weekStartDate).toISOString().split("T")[0];
    const usage = Number(u.totalUsage) || 0;
    const mode = u._id.paymentMode;

    if (mode === "cash" && cashPmId) {
      if (!totals[cashPmId]) totals[cashPmId] = {};
      totals[cashPmId][w] = (totals[cashPmId][w] || 0) - usage;
    } else if (isCardish(mode) && cardPmId) {
      if (!totals[cardPmId]) totals[cardPmId] = {};
      totals[cardPmId][w] = (totals[cardPmId][w] || 0) - usage;
    }
  });

  /* =========================================================
     5) BUILD PIVOT TABLE
  ========================================================== */

  const pivotTable = paymentModes.map((pm: any) => {
    const pmId = String(pm._id);
    const row: any = { paymentMode: pm.modeName };
    let rowTotal = 0;

    weeks.forEach((w) => {
      const amt = totals[pmId]?.[w] ?? 0;
      row[w] = amt;
      rowTotal += amt;
    });

    row.total = rowTotal;
    return row;
  });

  return res.status(httpStatus.OK).json({
    success: true,
    startDate: start,
    endDate: end,
    weeks,
    data: pivotTable,
  });
});

const toObjectId = (v?: string) =>
  v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;

const getSalesLedgerReports = catchAsync(
  async (req: Request, res: Response) => {
    const {
      outletId,
      outletIds,
      startDate,
      endDate,
      reportDuration, // 👈 NEW
      page = "1",
      limit = "20",
      status,
      search = "",
    } = req.query as Record<string, string>;

    /* =========================================================
       ✅ SMART DATE LOGIC
    ========================================================== */

    let start: Date;
    let end: Date;
    const today = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (reportDuration) {
        case "YEARLY":
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;

        case "MONTHLY":
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;

        case "WEEKLY": {
          const current = new Date();
          const day = current.getDay();
          const diff = day === 0 ? -6 : 1 - day; // Monday start
          start = new Date(current.setDate(current.getDate() + diff));
          start.setHours(0, 0, 0, 0);

          end = new Date();
          end.setHours(23, 59, 59, 999);
          break;
        }

        case "DAILY":
        default:
          start = new Date();
          start.setHours(0, 0, 0, 0);
          end = new Date();
          end.setHours(23, 59, 59, 999);
          break;
      }
    }

    /* =========================================================
       🔹 PAGINATION
    ========================================================== */

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 20, 1);

    /* =========================================================
       🔹 OUTLET FILTER
    ========================================================== */

    const outletObjectIds: Types.ObjectId[] = [];

    if (outletId) {
      const oid = toObjectId(outletId);
      if (oid) outletObjectIds.push(oid);
    }

    if (outletIds && outletIds.length) {
      outletIds
        .split(",")
        .map((id) => toObjectId(id))
        .filter((x): x is Types.ObjectId => !!x)
        .forEach((oid) => outletObjectIds.push(oid));
    }

    /* =========================================================
       🔹 BASE MATCH
    ========================================================== */

    const match: Record<string, any> = {
      invoiceDate: { $gte: start, $lte: end },
      isDeleted: { $ne: true },
    };

    if (outletObjectIds.length) {
      match.outletId = { $in: outletObjectIds };
    }

    if (status) {
      match.status = status;
    }

    /* =========================================================
       🔹 PIPELINE
    ========================================================== */

  const pipeline: any[] = [
  { $match: match },

  // USER
 {
  $addFields: {
    employeeObjectId: {
      $cond: [
        { $eq: [{ $type: "$employeeId" }, "objectId"] },
        "$employeeId",
        { $toObjectId: "$employeeId" }
      ]
    }
  }
},
{
  $lookup: {
    from: "users",
    localField: "employeeObjectId",
    foreignField: "_id",
    as: "user",
  },
},
{ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

  // REGISTER
  {
    $lookup: {
      from: "salesregisters",
      localField: "registerId",
      foreignField: "_id",
      as: "register",
    },
  },
  { $unwind: { path: "$register", preserveNullAndEmptyArrays: true } },

  // CUSTOMER
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer",
    },
  },
  { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

  // 🔥 FIX 1: SAFE TOTAL CALCULATION
  {
    $addFields: {
      computedTotalAmount: {
        $cond: [
          { $gt: ["$totalAmount", 0] },
          "$totalAmount",
          {
            $sum: {
              $map: {
                input: { $ifNull: ["$items", []] },
                as: "item",
                in: {
                  $multiply: [
                    { $ifNull: ["$$item.quantity", 0] },
                    { $ifNull: ["$$item.sellingPrice", 0] },
                  ],
                },
              },
            },
          },
        ],
      },

      computedPaidAmount: {
        $sum: {
          $map: {
            input: { $ifNull: ["$amountReceived", []] },
            as: "pay",
            in: { $ifNull: ["$$pay.amount", 0] },
          },
        },
      },
    },
  },

  // 🔥 FIX 2: SAFE STATUS LOGIC
  {
    $addFields: {
      finalStatus: {
        $cond: [
          {
            $or: [
              { $eq: ["$isDeleted", true] },
              {
                $and: [
                  { $ne: [{ $ifNull: ["$voidNote", ""] }, ""] },
                  { $ne: ["$voidNote", null] },
                ],
              },
            ],
          },
          "Void",
          {
            $cond: [
              { $gt: ["$balanceDue", 0] },
              "Pending",
              "Paid",
            ],
          },
        ],
      },
    },
  },

  // SEARCH
  ...(search
    ? [
        {
          $match: {
            $or: [
              { invoiceNumber: { $regex: search, $options: "i" } },
              { notes: { $regex: search, $options: "i" } },
              { "customer.name": { $regex: search, $options: "i" } },
              { "customer.fullName": { $regex: search, $options: "i" } },
            ],
          },
        },
      ]
    : []),

  // FINAL PROJECTION
  {
    $project: {
      _id: 1,
      date: "$invoiceDate",
      invoiceNumber: 1,

      userName: {
        $ifNull: ["$user.name", { $ifNull: ["$user.name", "-"] }],
      },

      registerCode: {
        $ifNull: ["$register.code", { $ifNull: ["$register.name", ""] }],
      },

      customerName: {
        $ifNull: [
          "$customer.customerName",
          {
            $ifNull: [
              "$customer.customerName",
              { $ifNull: ["$customer.phone", ""] },
            ],
          },
        ],
      },

      note: { $ifNull: ["$notes", ""] },
      status: "$finalStatus",
      totalAmount: "$computedTotalAmount",
      paidAmount: "$computedPaidAmount",
      balanceDue: {
        $subtract: ["$computedTotalAmount", "$computedPaidAmount"],
      },
    },
  },

  { $sort: { date: -1 } },

  {
    $facet: {
      rows: [
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
      ],
      meta: [{ $count: "total" }],
      totals: [
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
          },
        },
      ],
    },
  },
];

    const agg = await (Invoice as any).aggregate(pipeline);

    const rows = agg?.[0]?.rows || [];
    console.log('-----rows',rows)
    const totalCount = agg?.[0]?.meta?.[0]?.total || 0;
    const totalsDoc = agg?.[0]?.totals?.[0] || { totalAmount: 0 };

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totals: {
        totalAmount: totalsDoc.totalAmount || 0,
      },
      data: rows.map((r: any) => ({
        id: r._id,
        date: r.date,
        user: r.userName || "-",
        register: r.registerCode || "-",
        customer: r.customerName || "-",
        note: r.note || "",
        status: r.status || "Paid",
        total: r.totalAmount || 0,
        invoiceNumber: r.invoiceNumber,
      })),
      filtersApplied: {
        outletId,
        outletIds,
        reportDuration,
        startDate: start,
        endDate: end,
        status,
        search,
      },
    });
  }
);









//-----------------------------------------------
export {
  getTopItems,
  getTopCustomer,
  getTopOutlet,
  getOutletReport,
  getOutletDailyReport,
  getSalesReportByOutlet,
  getSalesReportByCustomer,
  getSalesChartDataReportByOutlet,
  getSalesChartDataReportByCustomer,
  getRegisterChartDataByOutlet,
  getRegisterDataByOutlet,
  getSalesChartDataReportByOutlets,
  getGiftCardChartDataReportByOutlets,
  getGiftCardDataReportByOutlets,
  getRetailDashboardData,
  getPaymentReports,
  getSalesLedgerReports
};
