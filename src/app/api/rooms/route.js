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
    genderType: z.string().optional()
});


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
           const rooms = await prisma.room.findMany();
           return NextResponse.json(rooms , {status : 200});
      } catch (error) {
          console.error(error);
          return NextResponse.json({message : 'Error fetching rooms'} , {status : 500});
      }
  }


  export async function POST(req) {
    try{
        const authorized = await isAdmin(req);
           if(!authorized) {
               return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
            }
          const body = await req.json();
          const parsedBody = roomSchema.safeParse(body);
            if (!parsedBody.success) {
                return NextResponse.json({ message: "Invalid room input.", errors: parsedBody.error.issues } , {status : 400});
            }
          const { roomNumber, block, floor, capacity, genderType } = parsedBody.data
            const newRoom = await prisma.room.create({
                data: {
                   roomNumber,
                   block,
                    floor,
                    capacity,
                    genderType
                }
          });
         return NextResponse.json(newRoom, {status : 201});
    }catch(error) {
          console.error(error)
          return NextResponse.json({message : 'Error creating new room'}, {status : 500})
      }
  }