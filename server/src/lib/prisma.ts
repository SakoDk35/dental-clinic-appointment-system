// server/src/lib/prisma.ts
//
// One shared Prisma client for the whole app. Every module that needs
// database access imports this file instead of creating its own
// `new PrismaClient()` — avoids exhausting database connections.

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
