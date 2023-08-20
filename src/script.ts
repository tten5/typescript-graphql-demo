// Example how to use Prisma to interact with database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

async function main() {
    const allLinks = await prisma.link.findMany()
    const newLink = await prisma.link.create({
        data: {
            description: 'Fullstack tutorial for GraphQL',
            url: 'www.howtographql.com',
        },
    });
    console.log(allLinks)
}



main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        // Close the database connections when the script terminates.
        await prisma.$disconnect()
    })

// try it: npx ts-node src/script.ts

