    // lib/auth.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number
}
export async function verifyAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if(!token) {
      return { user: null, error: 'No Token Provided'}
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return { user: decodedToken, error: null };
  } catch (error) {
    console.error("Token verification failed:", error);
      return {user: null, error: "Invalid token"};
  }
}