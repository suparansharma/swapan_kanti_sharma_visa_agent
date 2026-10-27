import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import VisaApplication from "@/models/VisaApplication";
import VisaCost from "@/models/VisaCost";
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
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Load VisaCost rates to calculate profit dynamically
    const visaCostDocs = await VisaCost.find().lean();
    const findCostForApp = (country: string, sType: string) => {
      const cLower = (country || "").toLowerCase();
      const sLower = (sType || "").toLowerCase();
      return (
        visaCostDocs.find(
          (c) => c.country.toLowerCase() === cLower && c.visaType.toLowerCase() === sLower
        ) ||
        visaCostDocs.find((c) => c.country.toLowerCase() === cLower)
      );
    };

    const formattedApplications = applications.map((v) => {
      const total = Number(v.totalAmount ?? v.feeAmount) || 0;
      const matched = findCostForApp(v.destinationCountry, v.serviceType);
      const costAmount =
        v.costAmount !== undefined && Number(v.costAmount) > 0
          ? Number(v.costAmount)
          : matched
          ? Number(matched.totalCost) || 0
          : 0;
      const profitAmount =
        v.profitAmount !== undefined && Number(v.profitAmount) > 0
          ? Number(v.profitAmount)
          : costAmount > 0
          ? Math.max(0, total - costAmount)
          : 0;

      return {
        ...v,
        costAmount,
        profitAmount,
      };
    });

    // Calculate summary statistics for the dashboard
    const allVisas = await VisaApplication.find().lean();
    let totalContractAmount = 0;
    let totalCollectedAmount = 0;
    let totalDueAmount = 0;
    let totalProfitAmount = 0;
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

      const matched = findCostForApp(v.destinationCountry, v.serviceType);
      const c = v.costAmount !== undefined && Number(v.costAmount) > 0 ? Number(v.costAmount) : matched ? Number(matched.totalCost) || 0 : 0;
      const p = v.profitAmount !== undefined && Number(v.profitAmount) > 0 ? Number(v.profitAmount) : c > 0 ? Math.max(0, total - c) : 0;
      totalProfitAmount += p;

      if (v.status === "approved" || v.status === "delivery_completed" || v.status === "dr_ayush_done") approvedCount++;
      else if (v.status === "ready_for_delivery" || v.status === "ready_for_pickup" || v.status === "delivered") readyCount++;
      else processingCount++;
    }

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      stats: {
        total: allVisas.length,
        totalContractAmount,
        totalCollectedAmount,
        totalDueAmount,
        totalProfitAmount,
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
    const sType = serviceType || "tourist_visa";

    if (!applicantName || !passportNumber || !phone) {
      return NextResponse.json(
        { error: "Applicant Name, Passport Number, and Phone are required." },
        { status: 400 }
      );
    }

    const numTotal = Number(totalAmount ?? feeAmount) || 0;
    const numPaid = Number(paidAmount) || 0;
    const computedDue = Math.max(0, numTotal - numPaid);

    // Look up matching VisaCost rate
    const costDoc =
      (await VisaCost.findOne({
        country: new RegExp(`^${country}$`, "i"),
        visaType: sType,
      })) ||
      (await VisaCost.findOne({
        country: new RegExp(`^${country}$`, "i"),
      }));

    // Enforce minimum client charge
    const minRequired = costDoc ? Number(costDoc.clientFee) || Number(costDoc.totalCost) || 0 : 0;
    if (minRequired > 0 && numTotal < minRequired) {
      return NextResponse.json(
        {
          error: `${country} ভিসার জন্য নির্ধারিত ক্লায়েন্ট চার্জ ৳${minRequired.toLocaleString("en-IN")}। এর চেয়ে কম টাকা নেওয়া যাবে না (সমান বা বেশি নিতে হবে)।`,
        },
        { status: 400 }
      );
    }

    const costAmount = costDoc ? Number(costDoc.totalCost) || 0 : 0;
    const profitAmount = costAmount > 0 ? Math.max(0, numTotal - costAmount) : (costDoc?.estimatedProfit || 0);

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
      const count = await VisaApplication.countDocuments();
      nextNum = count + 1;
    }

    let trackingId = `VS-${String(nextNum).padStart(3, "0")}`;
    while (await VisaApplication.exists({ trackingId })) {
      nextNum += 1;
      trackingId = `VS-${String(nextNum).padStart(3, "0")}`;
    }

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
      serviceType: sType,
      status: status || "submitted",
      feeAmount: numTotal,
      totalAmount: numTotal,
      paidAmount: numPaid,
      dueAmount: computedDue,
      costAmount,
      profitAmount,
      feeStatus: computedFeeStatus,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      notes: notes || "",
      createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
      createdByName: authUser?.name || "",
    });

    return NextResponse.json(
      { success: true, message: "ভিসা আবেদন সফলভাবে তৈরি হয়েছে।", application: newApp },
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
    const authUser = await getAuthUser();
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

    const current = await VisaApplication.findById(id);
    if (!current) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
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

    if (authUser?.userId) {
      updateFields.updatedBy = authUser.userId;
      updateFields.updatedByName = authUser.name || "";
    }

    const targetCountry = (destinationCountry || current.destinationCountry || "India").trim();
    const targetService = serviceType || current.serviceType || "tourist_visa";

    const costDoc =
      (await VisaCost.findOne({
        country: new RegExp(`^${targetCountry}$`, "i"),
        visaType: targetService,
      })) ||
      (await VisaCost.findOne({
        country: new RegExp(`^${targetCountry}$`, "i"),
      }));

    if (totalAmount !== undefined || paidAmount !== undefined || destinationCountry !== undefined || serviceType !== undefined) {
      const newTotal = totalAmount !== undefined ? Number(totalAmount) : (current.totalAmount || current.feeAmount || 0);
      const newPaid = paidAmount !== undefined ? Number(paidAmount) : (current.paidAmount || 0);

      // Enforce minimum client fee
      const minRequired = costDoc ? Number(costDoc.clientFee) || Number(costDoc.totalCost) || 0 : 0;
      if (minRequired > 0 && newTotal < minRequired) {
        return NextResponse.json(
          {
            error: `${targetCountry} ভিসার জন্য নির্ধারিত ক্লায়েন্ট চার্জ ৳${minRequired.toLocaleString("en-IN")}। এর চেয়ে কম টাকা নেওয়া যাবে না (সমান বা বেশি নিতে হবে)।`,
          },
          { status: 400 }
        );
      }

      updateFields.totalAmount = newTotal;
      updateFields.feeAmount = newTotal;
      updateFields.paidAmount = newPaid;
      updateFields.dueAmount = Math.max(0, newTotal - newPaid);

      const costAmount = costDoc ? Number(costDoc.totalCost) || 0 : current.costAmount || 0;
      const profitAmount = costAmount > 0 ? Math.max(0, newTotal - costAmount) : (current.profitAmount || 0);
      updateFields.costAmount = costAmount;
      updateFields.profitAmount = profitAmount;

      if (!feeStatus) {
        updateFields.feeStatus =
          newTotal > 0 && newPaid >= newTotal
            ? "paid"
            : newPaid > 0
            ? "partial"
            : "pending";
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
