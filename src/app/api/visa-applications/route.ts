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
        { visaType: regex },
      ];
    }

    const applications = await VisaApplication.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics for the dashboard
    const allVisas = await VisaApplication.find().lean();
    let totalContractAmount = 0;
    let totalCollectedAmount = 0;
    let totalDueAmount = 0;
    let approvedCount = 0;
    let processingCount = 0;
    let readyCount = 0;

    for (const v of allVisas) {
      const total = Number(v.totalAmount ?? v.feeAmount) || 0;
      const paid = Number(v.paidAmount ?? (v.feeStatus === "paid" ? total : 0)) || 0;
      const due = Number(v.dueAmount ?? Math.max(0, total - paid)) || 0;

      totalContractAmount += total;
      totalCollectedAmount += paid;
      totalDueAmount += due;

      if (v.status === "approved") approvedCount++;
      else if (v.status === "ready_for_pickup" || v.status === "delivered") readyCount++;
      else processingCount++;
    }

    return NextResponse.json({
      success: true,
      applications,
      stats: {
        total: allVisas.length,
        totalContractAmount,
        totalCollectedAmount,
        totalDueAmount,
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
      visaType,
      serviceType,
      status,
      feeAmount,
      totalAmount,
      paidAmount,
      feeStatus,
      estimatedDelivery,
      notes,
    } = body;

    const country = (destinationCountry || "India").trim();

    if (!applicantName || !passportNumber || !phone) {
      return NextResponse.json(
        { error: "Applicant name, passport number, and phone are required." },
        { status: 400 }
      );
    }

    // Generate sequential tracking ID: VS-001, VS-002, ...
    let nextNum = 1;
    const latestApp = await VisaApplication.findOne({ trackingId: /^VS-\d+$/ })
      .sort({ createdAt: -1 })
      .select("trackingId")
      .lean();

    if (latestApp && latestApp.trackingId) {
      const match = latestApp.trackingId.match(/^VS-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    } else {
      // Fallback: If no VS-xxx records exist yet, count existing applications
      const count = await VisaApplication.countDocuments();
      nextNum = count + 1;
    }

    // Ensure uniqueness in case of concurrent requests or gaps
    let trackingId = `VS-${String(nextNum).padStart(3, "0")}`;
    while (await VisaApplication.exists({ trackingId })) {
      nextNum += 1;
      trackingId = `VS-${String(nextNum).padStart(3, "0")}`;
    }

    const numTotal = Number(totalAmount ?? feeAmount) || 0;
    const numPaid = Number(paidAmount) || 0;
    const computedDue = Math.max(0, numTotal - numPaid);
    const computedFeeStatus =
      feeStatus ||
      (numTotal > 0 && numPaid >= numTotal
        ? "paid"
        : numPaid > 0
        ? "partial"
        : "pending");

    const newApp = await VisaApplication.create({
      trackingId,
      applicantName: applicantName.trim(),
      passportNumber: passportNumber.trim().toUpperCase(),
      phone: phone.trim(),
      email: email ? email.trim() : "",
      destinationCountry: country,
      visaType: visaType ? visaType.trim() : "",
      serviceType: serviceType || "tourist_visa",
      status: status || "submitted",
      feeAmount: numTotal,
      totalAmount: numTotal,
      paidAmount: numPaid,
      dueAmount: computedDue,
      feeStatus: computedFeeStatus,
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
    const {
      id,
      applicantName,
      passportNumber,
      phone,
      email,
      destinationCountry,
      visaType,
      serviceType,
      status,
      feeStatus,
      totalAmount,
      paidAmount,
      notes,
      estimatedDelivery,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};
    if (applicantName !== undefined) updateFields.applicantName = applicantName.trim();
    if (passportNumber !== undefined) updateFields.passportNumber = passportNumber.trim().toUpperCase();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (email !== undefined) updateFields.email = email ? email.trim() : "";
    if (destinationCountry !== undefined) updateFields.destinationCountry = destinationCountry.trim();
    if (visaType !== undefined) updateFields.visaType = visaType.trim();
    if (serviceType !== undefined) updateFields.serviceType = serviceType;
    if (status) updateFields.status = status;
    if (feeStatus) updateFields.feeStatus = feeStatus;
    if (notes !== undefined) updateFields.notes = notes;
    if (estimatedDelivery) updateFields.estimatedDelivery = new Date(estimatedDelivery);

    if (totalAmount !== undefined || paidAmount !== undefined) {
      const current = await VisaApplication.findById(id);
      if (current) {
        const newTotal = totalAmount !== undefined ? Number(totalAmount) : (current.totalAmount || current.feeAmount || 0);
        const newPaid = paidAmount !== undefined ? Number(paidAmount) : (current.paidAmount || 0);
        updateFields.totalAmount = newTotal;
        updateFields.feeAmount = newTotal;
        updateFields.paidAmount = newPaid;
        updateFields.dueAmount = Math.max(0, newTotal - newPaid);
        if (!feeStatus) {
          updateFields.feeStatus =
            newTotal > 0 && newPaid >= newTotal
              ? "paid"
              : newPaid > 0
              ? "partial"
              : "pending";
        }
      }
    }

    const updated = await VisaApplication.findByIdAndUpdate(
      id,
      updateFields,
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
