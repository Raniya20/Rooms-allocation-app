// src/app/api/allocate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const isAdmin = async (req : Request) => {
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!apiKey) return false;
     const user = await prisma.user.findUnique({ where: { apiKey } });
      return user?.role === 'admin';
 };

const generateQueueId = async () => {
    try {
      const lastUserWithQueueId = await prisma.user.findFirst({
           where : {
               NOT : {
                 queueId : null,
                }
               },
               orderBy : {
                   queueId : 'desc'
                },
               select : {
                    queueId: true
                }
         })

        if(lastUserWithQueueId) {
            const lastQueueIdNumber = parseInt(lastUserWithQueueId.queueId)
           const newQueueId = (lastQueueIdNumber + 1).toString()
             return newQueueId
        } else {
         return "1"
           }
      } catch(error){
       throw error
    }
}


const allocateRooms = async () => {
    try {
      const rooms = await prisma.room.findMany()
        const unallocatedStudents = await prisma.user.findMany({
             where : {
                role : 'student',
                 NOT : {
                   allocations : {
                      some : {}
                 }
                }
               },
           orderBy : {
                yearOfStudy : 'asc'
               }
            })

         const allocations = []
           let studentIndex = 0;
        for (const room of rooms) {
           for (let i = 0; i < room.capacity; i++) {
               if (studentIndex < unallocatedStudents.length) {
                 const newAllocation = await prisma.allocation.create({
                      data: {
                        studentId: unallocatedStudents[studentIndex].id,
                        roomId: room.id
                       }
                    })
                   allocations.push(newAllocation);
                   studentIndex++;
            } else {
                break;
            }
          }
      }
         return allocations
     } catch (error) {
         throw error
     }
};

export async function POST(req : Request) {
    try{
          const authorized = await isAdmin(req);
          if(!authorized) {
           return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
            }
         const allocations = await allocateRooms();
          const users = await prisma.user.findMany()

         for(const user of users) {
            if(user.applicationStatus === 'registered' && !user.queueId ) {
                await prisma.user.update({
                   where : {
                    id : user.id
                   },
                 data : {
                      queueId : await generateQueueId()
                     }
                  })
               }
           }
            return NextResponse.json(allocations , {status : 201});
        }catch(error) {
          console.error(error)
             return NextResponse.json({message : 'Error allocating rooms'}, {status : 500});
         }
}