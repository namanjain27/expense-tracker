import axios from 'axios';
import { Expense, TotalExpenses } from '../types/expense';
import { Subscription } from '../types/subscription';
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000' || 'http://0.0.0.0:8000';

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
    getExpenses: async (): Promise<Expense[]> => {
        const response = await axios.get(`/api/expenses/`);
        return response.data;
    },

    getTotalExpenses: async (month?: number, year?: number): Promise<TotalExpenses> => {
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month.toString());
        if (year !== undefined) params.append('year', year.toString());
        const response = await axios.get(`/api/expenses/total?${params.toString()}`);
        return response.data;
    },

    createExpense: async (expense: Omit<Expense, 'id' | 'category'>): Promise<Expense> => {
        const response = await axios.post(`/api/expenses/`, expense);
        return response.data;
    },

    deleteExpense: async (id: number): Promise<string> => {
        const response = await axios.delete(`/api/expenses/${id}`);
        return response.data;
    },

    exportExpenses: () => {
        window.location.href = `/api/expenses/export`;
    },

    // Recurring Expenses APIs
    getRecurringExpenses: async (): Promise<Subscription[]> => {
        const response = await axios.get(`/api/recurring-expenses/`);
        return response.data;
    },

    createRecurringExpense: async (subscription: Omit<Subscription, 'id' | 'category'>): Promise<Subscription> => {
        const response = await axios.post(`/api/recurring-expenses/`, subscription);
        return response.data;
    },

    updateRecurringExpense: async (id: number, subscription: Omit<Subscription, 'id' | 'category'>): Promise<Subscription> => {
        const response = await axios.put(`/api/recurring-expenses/${id}`, subscription);
        return response.data;
    },

    updateSubscriptionEffectiveDate: async (subscriptionId: number): Promise<Subscription> => {
        const response = await axios.post(`/api/recurring-expenses/${subscriptionId}/update-effective-date`);
        return response.data;
    },

    deleteRecurringExpense: async (id: number): Promise<string> => {
        const response = await axios.delete(`/api/recurring-expenses/${id}`);
        return response.data;
    },

    getIntentionBreakdown: async (month: number, year: number): Promise<{
        totals: { [key: string]: number },
        percentages: { [key: string]: number },
        total_amount: number
    }> => {
        const response = await axios.get(`/api/expenses/intention-breakdown?month=${month}&year=${year}`);
        return response.data;
    },

    // Budget APIs
    async createBudget(budget: BudgetCreate): Promise<Budget> {
        const response = await axios.post('/api/budget/', budget);
        return response.data;
    },

    async getLatestBudget(month?: number, year?: number): Promise<Budget> {
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month.toString());
        if (year !== undefined) params.append('year', year.toString());
        const response = await axios.get(`/api/budget/latest?${params.toString()}`);
        return response.data;
    },

    async updateBudget(budget: BudgetInput, month?: number, year?: number): Promise<Budget> {
        const params = new URLSearchParams();
        if (month !== undefined) params.append('month', month.toString());
        if (year !== undefined) params.append('year', year.toString());
        const response = await axios.put(`/api/budget/latest?${params.toString()}`, budget);
        return response.data;
    },

    getDailyExpenses: async (month: number, year: number): Promise<DailyExpensesResponse> => {
        const response = await axios.get(`/api/expenses/daily?month=${month}&year=${year}`);
        return response.data;
    }
}; 