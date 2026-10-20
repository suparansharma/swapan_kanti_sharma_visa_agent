import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  const startTime = Date.now();
  try {
    const db = await connectToDatabase();
    const latency = Date.now() - startTime;
    const isConnected = db.connection.readyState === 1;

    return NextResponse.json({
      status: isConnected ? "healthy" : "degraded",
      database: {
        engine: "MongoDB",
        connected: isConnected,
        readyState: db.connection.readyState,
        host: db.connection.host,
        name: db.connection.name,
        latencyMs: latency,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        status: "unhealthy",
        database: {
          engine: "MongoDB",
          connected: false,
          readyState: mongoose.connection.readyState,
          latencyMs: latency,
          error: errorMessage,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
