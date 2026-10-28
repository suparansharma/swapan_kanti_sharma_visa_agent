import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PassportEntry from "@/models/PassportEntry";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status !== "all") {
      query.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { mobile: regex },
        { nid: regex },
        { entryNumber: regex },
        { email: regex },
        { onlineTrackId: regex },
      ];
    }

    // Run query, count, and aggregation in parallel for ultra-fast response
    const [entries, totalMatching, statsResult] = await Promise.all([
      PassportEntry.find(query)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PassportEntry.countDocuments(query),
      PassportEntry.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalContractAmount: { $sum: "$totalAmount" },
            totalCollectedAmount: { $sum: "$paidAmount" },
            totalDueAmount: { $sum: "$dueAmount" },
            readyCount: {
              $sum: { $cond: [{ $eq: ["$status", "ready_for_pickup"] }, 1, 0] },
            },
            deliveredCount: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            processingCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$status", "ready_for_pickup"] },
                      { $ne: ["$status", "delivered"] },
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
      readyCount: 0,
      deliveredCount: 0,
      processingCount: 0,
    };

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    return NextResponse.json({
      success: true,
      entries,
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
        readyCount: statsData.readyCount || 0,
        deliveredCount: statsData.deliveredCount || 0,
        processingCount: statsData.processingCount || 0,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching passport entries:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch passport entries";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();
    const body = await request.json();

    const {
      name,
      mobile,
      email,
      nid,
      birthDate,
      passportType,
      totalAmount,
      paidAmount,
      onlineTrackId,
      status,
      deliveryDate,
      notes,
    } = body;

    if (!name || !mobile || !nid || !birthDate) {
      return NextResponse.json(
        { error: "নাম, মোবাইল নম্বর, এনআইডি এবং জন্মতারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const parsedTotal = Math.max(0, Number(totalAmount) || 0);
    const parsedPaid = Math.max(0, Number(paidAmount) || 0);
    const calculatedDue = Math.max(0, parsedTotal - parsedPaid);

    // Generate sequential entry serial: PS-001, PS-002, ...
    let nextNum = 1;
    const latestEntry = await PassportEntry.findOne({ entryNumber: /^PS-\d+$/ })
      .sort({ createdAt: -1 })
      .select("entryNumber")
      .lean();

    if (latestEntry && latestEntry.entryNumber) {
      const match = latestEntry.entryNumber.match(/^PS-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    } else {
      // Fallback: If no PS-xxx records exist yet, count existing entries
      const count = await PassportEntry.countDocuments();
      nextNum = count + 1;
    }

    // Ensure uniqueness in case of concurrent requests or gaps
    let entryNumber = `PS-${String(nextNum).padStart(3, "0")}`;
    while (await PassportEntry.exists({ entryNumber })) {
      nextNum += 1;
      entryNumber = `PS-${String(nextNum).padStart(3, "0")}`;
    }

    const newEntry = await PassportEntry.create({
      entryNumber,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : "",
      nid: nid.trim(),
      birthDate: birthDate.trim(),
      passportType: passportType || "e_passport_10y_48p",
      totalAmount: parsedTotal,
      paidAmount: parsedPaid,
      dueAmount: calculatedDue,
      onlineTrackId: onlineTrackId ? onlineTrackId.trim() : "",
      status: status || "submitted",
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      notes: notes || "",
      createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
      createdByName: authUser?.name || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "পাসপোর্ট এন্ট্রি সফলভাবে যুক্ত হয়েছে।",
        entry: newEntry,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating passport entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create passport entry";
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
      name,
      mobile,
      email,
      nid,
      birthDate,
      passportType,
      totalAmount,
      paidAmount,
      onlineTrackId,
      status,
      deliveryDate,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (mobile) updateData.mobile = mobile.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (nid) updateData.nid = nid.trim();
    if (birthDate) updateData.birthDate = birthDate.trim();
    if (passportType) updateData.passportType = passportType;
    if (onlineTrackId !== undefined) updateData.onlineTrackId = onlineTrackId ? onlineTrackId.trim() : "";
    if (status) updateData.status = status;
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : undefined;
    if (notes !== undefined) updateData.notes = notes;

    if (authUser?.userId) {
      updateData.updatedBy = authUser.userId;
      updateData.updatedByName = authUser.name || "";
    }

    if (totalAmount !== undefined || paidAmount !== undefined) {
      const existing = await PassportEntry.findById(id);
      if (!existing) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      }
      const t = totalAmount !== undefined ? Math.max(0, Number(totalAmount) || 0) : existing.totalAmount;
      const p = paidAmount !== undefined ? Math.max(0, Number(paidAmount) || 0) : existing.paidAmount;
      updateData.totalAmount = t;
      updateData.paidAmount = p;
      updateData.dueAmount = Math.max(0, t - p);
    }

    const updated = await PassportEntry.findByIdAndUpdate(id, updateData, { new: true })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!updated) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "পাসপোর্ট এন্ট্রি সফলভাবে আপডেট হয়েছে।",
      entry: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating passport entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update passport entry";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    await PassportEntry.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "পাসপোর্ট এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: unknown) {
    console.error("Error deleting passport entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete passport entry";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
