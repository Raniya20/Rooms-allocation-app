// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

 const isAdmin = async (req : Request) => {
       const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
          if(!apiKey) return false;
         const user = await prisma.user.findUnique({ where: { apiKey } });
          return user?.role === 'admin';
      };


export async function POST(req: Request) {
  try {
        const authorized = await isAdmin(req);
         if(!authorized) {
            return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
         }
        const allocations = await prisma.allocation.findMany({
           include : {
              room : true,
                student : true
              },
          orderBy : {
               student : {
                  queueId : 'asc'
                 }
           }
        });

       for(const allocation of allocations){
           const notification = {
                message : `You have been assigned to room number: ${allocation?.room?.roomNumber}.`
              }
        await prisma.allocation.update({
               where : {
                id: allocation.id
                  },
               data : {
                 keyAssignedDate : new Date()
                 }
              })
          console.log(notification)
        //Here you should implement your notification mechanism

      }
     return NextResponse.json({message : "All users have been notified"} , {status : 201});
  } catch (error) {
       console.error(error);
        return NextResponse.json({ message: 'Error during notifications.' }, { status: 500 });
    }
}