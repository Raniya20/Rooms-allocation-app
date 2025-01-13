// src/app/api/users/route.js
import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../../../../lib/prisma';
import { Prisma } from '@prisma/client';


// Define a Zod schema for user input validation
const userSchema = z.object({
    email: z.string().email().trim(),
    password: z.string().min(6).trim(),
    role: z.enum(['student', 'admin']).optional(),
    applicationStatus: z.string().optional(),
    yearOfStudy: z.number().optional(),
    hasMedicalCertificate: z.boolean().optional(),
    roomPreferences: z.string().optional(),
    roommatePreferences: z.string().optional()
});

const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

export async function POST(req) {
    try{
        const body = await req.json();
        const parsedBody = userSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ message: "Invalid user input.", errors: parsedBody.error.issues }, { status: 400 });
        }
        const { email, password, role = 'student',applicationStatus , yearOfStudy,hasMedicalCertificate ,roomPreferences, roommatePreferences } = parsedBody.data;


         const existingUser = await prisma.user.findUnique({ where: { email } });
         if (existingUser) {
              return NextResponse.json({ message: "Email already exists." }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 12)
        const apiKey = generateApiKey();
        const newUser = await prisma.user.create({
            data : {
                email,
                password : hashedPassword,
                role,
                applicationStatus,
                yearOfStudy,
                hasMedicalCertificate,
                roomPreferences,
                roommatePreferences,
                apiKey
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
                apiKey: true
            }
        });
        console.log("Generated apiKey:", apiKey)
        return NextResponse.json({message : "User registered successfully", user: newUser, apiKey : newUser.apiKey }, {status: 201});
    }catch(error) {
          console.error("Prisma Error:", error); // Log the detailed error
           if (error instanceof Prisma.PrismaClientKnownRequestError) {
             return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
           }

        console.error(error)
        return NextResponse.json({message : 'Error creating new user'}, {status : 500});
    }
}