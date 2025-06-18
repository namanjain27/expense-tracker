import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { SavingGoal } from '../types/savingGoal';
import SavingGoalCard from './SavingGoalCard';
import AddSavingGoalDialog from './AddSavingGoalDialog';

const initialGoals: SavingGoal[] = [
    {
        id: 1,
        name: 'Japan Trip',
        targetDate: '2025-09-15',
        targetAmount: 150000,
        savedAmount: 80000,
    },
    {
        id: 2,
        name: 'New Car',
        targetDate: '2026-12-31',
        targetAmount: 500000,
        savedAmount: 120000,
    },
];

const SavingGoalsPanel: React.FC = () => {
    const [goals, setGoals] = useState<SavingGoal[]>(initialGoals);
    const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);

    const handleAddGoal = (newGoal: Omit<SavingGoal, 'id'>) => {
        setGoals(prevGoals => [
            ...prevGoals,
            { ...newGoal, id: prevGoals.length > 0 ? Math.max(...prevGoals.map(g => g.id)) + 1 : 1 }
        ]);
    };

    const handleAddAmount = (id: number, amount: number) => {
        setGoals(prevGoals =>
            prevGoals.map(goal =>
                goal.id === id ? { ...goal, savedAmount: goal.savedAmount + amount } : goal
            )
        );
    };

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Saving Goals</Typography>
                <Button variant="contained" onClick={() => setIsAddGoalDialogOpen(true)}>
                    Add Goal
                </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
                {goals.map(goal => (
                    <SavingGoalCard key={goal.id} goal={goal} onAddAmount={handleAddAmount} />
                ))}
            </Box>
            <AddSavingGoalDialog
                open={isAddGoalDialogOpen}
                onClose={() => setIsAddGoalDialogOpen(false)}
                onAddGoal={handleAddGoal}
            />
        </Paper>
    );
};

export default SavingGoalsPanel; 