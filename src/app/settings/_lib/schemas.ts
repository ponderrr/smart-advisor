import { z } from "zod";

import { isValidPassword } from "@/features/auth/utils/validation";

/**
 * Settings form schemas. Extracted verbatim from page.tsx so both the
 * page (useForm/zodResolver) and the save-handler hook (inferred types)
 * can share them without a page⇄hook cycle.
 */

export const profileSchema = z.object({
  newName: z.string().min(1, "Username is required").trim(),
  age: z.coerce
    .number()
    .int()
    .min(13, "Must be at least 13")
    .max(120, "Must be 120 or under")
    .optional()
    .or(z.literal("")),
});

export const emailSchema = z.object({
  newEmail: z.string().email("Enter a valid email").trim(),
});

export const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .refine(isValidPassword, "Password doesn't meet all requirements"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const backupEmailSchema = z.object({
  backupEmail: z.string().email("Enter a valid email").trim(),
});

export type ProfileForm = z.infer<typeof profileSchema>;
export type EmailForm = z.infer<typeof emailSchema>;
export type PasswordForm = z.infer<typeof passwordSchema>;
export type BackupEmailForm = z.infer<typeof backupEmailSchema>;
