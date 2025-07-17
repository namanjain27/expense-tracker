import React, { useState } from 'react';
import { Paper, Typography, Box, LinearProgress, Button, TextField, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RedeemIcon from '@mui/icons-material/Redeem';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { SavingGoal, SavingGoalEdit } from '../types/savingGoal';

interface SavingGoalCardProps {
    goal: SavingGoal;
    onAddAmount: (id: number, amount: number) => void;
    onDelete: (id: number) => void;
    onEdit: (id: number, updates: SavingGoalEdit) => void;
    onRedeem: (id: number) => void;
}

const SavingGoalCard: React.FC<SavingGoalCardProps> = ({ goal, onAddAmount, onDelete, onEdit, onRedeem }) => {
    const [amountToAdd, setAmountToAdd] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState(goal.name);
    const [editTargetAmount, setEditTargetAmount] = useState(goal.target_amount.toString());
    const [editTargetDate, setEditTargetDate] = useState(goal.target_date);
    const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);

    const handleAddAmount = () => {
        const amount = parseFloat(amountToAdd);
        if (!isNaN(amount) && amount > 0) {
            onAddAmount(goal.id, amount);
            setAmountToAdd('');
        }
    };

    const handleEdit = () => {
        const updates: SavingGoalEdit = {
            name: editName,
            target_amount: parseFloat(editTargetAmount),
            target_date: editTargetDate
        };
        onEdit(goal.id, updates);
        setEditMode(false);
    };

    const handleCancelEdit = () => {
        setEditName(goal.name);
        setEditTargetAmount(goal.target_amount.toString());
        setEditTargetDate(goal.target_date);
        setEditMode(false);
    };

    const handleRedeemClick = () => {
        setRedeemDialogOpen(true);
    };

    const handleRedeemConfirm = () => {
        onRedeem(goal.id);
        setRedeemDialogOpen(false);
    };

    const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
    const remainingAmount = goal.target_amount - goal.saved_amount;
    const amountToAddNumber = parseFloat(amountToAdd) || 0;

    const isExceeded = remainingAmount > 0 && amountToAddNumber > remainingAmount;
    const isGoalReached = remainingAmount <= 0 || goal.is_completed;
    const isAddDisabled = amountToAddNumber <= 0 || isExceeded || isGoalReached || goal.status === 'redeemed';
    const isRedeemed = goal.status === 'redeemed';
    const canRedeem = (goal.status === 'active' || goal.status === 'completed') && !isRedeemed;

    const getStatusColor = () => {
        if (goal.status === 'redeemed') {
            return goal.is_completed ? 'success' : 'info';
        }
        switch (goal.status) {
            case 'completed': return 'success';
            default: return 'default';
        }
    };

    const getRedeemButtonText = () => {
        return isGoalReached ? 'Yippee! Redeem' : 'Break Piggy Bank';
    };

    const getRedeemButtonIcon = () => {
        return isGoalReached ? <RedeemIcon /> : <BrokenImageIcon />;
    };

    let tooltipTitle = "";
    if (isExceeded) {
        tooltipTitle = `Amount cannot exceed remaining ₹${remainingAmount.toLocaleString()}`;
    } else if (isGoalReached) {
        tooltipTitle = "Congratulations! Goal reached.";
    }


    return (
        <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, opacity: isRedeemed ? 0.7 : 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editMode ? (
                    <TextField
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ flexGrow: 1, mr: 1 }}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>{goal.name}</Typography>
                        <Chip label={goal.status === 'redeemed' && goal.is_completed ? 'completed' : goal.status} color={getStatusColor()} size="small" />
                    </Box>
                )}
                <Box>
                    {editMode ? (
                        <TextField
                            value={editTargetAmount}
                            onChange={(e) => setEditTargetAmount(e.target.value)}
                            variant="outlined"
                            size="small"
                            type="number"
                            sx={{ width: '120px', mr: 1 }}
                        />
                    ) : (
                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>{`₹${goal.target_amount.toLocaleString()}/-`}</Typography>
                    )}
                    {!isRedeemed && (
                        <IconButton onClick={() => setEditMode(!editMode)} size="small">
                            <EditIcon />
                        </IconButton>
                    )}
                    <IconButton onClick={() => onDelete(goal.id)} size="small">
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
                {editMode ? (
                    <TextField
                        label="Target Date"
                        type="date"
                        value={editTargetDate}
                        onChange={(e) => setEditTargetDate(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                ) : (
                    <Typography variant="body2">Date - {new Date(goal.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                )}
                <Typography variant="body2">Saved - ₹{goal.saved_amount.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
            </Box>
            {editMode ? (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="contained" onClick={handleEdit} size="small">
                        Save
                    </Button>
                    <Button variant="outlined" onClick={handleCancelEdit} size="small">
                        Cancel
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TextField
                            label="Add Amount"
                            variant="outlined"
                            size="small"
                            onChange={(e) => isRedeemed ? null : setAmountToAdd(e.target.value)}
                            type="number"
                            sx={{ flexGrow: 1 }}
                            disabled={isGoalReached || isRedeemed}
                            error={isExceeded}
                            helperText={isExceeded ? `Max: ₹${remainingAmount.toLocaleString()}` : (isGoalReached ? "Goal Reached" : (isRedeemed ? `Total Saved: ₹${goal.saved_amount.toLocaleString()}` : " "))}
                            value={isRedeemed ? '' : amountToAdd}
                        />
                        <Tooltip title={tooltipTitle}>
                            <span>
                                <Button variant="contained" onClick={handleAddAmount} startIcon={<AddIcon />} disabled={isAddDisabled}>
                                    Add
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>
                    {canRedeem && (
                        <Box sx={{ mt: 1 }}>
                            <Button 
                                variant={isGoalReached ? "contained" : "outlined"} 
                                color={isGoalReached ? "success" : "warning"}
                                onClick={handleRedeemClick}
                                startIcon={getRedeemButtonIcon()}
                                size="small"
                            >
                                {getRedeemButtonText()}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
            
            <Dialog open={redeemDialogOpen} onClose={() => setRedeemDialogOpen(false)}>
                <DialogTitle>
                    {isGoalReached ? 'Congratulations!' : 'Break Piggy Bank?'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {isGoalReached 
                            ? `You've reached your goal of ₹${goal.target_amount.toLocaleString()}! Would you like to redeem it?`
                            : `You've only saved ₹${goal.saved_amount.toLocaleString()} out of ₹${goal.target_amount.toLocaleString()}. Are you sure you want to break the piggy bank?`
                        }
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRedeemDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleRedeemConfirm} 
                        color={isGoalReached ? "success" : "warning"}
                        variant="contained"
                    >
                        {isGoalReached ? 'Redeem' : 'Break Piggy Bank'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default SavingGoalCard; 