import React, { useState } from 'react';
import { Paper, Typography, Box, LinearProgress, Button, TextField, Tooltip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { SavingGoal } from '../types/savingGoal';

interface SavingGoalCardProps {
    goal: SavingGoal;
    onAddAmount: (id: number, amount: number) => void;
    onDelete: (id: number) => void;
}

const SavingGoalCard: React.FC<SavingGoalCardProps> = ({ goal, onAddAmount, onDelete }) => {
    const [amountToAdd, setAmountToAdd] = useState('');

    const handleAddAmount = () => {
        const amount = parseFloat(amountToAdd);
        if (!isNaN(amount) && amount > 0) {
            onAddAmount(goal.id, amount);
            setAmountToAdd('');
        }
    };

    const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
    const remainingAmount = goal.target_amount - goal.saved_amount;
    const amountToAddNumber = parseFloat(amountToAdd) || 0;

    const isExceeded = remainingAmount > 0 && amountToAddNumber > remainingAmount;
    const isGoalReached = remainingAmount <= 0;
    const isAddDisabled = amountToAddNumber <= 0 || isExceeded || isGoalReached;

    let tooltipTitle = "";
    if (isExceeded) {
        tooltipTitle = `Amount cannot exceed remaining ₹${remainingAmount.toLocaleString()}`;
    } else if (isGoalReached) {
        tooltipTitle = "Congratulations! Goal reached.";
    }


    return (
        <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>{goal.name}</Typography>
                <Box>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>{`₹${goal.target_amount.toLocaleString()}/-`}</Typography>
                    <IconButton onClick={() => onDelete(goal.id)} size="small">
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
                <Typography variant="body2">Date - {new Date(goal.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                <Typography variant="body2">Saved - ₹{goal.saved_amount.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <TextField
                    label="Add Amount"
                    variant="outlined"
                    size="small"
                    value={amountToAdd}
                    onChange={(e) => setAmountToAdd(e.target.value)}
                    type="number"
                    sx={{ flexGrow: 1 }}
                    disabled={isGoalReached}
                    error={isExceeded}
                    helperText={isExceeded ? `Max: ₹${remainingAmount.toLocaleString()}` : (isGoalReached ? "Goal Reached" : " ")}
                />
                 <Tooltip title={tooltipTitle}>
                    <span>
                        <Button variant="contained" onClick={handleAddAmount} startIcon={<AddIcon />} disabled={isAddDisabled}>
                            Add
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Paper>
    );
};

export default SavingGoalCard; 