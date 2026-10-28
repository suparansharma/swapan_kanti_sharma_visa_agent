import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PassportEntry from "@/models/PassportEntry";
import VisaApplication from "@/models/VisaApplication";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    const results: any[] = [];
    const limit = 15;

    const regex = query ? new RegExp(query, "i") : null;

    // Search Passport Entries
    const pQuery: Record<string, unknown> = {};
    if (regex) {
      pQuery.$or = [
        { entryNumber: regex },
        { name: regex },
        { mobile: regex },
        { nid: regex },
        { onlineTrackId: regex },
      ];
    }
    const passports = await PassportEntry.find(pQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    for (const p of passports) {
      const total = Number(p.totalAmount) || 0;
      const paid = Number(p.paidAmount) || 0;
      const due = Number(p.dueAmount) || Math.max(0, total - paid);

      results.push({
        id: p._id.toString(),
        referenceId: p.entryNumber,
        moduleType: "passport",
        moduleLabel: "পাসপোর্ট",
        applicantName: p.name,
        phone: p.mobile,
        nidOrPassport: p.nid || "",
        serviceTitle: p.passportType || "ই-পাসপোর্ট",
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
      });
    }

    // Search Visa Applications
    const vQuery: Record<string, unknown> = {};
    if (regex) {
      vQuery.$or = [
        { trackingId: regex },
        { applicantName: regex },
        { phone: regex },
        { passportNumber: regex },
        { destinationCountry: regex },
      ];
    }
    const visas = await VisaApplication.find(vQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    for (const v of visas) {
      const total = Number(v.totalAmount ?? v.feeAmount) || 0;
      const paid = Number(v.paidAmount) || 0;
      const due = Number(v.dueAmount) || Math.max(0, total - paid);
      const country = v.destinationCountry || "ভিসা";
      const sType = v.visaType || v.serviceType || "";

      results.push({
        id: v._id.toString(),
        referenceId: v.trackingId,
        moduleType: "visa",
        moduleLabel: "ভিসা",
        applicantName: v.applicantName,
        phone: v.phone,
        nidOrPassport: v.passportNumber || "",
        serviceTitle: `${country} (${sType})`,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
      });
    }

    return NextResponse.json({
      success: true,
      files: results,
    });
  } catch (error: unknown) {
    console.error("Error in /api/accounts/search-files:", error);
    return NextResponse.json(
      { error: "Failed to search files" },
      { status: 500 }
    );
  }
}
