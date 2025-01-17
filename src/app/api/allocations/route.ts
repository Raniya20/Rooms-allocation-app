import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../../../lib/auth';

const prisma = new PrismaClient();

const isAdmin = async (req) => {
    const result = await verifyAuth(req)
    return result.user?.role === 'admin';
};

export async function GET(req: Request) {
    try {
        const authorized = await isAdmin(req);
        if (!authorized) {
            return NextResponse.json({ message: "You're not authorized to perform this action" }, { status: 403 });
        }
      // Fetch users with their assigned rooms.
       const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                assignedRoom: true,
                role: true,
                 notificationSent: true
            }
        });
        // Fetch rooms and their available slots
      const rooms = await prisma.room.findMany({
        select: {
          roomNumber: true,
          capacity: true,
          availableSlots:true,
          block : true,
          floor : true
        }
      });

        return NextResponse.json({ users, rooms }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching allocations', error: error.message }, { status: 500 });
    }
}