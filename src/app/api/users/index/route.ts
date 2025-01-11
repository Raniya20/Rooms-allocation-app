 // src/app/api/users/index/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define a Zod schema for user input validation
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
   role: z.enum(['student', 'admin']).optional(),
   applicationStatus: z.string().optional(),
     yearOfStudy: z.number().optional(),
     hasMedicalCertificate: z.boolean().optional(),
  roomPreferences: z.string().optional(),
  roommatePreferences: z.string().optional()
 });

import crypto from 'crypto';
 const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
  };

const isAdmin = async (req: Request) => {
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!apiKey) return false;
      const user = await prisma.user.findUnique({ where: { apiKey } });
       return user?.role === 'admin';
 };


export async function GET(req: Request) {
   try {
       const authorized = await isAdmin(req);
        if(!authorized) {
          return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
        }
        const users = await prisma.user.findMany();
          return NextResponse.json(users, {status : 200});
      } catch (error) {
         console.error(error);
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
    }
}


export async function POST(req : Request) {
    try{
      const body = await req.json();
        const parsedBody = userSchema.safeParse(body);
          if (!parsedBody.success) {
            return NextResponse.json({ message: "Invalid user input.", errors: parsedBody.error.issues }, { status: 400 });
          }
      const { email, password, role = 'student',applicationStatus , yearOfStudy,hasMedicalCertificate ,roomPreferences, roommatePreferences } = parsedBody.data;
      const hashedPassword = await bcrypt.hash(password, 10)
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
                password: true,
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
         console.error(error)
       return NextResponse.json({message : 'Error creating new user'}, {status : 500});
       }
}