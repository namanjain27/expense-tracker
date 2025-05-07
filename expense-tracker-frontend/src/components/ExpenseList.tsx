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
    Tooltip
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
        <>
            <Typography variant="h6" gutterBottom>
                Recent Expenses
            </Typography>
            <TableContainer>
                <Table>
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
        </>
    );
};

export default ExpenseList; 