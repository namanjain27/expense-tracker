import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '../types/expense';

interface ExpenseListProps {
    expenses: Expense[];
    onSelectExpense: (expense: Expense) => void;
    selectedExpense: Expense | null;
    onDeleteClick: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ 
    expenses, 
    onSelectExpense, 
    selectedExpense,
    onDeleteClick 
}) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Recent Expenses
            </Typography>
            <TableContainer 
                component={Paper} 
                sx={{ 
                    flex: 1,
                    maxHeight: '1125px', // This will show approximately 10 rows
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '4px',
                        '&:hover': {
                            background: '#555',
                        },
                    },
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Intention</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow
                                key={expense.id}
                                hover
                                onClick={() => onSelectExpense(expense)}
                                selected={selectedExpense?.id === expense.id}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{expense.date}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>{expense.intention}</TableCell>
                                <TableCell align="right">₹{expense.amount.toFixed(2)}</TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Delete Expense">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteClick(expense);
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {expenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No expenses found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ExpenseList; 