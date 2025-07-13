import React, { useState, useMemo, useContext } from 'react';
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
    Box,
    TableSortLabel,
    TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '../types/expense';
import { ThemeContext } from './Dashboard';

type SortField = 'date' | 'category' | 'intention' | 'amount';
type SortOrder = 'asc' | 'desc' | 'group';

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
    const { isDarkMode } = useContext(ThemeContext);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            // Cycle through sort orders
            if (field === 'category' || field === 'intention') {
                setSortOrder(sortOrder === 'asc' ? 'group' : 'asc');
            } else {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }
        } else {
            setSortField(field);
            setSortOrder(field === 'category' || field === 'intention' ? 'group' : 'desc');
        }
    };

    const sortedExpenses = useMemo(() => {
        let sorted = [...expenses];

        if (sortOrder === 'group' && (sortField === 'category' || sortField === 'intention')) {
            // Group by the selected field
            const groups = sorted.reduce((acc, expense) => {
                const key = expense[sortField];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(expense);
                return acc;
            }, {} as Record<string, Expense[]>);

            // Sort groups by key
            const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
            sorted = sortedGroups.flatMap(([_, group]) => group);
        } else {
            // Regular sorting
            sorted.sort((a, b) => {
                let comparison = 0;
                switch (sortField) {
                    case 'date':
                        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                        break;
                    case 'amount':
                        comparison = a.amount - b.amount;
                        break;
                    case 'category':
                    case 'intention':
                        comparison = a[sortField].localeCompare(b[sortField]);
                        break;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        return sorted;
    }, [expenses, sortField, sortOrder]);

    const filteredExpenses = useMemo(() => {
        if (!searchQuery) return sortedExpenses;
        return sortedExpenses.filter(expense => {
            const name = expense.name || '';
            const amount = expense.amount != null ? expense.amount.toString() : '';
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   amount == searchQuery;
        });
    }, [sortedExpenses, searchQuery]);

    // const getSortLabel = (field: SortField) => {
    //     if (field !== sortField) return 'Sort';
    //     if (sortOrder === 'group') return 'Grouped';
    //     return sortOrder === 'asc' ? 'Ascending' : 'Descending';
    // };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                    Monthly Transactions
                </Typography>
                <TextField
                    label="Search name or amount of expense"
                    variant="outlined"
                    sx={{ width: '350px' }}
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </Box>
            <TableContainer 
                component={Paper} 
                sx={{ 
                    flex: 1,
                    maxHeight: filteredExpenses.length > 10 ? '600px' : 'fit-content',
                    overflow: filteredExpenses.length > 10 ? 'auto' : 'visible',
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: isDarkMode ? '#2d2d2d' : '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: isDarkMode ? '#555' : '#888',
                        borderRadius: '4px',
                        '&:hover': {
                            background: isDarkMode ? '#666' : '#555',
                        },
                    },
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: isDarkMode ? '#2d2d2d' : undefined }}>
                                <TableSortLabel
                                    active={sortField === 'date'}
                                    direction={sortOrder === 'desc' ? 'desc' : 'asc'}
                                    onClick={() => handleSort('date')}
                                >
                                    Date
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: isDarkMode ? '#2d2d2d' : undefined }}>Name</TableCell>
                            <TableCell sx={{ backgroundColor: isDarkMode ? '#2d2d2d' : undefined }}>
                                <TableSortLabel
                                    active={sortField === 'category'}
                                    direction={sortOrder === 'desc' ? 'desc' : 'asc'}
                                    onClick={() => handleSort('category')}
                                >
                                    Category
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: isDarkMode ? '#2d2d2d' : undefined }}>
                                <TableSortLabel
                                    active={sortField === 'intention'}
                                    direction={sortOrder === 'desc' ? 'desc' : 'asc'}
                                    onClick={() => handleSort('intention')}
                                >
                                    Intention
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="right" sx={{ backgroundColor: isDarkMode ? '#2d2d2d' : undefined }}>
                                <TableSortLabel
                                    active={sortField === 'amount'}
                                    direction={sortOrder === 'desc' ? 'desc' : 'asc'}
                                    onClick={() => handleSort('amount')}
                                >
                                    Amount
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center" sx={{ backgroundColor: isDarkMode ? '#2d2d2d' : undefined }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredExpenses.map((expense, index) => (
                            <React.Fragment key={expense.id}>
                                {((sortField === 'category' || sortField === 'intention') && 
                                  sortOrder === 'group' && 
                                  (index === 0 || expense[sortField] !== filteredExpenses[index - 1][sortField])) && (
                                    <TableRow>
                                        <TableCell 
                                            colSpan={6} 
                                            sx={{ 
                                                backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                                                fontWeight: 'bold',
                                                color: isDarkMode ? '#ffffff' : undefined
                                            }}
                                        >
                                            {expense[sortField]}
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow
                                    hover
                                    onClick={() => onSelectExpense(expense)}
                                    selected={selectedExpense?.id === expense.id}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: isDarkMode ? '#2d2d2d' : undefined
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: isDarkMode ? '#1a1a1a' : undefined
                                        }
                                    }}
                                >
                                    <TableCell>{new Date(expense.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell>{expense.name}</TableCell>
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
                            </React.Fragment>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
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