export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  items: Task[];
  total: number;
  page: number;
  page_size: number;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
}

export interface TaskFilters {
  status: TaskStatus | "";
  priority: TaskPriority | "";
  sort_by: "created_at" | "priority";
  order: "asc" | "desc";
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
