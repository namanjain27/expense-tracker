import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { SavingGoal } from '../types/savingGoal';

interface AddSavingGoalDialogProps {
    open: boolean;
    onClose: () => void;
    onAddGoal: (goal: Omit<SavingGoal, 'id'>) => void;
}

const AddSavingGoalDialog: React.FC<AddSavingGoalDialogProps> = ({ open, onClose, onAddGoal }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [savedAmount, setSavedAmount] = useState('');
    const [dateError, setDateError] = useState('');
    const [savedAmountError, setSavedAmountError] = useState('');
    const [targetAmountError, setTargetAmountError] = useState('');

    const handleAdd = () => {
        const newGoal = {
            name,
            target_amount: parseFloat(targetAmount),
            target_date: targetDate,
            saved_amount: parseFloat(savedAmount) || 0,
        };

        if (newGoal.name && !isNaN(newGoal.target_amount) && newGoal.target_date && !dateError && !savedAmountError && !targetAmountError) {
            onAddGoal(newGoal);
            onClose();
            // Reset fields
            setName('');
            setTargetAmount('');
            setTargetDate('');
            setSavedAmount('');
            setTargetAmountError('');
            setSavedAmountError('');
            setDateError('');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add New Saving Goal</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Goal Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <TextField
                    margin="dense"
                    label="Target Amount"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={targetAmount}
                    onChange={(e) => {
                        const value = e.target.value;
                        setTargetAmount(value);
                        if (value === '') {
                            setTargetAmountError('');
                        } else {
                            const parsed = parseFloat(value);
                            if (isNaN(parsed) || parsed <= 0) {
                                setTargetAmountError('Target amount must be positive');
                            } else {
                                setTargetAmountError('');
                            }
                        }
                    }}
                    error={!!targetAmountError}
                    helperText={targetAmountError}
                />
                <TextField
                    margin="dense"
                    label="Target Date"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={targetDate}
                    onChange={(e) => {
                        const value = e.target.value;
                        setTargetDate(value);
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (selectedDate <= today) {
                            setDateError('Date must be in the future');
                        } else {
                            setDateError('');
                        }
                    }}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    error={!!dateError}
                    helperText={dateError}
                />
                <TextField
                    margin="dense"
                    label="Already Saved Amount (Optional)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={savedAmount}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSavedAmount(value);
                        if (value === '') {
                            setSavedAmountError('');
                        } else {
                            const parsed = parseFloat(value);
                            const target = parseFloat(targetAmount);
                            if (isNaN(parsed) || parsed < 0) {
                                setSavedAmountError('Amount cannot be negative');
                            } else if (!isNaN(target) && parsed > target) {
                                setSavedAmountError('Saved amount cannot exceed target amount');
                            } else {
                                setSavedAmountError('');
                            }
                        }
                    }}
                    error={!!savedAmountError}
                    helperText={savedAmountError}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!!dateError || !!savedAmountError || !!targetAmountError}>Add</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddSavingGoalDialog; 