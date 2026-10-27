import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import PassportCost from "@/models/PassportCost";
import { getAuthUser } from "@/lib/auth";

// Standard default rates template for easy initial seeding if requested
const DEFAULT_STANDARD_RATES = [
  {
    passportType: "5y_regular_21d",
    title: "৫ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস)",
    govtFee: 4025,
    bankFee: 150,
    processingFee: 500,
    otherFee: 325,
    clientFee: 6000,
    duration: "২১ কর্মদিবস",
    validityYears: 5,
    pageCount: 48,
    description: "৫ বছর মেয়াদের সাধারণ ডেলিভারি ই-পাসপোর্ট খরচ",
  },
  {
    passportType: "10y_regular_21d",
    title: "১০ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস)",
    govtFee: 5750,
    bankFee: 150,
    processingFee: 600,
    otherFee: 500,
    clientFee: 8000,
    duration: "২১ কর্মদিবস",
    validityYears: 10,
    pageCount: 48,
    description: "১০ বছর মেয়াদের সাধারণ ডেলিভারি ই-পাসপোর্ট খরচ",
  },
  {
    passportType: "5y_urgent_7d",
    title: "৫ বছর মেয়াদী জরুরি পাসপোর্ট (৭ কর্ম দিবস)",
    govtFee: 6325,
    bankFee: 150,
    processingFee: 800,
    otherFee: 725,
    clientFee: 9500,
    duration: "৭ কর্মদিবস",
    validityYears: 5,
    pageCount: 48,
    description: "জরুরি ডেলিভারি (৭ কর্মদিবস) ই-পাসপোর্ট খরচ",
  },
  {
    passportType: "10y_urgent_7d",
    title: "১০ বছর মেয়াদী জরুরি পাসপোর্ট (৭ কর্ম দিবস)",
    govtFee: 8050,
    bankFee: 150,
    processingFee: 1000,
    otherFee: 800,
    clientFee: 12000,
    duration: "৭ কর্মদিবস",
    validityYears: 10,
    pageCount: 48,
    description: "১০ বছর মেয়াদের জরুরি ডেলিভারি ই-পাসপোর্ট খরচ",
  },
  {
    passportType: "5y_very_urgent_3d",
    title: "৫ বছর মেয়াদী অতীব জরুরি পাসপোর্ট (৩ কর্ম দিবস)",
    govtFee: 8625,
    bankFee: 150,
    processingFee: 1500,
    otherFee: 1225,
    clientFee: 14000,
    duration: "৩ কর্মদিবস",
    validityYears: 5,
    pageCount: 48,
    description: "৩ কর্মদিবসে সুপার এক্সপ্রেস ডেলিভারি খরচ",
  },
  {
    passportType: "10y_very_urgent_3d",
    title: "১০ বছর মেয়াদী অতীব জরুরি পাসপোর্ট (৩ কর্ম দিবস)",
    govtFee: 10350,
    bankFee: 150,
    processingFee: 1800,
    otherFee: 1700,
    clientFee: 17000,
    duration: "৩ কর্মদিবস",
    validityYears: 10,
    pageCount: 48,
    description: "১০ বছর মেয়াদের অতীব জরুরি সুপার এক্সপ্রেস খরচ",
  },
];

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { passportType: regex },
        { description: regex },
        { duration: regex },
      ];
    }

    const costs = await PassportCost.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Summary calculation
    const count = costs.length;
    let minCost = count > 0 ? costs[0].totalCost : 0;
    let maxCost = 0;
    let sumTotalCost = 0;
    let sumProfit = 0;

    for (const c of costs) {
      const tc = Number(c.totalCost) || 0;
      if (tc < minCost) minCost = tc;
      if (tc > maxCost) maxCost = tc;
      sumTotalCost += tc;
      sumProfit += Number(c.estimatedProfit) || 0;
    }

    const avgCost = count > 0 ? Math.round(sumTotalCost / count) : 0;

    return NextResponse.json({
      success: true,
      costs,
      stats: {
        totalTypes: count,
        minCost,
        maxCost,
        avgCost,
        totalEstimatedProfit: sumProfit,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching passport costs:", error);
    const msg = error instanceof Error ? error.message : "খরচের তথ্য লোড করতে ব্যর্থ হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();
    const body = await request.json();

    // Support quick seed / reset to default rates
    if (body.action === "seed_defaults") {
      let insertedCount = 0;
      for (const item of DEFAULT_STANDARD_RATES) {
        const exists = await PassportCost.findOne({ passportType: item.passportType });
        if (!exists) {
          const total = item.govtFee + item.bankFee + item.processingFee + item.otherFee;
          const profit = item.clientFee ? item.clientFee - total : 0;
          await PassportCost.create({
            ...item,
            totalCost: total,
            estimatedProfit: profit,
            createdByName: authUser?.name || "System Admin",
            createdBy: authUser?.userId || undefined,
          });
          insertedCount++;
        }
      }
      return NextResponse.json({
        success: true,
        message: `${insertedCount}টি স্ট্যান্ডার্ড পাসপোর্ট খরচের হার সফলভাবে তৈরি হয়েছে।`,
      });
    }

    const {
      passportType,
      title,
      govtFee,
      bankFee,
      processingFee,
      otherFee,
      clientFee,
      duration,
      validityYears,
      pageCount,
      description,
      isActive,
    } = body;

    if (!passportType || !title) {
      return NextResponse.json(
        { error: "পাসপোর্ট ধরন এবং শিরোনাম আবশ্যক।" },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await PassportCost.findOne({ passportType: passportType.trim() });
    if (existing) {
      return NextResponse.json(
        {
          error: `"${title}" এই ধরনের খরচের হার ইতোমধ্যে তালিকায় রয়েছে। অনুগ্রহ করে বিদ্যমান রেটটি এডিট করুন।`,
        },
        { status: 409 }
      );
    }

    const g = Math.max(0, Number(govtFee) || 0);
    const b = Math.max(0, Number(bankFee) || 0);
    const p = Math.max(0, Number(processingFee) || 0);
    const o = Math.max(0, Number(otherFee) || 0);
    const total = Math.round(g + b + p + o);
    const c = Math.max(0, Number(clientFee) || 0);
    const profit = c > 0 ? Math.round(c - total) : 0;

    const newCost = await PassportCost.create({
      passportType: passportType.trim(),
      title: title.trim(),
      govtFee: g,
      bankFee: b,
      processingFee: p,
      otherFee: o,
      totalCost: total,
      clientFee: c,
      estimatedProfit: profit,
      duration: duration ? duration.trim() : "২১ কর্মদিবস",
      validityYears: validityYears ? Number(validityYears) : 5,
      pageCount: pageCount ? Number(pageCount) : 48,
      description: description ? description.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: authUser?.userId || undefined,
      createdByName: authUser?.name || "System",
    });

    return NextResponse.json({
      success: true,
      message: "নতুন পাসপোর্ট খরচের তথ্য সফলভাবে যুক্ত হয়েছে।",
      cost: newCost,
    });
  } catch (error: unknown) {
    console.error("Error creating passport cost:", error);
    const msg = error instanceof Error ? error.message : "পাসপোর্ট খরচের তথ্য যুক্ত করতে ব্যর্থ হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();
    const body = await request.json();

    const {
      id,
      passportType,
      title,
      govtFee,
      bankFee,
      processingFee,
      otherFee,
      clientFee,
      duration,
      validityYears,
      pageCount,
      description,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Cost item ID is required" }, { status: 400 });
    }

    const existing = await PassportCost.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "খরচের তথ্য খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check duplicate passportType if changed
    if (passportType && passportType !== existing.passportType) {
      const conflict = await PassportCost.findOne({
        passportType: passportType.trim(),
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "এই পাসপোর্ট ধরনের জন্য ইতোমধ্যে একটি খরচের হার নির্ধারিত আছে।" },
          { status: 409 }
        );
      }
      existing.passportType = passportType.trim();
    }

    if (title) existing.title = title.trim();
    if (govtFee !== undefined) existing.govtFee = Math.max(0, Number(govtFee) || 0);
    if (bankFee !== undefined) existing.bankFee = Math.max(0, Number(bankFee) || 0);
    if (processingFee !== undefined) existing.processingFee = Math.max(0, Number(processingFee) || 0);
    if (otherFee !== undefined) existing.otherFee = Math.max(0, Number(otherFee) || 0);
    if (clientFee !== undefined) existing.clientFee = Math.max(0, Number(clientFee) || 0);
    if (duration !== undefined) existing.duration = duration.trim();
    if (validityYears !== undefined) existing.validityYears = Number(validityYears);
    if (pageCount !== undefined) existing.pageCount = Number(pageCount);
    if (description !== undefined) existing.description = description.trim();
    if (isActive !== undefined) existing.isActive = Boolean(isActive);

    const g = Number(existing.govtFee) || 0;
    const b = Number(existing.bankFee) || 0;
    const p = Number(existing.processingFee) || 0;
    const o = Number(existing.otherFee) || 0;
    existing.totalCost = Math.round(g + b + p + o);

    const c = Number(existing.clientFee) || 0;
    existing.estimatedProfit = c > 0 ? Math.round(c - existing.totalCost) : 0;

    if (authUser?.userId) {
      existing.updatedBy = authUser.userId as any;
      existing.updatedByName = authUser.name || "";
    }

    await existing.save();

    return NextResponse.json({
      success: true,
      message: "পাসপোর্ট খরচের তথ্য সফলভাবে আপডেট করা হয়েছে।",
      cost: existing,
    });
  } catch (error: unknown) {
    console.error("Error updating passport cost:", error);
    const msg = error instanceof Error ? error.message : "পাসপোর্ট খরচ আপডেট করতে ব্যর্থ হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // ignore body parse fail
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Cost item ID is required" }, { status: 400 });
    }

    const deleted = await PassportCost.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "খরচের তথ্য খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `"${deleted.title}" খরচের তথ্য সফলভাবে মুছে ফেলা হয়েছে।`,
    });
  } catch (error: unknown) {
    console.error("Error deleting passport cost:", error);
    const msg = error instanceof Error ? error.message : "খরচের তথ্য মুছতে ব্যর্থ হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
