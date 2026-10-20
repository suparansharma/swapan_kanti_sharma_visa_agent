import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";

export async function POST() {
  try {
    await connectToDatabase();

    const demoEmail = "admin@sharma.com";
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("232578", salt);

      demoUser = await User.create({
        name: "Admin Sharma",
        email: demoEmail,
        password: hashedPassword,
        role: "admin",
        bio: "System Administrator",
        department: "Administration",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      demoUser.password = await bcrypt.hash("232578", salt);
      demoUser.role = "admin";
      await demoUser.save();
    }

    // Check if initial tasks exist for this user
    const existingTasksCount = await Task.countDocuments({ user: demoUser._id });
    if (existingTasksCount === 0) {
      await Task.create([
        {
          user: demoUser._id,
          title: "Configure MongoDB Connection Pool & Caching",
          description: "Verify global connection caching in Next.js 16 App Router runtime.",
          status: "completed",
          priority: "high",
          category: "Database",
        },
        {
          user: demoUser._id,
          title: "Implement Bcrypt & JWT HttpOnly Cookie Auth",
          description: "Generate Jose JWT tokens with 7-day expiration and secure cookies.",
          status: "completed",
          priority: "high",
          category: "Authentication",
        },
        {
          user: demoUser._id,
          title: "Build Workspace CRUD & Dynamic Analytics",
          description: "Add, filter, update status and delete items directly from MongoDB.",
          status: "in_progress",
          priority: "medium",
          category: "Engineering",
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Demo user initialized successfully!",
      credentials: {
        email: demoEmail,
        password: "232578",
      },
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to seed demo data";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
