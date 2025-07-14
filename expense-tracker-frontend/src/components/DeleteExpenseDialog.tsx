import React, { useContext } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';
import { Expense, Income, Saving, RecordType } from '../types/records';
import { ThemeContext } from './Dashboard';

type TransactionRecord = (Expense | Income | Saving) & { type: RecordType };

interface DeleteExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: (id: number) => void;
    expense: TransactionRecord | null;
}

const DeleteExpenseDialog: React.FC<DeleteExpenseDialogProps> = ({
    open,
    onClose,
    onDelete,
    expense
}) => {
    const { isDarkMode } = useContext(ThemeContext);

    if (!expense) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: {
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                }
            }}
        >
            <DialogTitle sx={{ 
                color: isDarkMode ? '#ffffff' : undefined,
                borderBottom: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`
            }}>
                Delete {expense.type}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Typography sx={{ color: isDarkMode ? '#ffffff' : undefined }}>
                    Are you sure you want to delete the {expense.type.toLowerCase()} "{expense.name}"?
                </Typography>
            </DialogContent>
            <DialogActions sx={{ 
                borderTop: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`,
                p: 2
            }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button 
                    onClick={() => onDelete(expense.id)} 
                    variant="contained" 
                    color="error"
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteExpenseDialog; 