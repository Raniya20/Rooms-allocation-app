// src/app/api/allocations/index/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isAdmin = async (req : Request) => {
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
        const allocations = await prisma.allocation.findMany();
            return NextResponse.json(allocations , {status : 200});
        } catch (error) {
           console.error(error);
             return NextResponse.json({ message: 'Error fetching allocations' }, { status: 500 });
        }
}