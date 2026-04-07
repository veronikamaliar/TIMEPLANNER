export interface Task {
  id: number
  title: string
  description?: string
  priority?: string
  dueDate?: string
  completed: boolean
  timeSpent?: number
  attachment?: string
  category?: { id: number; name: string } | null
  user?: {
  id: number;
  name: string;
  email: string;
};
}
