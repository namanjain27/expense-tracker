export type IntentionType = 'Need' | 'Want' | 'Saving';
export type RecordType = 'Income' | 'Expense' | 'Saving';

// Base interface for all records
interface BaseRecord {
    id: number;
    date: string;
    category_id: number;
    category: string;
    amount: number;
    name: string;
    created_at?: string;
}

// Expense interface (existing)
export interface Expense extends BaseRecord {
    intention: IntentionType;
}

// Income interface
export interface Income extends BaseRecord {
    // Income doesn't have intention field
}

// Saving interface
export interface Saving extends BaseRecord {
    // Saving doesn't have intention field
}

// Category definitions
export const EXPENSE_CATEGORIES: { [key: number]: string } = {
    1: "Food",
    2: "Housing", 
    3: "Transportation",
    4: "Personal",
    5: "Utility",
    6: "Recreation",
    7: "Health",
    8: "Debt"
};

export const INCOME_CATEGORIES: { [key: number]: string } = {
    1: "Salary",
    2: "Interest",
    3: "Gift",
    4: "Matured Amount",
    5: "Dividend",
    6: "Stocks",
    7: "Side Hustle",
    8: "Others"
};

export const SAVING_CATEGORIES: { [key: number]: string } = {
    1: "Stocks",
    2: "PPF",
    3: "Recurring deposit",
    4: "Fixed Deposit",
    5: "Mutual Fund",
    6: "Others"
};

// Helper function to get categories by record type
export const getCategoriesByType = (recordType: RecordType): { [key: number]: string } => {
    switch (recordType) {
        case 'Income':
            return INCOME_CATEGORIES;
        case 'Expense':
            return EXPENSE_CATEGORIES;
        case 'Saving':
            return SAVING_CATEGORIES;
        default:
            return EXPENSE_CATEGORIES;
    }
};

// Legacy export for backward compatibility
export const CATEGORIES = EXPENSE_CATEGORIES;

export interface CategoryTotal {
    [key: string]: number;
}

export interface TotalExpenses {
    overall_total: number;
    category_breakdown: CategoryTotal;
}