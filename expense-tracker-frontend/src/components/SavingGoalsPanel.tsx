import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { SavingGoal, SavingGoalCreate, SavingGoalEdit } from '../types/savingGoal';
import SavingGoalCard from './SavingGoalCard';
import AddSavingGoalDialog from './AddSavingGoalDialog';
import { api } from '../services/api';

interface SavingGoalsPanelProps {
    onDataChange?: () => void;
}

const SavingGoalsPanel: React.FC<SavingGoalsPanelProps> = ({ onDataChange }) => {
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
    const [hasAccount, setHasAccount] = useState(true);
    const [accountCheckLoading, setAccountCheckLoading] = useState(true);

    const fetchGoals = async () => {
        try {
            const fetchedGoals = await api.getSavingGoals();
            setGoals(fetchedGoals);
        } catch (error) {
            console.error("Failed to fetch saving goals:", error);
        }
    };

    const checkUserAccount = async () => {
        try {
            setAccountCheckLoading(true);
            const account = await api.getUserAccount();
            setHasAccount(!!account);
        } catch (error) {
            console.error("Failed to check user account:", error);
            setHasAccount(false);
        } finally {
            setAccountCheckLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
        checkUserAccount();
    }, []);

    const handleAddGoal = async (newGoal: SavingGoalCreate) => {
        try {
            await api.createSavingGoal(newGoal);
            fetchGoals(); // Refetch goals to display the new one
            onDataChange?.(); // Trigger dashboard reload
        } catch (error) {
            console.error("Failed to create saving goal:", error);
        }
    };

    const handleAddAmount = async (id: number, amount: number) => {
        try {
            await api.addAmountToGoal(id, amount);
            fetchGoals(); // Refetch goals to display updated progress
            onDataChange?.(); // Trigger dashboard reload
        } catch (error) {
            console.error("Failed to add amount to goal:", error);
        }
    };

    const handleDeleteGoal = async (id: number) => {
        try {
            await api.deleteSavingGoal(id);
            fetchGoals(); // Refetch goals to remove the deleted one
            onDataChange?.(); // Trigger dashboard reload
        } catch (error) {
            console.error("Failed to delete saving goal:", error);
        }
    };

    const handleEditGoal = async (id: number, updates: SavingGoalEdit) => {
        try {
            await api.editSavingGoal(id, updates);
            fetchGoals(); // Refetch goals to display updated information
        } catch (error) {
            console.error("Failed to edit saving goal:", error);
        }
    };

    const handleRedeemGoal = async (id: number) => {
        try {
            await api.redeemSavingGoal(id);
            fetchGoals(); // Refetch goals to display updated status
            onDataChange?.(); // Trigger dashboard reload
        } catch (error) {
            console.error("Failed to redeem saving goal:", error);
        }
    };

    if (accountCheckLoading) {
        return (
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography>Loading...</Typography>
            </Paper>
        );
    }

    if (!hasAccount) {
        return (
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img 
                            src="luggage.png" 
                            alt="Saving Goals" 
                            style={{ width: '50px', height: '50px' }}
                        />Saving Goals
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        Please add an account first to start creating saving goals.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Saving goals require an account to track your balance and progress.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6"sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                        src="luggage.png" 
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
                    <SavingGoalCard 
                        key={goal.id} 
                        goal={goal} 
                        onAddAmount={handleAddAmount} 
                        onDelete={handleDeleteGoal}
                        onEdit={handleEditGoal}
                        onRedeem={handleRedeemGoal}
                    />
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