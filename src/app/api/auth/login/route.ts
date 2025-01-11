  // src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Please provide an email and password' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } , select : {
           id: true,
            email:true,
            password : true,
            role : true,
            applicationStatus: true,
            yearOfStudy: true,
            hasMedicalCertificate : true,
            roomPreferences: true,
            roommatePreferences: true,
            apiKey: true,
       }});
         if (!user) {
             return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
         const isPasswordValid = await bcrypt.compare(password, user.password);
       if (!isPasswordValid) {
           return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
       }
      return NextResponse.json({message: 'Logged in successfully', user, apiKey : user.apiKey} , {status : 200});
    } catch (error) {
        console.error(error);
         return NextResponse.json({ message: 'Error logging in' }, { status: 500 });
      }
}