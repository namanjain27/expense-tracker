import axios from 'axios';
import { Expense, TotalExpenses } from '../types/expense';
import { Subscription, SubscriptionCreate } from '../types/subscription';
import { SavingGoal, SavingGoalCreate } from '../types/savingGoal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export interface Budget {
  id: number;
  monthly_income: number;
  saving_goal: number;
  category_budgets: { [key: string]: number };
  created_at: string;
}

export interface BudgetCreate {
  monthly_income: number;
  saving_goal: number;
  category_budgets: { [key: string]: number };
}

export interface BudgetInput {
  monthly_income: number;
  saving_goal: number;
  category_budgets: { [key: string]: number };
}

export interface DailyExpense {
  date: string;
  amount: number;
}

export interface DailyExpensesResponse {
  daily_expenses: DailyExpense[];
}

export const api = {
  getExpenses: async (month?: number, year?: number): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());
    const response = await axiosInstance.get(`/expenses/?${params.toString()}`);
    return response.data;
  },

  getTotalExpenses: async (month?: number, year?: number): Promise<TotalExpenses> => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());
    const response = await axiosInstance.get(`/expenses/total?${params.toString()}`);
    return response.data;
  },

  createExpense: async (expense: Omit<Expense, 'id' | 'category'>): Promise<Expense> => {
    const response = await axiosInstance.post(`/expenses/`, expense);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<string> => {
    const response = await axiosInstance.delete(`/expenses/${id}`);
    return response.data;
  },

  exportExpenses: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses/export`);
    if (!response.ok) {
      throw new Error('Failed to export expenses');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  getRecurringExpenses: async (): Promise<Subscription[]> => {
    const response = await axiosInstance.get(`/recurring-expenses/`);
    return response.data;
  },

  createRecurringExpense: async (subscription: Omit<Subscription, 'id' | 'category'>): Promise<Subscription> => {
    const response = await axiosInstance.post(`/recurring-expenses/`, subscription);
    return response.data;
  },

  updateRecurringExpense: async (id: number, subscription: Omit<Subscription, 'id' | 'category'>): Promise<Subscription> => {
    const response = await axiosInstance.put(`/recurring-expenses/${id}`, subscription);
    return response.data;
  },

  updateSubscriptionEffectiveDate: async (subscriptionId: number): Promise<Subscription> => {
    const response = await axiosInstance.post(`/recurring-expenses/${subscriptionId}/update-effective-date`);
    return response.data;
  },

  deleteRecurringExpense: async (id: number): Promise<string> => {
    const response = await axiosInstance.delete(`/recurring-expenses/${id}`);
    return response.data;
  },

  getIntentionBreakdown: async (month: number, year: number): Promise<{
    totals: { [key: string]: number },
    percentages: { [key: string]: number },
    total_amount: number
  }> => {
    const response = await axiosInstance.get(`/expenses/intention-breakdown?month=${month}&year=${year}`);
    return response.data;
  },

  createBudget: async (budget: BudgetCreate): Promise<Budget> => {
    const response = await axiosInstance.post('/budget/', budget);
    return response.data;
  },

  getLatestBudget: async (month?: number, year?: number): Promise<Budget> => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());
    const response = await axiosInstance.get(`/budget/latest?${params.toString()}`);
    return response.data;
  },

  updateBudget: async (budget: BudgetInput, month?: number, year?: number): Promise<Budget> => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());
    const response = await axiosInstance.put(`/budget/latest?${params.toString()}`, budget);
    return response.data;
  },

  getDailyExpenses: async (month: number, year: number): Promise<DailyExpensesResponse> => {
    const response = await axiosInstance.get(`/expenses/daily?month=${month}&year=${year}`);
    return response.data;
  },

  // Saving Goals
  getSavingGoals: async (): Promise<SavingGoal[]> => {
    const response = await fetch(`${API_BASE_URL}/saving-goals/`);
    if (!response.ok) {
      throw new Error('Failed to fetch saving goals');
    }
    return response.json();
  },

  createSavingGoal: async (goal: SavingGoalCreate): Promise<SavingGoal> => {
    const response = await fetch(`${API_BASE_URL}/saving-goals/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) {
      throw new Error('Failed to create saving goal');
    }
    return response.json();
  },

  addAmountToGoal: async (id: number, amount: number): Promise<SavingGoal> => {
    const response = await fetch(`${API_BASE_URL}/saving-goals/${id}/add-amount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      throw new Error('Failed to add amount to goal');
    }
    return response.json();
  },

  updateSavingGoal: async (id: number, goal: SavingGoalCreate): Promise<SavingGoal> => {
    const response = await fetch(`${API_BASE_URL}/saving-goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) {
      throw new Error('Failed to update saving goal');
    }
    return response.json();
  },

  deleteSavingGoal: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/saving-goals/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete saving goal');
    }
  },

  // Subscriptions
  getSubscriptions: async (): Promise<Subscription[]> => {
    const response = await fetch(`${API_BASE_URL}/recurring-expenses/`);
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }
    return response.json();
  },

  uploadStatement: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
