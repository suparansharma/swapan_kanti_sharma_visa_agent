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
    const { name, bio, department } = body;

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
        bio: bio ? bio.trim().slice(0, 200) : "",
        department: department ? department.trim() : "Engineering",
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        department: updatedUser.department,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
