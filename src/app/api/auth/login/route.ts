// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";
import { generateSessionId } from "../../../../lib/utils";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      console.log("Login Attempt Failed: Missing email or password");
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`Login Attempt Failed: User not found for email: ${email}`);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      console.log(`Login Attempt Failed: Invalid password for user: ${email}`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, // Include the role in the payload
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // Generate a unique session ID
    const sessionId = generateSessionId();

    // Log the session details
    console.log("Session Generated:", { sessionId, userId: user.id, email: user.email });

    const response = NextResponse.json(
      { message: "Logged in successfully", sessionId, token },
      { status: 200 }
    );

    // Set the token in an httpOnly cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
    });

    console.log("Login Successful for:", { email: user.email, sessionId });

    return response;
  } catch (error) {
    // Explicitly cast the error to an object with a `message` property
    const errorMessage = (error instanceof Error) ? error.message : "An unexpected error occurred";

    console.error("Login error:", errorMessage);
    return NextResponse.json(
      { message: "Login failed", error: errorMessage },
      { status: 500 }
    );
  }
}
