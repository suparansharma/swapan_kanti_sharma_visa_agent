import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import VisaApplication from "@/models/VisaApplication";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "Please enter a tracking ID or passport number." },
        { status: 400 }
      );
    }

    let application: any = await VisaApplication.findOne({
      $or: [
        { trackingId: query.toUpperCase() },
        { passportNumber: query.toUpperCase() },
      ],
    }).select("-feeAmount -feeStatus -createdBy");

    let isPassport = false;
    if (!application) {
      const PassportEntry = (await import("@/models/PassportEntry")).default;
      const p = await PassportEntry.findOne({
        $or: [
          { entryNumber: query.toUpperCase() },
          { nid: query },
          { onlineTrackId: query.toUpperCase() },
        ],
      }).select("-totalAmount -paidAmount -dueAmount -createdBy").lean();

      if (p) {
        isPassport = true;
        application = {
          _id: p._id,
          trackingId: p.entryNumber,
          applicantName: p.name,
          passportNumber: p.nid,
          status: p.status,
          destinationCountry: "বাংলাদেশ পাসপোর্ট অধিদপ্তর",
          serviceType: p.passportType,
          visaType: p.onlineTrackId ? `Online Track ID: ${p.onlineTrackId}` : "ই-পাসপোর্ট",
          familyGroupId: p.familyGroupId,
          isFamilyHead: p.isFamilyHead,
          familyRelation: p.familyRelation,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }
    }

    if (!application) {
      return NextResponse.json(
        {
          error: "No application found matching this Tracking ID, Passport Number or NID. Please check and try again.",
        },
        { status: 404 }
      );
    }

    let familyMembers: any[] = [];
    if (application.familyGroupId) {
      if (isPassport) {
        const PassportEntry = (await import("@/models/PassportEntry")).default;
        familyMembers = await PassportEntry.find({
          familyGroupId: application.familyGroupId,
          _id: { $ne: application._id },
        })
          .select("entryNumber name nid status passportType familyRelation onlineTrackId")
          .lean();
        familyMembers = familyMembers.map((m: any) => ({
          trackingId: m.entryNumber,
          applicantName: m.name,
          passportNumber: m.nid,
          status: m.status,
          serviceType: m.passportType,
          familyRelation: m.familyRelation,
        }));
      } else {
        familyMembers = await VisaApplication.find({
          familyGroupId: application.familyGroupId,
          _id: { $ne: application._id },
        })
          .select("trackingId applicantName passportNumber status visaType serviceType familyRelation")
          .lean();
      }
    }

    return NextResponse.json({
      success: true,
      application,
      familyMembers,
    });
  } catch (error: unknown) {
    console.error("Error checking tracking status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to query tracking information";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
