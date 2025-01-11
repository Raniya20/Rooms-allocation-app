// src/app/api/testpost/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const data = await req.json();
         return NextResponse.json({ message: "This is a POST test route", received: data }, { status: 200 });
     } catch (error){
        console.error(error)
        return NextResponse.json({ message: "Error receiving post request" }, { status: 500 });
    }
}