// src/app/api/rooms/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyAuth } from '../../../lib/auth';

const prisma = new PrismaClient();

const roomSchema = z.object({
    roomNumber: z.number(),
    block: z.string().optional(),
    floor: z.string().optional(),
    capacity: z.number(),
    genderType: z.string().optional(),
    availableSlots: z.number(),
});


const isAdmin = async (req) => {
    const result = await verifyAuth(req)
    return result.user?.role === 'admin';
};

export async function GET(req) {
    try {
        const authorized = await isAdmin(req);
        if (!authorized) {
            return NextResponse.json({ message: "You're not authorized to perform this action" }, { status: 403 })
        }
        const rooms = await prisma.room.findMany();
        return NextResponse.json(rooms, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching rooms' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authorized = await isAdmin(req);
        if (!authorized) {
            return NextResponse.json({ message: "You're not authorized to perform this action" }, { status: 403 })
        }
        const body = await req.json();

        // Validate the request body against the schema
        const validationResult = roomSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json({ message: 'Invalid room data', errors: validationResult.error.issues }, { status: 400 });
        }

        const { roomNumber, block, floor, capacity, genderType, availableSlots } = validationResult.data;


        // Check if a room with the same roomNumber already exists
        const existingRoom = await prisma.room.findUnique({ where: { roomNumber } });
        if (existingRoom) {
            return NextResponse.json({ message: 'Room with this number already exists' }, { status: 409 });
        }


        const newRoom = await prisma.room.create({
            data: {
                roomNumber,
                block,
                floor,
                capacity,
                genderType,
                availableSlots
            }
        });

        return NextResponse.json(newRoom, { status: 201 });
    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json({ message: 'Error creating room' }, { status: 500 });
    }
}