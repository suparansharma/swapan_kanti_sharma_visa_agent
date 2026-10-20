import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import VisaApplication from "@/models/VisaApplication";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const serviceType = searchParams.get("serviceType") || "all";

    // Build filter
    const query: Record<string, unknown> = {};

    if (status !== "all") {
      query.status = status;
    }
    if (serviceType !== "all") {
      query.serviceType = serviceType;
    }
    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { applicantName: regex },
        { passportNumber: regex },
        { trackingId: regex },
        { phone: regex },
        { destinationCountry: regex },
      ];
    }

    const applications = await VisaApplication.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics for the dashboard
    const totalCount = await VisaApplication.countDocuments();
    const approvedCount = await VisaApplication.countDocuments({ status: "approved" });
    const processingCount = await VisaApplication.countDocuments({
      status: { $in: ["submitted", "document_verification", "embassy_processing", "biometric_pending"] },
    });
    const readyCount = await VisaApplication.countDocuments({
      status: { $in: ["ready_for_pickup", "delivered"] },
    });

    return NextResponse.json({
      success: true,
      applications,
      stats: {
        total: totalCount,
        approved: approvedCount,
        processing: processingCount,
        ready: readyCount,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching visa applications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch applications";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();
    const body = await request.json();

    const {
      applicantName,
      passportNumber,
      phone,
      email,
      destinationCountry,
      serviceType,
      status,
      feeAmount,
      feeStatus,
      estimatedDelivery,
      notes,
    } = body;

    if (!applicantName || !passportNumber || !phone || !destinationCountry) {
      return NextResponse.json(
        { error: "Applicant name, passport number, phone, and country are required." },
        { status: 400 }
      );
    }

    // Generate unique tracking ID: e.g. SH-89241
    const prefix = serviceType?.includes("passport") ? "SH-PASS" : "SH-VISA";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `${prefix}-${randomSuffix}`;

    const newApp = await VisaApplication.create({
      trackingId,
      applicantName: applicantName.trim(),
      passportNumber: passportNumber.trim().toUpperCase(),
      phone: phone.trim(),
      email: email ? email.trim() : "",
      destinationCountry: destinationCountry.trim(),
      serviceType: serviceType || "tourist_visa",
      status: status || "submitted",
      feeAmount: Number(feeAmount) || 0,
      feeStatus: feeStatus || "pending",
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      notes: notes || "",
      createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
    });

    return NextResponse.json(
      { success: true, message: "Visa & Passport record created successfully", application: newApp },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating visa application:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create application";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, status, feeStatus, notes, estimatedDelivery } = body;

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const updated = await VisaApplication.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(feeStatus && { feeStatus }),
        ...(notes !== undefined && { notes }),
        ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) }),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Application status updated successfully",
      application: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating visa application:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update application";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    await VisaApplication.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting visa application:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete application";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
