import { z } from 'zod'

export const OnboardingSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  fatherName: z.string().min(2, "Father's name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  address: z.string().optional(),
  
  isEnrolling: z.boolean(),
  courseId: z.string().optional(),
  courseOnSlotId: z.string().optional(),
  
  isPaying: z.boolean(),
  applyDiscount: z.boolean(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountDuration: z.enum(["SINGLE_MONTH", "ENTIRE_COURSE"]).optional(),
  discountAmount: z.number().min(0).optional(),
  paymentAmount: z.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.isEnrolling) {
    if (!data.courseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courseId"],
        message: "Please select a course.",
      });
    }
    if (!data.courseOnSlotId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courseOnSlotId"],
        message: "Please select a time slot.",
      });
    }

    if (data.isPaying) {
      if (data.paymentAmount === undefined || data.paymentAmount < 0 || isNaN(data.paymentAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentAmount"],
          message: "Please enter a valid payment amount (0 or more).",
        });
      }
      if (data.applyDiscount) {
        if (!data.discountAmount || data.discountAmount <= 0 || isNaN(data.discountAmount)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["discountAmount"],
            message: "Discount amount must be greater than 0.",
          });
        }
        if (!data.discountDuration) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["discountDuration"],
            message: "Please select discount duration.",
          });
        }
      }
    }
  }
});

export type OnboardingFormData = z.infer<typeof OnboardingSchema>
