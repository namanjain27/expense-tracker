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
import { Expense, Income, Saving, RecordType } from '../types/records';
import { ThemeContext } from './Dashboard';

type SortField = 'date' | 'category' | 'type' | 'amount';
type SortOrder = 'asc' | 'desc' | 'group';

type TransactionRecord = (Expense | Income | Saving) & { type: RecordType };

interface MonthlyTransactionListProps {
    expenses: Expense[];
    incomes: Income[];
    savings: Saving[];
    onSelectRecord: (record: TransactionRecord) => void;
    selectedRecord: TransactionRecord | null;
    onDeleteClick: (record: TransactionRecord) => void;
}

const MonthlyTransactionList: React.FC<MonthlyTransactionListProps> = ({ 
    expenses, 
    incomes,
    savings,
    onSelectRecord, 
    selectedRecord,
    onDeleteClick 
}) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            // Cycle through sort orders
            if (field === 'category' || field === 'type') {
                setSortOrder(sortOrder === 'asc' ? 'group' : 'asc');
            } else {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }
        } else {
            setSortField(field);
            setSortOrder(field === 'category' || field === 'type' ? 'group' : 'desc');
        }
    };

    const allRecords = useMemo(() => {
        const expenseRecords: TransactionRecord[] = expenses.map(expense => ({ ...expense, type: 'Expense' as RecordType }));
        const incomeRecords: TransactionRecord[] = incomes.map(income => ({ ...income, type: 'Income' as RecordType }));
        const savingRecords: TransactionRecord[] = savings.map(saving => ({ ...saving, type: 'Saving' as RecordType }));
        
        return [...expenseRecords, ...incomeRecords, ...savingRecords];
    }, [expenses, incomes, savings]);

    const sortedRecords = useMemo(() => {
        let sorted = [...allRecords];

        if (sortOrder === 'group' && (sortField === 'category' || sortField === 'type')) {
            // Group by the selected field
            const groups = sorted.reduce((acc, record) => {
                const key = record[sortField];
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(record);
                return acc;
            }, {} as Record<string, TransactionRecord[]>);

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
                    case 'type':
                        comparison = a[sortField].localeCompare(b[sortField]);
                        break;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        return sorted;
    }, [allRecords, sortField, sortOrder]);

    const filteredRecords = useMemo(() => {
        if (!searchQuery) return sortedRecords;
        return sortedRecords.filter(record => {
            const name = record.name || '';
            const amount = record.amount != null ? record.amount.toString() : '';
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   amount == searchQuery;
        });
    }, [sortedRecords, searchQuery]);

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
                    label="Search name or amount of transaction"
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
                    maxHeight: filteredRecords.length > 10 ? '600px' : 'fit-content',
                    overflow: filteredRecords.length > 10 ? 'auto' : 'visible',
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
                                    active={sortField === 'type'}
                                    direction={sortOrder === 'desc' ? 'desc' : 'asc'}
                                    onClick={() => handleSort('type')}
                                >
                                    Type
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
                        {filteredRecords.map((record, index) => {
                            const getRowColor = (type: RecordType) => {
                                switch (type) {
                                    case 'Income':
                                        return { color: '#4CAF50' };
                                    case 'Expense':
                                        return { color: '#FF5252' };
                                    case 'Saving':
                                        return { color: '#36A2EB' };
                                    default:
                                        return {};
                                }
                            };

                            return (
                                <React.Fragment key={`${record.type}-${record.id}`}>
                                    {((sortField === 'category' || sortField === 'type') && 
                                      sortOrder === 'group' && 
                                      (index === 0 || record[sortField] !== filteredRecords[index - 1][sortField])) && (
                                        <TableRow>
                                            <TableCell 
                                                colSpan={6} 
                                                sx={{ 
                                                    backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                                                    fontWeight: 'bold',
                                                    color: isDarkMode ? '#ffffff' : undefined
                                                }}
                                            >
                                                {record[sortField]}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow
                                        hover
                                        onClick={() => onSelectRecord(record)}
                                        selected={selectedRecord?.id === record.id && selectedRecord?.type === record.type}
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
                                        <TableCell>{new Date(record.date).toLocaleDateString('en-GB')}</TableCell>
                                        <TableCell>{record.name}</TableCell>
                                        <TableCell>{record.category}</TableCell>
                                        <TableCell sx={getRowColor(record.type)}>
                                            <strong>{record.type}</strong>
                                        </TableCell>
                                        <TableCell align="right" sx={getRowColor(record.type)}>
                                            <strong>₹{record.amount.toFixed(2)}</strong>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={`Delete ${record.type}`}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteClick(record);
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                        {filteredRecords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MonthlyTransactionList; 