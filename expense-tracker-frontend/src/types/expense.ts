export type IntentionType = 'Need' | 'Want' | 'Saving';

export interface Expense {
    id: number;
    date: string;
    category_id: number;
    category: string;
    amount: number;
    intention: IntentionType;
}

export interface CategoryTotal {
    [key: string]: number;
}

export interface TotalExpenses {
    overall_total: number;
    category_breakdown: CategoryTotal;
}

export const CATEGORIES: { [key: number]: string } = {
    1: "Food",
    2: "Rent",
    3: "Travel",
    4: "Shopping",
    5: "Utility",
    6: "Misc"
}; 