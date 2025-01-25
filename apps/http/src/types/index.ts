import { z } from "zod";


export const EmailSchema = z.string().email();

/**  User Schema */ 
export const UserSignupSchema = z.object({
    name : z.string(),
    email : EmailSchema,
    username : z.string(),
    password: z.string()
})

export const UserSignInSchema = z.object({
    email : EmailSchema,
    password: z.string()
})

export const CreateBoardSchema = z.object({
    name: z.string()
})