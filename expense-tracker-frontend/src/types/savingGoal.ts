export interface SavingGoal {
    id: number;
    name: string;
    target_date: string; // Using string for simplicity, can be Date object
    target_amount: number;
    saved_amount: number;
    status: 'active' | 'completed' | 'redeemed';
    is_completed: boolean;
    redeemed_at: string | null;
    created_at?: string;
}

export type SavingGoalCreate = Omit<SavingGoal, 'id' | 'status' | 'is_completed' | 'redeemed_at' | 'created_at'>;

export interface SavingGoalEdit {
    name?: string;
    target_date?: string;
    target_amount?: number;
}

export interface AddAmountRequest {
    amount: number;
}

export interface RedeemGoalRequest {
    // Empty for now, can be extended later
} 