import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const authPayload = await getAuthUser();
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, department, phone, address, emergencyContact } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(
      authPayload.userId,
      {
        name: name.trim(),
        bio: bio !== undefined ? bio.trim().slice(0, 200) : "",
        ...(department ? { department: department.trim() } : {}),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Also update Employee record if linked
    const Employee = (await import("@/models/Employee")).default;
    const empUpdate: Record<string, unknown> = { name: name.trim() };
    if (phone !== undefined) empUpdate.phone = phone.trim();
    if (address !== undefined) empUpdate.address = address.trim();
    if (emergencyContact !== undefined) empUpdate.emergencyContact = emergencyContact.trim();

    const employee = await Employee.findOneAndUpdate(
      {
        $or: [
          { userId: updatedUser._id },
          { email: updatedUser.email.toLowerCase() }
        ]
      },
      { $set: empUpdate },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        department: employee?.department || updatedUser.department,
        createdAt: updatedUser.createdAt,
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
    console.error("Profile update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
