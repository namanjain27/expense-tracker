import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography
} from '@mui/material';
import { Expense } from '../types/expense';

interface ExpenseListProps {
    expenses: Expense[];
    onSelectExpense: (expense: Expense) => void;
    selectedExpense: Expense | null;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onSelectExpense, selectedExpense }) => {
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
                            <TableCell align="right">Amount</TableCell>
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
                                <TableCell align="right">${expense.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {expenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
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