
import { prisma } from './prisma';


async function main() {
    // Seed Users
    const users = [
        {
            email: 'student1@example.com',
            queueId: 1,
            hasMedicalCertificate: true,
            roomPreferences: JSON.stringify({ floorPreference: "1", blockPreference: "A", capacityPreference: "1" }),
            roommatePreferences: '[]',
        },
        {
            email: 'student2@example.com',
            queueId: 2,
            hasMedicalCertificate: false,
            roomPreferences: JSON.stringify({ floorPreference: "1", blockPreference: "A", capacityPreference: "2" }),
            roommatePreferences: '[3]',
        },
        {
            email: 'student3@example.com',
            queueId: 3,
            hasMedicalCertificate: false,
            roomPreferences: JSON.stringify({ floorPreference: "1", blockPreference: "A", capacityPreference: "2" }),
            roommatePreferences: '[2]',
        },
         {
            email: 'student4@example.com',
            queueId: 4,
            hasMedicalCertificate: false,
            roomPreferences: JSON.stringify({ floorPreference: "1", blockPreference: "A", capacityPreference: "1" }),
            roommatePreferences: '[]',
        },
      {
        email: 'admin@example.com',
        role: 'admin',
        queueId: 5,
       }

    ];

    for (const userData of users) {
        await prisma.user.create({ data: userData });
    }

    // Seed Rooms
    const rooms = [
        {
            roomNumber: 90,
            block: 'A',
            floor: '1',
            capacity: 1,
            genderType: 'male',
             availableSlots: 1
        },
        {
            roomNumber: 102,
            block: 'A',
            floor: '1',
            capacity: 2,
            genderType: 'male',
             availableSlots: 2
        },
        {
            roomNumber: 103,
            block: 'B',
            floor: '2',
            capacity: 3,
            genderType: 'female',
             availableSlots: 3
        },
    ];

    for (const roomData of rooms) {
        await prisma.room.create({ data: roomData });
    }
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });