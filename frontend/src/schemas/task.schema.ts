import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(2, 'Мінімум 2 символи'),
  description: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
  timeSpent: z.union([z.string(), z.number()]).optional(),
  attachment: z.any().optional().nullable(),
  categoryId: z.number().optional().nullable(),
})

export type TaskFormData = z.infer<typeof taskSchema>