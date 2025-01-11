    // src/app/api/users/[id]/route.ts
    import { NextResponse } from 'next/server';
    import { PrismaClient } from '@prisma/client';
    import { z } from 'zod';
    import bcrypt from 'bcryptjs';

    const prisma = new PrismaClient();


  // Define a Zod schema for user input validation
 const userSchema = z.object({
   email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['student', 'admin']).optional(),
    applicationStatus: z.string().optional(),
     yearOfStudy: z.number().optional(),
    hasMedicalCertificate: z.boolean().optional(),
    roomPreferences: z.string().optional(),
    roommatePreferences: z.string().optional()
});

  const isAdmin = async (req : Request) => {
       const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (!apiKey) return false;
     const user = await prisma.user.findUnique({ where: { apiKey } });
      return user?.role === 'admin';
    };

    export async function GET(req: Request , {params} : {params : {id:string}}) {
        try {
            const authorized = await isAdmin(req);
            if(!authorized) {
             return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
           }
                const user = await prisma.user.findUnique({
                    where: { id: parseInt(params.id) },
              });
             if (!user) {
               return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }
                return NextResponse.json(user, {status : 200});
         } catch (error) {
             console.error(error);
               return NextResponse.json({ message: 'Error fetching user' }, { status: 500 });
        }
  }


    export async function PUT(req : Request , {params} : {params : {id:string}}) {
          try {
            const authorized = await isAdmin(req);
            if(!authorized) {
             return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
           }
               const body = await req.json();
            const parsedBody = userSchema.safeParse(body);
              if (!parsedBody.success) {
                 return NextResponse.json({ message: "Invalid user input.", errors: parsedBody.error.issues } , {status : 400});
               }
             const { email, password, role, applicationStatus , yearOfStudy,hasMedicalCertificate, roomPreferences, roommatePreferences } = parsedBody.data
            const updatedData  = {
              email,
               role,
               applicationStatus,
                yearOfStudy,
              hasMedicalCertificate,
              roomPreferences,
                roommatePreferences
             }
           if(password) {
                const hashedPassword = await bcrypt.hash(password, 10)
                 updatedData.password = hashedPassword
             }
               const updatedUser = await prisma.user.update({
                  where: { id: parseInt(params.id) },
                  data: updatedData,
              });
            return NextResponse.json(updatedUser, {status: 200});
       } catch (error) {
             console.error(error);
             return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
         }
    }

    export async function DELETE(req : Request, {params} : {params : {id:string}}) {
        try {
             const authorized = await isAdmin(req);
             if(!authorized) {
                return NextResponse.json({message : "You're not authorized to perform this action"} , {status : 403})
            }
               await prisma.user.delete({
                  where: { id: parseInt(params.id) },
              });
              return NextResponse.json({message: "User deleted succesfully"}, {status: 200});
       } catch (error) {
           console.error(error);
            return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
         }
    }