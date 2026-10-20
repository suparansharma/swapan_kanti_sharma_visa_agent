import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const authPayload = await getAuthUser();
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const tasks = await Task.find({ user: authPayload.userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ tasks });
  } catch (error: unknown) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authPayload = await getAuthUser();
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, category } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Item title is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const newTask = await Task.create({
      user: authPayload.userId,
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status || "todo",
      priority: priority || "medium",
      category: category || "General",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Item created successfully",
        task: newTask,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Task creation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create item";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
