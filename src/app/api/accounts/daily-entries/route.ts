import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AccountTransaction from "@/models/AccountTransaction";
import PassportEntry from "@/models/PassportEntry";
import VisaApplication from "@/models/VisaApplication";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const moduleType = searchParams.get("moduleType") || "all"; // 'all' | 'passport' | 'visa'
    const transactionType = searchParams.get("transactionType") || "all"; // 'all' | 'collection' | 'expense'
    const paymentStatus = searchParams.get("paymentStatus") || "all"; // 'all' | 'paid' | 'partial' | 'due'
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    // 1. Build Date Filters
    const dateQuery: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        (dateQuery.createdAt as Record<string, unknown>).$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        (dateQuery.createdAt as Record<string, unknown>).$lte = e;
      }
    }

    const txDateQuery: Record<string, unknown> = {};
    if (startDate || endDate) {
      txDateQuery.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        (txDateQuery.date as Record<string, unknown>).$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        (txDateQuery.date as Record<string, unknown>).$lte = e;
      }
    }

    let searchRegex: RegExp | null = null;
    if (search.trim()) {
      searchRegex = new RegExp(search.trim(), "i");
    }

    // 2. Fetch Account Transactions (Collections and File Expenses)
    const txQuery: Record<string, unknown> = { ...txDateQuery };
    if (moduleType !== "all") {
      txQuery.moduleType = moduleType;
    }
    if (transactionType !== "all") {
      txQuery.type = transactionType;
    }
    if (searchRegex) {
      txQuery.$or = [
        { referenceId: searchRegex },
        { applicantName: searchRegex },
        { phone: searchRegex },
        { category: searchRegex },
        { notes: searchRegex },
        { transactionNumber: searchRegex },
      ];
    }

    const transactions = await AccountTransaction.find(txQuery)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // 3. Fetch Passport Entries (Initial Booking & deposits) if transactionType is not strictly 'expense'
    let passportEntries: any[] = [];
    if (
      (transactionType === "all" || transactionType === "collection") &&
      (moduleType === "all" || moduleType === "passport")
    ) {
      const pQuery: Record<string, unknown> = { ...dateQuery };
      if (searchRegex) {
        pQuery.$or = [
          { name: searchRegex },
          { mobile: searchRegex },
          { nid: searchRegex },
          { entryNumber: searchRegex },
          { onlineTrackId: searchRegex },
          { notes: searchRegex },
        ];
      }
      passportEntries = await PassportEntry.find(pQuery)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }

    // 4. Fetch Visa Applications (Initial Booking & deposits) if transactionType is not strictly 'expense'
    let visaApplications: any[] = [];
    if (
      (transactionType === "all" || transactionType === "collection") &&
      (moduleType === "all" || moduleType === "visa")
    ) {
      const vQuery: Record<string, unknown> = { ...dateQuery };
      if (searchRegex) {
        vQuery.$or = [
          { applicantName: searchRegex },
          { passportNumber: searchRegex },
          { phone: searchRegex },
          { trackingId: searchRegex },
          { destinationCountry: searchRegex },
          { notes: searchRegex },
        ];
      }
      visaApplications = await VisaApplication.find(vQuery)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }

    // Look up map of passport/visa current due amounts
    const passportMap: Record<string, any> = {};
    const visaMap: Record<string, any> = {};

    const allPassports = await PassportEntry.find().select("entryNumber dueAmount totalAmount paidAmount").lean();
    for (const p of allPassports) {
      passportMap[p.entryNumber] = p;
    }

    const allVisas = await VisaApplication.find().select("trackingId dueAmount totalAmount feeAmount paidAmount").lean();
    for (const v of allVisas) {
      visaMap[v.trackingId] = v;
    }

    // Pre-calculate total expenses for each referenceId
    const fileExpenseMap: Record<string, number> = {};
    const allExpenses = await AccountTransaction.find({ type: "expense" })
      .select("referenceId amount")
      .lean();
    for (const exp of allExpenses) {
      if (exp.referenceId) {
        const refU = exp.referenceId.trim().toUpperCase();
        fileExpenseMap[refU] = (fileExpenseMap[refU] || 0) + (Number(exp.amount) || 0);
      }
    }

    const unifiedList: any[] = [];

    // Map Account Transactions
    for (const tx of transactions) {
      const isCollection = tx.type === "collection";
      const inAmount = isCollection ? tx.amount : 0;
      const outAmount = !isCollection ? tx.amount : 0;

      // Find current live due & paid
      let liveDue = 0;
      let liveTotal = 0;
      let filePaid = 0;
      if (tx.moduleType === "passport" && passportMap[tx.referenceId]) {
        liveDue = passportMap[tx.referenceId].dueAmount || 0;
        liveTotal = passportMap[tx.referenceId].totalAmount || 0;
        filePaid = passportMap[tx.referenceId].paidAmount || 0;
      } else if (tx.moduleType === "visa" && visaMap[tx.referenceId]) {
        liveDue = visaMap[tx.referenceId].dueAmount || 0;
        liveTotal = Number(visaMap[tx.referenceId].totalAmount ?? visaMap[tx.referenceId].feeAmount) || 0;
        filePaid = visaMap[tx.referenceId].paidAmount || 0;
      }

      const refU = (tx.referenceId || "").trim().toUpperCase();
      const fileTotalExpense = fileExpenseMap[refU] || 0;
      const profit =
        filePaid > 0 || fileTotalExpense > 0
          ? filePaid - fileTotalExpense
          : inAmount - outAmount;

      unifiedList.push({
        id: tx._id.toString(),
        isTransactionRecord: true,
        transactionNumber: tx.transactionNumber,
        entryType: tx.type, // 'collection' | 'expense'
        referenceId: tx.referenceId,
        moduleType: tx.moduleType,
        moduleLabel: tx.moduleType === "passport" ? "পাসপোর্ট" : tx.moduleType === "visa" ? "ভিসা" : "অন্যান্য",
        applicantName: tx.applicantName,
        phone: tx.phone || "—",
        serviceTitle: tx.serviceTitle || (tx.moduleType === "passport" ? "পাসপোর্ট সেবা" : "ভিসা প্রসেসিং"),
        category: tx.category,
        totalAmount: liveTotal,
        inAmount,
        outAmount,
        profit,
        fileExpense: fileTotalExpense,
        dueAmount: liveDue,
        paymentStatus: liveDue <= 0 ? "paid" : "due",
        paymentMethod: tx.paymentMethod || "cash",
        notes: tx.notes || "",
        createdAt: tx.date || tx.createdAt,
        createdByName: tx.createdByName || "সিস্টেম",
      });
    }

    // Map initial Passport Entries (Booking Deposits)
    for (const p of passportEntries) {
      const total = Number(p.totalAmount) || 0;
      const paid = Number(p.paidAmount) || 0;
      const due = Number(p.dueAmount) || Math.max(0, total - paid);
      const refU = p.entryNumber.trim().toUpperCase();
      const fileTotalExpense = fileExpenseMap[refU] || 0;
      const profit = paid - fileTotalExpense;

      unifiedList.push({
        id: p._id.toString(),
        isTransactionRecord: false,
        transactionNumber: p.entryNumber,
        entryType: "collection",
        referenceId: p.entryNumber,
        moduleType: "passport",
        moduleLabel: "পাসপোর্ট",
        applicantName: p.name,
        phone: p.mobile,
        serviceTitle: p.passportType || "ই-পাসপোর্ট আবেদন",
        category: "ফাইল বুকিং ও প্রাথমিক জমা",
        totalAmount: total,
        inAmount: paid,
        outAmount: 0,
        profit,
        fileExpense: fileTotalExpense,
        dueAmount: due,
        paymentStatus: due <= 0 && total > 0 ? "paid" : paid > 0 && due > 0 ? "partial" : "due",
        paymentMethod: "cash",
        notes: p.notes || "",
        createdAt: p.createdAt,
        createdByName:
          typeof p.createdBy === "object" && p.createdBy?.name
            ? p.createdBy.name
            : p.createdByName || "সিস্টেম",
      });
    }

    // Map initial Visa Applications (Booking Deposits)
    for (const v of visaApplications) {
      const total = Number(v.totalAmount ?? v.feeAmount) || 0;
      const paid = Number(v.paidAmount) || 0;
      const due = Number(v.dueAmount) || Math.max(0, total - paid);
      const country = v.destinationCountry || "ভিসা";
      const sType = v.visaType || v.serviceType || "";
      const refU = v.trackingId.trim().toUpperCase();
      const fileTotalExpense = fileExpenseMap[refU] || 0;
      const profit = paid - fileTotalExpense;

      unifiedList.push({
        id: v._id.toString(),
        isTransactionRecord: false,
        transactionNumber: v.trackingId,
        entryType: "collection",
        referenceId: v.trackingId,
        moduleType: "visa",
        moduleLabel: "ভিসা",
        applicantName: v.applicantName,
        phone: v.phone,
        serviceTitle: `${country} (${sType})`,
        category: "ফাইল বুকিং ও প্রাথমিক জমা",
        totalAmount: total,
        inAmount: paid,
        outAmount: 0,
        profit,
        fileExpense: fileTotalExpense,
        dueAmount: due,
        paymentStatus: due <= 0 && total > 0 ? "paid" : paid > 0 && due > 0 ? "partial" : "due",
        paymentMethod: "cash",
        notes: v.notes || "",
        createdAt: v.createdAt,
        createdByName:
          typeof v.createdBy === "object" && v.createdBy?.name
            ? v.createdBy.name
            : v.createdByName || "সিস্টেম",
      });
    }

    // Filter by paymentStatus if requested
    let filteredList = unifiedList;
    if (paymentStatus === "paid") {
      filteredList = unifiedList.filter((item) => item.dueAmount <= 0);
    } else if (paymentStatus === "due") {
      filteredList = unifiedList.filter((item) => item.dueAmount > 0);
    }

    // Sort descending by date
    filteredList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 5. Calculate KPI Metrics for Today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [todayTxs, todayPassports, todayVisas] = await Promise.all([
      AccountTransaction.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean(),
      PassportEntry.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      VisaApplication.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);

    let todayIn = 0;
    let todayOut = 0;
    let todayDue = 0;

    for (const tx of todayTxs) {
      if (tx.type === "collection") todayIn += tx.amount || 0;
      else todayOut += tx.amount || 0;
    }

    for (const p of todayPassports) {
      todayIn += Number(p.paidAmount) || 0;
      todayDue += Number(p.dueAmount) || Math.max(0, (Number(p.totalAmount) || 0) - (Number(p.paidAmount) || 0));
    }

    for (const v of todayVisas) {
      const tot = Number(v.totalAmount ?? v.feeAmount) || 0;
      const pd = Number(v.paidAmount) || 0;
      todayIn += pd;
      todayDue += Number(v.dueAmount) || Math.max(0, tot - pd);
    }

    // Calculate Filtered Summary
    let filteredIn = 0;
    let filteredOut = 0;
    let filteredDue = 0;
    let filteredProfit = 0;
    for (const item of filteredList) {
      filteredIn += item.inAmount || 0;
      filteredOut += item.outAmount || 0;
      filteredDue += item.dueAmount || 0;
      filteredProfit += item.profit !== undefined ? item.profit : (item.inAmount || 0) - (item.outAmount || 0);
    }

    // All-time calculation
    let allTimeIn = 0;
    let allTimeOut = 0;
    for (const exp of allExpenses) {
      allTimeOut += Number(exp.amount) || 0;
    }
    for (const p of allPassports) {
      allTimeIn += Number(p.paidAmount) || 0;
    }
    for (const v of allVisas) {
      allTimeIn += Number(v.paidAmount) || 0;
    }
    for (const tx of transactions) {
      if (tx.type === "collection" && !passportMap[tx.referenceId] && !visaMap[tx.referenceId]) {
        allTimeIn += tx.amount || 0;
      }
    }
    const allTimeProfit = allTimeIn - allTimeOut;

    const totalEntries = filteredList.length;
    const totalPages = Math.ceil(totalEntries / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedEntries = filteredList.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      entries: paginatedEntries,
      pagination: {
        page,
        limit,
        totalEntries,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      summary: {
        today: {
          inAmount: todayIn,
          outAmount: todayOut,
          netCash: todayIn - todayOut,
          profit: todayIn - todayOut,
          dueAmount: todayDue,
          totalCount: todayTxs.length + todayPassports.length + todayVisas.length,
          passportCount:
            todayTxs.filter((t) => t.moduleType === "passport").length + todayPassports.length,
          visaCount:
            todayTxs.filter((t) => t.moduleType === "visa").length + todayVisas.length,
        },
        filtered: {
          inAmount: filteredIn,
          outAmount: filteredOut,
          netCash: filteredIn - filteredOut,
          profit: filteredIn - filteredOut,
          dueAmount: filteredDue,
          totalCount: filteredList.length,
        },
        allTime: {
          inAmount: allTimeIn,
          outAmount: allTimeOut,
          profit: allTimeProfit,
          dueAmount: todayDue,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Error in /api/accounts/daily-entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily account entries" },
      { status: 500 }
    );
  }
}
