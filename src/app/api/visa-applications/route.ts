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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

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
        { familyGroupId: regex },
        { familyHeadName: regex },
        { familyHeadTrackingId: regex },
      ];
    }

    // Run query, count, and aggregation in parallel for ultra-fast performance
    const [applications, totalMatching, statsResult] = await Promise.all([
      VisaApplication.find(query)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VisaApplication.countDocuments(query),
      VisaApplication.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalContractAmount: {
              $sum: { $ifNull: ["$totalAmount", "$feeAmount"] },
            },
            totalCollectedAmount: {
              $sum: { $ifNull: ["$paidAmount", 0] },
            },
            totalDueAmount: {
              $sum: { $ifNull: ["$dueAmount", 0] },
            },
            approved: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["approved", "delivery_completed", "dr_ayush_done"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            ready: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["ready_for_delivery", "ready_for_pickup", "delivered"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            processing: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $not: {
                          $in: [
                            "$status",
                            ["approved", "delivery_completed", "dr_ayush_done"],
                          ],
                        },
                      },
                      {
                        $not: {
                          $in: [
                            "$status",
                            [
                              "ready_for_delivery",
                              "ready_for_pickup",
                              "delivered",
                            ],
                          ],
                        },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const statsData = statsResult[0] || {
      total: 0,
      totalContractAmount: 0,
      totalCollectedAmount: 0,
      totalDueAmount: 0,
      approved: 0,
      processing: 0,
      ready: 0,
    };

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        page,
        limit,
        totalEntries: totalMatching,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        total: statsData.total || 0,
        totalContractAmount: statsData.totalContractAmount || 0,
        totalCollectedAmount: statsData.totalCollectedAmount || 0,
        totalDueAmount: statsData.totalDueAmount || 0,
        approved: statsData.approved || 0,
        processing: statsData.processing || 0,
        ready: statsData.ready || 0,
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
      receivedDate,
      estimatedDelivery,
      notes,
      applicationCategory,
      isFamilyGroup,
      members,
    } = body;

    const country = (destinationCountry || "India").trim();

    if (!applicantName || !passportNumber || !phone) {
      return NextResponse.json(
        { error: "Applicant name, passport number, and phone are required." },
        { status: 400 }
      );
    }

    // Helper: Next Sequential Tracking ID
    const getNextTrackingId = async (): Promise<string> => {
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
      return trackingId;
    };

    // Helper: Next Sequential Family Group ID
    const getNextFamilyGroupId = async (): Promise<string> => {
      let nextNum = 1;
      const latestFamily = await VisaApplication.findOne({ familyGroupId: /^FAM-\d+$/ })
        .sort({ createdAt: -1 })
        .select("familyGroupId")
        .lean();

      if (latestFamily && latestFamily.familyGroupId) {
        const match = latestFamily.familyGroupId.match(/^FAM-(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      let familyGroupId = `FAM-${String(nextNum).padStart(3, "0")}`;
      while (await VisaApplication.exists({ familyGroupId })) {
        nextNum += 1;
        familyGroupId = `FAM-${String(nextNum).padStart(3, "0")}`;
      }
      return familyGroupId;
    };

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

    const effectiveReceivedDate = receivedDate ? receivedDate.trim() : new Date().toISOString().split("T")[0];

    // Determine if this is a Family / Group Application
    const isGroup = applicationCategory === "family_group" || isFamilyGroup || (Array.isArray(members) && members.length > 0);
    const validMembers: Array<{
      applicantName: string;
      passportNumber: string;
      relation?: string;
      visaType?: string;
      serviceType?: string;
      phone?: string;
    }> = Array.isArray(members)
      ? members.filter(
          (m) =>
            m &&
            typeof m.applicantName === "string" &&
            m.applicantName.trim() &&
            typeof m.passportNumber === "string" &&
            m.passportNumber.trim()
        )
      : [];

    if (isGroup && validMembers.length > 0) {
      const familyGroupId = await getNextFamilyGroupId();
      const headTrackingId = await getNextTrackingId();
      const totalMemberCount = 1 + validMembers.length;
      const memberSummary = [applicantName.trim(), ...validMembers.map((m) => m.applicantName.trim())].join(", ");

      // 1. Create Primary Applicant doc (Family Head - holds total package financial liability)
      const primaryApp = await VisaApplication.create({
        trackingId: headTrackingId,
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
        receivedDate: effectiveReceivedDate,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        notes: notes || "",
        applicationCategory: "family_group",
        isFamilyHead: true,
        familyGroupId,
        familyHeadTrackingId: headTrackingId,
        familyHeadName: applicantName.trim(),
        familyRelation: "প্রধান আবেদনকারী (Family Head)",
        familyMemberCount: totalMemberCount,
        groupMembersSummary: memberSummary,
        createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
        createdByName: authUser?.name || "",
      });

      // 2. Create records for each family member (each gets individual tracking ID for separate passport processing)
      const createdMembers = [];
      for (const m of validMembers) {
        const memberTrackingId = await getNextTrackingId();
        const memberApp = await VisaApplication.create({
          trackingId: memberTrackingId,
          applicantName: m.applicantName.trim(),
          passportNumber: m.passportNumber.trim().toUpperCase(),
          phone: m.phone ? m.phone.trim() : phone.trim(),
          email: email ? email.trim() : "",
          destinationCountry: country,
          visaType: m.visaType ? m.visaType.trim() : (visaType ? visaType.trim() : ""),
          serviceType: m.serviceType || serviceType || "tourist_visa",
          status: status || "submitted",
          feeAmount: 0,
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          feeStatus: computedFeeStatus,
          receivedDate: effectiveReceivedDate,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
          notes: notes ? `${notes} | ফ্যামিলি প্যাকেজ (বিল প্রধান: ${applicantName.trim()} - ${headTrackingId})` : `ফ্যামিলি প্যাকেজ (বিল প্রধান: ${applicantName.trim()} - ${headTrackingId})`,
          applicationCategory: "family_group",
          isFamilyHead: false,
          familyGroupId,
          familyHeadTrackingId: headTrackingId,
          familyHeadName: applicantName.trim(),
          familyRelation: m.relation || "পরিবার সদস্য",
          familyMemberCount: totalMemberCount,
          groupMembersSummary: memberSummary,
          createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
          createdByName: authUser?.name || "",
        });
        createdMembers.push(memberApp);
      }

      return NextResponse.json(
        {
          success: true,
          message: `ফ্যামিলি প্যাকেজ সফলভাবে তৈরি হয়েছে (${totalMemberCount} জন সদস্য)`,
          application: primaryApp,
          membersCount: createdMembers.length,
          familyGroupId,
        },
        { status: 201 }
      );
    }

    // Default: Single / Individual Application
    const trackingId = await getNextTrackingId();
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
      receivedDate: effectiveReceivedDate,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      notes: notes || "",
      applicationCategory: "individual",
      isFamilyHead: false,
      familyGroupId: "",
      familyHeadTrackingId: "",
      familyHeadName: "",
      familyRelation: "",
      familyMemberCount: 1,
      groupMembersSummary: "",
      createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
      createdByName: authUser?.name || "",
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
      receivedDate,
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
    if (receivedDate !== undefined) updateFields.receivedDate = receivedDate.trim();
    if (notes !== undefined) updateFields.notes = notes;
    if (estimatedDelivery) updateFields.estimatedDelivery = new Date(estimatedDelivery);

    if (authUser?.userId) {
      updateFields.updatedBy = authUser.userId;
      updateFields.updatedByName = authUser.name || "";
    }

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

    // Sync feeStatus to family members if updated record is Family Head
    if (updated.isFamilyHead && updated.familyGroupId && updated.feeStatus) {
      await VisaApplication.updateMany(
        { familyGroupId: updated.familyGroupId, isFamilyHead: false },
        { feeStatus: updated.feeStatus }
      );
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
