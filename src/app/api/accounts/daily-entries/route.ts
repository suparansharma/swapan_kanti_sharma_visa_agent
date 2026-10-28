import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PassportEntry from "@/models/PassportEntry";
import VisaApplication from "@/models/VisaApplication";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const moduleType = searchParams.get("moduleType") || "all"; // 'all' | 'passport' | 'visa'
    const paymentStatus = searchParams.get("paymentStatus") || "all"; // 'all' | 'paid' | 'partial' | 'due'
    const search = searchParams.get("search") || "";

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

    // Prepare search regex if any
    let searchRegex: RegExp | null = null;
    if (search.trim()) {
      searchRegex = new RegExp(search.trim(), "i");
    }

    // 2. Query Passport Entries
    let passportEntries: any[] = [];
    if (moduleType === "all" || moduleType === "passport") {
      const pQuery: Record<string, unknown> = { ...dateQuery };
      if (searchRegex) {
        pQuery.$or = [
          { name: searchRegex },
          { mobile: searchRegex },
          { nid: searchRegex },
          { entryNumber: searchRegex },
          { onlineTrackId: searchRegex },
        ];
      }
      passportEntries = await PassportEntry.find(pQuery)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }

    // 3. Query Visa Applications
    let visaApplications: any[] = [];
    if (moduleType === "all" || moduleType === "visa") {
      const vQuery: Record<string, unknown> = { ...dateQuery };
      if (searchRegex) {
        vQuery.$or = [
          { applicantName: searchRegex },
          { passportNumber: searchRegex },
          { phone: searchRegex },
          { trackingId: searchRegex },
          { destinationCountry: searchRegex },
        ];
      }
      visaApplications = await VisaApplication.find(vQuery)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();
    }

    // Passport type labels for readability
    const passportTypeLabels: Record<string, string> = {
      "5y_regular_21d": "৫ বছর মেয়াদী সাধারণ (২১ দিন)",
      "10y_regular_21d": "১০ বছর মেয়াদী সাধারণ (২১ দিন)",
      "5y_urgent_7d": "৫ বছর মেয়াদী জরুরি (৭ দিন)",
      "10y_urgent_7d": "১০ বছর মেয়াদী জরুরি (৭ দিন)",
      "5y_very_urgent_3d": "৫ বছর অতীব জরুরি (৩ দিন)",
      "10y_very_urgent_3d": "১০ বছর অতীব জরুরি (৩ দিন)",
      "5y_noc_3d": "৫ বছর অতীব জরুরি (NOC)",
      "10y_noc_3d": "১০ বছর অতীব জরুরি (NOC)",
      "5y_go_medical_hajj_3d": "৫ বছর অতীব জরুরি (GO/হজ্জ/চিকিৎসা)",
      "10y_go_medical_hajj_3d": "১০ বছর অতীব জরুরি (GO/হজ্জ/চিকিৎসা)",
      "5y_go_govt_work_3d": "৫ বছর অতীব জরুরি (GO সরকারি কাজ)",
      "10y_go_govt_work_3d": "১০ বছর অতীব জরুরি (GO সরকারি কাজ)",
    };

    // Format unified records
    const unifiedList: any[] = [];

    // Map passport entries
    for (const p of passportEntries) {
      const total = Number(p.totalAmount) || 0;
      const paid = Number(p.paidAmount) || 0;
      const due = Number(p.dueAmount) || Math.max(0, total - paid);
      let pStatus: "paid" | "partial" | "due" = "due";
      if (due <= 0 && total > 0) pStatus = "paid";
      else if (paid > 0 && due > 0) pStatus = "partial";

      unifiedList.push({
        id: p._id.toString(),
        referenceId: p.entryNumber || "PS",
        moduleType: "passport",
        moduleLabel: "পাসপোর্ট",
        applicantName: p.name,
        phone: p.mobile,
        nidOrPassportNo: p.nid || "—",
        serviceTitle: passportTypeLabels[p.passportType] || p.passportType || "ই-পাসপোর্ট আবেদন",
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        paymentStatus: pStatus,
        status: p.status,
        createdAt: p.createdAt,
        createdByName:
          typeof p.createdBy === "object" && p.createdBy?.name
            ? p.createdBy.name
            : p.createdByName || "সিস্টেম",
        notes: p.notes || "",
      });
    }

    // Map visa entries
    for (const v of visaApplications) {
      const total = Number(v.totalAmount ?? v.feeAmount) || 0;
      const paid = Number(v.paidAmount) || 0;
      const due = Number(v.dueAmount) || Math.max(0, total - paid);
      let pStatus: "paid" | "partial" | "due" = "due";
      if (due <= 0 && total > 0) pStatus = "paid";
      else if (paid > 0 && due > 0) pStatus = "partial";

      const country = v.destinationCountry || "ভিসা";
      const sType = v.visaType || v.serviceType || "ট্যুরিস্ট";

      unifiedList.push({
        id: v._id.toString(),
        referenceId: v.trackingId || "VS",
        moduleType: "visa",
        moduleLabel: "ভিসা",
        applicantName: v.applicantName,
        phone: v.phone,
        nidOrPassportNo: v.passportNumber || "—",
        serviceTitle: `${country} (${sType})`,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        paymentStatus: pStatus,
        status: v.status,
        createdAt: v.createdAt,
        createdByName:
          typeof v.createdBy === "object" && v.createdBy?.name
            ? v.createdBy.name
            : v.createdByName || "সিস্টেম",
        notes: v.notes || "",
      });
    }

    // Filter by paymentStatus if requested
    let filteredList = unifiedList;
    if (paymentStatus === "paid") {
      filteredList = unifiedList.filter((item) => item.paymentStatus === "paid");
    } else if (paymentStatus === "due") {
      filteredList = unifiedList.filter((item) => item.dueAmount > 0);
    } else if (paymentStatus === "partial") {
      filteredList = unifiedList.filter((item) => item.paymentStatus === "partial");
    }

    // Sort descending by date
    filteredList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate Summary Stats for Today (strict midnight to midnight)
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [allTodayPassports, allTodayVisas] = await Promise.all([
      PassportEntry.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      VisaApplication.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);

    let todayContract = 0;
    let todayPaid = 0;
    let todayDue = 0;
    const todayPassportCount = allTodayPassports.length;
    const todayVisaCount = allTodayVisas.length;

    for (const p of allTodayPassports) {
      const t = Number(p.totalAmount) || 0;
      const pd = Number(p.paidAmount) || 0;
      todayContract += t;
      todayPaid += pd;
      todayDue += Number(p.dueAmount) || Math.max(0, t - pd);
    }

    for (const v of allTodayVisas) {
      const t = Number(v.totalAmount ?? v.feeAmount) || 0;
      const pd = Number(v.paidAmount) || 0;
      todayContract += t;
      todayPaid += pd;
      todayDue += Number(v.dueAmount) || Math.max(0, t - pd);
    }

    // Calculate Filtered Summary
    let filteredContract = 0;
    let filteredPaid = 0;
    let filteredDue = 0;
    for (const item of filteredList) {
      filteredContract += item.totalAmount;
      filteredPaid += item.paidAmount;
      filteredDue += item.dueAmount;
    }

    return NextResponse.json({
      success: true,
      entries: filteredList,
      summary: {
        today: {
          contract: todayContract,
          paid: todayPaid,
          due: todayDue,
          passportCount: todayPassportCount,
          visaCount: todayVisaCount,
          totalCount: todayPassportCount + todayVisaCount,
        },
        filtered: {
          contract: filteredContract,
          paid: filteredPaid,
          due: filteredDue,
          totalCount: filteredList.length,
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
