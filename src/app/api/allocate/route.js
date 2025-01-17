import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../../../lib/auth';

const prisma = new PrismaClient();

async function allocateRooms(students, rooms) {
    const medicalStudents = students.filter(s => s.hasMedicalCertificate);
    const regularStudents = students.filter(s => !s.hasMedicalCertificate);

    // Assign single rooms to students with medical certificate
    medicalStudents.sort((a, b) => a.queueId - b.queueId);
    for (const student of medicalStudents) {
        if (!student.assignedRoom) {
            for (const room of rooms) {
                if (room.capacity === 1 && room.availableSlots > 0) {
                    student.assignedRoom = room.roomNumber;
                    room.availableSlots -= 1;
                    break;
                }
            }
        }
    }

    // Assign rooms based on preference for regular students
    regularStudents.sort((a, b) => a.queueId - b.queueId);
    for (const student of regularStudents) {
        if (!student.assignedRoom) {
            // Find suitable roommates and allocate rooms
            if (student.roommatePreferences && student.roommatePreferences.length > 0) {
                const roommates = regularStudents.filter(s =>
                    student.roommatePreferences.includes(s.id.toString()) && !s.assignedRoom
                );
                if (roommates.length > 0) {
                    if (roommates.length + 1 < 3) {
                        for (const room of rooms) {
                            if (room.capacity === roommates.length + 1 && room.availableSlots >= roommates.length + 1) {
                                student.assignedRoom = room.roomNumber;
                                for (const roommate of roommates) {
                                    roommate.assignedRoom = room.roomNumber;
                                }
                                room.availableSlots -= roommates.length + 1;
                                break;
                            }
                        }
                    }
                }
            }
             if (!student.assignedRoom) {
              let best_room = null;
                  let best_score = -1;
                  for (const room of rooms) {
                      if (room.availableSlots > 0) {
                          const score = calculateRoomScore(student, room)
                          if (score > best_score) {
                              best_score = score
                              best_room = room;
                          }
                      }
                  }
                if (best_room) {
                    student.assignedRoom = best_room.roomNumber
                    best_room.availableSlots -= 1;
                }
            }
        }
    }

    await Promise.all(students.map(student => prisma.user.update({
        where: { id: student.id },
        data: { assignedRoom: student.assignedRoom }
    })));
    await Promise.all(rooms.map(room => prisma.room.update({
        where: { roomNumber: room.roomNumber },
        data: { availableSlots: room.availableSlots }
    })));
    return [students, rooms];
}

function calculateRoomScore(student, room) {
    let score = 0;
    const floor_match_points = 10;
    const block_match_points = 15;
    const capacity_match_points = 20;
    const studentPreferences = JSON.parse(student.roomPreferences);

    if (studentPreferences && studentPreferences.floorPreference === room.floor && studentPreferences.floorPreference !== "any") {
        score += floor_match_points;
    } else if (studentPreferences && studentPreferences.floorPreference === "any") {
        score += 0;
    }
    if (studentPreferences && studentPreferences.blockPreference === room.block && studentPreferences.blockPreference !== "any") {
        score += block_match_points;
    } else if (studentPreferences && studentPreferences.blockPreference === "any") {
        score += 0
    }
     if (studentPreferences && studentPreferences.capacityPreference === room.capacity && studentPreferences.capacityPreference !== "any") {
        score += capacity_match_points;
    } else if (studentPreferences && studentPreferences.capacityPreference === "any") {
        score += 0
    }

    return score;
}


async function sendNotifications(students) {
    for (const student of students) {
        if (student.assignedRoom && !student.notificationSent) {
            //call notification service
            console.log(`Notification sent to ${student.email}, your assigned room is ${student.assignedRoom}`);
            await prisma.user.update({
              where: { id: student.id },
              data: { notificationSent: true }
          });
        }
    }
}

const isAdmin = async (req) => {
    const result = await verifyAuth(req)
    return result.user?.role === 'admin';
};

// Changed from "export default async function handler" to:
export async function POST(req, res) {
    if (req.method !== 'POST') {
       return Response.json({ message: 'Method not allowed' }, { status: 405 });
    }
    const authorized = await isAdmin(req);
    if (!authorized) {
        return Response.json({ message: "You're not authorized to perform this action" }, { status: 403 });
    }
    try {
        // Get all the data from DB
        const students = await prisma.user.findMany()
        const rooms = await prisma.room.findMany()
        // Allocate Rooms
        const [updatedStudents, updatedRooms] = await allocateRooms(students, rooms);
        // Send Notifications
        await sendNotifications(updatedStudents);

       return Response.json({ message: 'Rooms allocated successfully', updatedStudents, updatedRooms }, { status: 200 });
    } catch (error) {
        console.error(error)
        return Response.json({ message: 'Error allocating rooms', error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}