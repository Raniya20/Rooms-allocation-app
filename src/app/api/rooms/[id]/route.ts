// src/app/api/rooms/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyAuth } from '../../../../lib/auth';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

const roomSchema = z.object({
    roomNumber: z.number().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    capacity: z.number().optional(),
    genderType: z.string().optional()
});


const isAdmin = async (req?: NextRequest) => {
    const result = await verifyAuth(req);
    return result.user?.role === 'admin';
};


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authorized = await isAdmin(req);
        if (!authorized) {
            return NextResponse.json({ message: "You're not authorized to perform this action" }, { status: 403 });
        }
        const room = await prisma.room.findUnique({
            where: { id: parseInt(params.id) },
        });
        if (!room) {
            return NextResponse.json({ message: 'Room not found' }, { status: 404 });
        }
        return NextResponse.json(room, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching room' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
         const authorized = await isAdmin(req);
         if(!authorized) {
             return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
          }
        const body = await req.json();
        const parsedBody = roomSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ message: "Invalid room input.", errors: parsedBody.error.issues }, { status: 400 });
        }
        const { roomNumber, block, floor, capacity, genderType } = parsedBody.data;
        const updatedRoom = await prisma.room.update({
            where: { id: parseInt(params.id) },
            data: {
                roomNumber,
                block,
                floor,
                capacity,
                genderType
            },
        });
        return NextResponse.json(updatedRoom, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error updating room' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authorized = await isAdmin(req);
          if(!authorized) {
              return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
          }
        await prisma.room.delete({
            where: { id: parseInt(params.id) },
        });
        return NextResponse.json({ message: "Room deleted succesfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error deleting room' }, { status: 500 });
    }
}