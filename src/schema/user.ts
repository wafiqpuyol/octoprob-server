import { z } from "zod";

export const RegisterSchema = () => z.object({
    username: z.string()
        .min(4, 'Username should have at least 4 characters.')
        .max(20, 'Username should have at most 20 characters.')
        .regex(/^\w+$/, 'Should be alphanumeric.'),
    email: z.string().describe("Email").email({ message: "Email is required" }),
    password: z
        .string()
        .describe("Password")
        .min(6, { message: "Password must be atleast 6 characters" })
        .max(14, { message: "Password must be within 14 characters" }),
})

export const LoginSchema = () => z.object({
    email: z.string().email({ message: "Email is required" }),
    password: z.string({ message: "Password is required" }),
})

export const SocialAuth = () => z.object({
    username: z.string({ message: "Username is required" })
        .regex(/^\w+$/, 'Should be alphanumeric.'),
    email: z.string().describe("Email").email({ message: "Email is required" }),
    socialId: z.string(),
    type: z.enum(["facebook", "google"])
})