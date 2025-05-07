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
    2: "Housing",
    3: "Transportation",
    4: "Personal",
    5: "Utility",
    6: "Recreation",
    7: "Health",
    8: "Savings",
    9: "Debt"
}; 