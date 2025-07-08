import axios from 'axios';
import { Expense, TotalExpenses } from '../types/expense';
import { Subscription, SubscriptionCreate } from '../types/subscription';
import { SavingGoal, SavingGoalCreate } from '../types/savingGoal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  name?: string;
  created_at?: string;
  last_login?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  username: string; // This will be the email
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

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
  // Authentication APIs
  registerUser: async (userData: UserCreate): Promise<User> => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  loginUser: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axiosInstance.post('/auth/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  },

  logoutUser: (): void => {
    localStorage.removeItem('access_token');
  },

  requestPasswordReset: async (email: string): Promise<any> => {
    const response = await axiosInstance.post('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<any> => {
    const response = await axiosInstance.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },

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
    // Changed to axiosInstance for consistency with auth
    const response = await axiosInstance.get('/expenses/export', {
      responseType: 'blob', // Important for downloading files
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
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
    const response = await axiosInstance.get(`/saving-goals/`);
    return response.data;
  },

  createSavingGoal: async (goal: SavingGoalCreate): Promise<SavingGoal> => {
    const response = await axiosInstance.post(`/saving-goals/`, goal);
    return response.data;
  },

  addAmountToGoal: async (id: number, amount: number): Promise<SavingGoal> => {
    const response = await axiosInstance.post(`/saving-goals/${id}/add-amount`, { amount });
    return response.data;
  },

  updateSavingGoal: async (id: number, goal: SavingGoalCreate): Promise<SavingGoal> => {
    const response = await axiosInstance.put(`/saving-goals/${id}`, goal);
    return response.data;
  },

  deleteSavingGoal: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/saving-goals/${id}`);
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

  generateMonthlyReport: async (month: number, year: number): Promise<string> => {
    const response = await axiosInstance.get(`/monthly-report-html?month=${month}&year=${year}`);
    return response.data;
  },

  sendMonthlyReportEmail: async (): Promise<boolean> => {
    const response = await axiosInstance.post('/send-monthly-report');
    return response.data && response.data.message === "Monthly report has been queued.";
  },
};
