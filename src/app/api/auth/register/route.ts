import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { signJwtToken, setAuthCookie } from "@/lib/auth";

export async function POST() {
  return NextResponse.json(
    { error: "Public registration is disabled. Please sign in with your administrator credentials." },
    { status: 403 }
  );
}
