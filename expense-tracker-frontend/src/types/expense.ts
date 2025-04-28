export interface Expense {
    id: number;
    date: string;
    category_id: number;
    amount: number;
    category: string;
}

export interface CategoryTotal {
    [key: string]: number;
}

export interface TotalExpenses {
    overall_total: number;
    category_breakdown: CategoryTotal;
}

export const CATEGORIES = {
    1: "Food",
    2: "Rent",
    3: "Travel",
    4: "Shopping",
    5: "Utility",
    6: "Misc"
}; 