import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import VisaCost from "@/models/VisaCost";
import { getAuthUser } from "@/lib/auth";

export const DEFAULT_VISA_RATES = [
  {
    country: "India",
    visaType: "tourist_visa",
    title: "ভারত ট্যুরিস্ট ভিসা (IVAC প্রসেসিং)",
    embassyFee: 0,
    vfsCharge: 840,
    processingFee: 700,
    otherFee: 460,
    clientFee: 3000,
    duration: "৭-১০ কর্মদিবস",
    validity: "১ বছর",
    entryType: "Multiple Entry",
    description: "আইভিএসি (IVAC) অনলাইন ফর্ম, অ্যাপয়েন্টমেন্ট ও ফাইল প্রসেসিং সহ",
  },
  {
    country: "India",
    visaType: "medical_visa",
    title: "ভারত মেডিকেল ভিসা (Medical Patient - M1/M3)",
    embassyFee: 0,
    vfsCharge: 840,
    processingFee: 1200,
    otherFee: 960,
    clientFee: 4500,
    duration: "৭-১০ কর্মদিবস",
    validity: "৬ মাস",
    entryType: "Triple Entry",
    description: "ভারতীয় হাসপাতালের মেডিকেল ইনভাইটেশন লেটার ও অ্যাপয়েন্টমেন্ট সহ",
  },
  {
    country: "India",
    visaType: "medical_attendant",
    title: "ভারত মেডিকেল এটেন্ডেন্ট ভিসা (Medical Attendant - M2/M4)",
    embassyFee: 0,
    vfsCharge: 840,
    processingFee: 1100,
    otherFee: 860,
    clientFee: 4200,
    duration: "৭-১০ কর্মদিবস",
    validity: "৬ মাস",
    entryType: "Triple Entry",
    description: "মূল রোগীর সাথে সহযোগী মেডিকেল এটেন্ডেন্ট ফাইল প্রসেসিং",
  },
  {
    country: "India",
    visaType: "student_visa",
    title: "ভারত স্টুডেন্ট ভিসা (Student Visa - S1)",
    embassyFee: 0,
    vfsCharge: 840,
    processingFee: 1500,
    otherFee: 1160,
    clientFee: 5500,
    duration: "১০-১৫ কর্মদিবস",
    validity: "কোর্স মেয়াদী / ১ বছর",
    entryType: "Multiple Entry",
    description: "ভারতীয় শিক্ষা প্রতিষ্ঠানের অফার লেটার ও স্টুডেন্ট ফাইল প্রসেসিং",
  },
  {
    country: "India",
    visaType: "work_permit",
    title: "ভারত ওয়ার্ক পারমিট / এমপ্লয়মেন্ট ভিসা (Work Permit - E1)",
    embassyFee: 0,
    vfsCharge: 840,
    processingFee: 2500,
    otherFee: 1660,
    clientFee: 8000,
    duration: "১৫-২০ কর্মদিবস",
    validity: "চুক্তি অনুযায়ী / ১ বছর",
    entryType: "Multiple Entry",
    description: "ভারতীয় কোম্পানির নিয়োগ চুক্তিপত্র ও ওয়ার্ক ফাইল প্রসেসিং",
  },
  {
    country: "India",
    visaType: "business_visa",
    title: "ভারত বিজনেস ভিসা (Business Visa - B1)",
    embassyFee: 0,
    vfsCharge: 840,
    processingFee: 2000,
    otherFee: 1160,
    clientFee: 6000,
    duration: "৭-১০ কর্মদিবস",
    validity: "১ বছর",
    entryType: "Multiple Entry",
    description: "ভারত ও বাংলাদেশের ট্রেড লাইসেন্স এবং বিজনেস ইনভাইটেশন লেটার প্রসেসিং",
  },
  {
    country: "India",
    visaType: "passport_new",
    title: "নতুন পাসপোর্ট সার্ভিস (Passport New)",
    embassyFee: 0,
    vfsCharge: 500,
    processingFee: 1200,
    otherFee: 800,
    clientFee: 4000,
    duration: "১৫-২১ কর্মদিবস",
    validity: "১০ বছর / ৫ বছর",
    entryType: "Regular / Express",
    description: "ভারত ট্রাভেল সংক্রান্ত নতুন পাসপোর্ট অনলাইন আবেদন ও ফিঙ্গারপ্রিন্ট গাইডলাইন",
  },
  {
    country: "India",
    visaType: "passport_renewal",
    title: "পাসপোর্ট নবায়ন সার্ভিস (Passport Renewal)",
    embassyFee: 0,
    vfsCharge: 400,
    processingFee: 1000,
    otherFee: 600,
    clientFee: 3500,
    duration: "১০-১৫ কর্মদিবস",
    validity: "১০ বছর",
    entryType: "Renewal",
    description: "ভারত ভিসা আবেদনের পূর্বে মেয়াদোত্তীর্ণ পাসপোর্ট রিনিউ ও পুলিশ ক্লিয়ারেন্স গাইড",
  },
];

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "all";

    const query: Record<string, unknown> = {};

    if (country !== "all") {
      query.country = country;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { country: regex },
        { visaType: regex },
        { description: regex },
        { validity: regex },
        { duration: regex },
      ];
    }

    const costs = await VisaCost.find(query)
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
    console.error("Error fetching visa costs:", error);
    const msg = error instanceof Error ? error.message : "ভিসা খরচের তথ্য লোড করতে ব্যর্থ হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();
    const body = await request.json();

    // Support quick seed defaults / reset
    if (body.action === "seed_defaults" || body.action === "reset_defaults") {
      if (body.reset || body.action === "reset_defaults") {
        await VisaCost.deleteMany({});
      }
      let insertedCount = 0;
      for (const item of DEFAULT_VISA_RATES) {
        const exists = await VisaCost.findOne({
          country: item.country,
          visaType: item.visaType,
        });
        if (!exists) {
          const total = item.embassyFee + item.vfsCharge + item.processingFee + item.otherFee;
          const profit = item.clientFee ? item.clientFee - total : 0;
          await VisaCost.create({
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
        message: `${insertedCount}টি ভারতীয় ভিসা সার্ভিস খরচের হার সফলভাবে তৈরি হয়েছে।`,
      });
    }

    const {
      country,
      visaType,
      title,
      embassyFee,
      vfsCharge,
      processingFee,
      otherFee,
      clientFee,
      duration,
      validity,
      entryType,
      description,
      isActive,
    } = body;

    if (!country || !title) {
      return NextResponse.json(
        { error: "দেশ এবং শিরোনাম আবশ্যক।" },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = await VisaCost.findOne({
      country: country.trim(),
      visaType: (visaType || "tourist_visa").trim(),
      title: title.trim(),
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `"${title}" (${country}) খরচের হার ইতোমধ্যে তালিকায় রয়েছে। অনুগ্রহ করে সেটি এডিট করুন।`,
        },
        { status: 409 }
      );
    }

    const e = Math.max(0, Number(embassyFee) || 0);
    const v = Math.max(0, Number(vfsCharge) || 0);
    const p = Math.max(0, Number(processingFee) || 0);
    const o = Math.max(0, Number(otherFee) || 0);
    const total = Math.round(e + v + p + o);
    const c = Math.max(0, Number(clientFee) || 0);
    const profit = c > 0 ? Math.round(c - total) : 0;

    const newCost = await VisaCost.create({
      country: country.trim(),
      visaType: (visaType || "tourist_visa").trim(),
      title: title.trim(),
      embassyFee: e,
      vfsCharge: v,
      processingFee: p,
      otherFee: o,
      totalCost: total,
      clientFee: c,
      estimatedProfit: profit,
      duration: duration ? duration.trim() : "৭-১০ কর্মদিবস",
      validity: validity ? validity.trim() : "১ বছর",
      entryType: entryType ? entryType.trim() : "Multiple Entry",
      description: description ? description.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: authUser?.userId || undefined,
      createdByName: authUser?.name || "System",
    });

    return NextResponse.json({
      success: true,
      message: "নতুন ভিসা খরচের তথ্য সফলভাবে যুক্ত হয়েছে।",
      cost: newCost,
    });
  } catch (error: unknown) {
    console.error("Error creating visa cost:", error);
    const msg = error instanceof Error ? error.message : "ভিসা খরচের তথ্য যুক্ত করতে ব্যর্থ হয়েছে";
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
      country,
      visaType,
      title,
      embassyFee,
      vfsCharge,
      processingFee,
      otherFee,
      clientFee,
      duration,
      validity,
      entryType,
      description,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Cost item ID is required" }, { status: 400 });
    }

    const existing = await VisaCost.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "ভিসা খরচের তথ্য খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    if (country) existing.country = country.trim();
    if (visaType) existing.visaType = visaType.trim();
    if (title) existing.title = title.trim();
    if (embassyFee !== undefined) existing.embassyFee = Math.max(0, Number(embassyFee) || 0);
    if (vfsCharge !== undefined) existing.vfsCharge = Math.max(0, Number(vfsCharge) || 0);
    if (processingFee !== undefined) existing.processingFee = Math.max(0, Number(processingFee) || 0);
    if (otherFee !== undefined) existing.otherFee = Math.max(0, Number(otherFee) || 0);
    if (clientFee !== undefined) existing.clientFee = Math.max(0, Number(clientFee) || 0);
    if (duration !== undefined) existing.duration = duration.trim();
    if (validity !== undefined) existing.validity = validity.trim();
    if (entryType !== undefined) existing.entryType = entryType.trim();
    if (description !== undefined) existing.description = description.trim();
    if (isActive !== undefined) existing.isActive = Boolean(isActive);

    const e = Number(existing.embassyFee) || 0;
    const v = Number(existing.vfsCharge) || 0;
    const p = Number(existing.processingFee) || 0;
    const o = Number(existing.otherFee) || 0;
    existing.totalCost = Math.round(e + v + p + o);

    const c = Number(existing.clientFee) || 0;
    existing.estimatedProfit = c > 0 ? Math.round(c - existing.totalCost) : 0;

    if (authUser?.userId) {
      existing.updatedBy = authUser.userId as any;
      existing.updatedByName = authUser.name || "";
    }

    await existing.save();

    return NextResponse.json({
      success: true,
      message: "ভিসা খরচের তথ্য সফলভাবে আপডেট করা হয়েছে।",
      cost: existing,
    });
  } catch (error: unknown) {
    console.error("Error updating visa cost:", error);
    const msg = error instanceof Error ? error.message : "ভিসা খরচ আপডেট করতে ব্যর্থ হয়েছে";
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
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Cost item ID is required" }, { status: 400 });
    }

    const deleted = await VisaCost.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "ভিসা খরচের তথ্য খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `"${deleted.title}" (${deleted.country}) খরচের তথ্য সফলভাবে মুছে ফেলা হয়েছে।`,
    });
  } catch (error: unknown) {
    console.error("Error deleting visa cost:", error);
    const msg = error instanceof Error ? error.message : "ভিসা খরচের তথ্য মুছতে ব্যর্থ হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
