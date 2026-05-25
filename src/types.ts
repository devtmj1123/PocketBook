/**
 * Shared Type Definitions for Budgeting & Finance App
 */

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  tag: string; // reference to custom tag string/ID
  notes?: string; // Notion-like details
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string; // YYYY-MM-DD
  description?: string;
  category?: string;
}

export interface NoteBlock {
  id: string;
  type: "text" | "bullet" | "heading" | "todo" | "financial-note";
  content: string;
  completed?: boolean; // only for todo checklist blocks
}

export interface NotionNote {
  id: string;
  title: string;
  blocks: NoteBlock[];
  tags: string[]; // array of tag names
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  category?: string;
  amount?: number; // optional associated payments
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  amount?: number;
  type: "income" | "expense" | "reminder";
  notes?: string;
  completed?: boolean;
}

export interface CustomTag {
  id: string;
  name: string;
  color: string; // tw color class e.g. "bg-emerald-100/80 text-emerald-800"
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface FinancialSummary {
  monthlyIncome: number;
  totalExpenses: number;
  totalBudgets: number;
  savingsRate: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "reminder" | "task" | "event" | "system";
  date: string; // YYYY-MM-DD format
  read: boolean;
  referenceId?: string; // linking back to task or event
}

