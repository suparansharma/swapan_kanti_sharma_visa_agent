import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authPayload = await getAuthUser();
    if (!authPayload) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস (Unauthorized)" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড প্রদান করুন" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে" },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(authPayload.userId).select("+password");

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "বর্তমান পাসওয়ার্ডটি সঠিক নয়" },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!",
    });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    const msg = error instanceof Error ? error.message : "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
