// src/app/api/allocate/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../../../lib/auth';

const prisma = new PrismaClient();

// Function to check if the user is an admin
const isAdmin = async (req) => {
  const result = await verifyAuth(req);
  return result.user?.role === 'admin';
};

// Function to generate a new queue ID
const generateQueueId = async () => {
  try {
    const lastUserWithQueueId = await prisma.user.findFirst({
      where: {
        NOT: { queueId: null },
      },
      orderBy: {
        queueId: 'desc',
      },
      select: {
        queueId: true,
      },
    });

    if (lastUserWithQueueId) {
      const lastQueueIdNumber = parseInt(lastUserWithQueueId.queueId, 10);
      return (lastQueueIdNumber + 1).toString();
    } else {
      return "1";
    }
  } catch (error) {
    console.error("Error generating queue ID:", error);
    throw new Error("Failed to generate queue ID");
  }
};

// Function to allocate rooms to students
const allocateRooms = async () => {
  try {
    const rooms = await prisma.room.findMany();
    const unallocatedStudents = await prisma.user.findMany({
      where: {
        role: 'student',
        NOT: {
          allocations: { some: {} },
        },
      },
      orderBy: {
        yearOfStudy: 'asc',
      },
    });

    const allocations = [];
    let studentIndex = 0;

    for (const room of rooms) {
      for (let i = 0; i < room.capacity; i++) {
        if (studentIndex < unallocatedStudents.length) {
          const newAllocation = await prisma.allocation.create({
            data: {
              studentId: unallocatedStudents[studentIndex].id,
              roomId: room.id,
            },
          });
          allocations.push(newAllocation);
          studentIndex++;
        } else {
          break;
        }
      }
    }

    return allocations;
  } catch (error) {
    console.error("Error allocating rooms:", error);
    throw new Error("Failed to allocate rooms");
  }
};

// POST method to handle room allocation
export async function POST(req) {
  try {
    const authorized = await isAdmin(req);
    if (!authorized) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 }
      );
    }

    // Allocate rooms
    const allocations = await allocateRooms();

    // Assign queue IDs to eligible users
    const users = await prisma.user.findMany();
    for (const user of users) {
      if (user.applicationStatus === 'registered' && !user.queueId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { queueId: await generateQueueId() },
        });
      }
    }

    return NextResponse.json(allocations, { status: 201 });
  } catch (error) {
    console.error("Error in POST /allocate:", error);
    return NextResponse.json(
      { message: 'Error allocating rooms', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
