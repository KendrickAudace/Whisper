import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female"]),
  age: z.coerce.number().int().min(18, "You must be at least 18 years old").max(99),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().int().min(18).max(99),
  bio: z.string().max(500),
  location: z.string().max(120),
  interests: z.string().max(240),
  avatarUrl: z.string().url().or(z.literal("")),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(1000),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

export const codeSchema = z.object({
  code: z.string().min(1).max(20),
  meaning: z.string().min(1).max(280),
});
