import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Grid,
    Alert
} from '@mui/material';
import { api } from '../services/api';
import { CATEGORIES } from '../types/expense';

interface BudgetDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedMonth: number;
    selectedYear: number;
}

const BudgetDialog: React.FC<BudgetDialogProps> = ({ 
    open, 
    onClose, 
    onSuccess, 
    selectedMonth, 
    selectedYear 
}) => {
    const [monthlyIncome, setMonthlyIncome] = useState<string>('');
    const [savingGoal, setSavingGoal] = useState<string>('');
    const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: string }>({});
    const [error, setError] = useState<string>('');
    const [totalBudget, setTotalBudget] = useState<number>(0);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Check for existing budget and load data if found
    useEffect(() => {
        const checkExistingBudget = async () => {
            setLoading(true);
            setError('');
            
            try {
                const existingBudget = await api.getLatestBudget(selectedMonth, selectedYear);
                setIsEditing(true);
                setMonthlyIncome(existingBudget.monthly_income.toString());
                setSavingGoal(existingBudget.saving_goal.toString());
                
                // Convert category budgets to strings
                const budgets: { [key: string]: string } = {};
                Object.entries(existingBudget.category_budgets).forEach(([category, amount]) => {
                    budgets[category] = amount.toString();
                });
                setCategoryBudgets(budgets);
            } catch (error: any) {
                // Handle 404 error (no budget found) differently from other errors
                if (error.response?.status === 404) {
                    setIsEditing(false);
                    resetFields();
                } else {
                    console.error('Error checking existing budget:', error);
                    setError('Failed to load existing budget. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            checkExistingBudget();
        }
    }, [open, selectedMonth, selectedYear]);

    const resetFields = () => {
        setMonthlyIncome('');
        setSavingGoal('');
        setError('');
        setTotalBudget(0);
        const initialBudgets: { [key: string]: string } = {};
        Object.values(CATEGORIES).forEach(category => {
            initialBudgets[category] = '';
        });
        setCategoryBudgets(initialBudgets);
    };

    useEffect(() => {
        // Calculate total budget
        const total = Object.values(categoryBudgets).reduce((sum, value) => {
            const numValue = parseFloat(value) || 0;
            return sum + numValue;
        }, 0);
        setTotalBudget(total);
    }, [categoryBudgets]);

    const handleSubmit = async () => {
        try {
            // Clear any previous validation errors
            setError('');

            // Validate inputs
            if (!monthlyIncome || !savingGoal) {
                setError('Please fill in monthly income and saving goal');
                return;
            }

            const income = parseFloat(monthlyIncome);
            const saving = parseFloat(savingGoal);
            const budgets: { [key: string]: number } = {};

            // Check for empty category budgets
            const emptyCategories = Object.entries(categoryBudgets)
                .filter(([_, value]) => !value)
                .map(([category]) => category);

            if (emptyCategories.length > 0) {
                setError(`Please fill in budget for: ${emptyCategories.join(', ')}`);
                return;
            }

            // Convert category budgets to numbers
            for (const [category, value] of Object.entries(categoryBudgets)) {
                budgets[category] = parseFloat(value);
            }

            // Validate total budget doesn't exceed income
            if (totalBudget > income) {
                setError('Total category budgets cannot exceed monthly income');
                return;
            }

            // Create or update budget
            if (isEditing) {
                await api.updateBudget({
                    monthly_income: income,
                    saving_goal: saving,
                    category_budgets: budgets
                });
            } else {
                await api.createBudget({
                    monthly_income: income,
                    saving_goal: saving,
                    category_budgets: budgets
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            setError('Failed to save budget. Please try again.');
            console.error('Error saving budget:', error);
        }
    };

    const handleCategoryBudgetChange = (category: string, value: string) => {
        setCategoryBudgets(prev => ({
            ...prev,
            [category]: value
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? `Edit ${months[selectedMonth - 1]} ${selectedYear} Budget` : `Set ${months[selectedMonth - 1]} ${selectedYear} Budget`}
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <Typography>Loading budget data...</Typography>
                    </Box>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        {!isEditing && !error && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                No budget found for {months[selectedMonth - 1]} {selectedYear}. Please set your budget below.
                            </Alert>
                        )}
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Monthly Income"
                                        type="number"
                                        fullWidth
                                        value={monthlyIncome}
                                        onChange={(e) => setMonthlyIncome(e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: <Typography>₹</Typography>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Monthly Saving Goal"
                                        type="number"
                                        fullWidth
                                        value={savingGoal}
                                        onChange={(e) => setSavingGoal(e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: <Typography>₹</Typography>
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Typography variant="h6" gutterBottom>
                            Category Budgets
                        </Typography>
                        <Grid container spacing={2}>
                            {Object.values(CATEGORIES).map((category) => (
                                <Grid item xs={12} sm={6} md={4} key={category}>
                                    <TextField
                                        label={category}
                                        type="number"
                                        fullWidth
                                        value={categoryBudgets[category]}
                                        onChange={(e) => handleCategoryBudgetChange(category, e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: <Typography>₹</Typography>
                                        }}
                                        error={!categoryBudgets[category] && error.includes(category)}
                                        helperText={!categoryBudgets[category] && error.includes(category) ? 'Required' : ''}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="subtitle1">
                                Total Budget: ₹{totalBudget.toFixed(2)}
                            </Typography>
                            {monthlyIncome && (
                                <Typography variant="body2" color="text.secondary">
                                    Remaining: ₹{(parseFloat(monthlyIncome) - totalBudget).toFixed(2)}
                                </Typography>
                            )}
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    disabled={loading}
                >
                    {isEditing ? 'Update Budget' : 'Save Budget'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BudgetDialog; 