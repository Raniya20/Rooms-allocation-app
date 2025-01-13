// src/app/api/users/route.js
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '../../../lib/auth';
import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';



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

const isAdmin = async (req) => {
    const result = await verifyAuth(req)
    return result.user?.role === 'admin';
};


export async function GET(req) {
    try {
        const authorized = await isAdmin(req);
        if(!authorized) {
            return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
        }
        const users = await prisma.user.findMany();
        return NextResponse.json(users, {status : 200});
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
    }
}
