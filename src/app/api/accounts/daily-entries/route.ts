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
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

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

    // Build specific queries
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

    const pQuery: Record<string, unknown> = { ...dateQuery };
    if (searchRegex) {
      pQuery.$or = [
        { name: searchRegex },
        { mobile: searchRegex },
        { nid: searchRegex },
        { entryNumber: searchRegex },
        { onlineTrackId: searchRegex },
        { notes: searchRegex },
        { familyGroupId: searchRegex },
        { familyHeadName: searchRegex },
        { familyHeadEntryNumber: searchRegex },
        { groupMembersSummary: searchRegex },
      ];
    }

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

    // Today's bounds for KPI metrics
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();
    const todayStart = new Date(todayY, todayM, todayD, 0, 0, 0, 0);
    const todayEnd = new Date(todayY, todayM, todayD, 23, 59, 59, 999);
    const todayStr = `${todayY}-${String(todayM + 1).padStart(2, "0")}-${String(todayD).padStart(2, "0")}`;

    const isFilterToday =
      (!startDate && !endDate) || (startDate === todayStr && endDate === todayStr);

    const shouldFetchTodaySeparately =
      !isFilterToday ||
      moduleType !== "all" ||
      transactionType !== "all" ||
      paymentStatus !== "all" ||
      Boolean(searchRegex);

    // 2. Fetch main datasets AND today KPI metrics concurrently in ONE parallel roundtrip
    const [
      transactions,
      passportEntries,
      visaApplications,
      todayTxsRaw,
      todayPassportsRaw,
      todayVisasRaw,
    ] = await Promise.all([
      AccountTransaction.find(txQuery).sort({ date: -1, createdAt: -1 }).lean(),
      (transactionType === "all" || transactionType === "collection") &&
      (moduleType === "all" || moduleType === "passport")
        ? PassportEntry.find(pQuery).populate("createdBy", "name email").sort({ createdAt: -1 }).lean()
        : [],
      (transactionType === "all" || transactionType === "collection") &&
      (moduleType === "all" || moduleType === "visa")
        ? VisaApplication.find(vQuery).populate("createdBy", "name email").sort({ createdAt: -1 }).lean()
        : [],
      shouldFetchTodaySeparately
        ? AccountTransaction.find({ date: { $gte: todayStart, $lte: todayEnd } })
            .select("type amount moduleType referenceId _id")
            .lean()
        : null,
      shouldFetchTodaySeparately
        ? PassportEntry.find({ createdAt: { $gte: todayStart, $lte: todayEnd } })
            .select("entryNumber totalAmount paidAmount dueAmount")
            .lean()
        : null,
      shouldFetchTodaySeparately
        ? VisaApplication.find({ createdAt: { $gte: todayStart, $lte: todayEnd } })
            .select("trackingId totalAmount feeAmount paidAmount dueAmount")
            .lean()
        : null,
    ]);

    const effectiveTodayTxs = shouldFetchTodaySeparately ? (todayTxsRaw || []) : transactions;
    const effectiveTodayPassports = shouldFetchTodaySeparately ? (todayPassportsRaw || []) : passportEntries;
    const effectiveTodayVisas = shouldFetchTodaySeparately ? (todayVisasRaw || []) : visaApplications;

    // 3. TARGETED LOOKUPS: Collect ONLY the reference IDs present in the results
    const passportRefIds = new Set<string>();
    const visaRefIds = new Set<string>();
    const expenseRefIds = new Set<string>();

    for (const tx of transactions) {
      if (tx.referenceId) {
        const ref = tx.referenceId.trim();
        expenseRefIds.add(ref.toUpperCase());
        if (tx.moduleType === "passport") passportRefIds.add(ref);
        else if (tx.moduleType === "visa") visaRefIds.add(ref);
      }
    }
    for (const p of passportEntries) {
      if (p.entryNumber) expenseRefIds.add(p.entryNumber.trim().toUpperCase());
    }
    for (const v of visaApplications) {
      if (v.trackingId) expenseRefIds.add(v.trackingId.trim().toUpperCase());
    }

    for (const t of effectiveTodayTxs as any[]) {
      if (t.referenceId) {
        const ref = t.referenceId.trim();
        if (t.moduleType === "passport") passportRefIds.add(ref);
        else if (t.moduleType === "visa") visaRefIds.add(ref);
      }
    }

    // Run targeted indexed lookups in parallel
    const [relevantPassports, relevantVisas, relevantExpenses] = await Promise.all([
      passportRefIds.size > 0
        ? PassportEntry.find({ entryNumber: { $in: Array.from(passportRefIds) } })
            .select("entryNumber dueAmount totalAmount paidAmount")
            .lean()
        : [],
      visaRefIds.size > 0
        ? VisaApplication.find({ trackingId: { $in: Array.from(visaRefIds) } })
            .select("trackingId dueAmount totalAmount feeAmount paidAmount")
            .lean()
        : [],
      expenseRefIds.size > 0
        ? AccountTransaction.find({
            type: "expense",
            referenceId: { $in: Array.from(expenseRefIds) },
          })
            .select("referenceId amount")
            .lean()
        : [],
    ]);

    const passportMap: Record<string, any> = {};
    for (const p of relevantPassports) {
      passportMap[p.entryNumber] = p;
    }

    const visaMap: Record<string, any> = {};
    for (const v of relevantVisas) {
      visaMap[v.trackingId] = v;
    }

    const fileExpenseMap: Record<string, number> = {};
    for (const exp of relevantExpenses) {
      if (exp.referenceId) {
        const refU = exp.referenceId.trim().toUpperCase();
        fileExpenseMap[refU] = (fileExpenseMap[refU] || 0) + (Number(exp.amount) || 0);
      }
    }

    // 4. Map and unify results
    const unifiedList: any[] = [];

    // Map Account Transactions
    for (const tx of transactions) {
      const isCollection = tx.type === "collection";
      const inAmount = isCollection ? tx.amount : 0;
      const outAmount = !isCollection ? tx.amount : 0;

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
        applicantName:
          p.applicationCategory === "family_group"
            ? p.isFamilyHead
              ? `${p.name} (👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ - ${p.familyMemberCount || 1} জন)`
              : `${p.name} [ফ্যামিলি সদস্য - বিল প্রধান: ${p.familyHeadName || "পরিবার প্রধান"}]`
            : p.name,
        phone: p.mobile,
        serviceTitle: p.passportType || "ই-পাসপোর্ট আবেদন",
        category:
          p.applicationCategory === "family_group"
            ? p.isFamilyHead
              ? "ফ্যামিলি প্যাকেজ বুকিং ও জমা"
              : "ফ্যামিলি প্যাকেজ অন্তর্ভুক্ত"
            : "ফাইল বুকিং ও প্রাথমিক জমা",
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
          p.createdBy && typeof p.createdBy === "object" && "name" in p.createdBy
            ? (p.createdBy as any).name
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
        applicantName:
          v.applicationCategory === "family_group"
            ? v.isFamilyHead
              ? `${v.applicantName} (👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ - ${v.familyMemberCount || 1} জন)`
              : `${v.applicantName} [ফ্যামিলি সদস্য - বিল প্রধান: ${v.familyHeadName || "পরিবার প্রধান"}]`
            : v.applicantName,
        phone: v.phone,
        serviceTitle: `${country} (${sType})`,
        category:
          v.applicationCategory === "family_group"
            ? v.isFamilyHead
              ? "ফ্যামিলি প্যাকেজ বুকিং ও জমা"
              : "ফ্যামিলি প্যাকেজ অন্তর্ভুক্ত"
            : "ফাইল বুকিং ও প্রাথমিক জমা",
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
          v.createdBy && typeof v.createdBy === "object" && "name" in v.createdBy
            ? (v.createdBy as any).name
            : v.createdByName || "সিস্টেম",
      });
    }

    // 5. Group unifiedList by referenceId (Tracking Number)
    const groupedMap = new Map<string, any>();

    for (const item of unifiedList) {
      const ref = item.referenceId ? item.referenceId.trim().toUpperCase() : "";
      const groupKey = ref && ref !== "—" ? ref : `STANDALONE_${item.id}`;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          id: item.id,
          isTransactionRecord: item.isTransactionRecord,
          transactionNumber: item.transactionNumber || ref || item.id,
          entryType: item.entryType,
          referenceId: item.referenceId || "—",
          moduleType: item.moduleType,
          moduleLabel: item.moduleLabel,
          applicantName: item.applicantName,
          phone: item.phone,
          serviceTitle: item.serviceTitle,
          category: item.category,
          totalAmount: item.totalAmount || 0,
          inAmount: item.inAmount || 0,
          outAmount: item.outAmount || 0,
          profit: 0,
          fileExpense: item.outAmount || 0,
          dueAmount: item.dueAmount || 0,
          paymentStatus: item.paymentStatus,
          paymentMethod: item.paymentMethod,
          notes: item.notes || "",
          createdAt: item.createdAt,
          createdByName: item.createdByName,
          transactions: [item],
        });
      } else {
        const existing = groupedMap.get(groupKey);
        existing.inAmount += item.inAmount || 0;
        existing.outAmount += item.outAmount || 0;
        existing.transactions.push(item);

        if (new Date(item.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
          existing.createdAt = item.createdAt;
          existing.createdByName = item.createdByName;
        }

        if (item.applicantName && (!existing.applicantName || existing.applicantName === "—")) {
          existing.applicantName = item.applicantName;
        }
        if (item.phone && (!existing.phone || existing.phone === "—")) {
          existing.phone = item.phone;
        }
        if (item.serviceTitle && (!existing.serviceTitle || existing.serviceTitle === "—")) {
          existing.serviceTitle = item.serviceTitle;
        }
        if (item.totalAmount && (!existing.totalAmount || existing.totalAmount === 0)) {
          existing.totalAmount = item.totalAmount;
        }
        if (item.dueAmount !== undefined) {
          existing.dueAmount = item.dueAmount;
        }
        if (item.notes && !existing.notes.includes(item.notes)) {
          existing.notes = existing.notes ? `${existing.notes} | ${item.notes}` : item.notes;
        }
      }
    }

    const groupedList: any[] = [];
    for (const group of groupedMap.values()) {
      group.transactions.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      group.profit = (group.inAmount || 0) - (group.outAmount || 0);
      group.fileExpense = group.outAmount || 0;
      group.paymentStatus = (group.dueAmount || 0) <= 0 ? "paid" : "due";
      groupedList.push(group);
    }

    // Filter by paymentStatus if requested
    let filteredList = groupedList;
    if (paymentStatus === "paid") {
      filteredList = groupedList.filter((item) => item.dueAmount <= 0);
    } else if (paymentStatus === "due") {
      filteredList = groupedList.filter((item) => item.dueAmount > 0);
    }

    // Filter by transactionType if requested
    if (transactionType === "collection") {
      filteredList = filteredList.filter((item) => item.inAmount > 0);
    } else if (transactionType === "expense") {
      filteredList = filteredList.filter((item) => item.outAmount > 0);
    }

    // Sort descending by date
    filteredList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 6. Calculate KPI Metrics for Today
    let todayIn = 0;
    let todayOut = 0;

    for (const tx of effectiveTodayTxs as any[]) {
      if (tx.type === "collection") todayIn += Number(tx.amount) || 0;
      else todayOut += Number(tx.amount) || 0;
    }

    for (const p of effectiveTodayPassports as any[]) {
      todayIn += Number(p.paidAmount) || 0;
    }

    for (const v of effectiveTodayVisas as any[]) {
      todayIn += Number(v.paidAmount) || 0;
    }

    // Today due amount: distinct per tracking number to avoid duplication
    const todaySeenRefs = new Set<string>();
    let todayDue = 0;
    for (const p of effectiveTodayPassports as any[]) {
      const ref = p.entryNumber.trim().toUpperCase();
      if (!todaySeenRefs.has(ref)) {
        todaySeenRefs.add(ref);
        todayDue += Number(p.dueAmount) || Math.max(0, (Number(p.totalAmount) || 0) - (Number(p.paidAmount) || 0));
      }
    }
    for (const v of effectiveTodayVisas as any[]) {
      const ref = v.trackingId.trim().toUpperCase();
      if (!todaySeenRefs.has(ref)) {
        todaySeenRefs.add(ref);
        todayDue += Number(v.dueAmount) || Math.max(0, (Number(v.totalAmount ?? v.feeAmount) || 0) - (Number(v.paidAmount) || 0));
      }
    }
    for (const tx of effectiveTodayTxs as any[]) {
      if (tx.referenceId) {
        const ref = tx.referenceId.trim().toUpperCase();
        if (!todaySeenRefs.has(ref)) {
          todaySeenRefs.add(ref);
          if (tx.moduleType === "passport" && passportMap[tx.referenceId]) {
            todayDue += passportMap[tx.referenceId].dueAmount || 0;
          } else if (tx.moduleType === "visa" && visaMap[tx.referenceId]) {
            todayDue += visaMap[tx.referenceId].dueAmount || 0;
          }
        }
      }
    }

    const todayUniqueKeys = new Set<string>();
    for (const p of effectiveTodayPassports as any[]) todayUniqueKeys.add(`P_${p.entryNumber}`);
    for (const v of effectiveTodayVisas as any[]) todayUniqueKeys.add(`V_${v.trackingId}`);
    for (const t of effectiveTodayTxs as any[]) todayUniqueKeys.add(t.referenceId ? `R_${t.referenceId.trim().toUpperCase()}` : `TX_${t._id}`);

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
          totalCount: todayUniqueKeys.size,
          passportCount:
            (effectiveTodayTxs as any[]).filter((t) => t.moduleType === "passport").length +
            (effectiveTodayPassports as any[]).length,
          visaCount:
            (effectiveTodayTxs as any[]).filter((t) => t.moduleType === "visa").length +
            (effectiveTodayVisas as any[]).length,
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
          inAmount: filteredIn,
          outAmount: filteredOut,
          profit: filteredProfit,
          dueAmount: filteredDue,
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
