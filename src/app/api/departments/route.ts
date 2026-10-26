import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Department from "@/models/Department";
import Employee from "@/models/Employee";

export async function GET() {
  try {
    await connectToDatabase();
    // Auto seed default departments if none exist
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.create([
        { name: "Administration", code: "ADMIN", description: "প্রশাসন ও সার্বিক ব্যবস্থাপনা" },
        { name: "Accounts", code: "ACC", description: "হিসাবরক্ষণ ও অর্থ বিভাগ" },
        { name: "Operations", code: "OPS", description: "অপারেশন ও কম্পিউটার ডাটা এন্ট্রি" },
        { name: "Visa & Passport Section", code: "VPS", description: "ভিসা ও পাসপোর্ট প্রসেসিং বিভাগ" },
      ]);
    }

    const departments = await Department.find({}).sort({ name: 1 }).lean();

    // Attach count of employees per department
    const employeeCounts = await Employee.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    employeeCounts.forEach((ec) => {
      if (ec._id) countMap[ec._id] = ec.count;
    });

    const enriched = departments.map((d) => ({
      ...d,
      employeeCount: countMap[d.name] || 0,
    }));

    return NextResponse.json({ departments: enriched });
  } catch (error: unknown) {
    console.error("GET departments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const existing = await Department.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 400 }
      );
    }

    const newDept = await Department.create({
      name: trimmedName,
      code: code ? code.trim().toUpperCase() : "",
      description: description ? description.trim() : "",
    });

    return NextResponse.json({ success: true, department: newDept });
  } catch (error: unknown) {
    console.error("POST department error:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
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

    const dept = await Department.findById(id);
    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check if any employees use this department
    const inUseCount = await Employee.countDocuments({ department: dept.name });
    if (inUseCount > 0) {
      return NextResponse.json(
        { error: `এই ডিপার্টমেন্টে ${inUseCount} জন কর্মী যুক্ত আছেন, মুছে ফেলা সম্ভব নয়` },
        { status: 400 }
      );
    }

    await Department.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Department deleted" });
  } catch (error: unknown) {
    console.error("DELETE department error:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
