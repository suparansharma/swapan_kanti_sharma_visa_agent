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
        { familyGroupId: regex },
        { familyHeadName: regex },
        { familyHeadEntryNumber: regex },
        { groupMembersSummary: regex },
      ];
    }
    const passports = await PassportEntry.find(pQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Cache passport family heads to avoid duplicate queries
    const passportHeadCache: Record<string, any> = {};

    for (const p of passports) {
      if (p.applicationCategory === "family_group") {
        if (p.isFamilyHead) {
          const total = Number(p.totalAmount) || 0;
          const paid = Number(p.paidAmount) || 0;
          const due = Number(p.dueAmount) || Math.max(0, total - paid);

          results.push({
            id: p._id.toString(),
            referenceId: p.entryNumber,
            moduleType: "passport",
            moduleLabel: "পাসপোর্ট",
            applicantName: `${p.name} (👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ - ${p.familyMemberCount || 1} জন)`,
            phone: p.mobile,
            nidOrPassport: p.nid || "",
            serviceTitle: `${p.passportType || "ই-পাসপোর্ট"} [যৌথ ফ্যামিলি বিল]`,
            totalAmount: total,
            paidAmount: paid,
            dueAmount: due,
            isFamilyGroup: true,
            isFamilyHead: true,
          });
        } else {
          // Member: Link to family head billing so user can pay family bill directly
          let fHead = p.familyGroupId ? passportHeadCache[p.familyGroupId] : null;
          if (!fHead && p.familyGroupId) {
            fHead = await PassportEntry.findOne({ familyGroupId: p.familyGroupId, isFamilyHead: true }).lean();
            if (fHead) passportHeadCache[p.familyGroupId] = fHead;
          }

          const headTotal = fHead ? (Number(fHead.totalAmount) || 0) : 0;
          const headPaid = fHead ? (Number(fHead.paidAmount) || 0) : 0;
          const headDue = fHead ? (Number(fHead.dueAmount) || Math.max(0, headTotal - headPaid)) : 0;
          const targetRef = fHead ? fHead.entryNumber : p.entryNumber;

          results.push({
            id: p._id.toString(),
            referenceId: targetRef,
            moduleType: "passport",
            moduleLabel: "পাসপোর্ট",
            applicantName: `${p.name} [ফ্যামিলি সদস্য - বিল প্রধান: ${p.familyHeadName || fHead?.name || "পরিবার প্রধান"}]`,
            phone: p.mobile || (fHead ? fHead.mobile : ""),
            nidOrPassport: p.nid || "",
            serviceTitle: `${p.passportType || "ই-পাসপোর্ট"} [ফ্যামিলি প্যাকেজ]`,
            totalAmount: headTotal,
            paidAmount: headPaid,
            dueAmount: headDue,
            isFamilyGroup: true,
            isFamilyMember: true,
            familyHeadEntryNumber: targetRef,
          });
        }
      } else {
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
        { familyHeadName: regex },
        { familyGroupId: regex },
        { groupMembersSummary: regex },
      ];
    }
    const visas = await VisaApplication.find(vQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Cache family heads to avoid duplicate queries
    const familyHeadCache: Record<string, any> = {};

    for (const v of visas) {
      const country = v.destinationCountry || "ভিসা";
      const sType = v.visaType || v.serviceType || "";

      if (v.applicationCategory === "family_group") {
        if (v.isFamilyHead) {
          const total = Number(v.totalAmount ?? v.feeAmount) || 0;
          const paid = Number(v.paidAmount) || 0;
          const due = Number(v.dueAmount) || Math.max(0, total - paid);

          results.push({
            id: v._id.toString(),
            referenceId: v.trackingId,
            moduleType: "visa",
            moduleLabel: "ভিসা",
            applicantName: `${v.applicantName} (👨‍👩‍👧‍👦 ফ্যামিলি প্যাকেজ - ${v.familyMemberCount || 1} জন)`,
            phone: v.phone,
            nidOrPassport: v.passportNumber || "",
            serviceTitle: `${country} (${sType}) [যৌথ ফ্যামিলি বিল]`,
            totalAmount: total,
            paidAmount: paid,
            dueAmount: due,
            isFamilyGroup: true,
            isFamilyHead: true,
          });
        } else {
          // Member: Link to family head billing so user can pay family bill directly
          let fHead = v.familyGroupId ? familyHeadCache[v.familyGroupId] : null;
          if (!fHead && v.familyGroupId) {
            fHead = await VisaApplication.findOne({ familyGroupId: v.familyGroupId, isFamilyHead: true }).lean();
            if (fHead) familyHeadCache[v.familyGroupId] = fHead;
          }

          const headTotal = fHead ? (Number(fHead.totalAmount ?? fHead.feeAmount) || 0) : 0;
          const headPaid = fHead ? (Number(fHead.paidAmount) || 0) : 0;
          const headDue = fHead ? (Number(fHead.dueAmount) || Math.max(0, headTotal - headPaid)) : 0;
          const targetRef = fHead ? fHead.trackingId : v.trackingId;

          results.push({
            id: v._id.toString(),
            referenceId: targetRef,
            moduleType: "visa",
            moduleLabel: "ভিসা",
            applicantName: `${v.applicantName} [ফ্যামিলি সদস্য - বিল প্রধান: ${v.familyHeadName || fHead?.applicantName || "পরিবার প্রধান"}]`,
            phone: v.phone || (fHead ? fHead.phone : ""),
            nidOrPassport: v.passportNumber || "",
            serviceTitle: `${country} (${sType}) [ফ্যামিলি প্যাকেজ]`,
            totalAmount: headTotal,
            paidAmount: headPaid,
            dueAmount: headDue,
            isFamilyGroup: true,
            isFamilyMember: true,
            familyHeadTrackingId: targetRef,
          });
        }
      } else {
        const total = Number(v.totalAmount ?? v.feeAmount) || 0;
        const paid = Number(v.paidAmount) || 0;
        const due = Number(v.dueAmount) || Math.max(0, total - paid);

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
