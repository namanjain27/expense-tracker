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

    const handleAdd = () => {
        const newGoal = {
            name,
            target_amount: parseFloat(targetAmount),
            target_date: targetDate,
            saved_amount: parseFloat(savedAmount) || 0,
        };

        if (newGoal.name && !isNaN(newGoal.target_amount) && newGoal.target_date) {
            onAddGoal(newGoal);
            onClose();
            // Reset fields
            setName('');
            setTargetAmount('');
            setTargetDate('');
            setSavedAmount('');
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
                    onChange={(e) => setTargetAmount(e.target.value)}
                />
                <TextField
                    margin="dense"
                    label="Target Date"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    margin="dense"
                    label="Already Saved Amount (Optional)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={savedAmount}
                    onChange={(e) => setSavedAmount(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleAdd}>Add</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddSavingGoalDialog; 