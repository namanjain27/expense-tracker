import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, Container, Paper, Typography, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Doughnut, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Expense, TotalExpenses } from '../types/expense';
import { api, DailyExpense } from '../services/api';
import AddExpenseDialog from './AddExpenseDialog';
import DeleteExpenseDialog from './DeleteExpenseDialog';
import ExpenseList from './ExpenseList';
import SubscriptionsPanel, { SubscriptionsPanelRef } from './SubscriptionsPanel';
import BudgetDialog from './BudgetDialog';
import BudgetComparison from './BudgetComparison';
import { cyan } from '@mui/material/colors';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [totals, setTotals] = useState<TotalExpenses | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const subscriptionsPanelRef = useRef<SubscriptionsPanelRef>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [intentionData, setIntentionData] = useState<{
        totals: { [key: string]: number },
        percentages: { [key: string]: number },
        total_amount: number,
        budget_income: number,
        Saving_Untouched: number
    } | null>(null);
    const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
    const [currentMonth] = useState(() => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[new Date().getMonth()];
    });
    const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
    const [lineGraphLoading, setLineGraphLoading] = useState(false);
    const [lineGraphError, setLineGraphError] = useState<string>('');

    const fetchData = async () => {
        try {
            const [expensesData, totalsData] = await Promise.all([
                api.getExpenses(),
                api.getTotalExpenses(selectedMonth, selectedYear)
            ]);
            const sortedExpenses = expensesData.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setExpenses(sortedExpenses);
            setTotals(totalsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        const fetchIntentionData = async () => {
            try {
                const data = await api.getIntentionBreakdown(selectedMonth, selectedYear);
                const budgetData = await api.getLatestBudget(selectedMonth, selectedYear).catch(() => null);
                
                // Calculate Savings [Untouched]
                const budgetIncome = budgetData?.monthly_income || 0;
                const totalExpenses = data.total_amount;
                const untouchedSavings = budgetIncome - totalExpenses;
                const untouchedSavingsPercentage = budgetIncome > 0 ? (untouchedSavings / budgetIncome) * 100 : 0;

                setIntentionData({
                    ...data,
                    budget_income: budgetIncome,
                    Saving_Untouched: untouchedSavingsPercentage
                });
            } catch (error) {
                console.error('Error fetching intention data:', error);
            }
        };
        fetchIntentionData();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        const fetchDailyExpenses = async () => {
            try {
                setLineGraphLoading(true);
                setLineGraphError('');
                const response = await api.getDailyExpenses(selectedMonth, selectedYear);
                setDailyExpenses(response.daily_expenses);
            } catch (error) {
                console.error('Error fetching daily expenses:', error);
                setLineGraphError('Failed to load daily expenses data');
            } finally {
                setLineGraphLoading(false);
            }
        };

        fetchDailyExpenses();
    }, [selectedMonth, selectedYear]);

    const handleAddExpense = async (expense: Omit<Expense, 'id' | 'category'>) => {
        try {
            await api.createExpense(expense);
            fetchData();
            setIsAddDialogOpen(false);
            subscriptionsPanelRef.current?.fetchSubscriptions();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleDeleteExpense = async (id: number) => {
        try {
            await api.deleteExpense(id);
            fetchData();
            setIsDeleteDialogOpen(false);
            setSelectedExpense(null);
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const handleDeleteClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDeleteDialogOpen(true);
    };

    const chartData = {
        labels: totals ? Object.keys(totals.category_breakdown) : [],
        datasets: [{
            data: totals ? Object.values(totals.category_breakdown) : [],
            backgroundColor: [
                '#9ACD32',  // Food - Pink
                '#36A2EB',  // Housing - Blue
                '#FFCE56',  // Transportation - Yellow
                '#4BC0C0',  // Personal - Teal
                '#9966FF',  // Utility - Purple
                '#FF9F40',  // Recreation - Orange
                '#FF6384',  // Health - Pink
                '#4CAF50',  // Savings - Green
                '#FF5252'   // Debt - Red
            ]
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = totals?.overall_total || 0;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            },
            legend: {
                position: 'top' as const,
                labels: {
                    boxWidth: 15,
                    padding: 15
                }
            }
        }
    };

    const intentionChartData = {
        labels: ['Need', 'Want', 'Saving', 'Savings [Untouched]'],
        datasets: [{
            data: intentionData ? [
                intentionData.percentages.Need,
                intentionData.percentages.Want,
                intentionData.percentages.Saving,
                intentionData.Saving_Untouched || 0
            ] : [0, 0, 0, 0],
            backgroundColor: [
                '#2196F3',  // Blue for Need
                '#FFC107',  // Amber for Want
                '#9ACD32',  // Green for Saving
                '#4CAF50'   // Light Green for Savings [Untouched]
            ]
        }]
    };

    const intentionChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = intentionData?.total_amount || 0;
                        let amount = (value / 100) * total;
                        
                        // For Savings [Untouched], calculate based on budget income
                        if (label === 'Savings [Untouched]') {
                            const budgetIncome = intentionData?.budget_income || 0;
                            amount = budgetIncome - total;
                        }
                        
                        return `${label}: ${value.toFixed(1)}% (₹${amount.toFixed(2)})`;
                    }
                }
            },
            title: {
                display: true,
                text: 'Total Expense Amount: ₹' + intentionData?.total_amount.toFixed(2) || '0.00'
            }
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - i
    );

    const lineChartData = {
        labels: dailyExpenses.map(expense => {
            const date = new Date(expense.date);
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }),
        datasets: [{
            label: 'Daily Expenses',
            data: dailyExpenses.map(expense => expense.amount),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Daily Expense Variation'
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw || 0;
                        return `Amount: ₹${value.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount (₹)'
                },
                ticks: {
                    callback: (value: any) => `₹${value}`
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', mb: 3, gap: 3 }}>
                <Typography variant="h4">
                    Dashboard
                </Typography>
                <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {months.map((month, index) => (
                                <MenuItem key={month} value={index + 1}>
                                    {month}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {years.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenBudgetDialog(true)}
                    >
                        {months[selectedMonth - 1]} - Budget
                    </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6">Monthly Expenses</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', height: 'calc(100% - 60px)' }}>
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '100%' }}>
                                    <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Doughnut 
                                            data={chartData}
                                            options={{
                                                ...chartOptions,
                                                maintainAspectRatio: false
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
                                    <Typography variant="h5">Total: ₹{totals?.overall_total.toFixed(2) || '0.00'}</Typography>
                                    {totals && Object.entries(totals.category_breakdown)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([category, amount]) => (
                                            <Box key={category} sx={{ mt: 1 }}>
                                                <Typography>
                                                    {category}: ₹{amount.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        ))}
                                </Box>
                            </Box>
                        </Paper>
                        
                        <BudgetComparison 
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                        />
                        
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ ml: 2 }}>
                                    Expense Intention Breakdown
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Box sx={{ width: '60%', height: '100%' }}>
                                    <Pie 
                                        data={intentionChartData}
                                        options={intentionChartOptions}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6">Daily Expense Variation</Typography>
                            </Box>
                            {lineGraphLoading ? (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography>Loading daily expenses...</Typography>
                                </Box>
                            ) : lineGraphError ? (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="error">{lineGraphError}</Typography>
                                </Box>
                            ) : dailyExpenses.length === 0 ? (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="text.secondary">
                                        No expenses recorded for {months[selectedMonth - 1]} {selectedYear}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Line data={lineChartData} options={lineChartOptions} />
                                </Box>
                            )}
                        </Paper>
                    </Box>
                    <Box sx={{ flex: 1.2 }}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    Add Expense
                                </Button>
                                <Tooltip title="Download all expenses as Excel file">
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => api.exportExpenses()}
                                    >
                                        Export Data
                                    </Button>
                                </Tooltip>
                            </Box>
                            <ExpenseList
                                expenses={expenses}
                                onSelectExpense={setSelectedExpense}
                                selectedExpense={selectedExpense}
                                onDeleteClick={handleDeleteClick}
                            />
                        </Paper>
                    </Box>
                </Box>
                
                <Box sx={{ width: '100%' }}>
                    <SubscriptionsPanel ref={subscriptionsPanelRef} />
                </Box>
            </Box>

            <AddExpenseDialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAdd={handleAddExpense}
                onSubscriptionSuccess={() => subscriptionsPanelRef.current?.fetchSubscriptions()}
            />

            <DeleteExpenseDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onDelete={handleDeleteExpense}
                expense={selectedExpense}
            />

            <BudgetDialog
                open={openBudgetDialog}
                onClose={() => setOpenBudgetDialog(false)}
                onSuccess={fetchData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
            />

            <Box
                sx={{
                    mt: 4,
                    bgcolor: '#D9D9D9',
                    color: 'black',
                    py: 1,
                    textAlign: 'center',
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.1rem',
                    letterSpacing: '0.05em',
                    boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
                }}
            >
                Created By Naman Jain
            </Box>
        </Container>
    );
};

export default Dashboard; 