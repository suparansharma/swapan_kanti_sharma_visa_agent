import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Employee from "@/models/Employee";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "all";
    const status = searchParams.get("status") || "all";

    const query: Record<string, unknown> = {};

    if (department !== "all") {
      query.department = department;
    }
    if (status !== "all") {
      query.status = status;
    }
    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { employeeId: regex },
        { phone: regex },
        { designation: regex },
        { email: regex },
      ];
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [employees, totalMatching, total, active, inactive, onLeave] = await Promise.all([
      Employee.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(query),
      Employee.countDocuments(),
      Employee.countDocuments({ status: "active" }),
      Employee.countDocuments({ status: "inactive" }),
      Employee.countDocuments({ status: "on_leave" }),
    ]);

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        totalEntries: totalMatching,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: { total, active, inactive, onLeave },
    });
  } catch (error: unknown) {
    console.error("GET employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      name,
      phone,
      email,
      password,
      department,
      designation,
      joiningDate,
      salary,
      status,
      address,
      emergencyContact,
      notes,
    } = body;

    if (!name || !phone || !department || !designation) {
      return NextResponse.json(
        { error: "নাম, মোবাইল নম্বর, ডিপার্টমেন্ট এবং পদবী আবশ্যক।" },
        { status: 400 }
      );
    }

    const trimmedEmail = email ? email.trim().toLowerCase() : "";

    // If password provided, email is required
    if (password && password.trim()) {
      if (!trimmedEmail) {
        return NextResponse.json(
          { error: "লগইন অ্যাকাউন্ট তৈরির জন্য বৈধ ইমেইল আবশ্যক।" },
          { status: 400 }
        );
      }
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
          { status: 400 }
        );
      }
      // Check if User already exists with this email
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।" },
          { status: 400 }
        );
      }
    }

    // Generate sequential Employee ID: EMP-001, EMP-002, ...
    let nextNum = 1;
    const latestEmp = await Employee.findOne({ employeeId: /^EMP-\d+$/ })
      .sort({ createdAt: -1 })
      .select("employeeId")
      .lean();

    if (latestEmp && latestEmp.employeeId) {
      const match = latestEmp.employeeId.match(/^EMP-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    } else {
      const count = await Employee.countDocuments();
      nextNum = count + 1;
    }

    let employeeId = `EMP-${String(nextNum).padStart(3, "0")}`;
    while (await Employee.exists({ employeeId })) {
      nextNum += 1;
      employeeId = `EMP-${String(nextNum).padStart(3, "0")}`;
    }

    let createdUserId = undefined;
    let hasLoginAccount = false;

    // Create login account if password provided
    if (password && password.trim() && trimmedEmail) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password.trim(), salt);
      const role = designation.toLowerCase().includes("admin") ? "admin" : "user";

      const newUser = await User.create({
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        role,
        department: department.trim(),
        bio: `${designation} at Sharma Office`,
      });
      createdUserId = newUser._id;
      hasLoginAccount = true;
    }

    const newEmp = await Employee.create({
      employeeId,
      name: name.trim(),
      phone: phone.trim(),
      email: trimmedEmail,
      department: department.trim(),
      designation: designation.trim(),
      joiningDate: joiningDate ? joiningDate.trim() : "",
      salary: Number(salary) || 0,
      status: status || "active",
      address: address ? address.trim() : "",
      emergencyContact: emergencyContact ? emergencyContact.trim() : "",
      notes: notes ? notes.trim() : "",
      userId: createdUserId,
      hasLoginAccount,
    });

    return NextResponse.json({ success: true, employee: newEmp }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST employee error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const updated = await Employee.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: unknown) {
    console.error("PUT employee error:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
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

    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Employee deleted" });
  } catch (error: unknown) {
    console.error("DELETE employee error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
