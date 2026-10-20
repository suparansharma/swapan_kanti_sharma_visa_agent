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

    const application = await VisaApplication.findOne({
      $or: [
        { trackingId: query.toUpperCase() },
        { passportNumber: query.toUpperCase() },
      ],
    }).select("-feeAmount -feeStatus -createdBy");

    if (!application) {
      return NextResponse.json(
        {
          error: "No application found matching this Tracking ID or Passport Number. Please check and try again.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error: unknown) {
    console.error("Error checking tracking status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to query tracking information";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
