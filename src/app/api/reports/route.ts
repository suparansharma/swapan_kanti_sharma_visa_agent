import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PassportEntry from "@/models/PassportEntry";
import VisaApplication from "@/models/VisaApplication";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const moduleType = searchParams.get("moduleType") || "all"; // 'all' | 'passport' | 'visa'
    const status = searchParams.get("status") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all"; // 'all' | 'due' | 'paid'
    const passportType = searchParams.get("passportType") || "all";
    const destinationCountry = searchParams.get("destinationCountry") || "all";
    const serviceType = searchParams.get("serviceType") || "all";
    const search = searchParams.get("search") || "";

    // Build Date Filter
    const dateQuery: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        (dateQuery.createdAt as Record<string, unknown>).$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        (dateQuery.createdAt as Record<string, unknown>).$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // 1. Fetch Passport Entries
    let passportList: any[] = [];
    if (moduleType === "all" || moduleType === "passport") {
      const pQuery: Record<string, unknown> = { ...dateQuery };
      if (status !== "all") {
        pQuery.status = status;
      }
      if (passportType !== "all") {
        pQuery.passportType = passportType;
      }
      if (search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        pQuery.$or = [
          { name: regex },
          { mobile: regex },
          { nid: regex },
          { entryNumber: regex },
          { onlineTrackId: regex },
        ];
      }
      passportList = await PassportEntry.find(pQuery).sort({ createdAt: -1 }).lean();
      if (paymentStatus === "due") {
        passportList = passportList.filter((item) => (item.dueAmount || 0) > 0);
      } else if (paymentStatus === "paid") {
        passportList = passportList.filter((item) => (item.dueAmount || 0) === 0);
      }
    }

    // 2. Fetch Visa Applications
    let visaList: any[] = [];
    if (moduleType === "all" || moduleType === "visa") {
      const vQuery: Record<string, unknown> = { ...dateQuery };
      if (status !== "all") {
        vQuery.status = status;
      }
      if (destinationCountry !== "all") {
        vQuery.destinationCountry = destinationCountry;
      }
      if (serviceType !== "all") {
        vQuery.serviceType = serviceType;
      }
      if (search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        vQuery.$or = [
          { applicantName: regex },
          { passportNumber: regex },
          { trackingId: regex },
          { phone: regex },
          { destinationCountry: regex },
        ];
      }
      visaList = await VisaApplication.find(vQuery).sort({ createdAt: -1 }).lean();
      if (paymentStatus === "due") {
        visaList = visaList.filter((item) => {
          const total = Number(item.totalAmount ?? item.feeAmount) || 0;
          const paid = Number(item.paidAmount ?? (item.feeStatus === "paid" ? total : 0)) || 0;
          const due = Number(item.dueAmount ?? Math.max(0, total - paid)) || 0;
          return due > 0;
        });
      } else if (paymentStatus === "paid") {
        visaList = visaList.filter((item) => {
          const total = Number(item.totalAmount ?? item.feeAmount) || 0;
          const paid = Number(item.paidAmount ?? (item.feeStatus === "paid" ? total : 0)) || 0;
          const due = Number(item.dueAmount ?? Math.max(0, total - paid)) || 0;
          return due === 0;
        });
      }
    }

    // Calculate Financial Summaries
    let passportTotalBilling = 0;
    let passportTotalCollected = 0;
    let passportTotalDue = 0;
    for (const p of passportList) {
      passportTotalBilling += Number(p.totalAmount) || 0;
      passportTotalCollected += Number(p.paidAmount) || 0;
      passportTotalDue += Number(p.dueAmount) || 0;
    }

    let visaTotalBilling = 0;
    let visaTotalCollected = 0;
    let visaTotalDue = 0;
    for (const v of visaList) {
      const total = Number(v.totalAmount ?? v.feeAmount) || 0;
      const paid = Number(v.paidAmount ?? (v.feeStatus === "paid" ? total : 0)) || 0;
      const due = Number(v.dueAmount ?? Math.max(0, total - paid)) || 0;
      visaTotalBilling += total;
      visaTotalCollected += paid;
      visaTotalDue += due;
    }

    const combinedSummary = {
      totalApplications: passportList.length + visaList.length,
      totalBilling: passportTotalBilling + visaTotalBilling,
      totalCollected: passportTotalCollected + visaTotalCollected,
      totalDue: passportTotalDue + visaTotalDue,
      passport: {
        count: passportList.length,
        billing: passportTotalBilling,
        collected: passportTotalCollected,
        due: passportTotalDue,
      },
      visa: {
        count: visaList.length,
        billing: visaTotalBilling,
        collected: visaTotalCollected,
        due: visaTotalDue,
      },
    };

    return NextResponse.json({
      success: true,
      summary: combinedSummary,
      passportList,
      visaList,
    });
  } catch (error: unknown) {
    console.error("Error generating reports:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate reports";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
