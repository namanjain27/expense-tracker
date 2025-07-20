import React, { useContext } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem 
} from '@mui/material';
import { ThemeContext } from './Dashboard';
import { TotalExpenses } from '../types/expense';
import { Expense, Income, Saving, RecordType } from '../types/records';
import { DailyExpense } from '../services/api';
import Charts from './charts';
import MonthlyTransactionList from './ExpenseList';

interface MonthlyDataPanelProps {
    selectedMonth: number;
    selectedYear: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    availableMonths: string[];
    availableYears: number[];
    refreshTrigger: number;
    totals: TotalExpenses | null;
    dailyExpenses: DailyExpense[];
    lineGraphLoading: boolean;
    lineGraphError: string;
    expenses: Expense[];
    incomes: Income[];
    savings: Saving[];
    selectedRecord: (Expense | Income | Saving) & { type: RecordType } | null;
    onSelectRecord: (record: (Expense | Income | Saving) & { type: RecordType } | null) => void;
    onDeleteClick: (record: (Expense | Income | Saving) & { type: RecordType }) => void;
    chartsRef: React.RefObject<HTMLDivElement | null>;
    expensesRef: React.RefObject<HTMLDivElement | null>;
}

const MonthlyDataPanel: React.FC<MonthlyDataPanelProps> = ({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
    availableMonths,
    availableYears,
    refreshTrigger,
    totals,
    dailyExpenses,
    lineGraphLoading,
    lineGraphError,
    expenses,
    incomes,
    savings,
    selectedRecord,
    onSelectRecord,
    onDeleteClick,
    chartsRef,
    expensesRef
}) => {
    const { isDarkMode } = useContext(ThemeContext);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <Paper sx={{ 
            p: 3, 
            borderRadius: 4,
            background: isDarkMode 
                ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            border: `2px solid ${isDarkMode ? '#444444' : '#cccccc'}`
        }}>
            {/* Header with Month/Year Selectors */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3 
            }}>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        color: isDarkMode ? '#ffffff' : '#333333',
                        fontWeight: 'bold'
                    }}
                >
                    {months[selectedMonth - 1]} {selectedYear} Analytics
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Month Selector */}
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                            Month
                        </InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => onMonthChange(Number(e.target.value))}
                            sx={{
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : '#e0e0e0',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#555555' : '#cccccc',
                                },
                                '& .MuiSvgIcon-root': {
                                    color: isDarkMode ? '#ffffff' : '#000000',
                                }
                            }}
                        >
                            {availableMonths.map((month, index) => (
                                <MenuItem key={month} value={index + 1}>
                                    {month}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Year Selector */}
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                            Year
                        </InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => onYearChange(Number(e.target.value))}
                            sx={{
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : '#e0e0e0',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#555555' : '#cccccc',
                                },
                                '& .MuiSvgIcon-root': {
                                    color: isDarkMode ? '#ffffff' : '#000000',
                                }
                            }}
                        >
                            {availableYears.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Charts Section */}
            <Box ref={chartsRef} sx={{ mb: 3 }}>
                <Charts 
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    refreshTrigger={refreshTrigger}
                    totals={totals}
                    dailyExpenses={dailyExpenses}
                    lineGraphLoading={lineGraphLoading}
                    lineGraphError={lineGraphError}
                />
            </Box>

            {/* Monthly Transactions Section */}
            <Box ref={expensesRef}>
                <MonthlyTransactionList
                    expenses={expenses}
                    incomes={incomes}
                    savings={savings}
                    onSelectRecord={onSelectRecord}
                    selectedRecord={selectedRecord}
                    onDeleteClick={onDeleteClick}
                />
            </Box>
        </Paper>
    );
};

export default MonthlyDataPanel;