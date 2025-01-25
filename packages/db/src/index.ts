import { PrismaClient } from "@prisma/client";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();
export {prisma , PrismaClientValidationError};
