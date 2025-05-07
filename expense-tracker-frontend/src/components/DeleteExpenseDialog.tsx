import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';
import { Expense } from '../types/expense';

interface DeleteExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: (id: number) => void;
    expense: Expense | null;
}

const DeleteExpenseDialog: React.FC<DeleteExpenseDialogProps> = ({
    open,
    onClose,
    onDelete,
    expense
}) => {
    const handleDelete = () => {
        if (expense) {
            onDelete(expense.id);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogContent>
                {expense ? (
                    <Typography>
                        Are you sure you want to delete the expense of ₹{expense.amount.toFixed(2)} for {expense.category} on {expense.date}?
                    </Typography>
                ) : (
                    <Typography>Please select an expense to delete.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleDelete}
                    color="error"
                    variant="contained"
                    disabled={!expense}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteExpenseDialog; 