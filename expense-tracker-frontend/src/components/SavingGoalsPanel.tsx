import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { SavingGoal, SavingGoalCreate } from '../types/savingGoal';
import SavingGoalCard from './SavingGoalCard';
import AddSavingGoalDialog from './AddSavingGoalDialog';
import { api } from '../services/api';

const SavingGoalsPanel: React.FC = () => {
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);

    const fetchGoals = async () => {
        try {
            const fetchedGoals = await api.getSavingGoals();
            setGoals(fetchedGoals);
        } catch (error) {
            console.error("Failed to fetch saving goals:", error);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleAddGoal = async (newGoal: SavingGoalCreate) => {
        try {
            await api.createSavingGoal(newGoal);
            fetchGoals(); // Refetch goals to display the new one
        } catch (error) {
            console.error("Failed to create saving goal:", error);
        }
    };

    const handleAddAmount = async (id: number, amount: number) => {
        try {
            await api.addAmountToGoal(id, amount);
            fetchGoals(); // Refetch goals to display updated progress
        } catch (error) {
            console.error("Failed to add amount to goal:", error);
        }
    };

    const handleDeleteGoal = async (id: number) => {
        try {
            await api.deleteSavingGoal(id);
            fetchGoals(); // Refetch goals to remove the deleted one
        } catch (error) {
            console.error("Failed to delete saving goal:", error);
        }
    };

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6"sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                        src="/src/assets/colored icons/luggage.png" 
                        alt="Saving Goals" 
                        style={{ width: '50px', height: '50px' }}
                    />Saving Goals
                </Typography>
                <Button variant="contained" onClick={() => setIsAddGoalDialogOpen(true)}>
                    Add Goal
                </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
                {goals.map(goal => (
                    <SavingGoalCard key={goal.id} goal={goal} onAddAmount={handleAddAmount} onDelete={handleDeleteGoal} />
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