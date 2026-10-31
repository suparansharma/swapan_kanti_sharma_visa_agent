import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PassportEntry from "@/models/PassportEntry";
import { getAuthUser } from "@/lib/auth";

// In-memory cache for global passport stats (auto-invalidated on POST/PUT/DELETE)
let cachedPassportStats: {
  data: any;
  timestamp: number;
} | null = null;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    if (status !== "all") {
      andConditions.push({ status });
    }

    if (category === "individual") {
      andConditions.push({
        $or: [
          { applicationCategory: "individual" },
          { applicationCategory: { $exists: false } },
          { applicationCategory: null },
        ],
      });
    } else if (category === "family_group") {
      andConditions.push({ applicationCategory: "family_group" });
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      andConditions.push({
        $or: [
          { name: regex },
          { mobile: regex },
          { nid: regex },
          { entryNumber: regex },
          { email: regex },
          { onlineTrackId: regex },
          { familyGroupId: regex },
          { familyHeadName: regex },
          { familyHeadEntryNumber: regex },
          { groupMembersSummary: regex },
        ],
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    // 1. Check if stats are in memory cache
    const now = Date.now();
    const isStatsFresh = cachedPassportStats && now - cachedPassportStats.timestamp < 30000;

    const statsPromise = isStatsFresh
      ? Promise.resolve([cachedPassportStats!.data])
      : PassportEntry.aggregate([
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
        ]);

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
      statsPromise,
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

    if (!isStatsFresh) {
      cachedPassportStats = {
        data: statsData,
        timestamp: now,
      };
    }

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
      receivedDate,
      receivedBy,
      receivedByEmployeeId,
      totalAmount,
      paidAmount,
      onlineTrackId,
      status,
      deliveryDate,
      notes,
      applicationCategory,
      isFamilyGroup,
      members,
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
    const effectiveReceivedDate = receivedDate ? receivedDate.trim() : new Date().toISOString().split("T")[0];
    const effectiveReceivedBy = receivedBy ? receivedBy.trim() : (authUser?.name || "");
    const effectiveReceivedByEmployeeId = receivedByEmployeeId ? receivedByEmployeeId.trim() : "";

    // Helper: Next Sequential Entry Number (PS-001)
    const getNextEntryNumber = async (): Promise<string> => {
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
        const count = await PassportEntry.countDocuments();
        nextNum = count + 1;
      }

      let entryNumber = `PS-${String(nextNum).padStart(3, "0")}`;
      while (await PassportEntry.exists({ entryNumber })) {
        nextNum += 1;
        entryNumber = `PS-${String(nextNum).padStart(3, "0")}`;
      }
      return entryNumber;
    };

    // Helper: Next Sequential Family Group ID (FAM-PS-001)
    const getNextFamilyGroupId = async (): Promise<string> => {
      let nextNum = 1;
      const latestFamily = await PassportEntry.findOne({ familyGroupId: /^FAM-PS-\d+$/ })
        .sort({ createdAt: -1 })
        .select("familyGroupId")
        .lean();

      if (latestFamily && latestFamily.familyGroupId) {
        const match = latestFamily.familyGroupId.match(/^FAM-PS-(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      let familyGroupId = `FAM-PS-${String(nextNum).padStart(3, "0")}`;
      while (await PassportEntry.exists({ familyGroupId })) {
        nextNum += 1;
        familyGroupId = `FAM-PS-${String(nextNum).padStart(3, "0")}`;
      }
      return familyGroupId;
    };

    // Check if Family / Group Application
    const isGroup = applicationCategory === "family_group" || isFamilyGroup || (Array.isArray(members) && members.length > 0);
    const validMembers: Array<{
      name: string;
      mobile?: string;
      nid?: string;
      birthDate?: string;
      relation?: string;
      passportType?: string;
      onlineTrackId?: string;
    }> = Array.isArray(members)
      ? members.filter(
          (m) => m && typeof m.name === "string" && m.name.trim()
        )
      : [];

    if (isGroup && validMembers.length > 0) {
      const familyGroupId = await getNextFamilyGroupId();
      const headEntryNumber = await getNextEntryNumber();
      const totalMemberCount = 1 + validMembers.length;
      const memberSummary = [name.trim(), ...validMembers.map((m) => m.name.trim())].join(", ");

      // 1. Create Primary Entry doc (Family Head - holds total package financial liability)
      const primaryEntry = await PassportEntry.create({
        entryNumber: headEntryNumber,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email ? email.trim() : "",
        nid: nid.trim(),
        birthDate: birthDate.trim(),
        passportType: passportType || "e_passport_10y_48p",
        receivedDate: effectiveReceivedDate,
        receivedBy: effectiveReceivedBy,
        receivedByEmployeeId: effectiveReceivedByEmployeeId,
        totalAmount: parsedTotal,
        paidAmount: parsedPaid,
        dueAmount: calculatedDue,
        onlineTrackId: onlineTrackId ? onlineTrackId.trim() : "",
        status: status || "submitted",
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        notes: notes || "",
        applicationCategory: "family_group",
        isFamilyHead: true,
        familyGroupId,
        familyHeadEntryNumber: headEntryNumber,
        familyHeadName: name.trim(),
        familyRelation: "প্রধান আবেদনকারী (Family Head)",
        familyMemberCount: totalMemberCount,
        groupMembersSummary: memberSummary,
        createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
        createdByName: authUser?.name || "",
      });

      // 2. Create records for each family member
      const createdMembers = [];
      for (const m of validMembers) {
        const memberEntryNumber = await getNextEntryNumber();
        const memberEntry = await PassportEntry.create({
          entryNumber: memberEntryNumber,
          name: m.name.trim(),
          mobile: m.mobile ? m.mobile.trim() : mobile.trim(),
          email: email ? email.trim() : "",
          nid: m.nid ? m.nid.trim() : "—",
          birthDate: m.birthDate ? m.birthDate.trim() : "—",
          passportType: m.passportType || passportType || "e_passport_10y_48p",
          receivedDate: effectiveReceivedDate,
          receivedBy: effectiveReceivedBy,
          receivedByEmployeeId: effectiveReceivedByEmployeeId,
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          onlineTrackId: m.onlineTrackId ? m.onlineTrackId.trim() : "",
          status: status || "submitted",
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          notes: notes ? `${notes} | ফ্যামিলি প্যাকেজ (বিল প্রধান: ${name.trim()} - ${headEntryNumber})` : `ফ্যামিলি প্যাকেজ (বিল প্রধান: ${name.trim()} - ${headEntryNumber})`,
          applicationCategory: "family_group",
          isFamilyHead: false,
          familyGroupId,
          familyHeadEntryNumber: headEntryNumber,
          familyHeadName: name.trim(),
          familyRelation: m.relation || "পরিবার সদস্য",
          familyMemberCount: totalMemberCount,
          groupMembersSummary: memberSummary,
          createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
          createdByName: authUser?.name || "",
        });
        createdMembers.push(memberEntry);
      }

      return NextResponse.json(
        {
          success: true,
          message: `ফ্যামিলি পাসপোর্ট প্যাকেজ সফলভাবে যুক্ত হয়েছে (${totalMemberCount} জন সদস্য)`,
          entry: primaryEntry,
          membersCount: createdMembers.length,
          familyGroupId,
        },
        { status: 201 }
      );
    }

    // Default: Single / Individual Passport Entry
    const entryNumber = await getNextEntryNumber();
    const newEntry = await PassportEntry.create({
      entryNumber,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : "",
      nid: nid.trim(),
      birthDate: birthDate.trim(),
      passportType: passportType || "e_passport_10y_48p",
      receivedDate: effectiveReceivedDate,
      receivedBy: effectiveReceivedBy,
      receivedByEmployeeId: effectiveReceivedByEmployeeId,
      totalAmount: parsedTotal,
      paidAmount: parsedPaid,
      dueAmount: calculatedDue,
      onlineTrackId: onlineTrackId ? onlineTrackId.trim() : "",
      status: status || "submitted",
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      notes: notes || "",
      applicationCategory: "individual",
      isFamilyHead: false,
      familyGroupId: "",
      familyHeadEntryNumber: "",
      familyHeadName: "",
      familyRelation: "",
      familyMemberCount: 1,
      groupMembersSummary: "",
      createdBy: authUser?.userId ? (authUser.userId as unknown as string) : undefined,
      createdByName: authUser?.name || "",
    });

    cachedPassportStats = null;
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
      receivedDate,
      receivedBy,
      receivedByEmployeeId,
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
    if (receivedDate !== undefined) updateData.receivedDate = receivedDate.trim();
    if (receivedBy !== undefined) updateData.receivedBy = receivedBy.trim();
    if (receivedByEmployeeId !== undefined) updateData.receivedByEmployeeId = receivedByEmployeeId.trim();
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

    cachedPassportStats = null;
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

    cachedPassportStats = null;
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
