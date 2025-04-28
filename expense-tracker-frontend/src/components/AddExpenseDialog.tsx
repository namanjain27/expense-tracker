import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box
} from '@mui/material';
import { Expense, CATEGORIES } from '../types/expense';

interface AddExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (expense: Omit<Expense, 'id' | 'category'>) => void;
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ open, onClose, onAdd }) => {
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
    const [date, setDate] = useState(formattedDate);
    const [categoryId, setCategoryId] = useState<number>(1);
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            date,
            category_id: categoryId,
            amount: parseFloat(amount)
        });
        // Reset form
        setDate('');
        setCategoryId(1);
        setAmount('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Expense</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                        <TextField
                            select
                            label="Category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(parseInt(e.target.value))}
                            required
                        >
                            {Object.entries(CATEGORIES).map(([id, name]) => (
                                <MenuItem key={id} value={id}>
                                    {name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            inputProps={{ step: "0.01", min: "0" }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button 
                        type="submit" 
                        variant="contained"
                        disabled={!date || !amount}
                    >
                        Add
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddExpenseDialog; 