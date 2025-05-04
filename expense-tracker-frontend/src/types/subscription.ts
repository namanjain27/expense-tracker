export interface Period {
    value: number;
    unit: string;
}

export interface Subscription {
    id: number;
    name: string;
    amount: number;
    category_id: number;
    category: string;
    subscription_period: Period;
    effective_date: string;
    billing_period: Period;
    due_period: Period;
} 