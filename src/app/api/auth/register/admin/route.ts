// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../../../lib/prisma';

const userSchema = z.object({
    email: z.string().email().trim(),
    password: z.string().min(6).trim(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsedBody = userSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ message: "Invalid user input", errors: parsedBody.error.issues }, { status: 400 });
        }

        const { email, password } = parsedBody.data;

        let existingUser;
        try {
            existingUser = await prisma.user.findUnique({ where: { email } }); // Check if user exists
        } catch (error: any) {
            console.error("Prisma query error: ", error);
            return NextResponse.json({ message: "Error with prisma query" }, { status: 500 });
        }

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const apiKey = uuidv4();

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                apiKey,
                role: 'admin',  // <-- Set role to admin here
            },
            select: {
                id: true,
                email: true,
                role: true,
                applicationStatus: true,
                yearOfStudy: true,
                hasMedicalCertificate: true,
                roomPreferences: true,
                roommatePreferences: true,
                apiKey: true,
            },
        });

        return NextResponse.json({ message: 'User registered successfully', user: newUser, apiKey: newUser.apiKey }, { status: 201 });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 });
    }
}