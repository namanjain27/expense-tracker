export interface SavingGoal {
    id: number;
    name: string;
    targetDate: string; // Using string for simplicity, can be Date object
    targetAmount: number;
    savedAmount: number;
} 