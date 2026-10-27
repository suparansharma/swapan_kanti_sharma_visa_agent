import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const authPayload = await getAuthUser();
    if (!authPayload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(authPayload.userId).select("-password");

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Attempt to find linked employee record for detailed profile info
    const Employee = (await import("@/models/Employee")).default;
    const employee = await Employee.findOne({
      $or: [
        { userId: user._id },
        { email: user.email.toLowerCase() }
      ]
    }).lean();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        department: employee?.department || user.department || "General",
        createdAt: user.createdAt,
        employee: employee
          ? {
              id: employee._id.toString(),
              employeeId: employee.employeeId,
              name: employee.name,
              phone: employee.phone,
              email: employee.email,
              department: employee.department,
              designation: employee.designation,
              joiningDate: employee.joiningDate,
              salary: employee.salary,
              status: employee.status,
              address: employee.address,
              emergencyContact: employee.emergencyContact,
              notes: employee.notes,
            }
          : null,
      },
    });
  } catch (error: unknown) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null, error: "Failed to get user session" }, { status: 500 });
  }
}
