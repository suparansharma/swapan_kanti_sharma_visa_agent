import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Designation from "@/models/Designation";
import Employee from "@/models/Employee";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const query: Record<string, unknown> = {};
    if (department && department !== "all") {
      query.department = department;
    }

    // Auto seed default designations if none exist
    const count = await Designation.countDocuments();
    if (count === 0) {
      await Designation.create([
        { title: "Admin", department: "Administration", description: "সিস্টেম ও সার্বিক অফিস প্রশাসন" },
        { title: "Computer Operator", department: "Operations", description: "কম্পিউটার ডাটা এন্ট্রি ও অনলাইন আবেদন" },
        { title: "Accounts", department: "Accounts", description: "হিসাব ও অর্থ লেনদেন ব্যবস্থাপনা" },
        { title: "Visa Consultant", department: "Visa & Passport Section", description: "ভিসা প্রসেসিং ও ক্লায়েন্ট কনসালটেন্ট" },
      ]);
    }

    const designations = await Designation.find(query).sort({ title: 1 }).lean();

    const employeeCounts = await Employee.aggregate([
      { $group: { _id: "$designation", count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    employeeCounts.forEach((ec) => {
      if (ec._id) countMap[ec._id] = ec.count;
    });

    const enriched = designations.map((d) => ({
      ...d,
      employeeCount: countMap[d.title] || 0,
    }));

    return NextResponse.json({ designations: enriched });
  } catch (error: unknown) {
    console.error("GET designations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch designations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { title, department, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Designation title is required" },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    const existing = await Designation.findOne({
      title: { $regex: new RegExp(`^${trimmedTitle}$`, "i") },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Designation with this title already exists" },
        { status: 400 }
      );
    }

    const newDesig = await Designation.create({
      title: trimmedTitle,
      department: department ? department.trim() : "",
      description: description ? description.trim() : "",
    });

    return NextResponse.json({ success: true, designation: newDesig });
  } catch (error: unknown) {
    console.error("POST designation error:", error);
    return NextResponse.json(
      { error: "Failed to create designation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const desig = await Designation.findById(id);
    if (!desig) {
      return NextResponse.json({ error: "Designation not found" }, { status: 404 });
    }

    const inUseCount = await Employee.countDocuments({ designation: desig.title });
    if (inUseCount > 0) {
      return NextResponse.json(
        { error: `এই পদবীতে ${inUseCount} জন কর্মী যুক্ত আছেন, মুছে ফেলা সম্ভব নয়` },
        { status: 400 }
      );
    }

    await Designation.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Designation deleted" });
  } catch (error: unknown) {
    console.error("DELETE designation error:", error);
    return NextResponse.json(
      { error: "Failed to delete designation" },
      { status: 500 }
    );
  }
}
