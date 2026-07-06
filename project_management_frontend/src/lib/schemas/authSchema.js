import { z } from 'zod'

export const SignupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }).trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }).trim(),
})

export const SigninFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export const OrganizationFormSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters long.' }).trim(),
})
