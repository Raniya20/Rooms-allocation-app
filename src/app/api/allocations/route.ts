// src/app/api/allocations/index/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../../../lib/auth';


const prisma = new PrismaClient();

const isAdmin = async () => {
     const result = await verifyAuth()
       return result.user?.role === 'admin';
 };


export async function GET() {
    try {
        const authorized = await isAdmin();
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