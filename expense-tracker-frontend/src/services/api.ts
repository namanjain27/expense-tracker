import axios from 'axios';
import { Expense, TotalExpenses } from '../types/expense';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    getExpenses: async (): Promise<Expense[]> => {
        const response = await fetch(`${API_BASE_URL}/expenses/`);
        return response.json();
    },

    getTotalExpenses: async (): Promise<TotalExpenses> => {
        const response = await axios.get(`${API_BASE_URL}/expenses/total`);
        return response.data;
    },

    createExpense: async (expense: Omit<Expense, 'id' | 'category'>): Promise<Expense> => {
        const response = await axios.post(`${API_BASE_URL}/expenses/`, expense);
        return response.data;
    },

    deleteExpense: async (id: number): Promise<string> => {
        const response = await axios.delete(`${API_BASE_URL}/expenses/${id}`);
        return response.data;
    },

    exportExpenses: () => {
        window.location.href = `${API_BASE_URL}/expenses/export`;
    }
}; 