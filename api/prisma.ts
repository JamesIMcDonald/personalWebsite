import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

const connectionString = `${process.env.DATABASE_URL}`
const realSchema = process.env.NODE_ENV === 'development' ? "public" : "app"
const adapter = new PrismaPg({ connectionString }, { schema: realSchema });
const prisma = new PrismaClient({ adapter })

export default prisma