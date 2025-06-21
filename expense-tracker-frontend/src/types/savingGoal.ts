export interface SavingGoal {
    id: number;
    name: string;
    target_date: string; // Using string for simplicity, can be Date object
    target_amount: number;
    saved_amount: number;
}

export type SavingGoalCreate = Omit<SavingGoal, 'id'>; 