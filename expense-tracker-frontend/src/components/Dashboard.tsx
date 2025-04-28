import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Typography, Tooltip } from '@mui/material';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Expense, TotalExpenses, CATEGORIES } from '../types/expense';
import { api } from '../services/api';
import AddExpenseDialog from './AddExpenseDialog';
import DeleteExpenseDialog from './DeleteExpenseDialog';
import ExpenseList from './ExpenseList';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [totals, setTotals] = useState<TotalExpenses | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const fetchData = async () => {
        try {
            const [expensesData, totalsData] = await Promise.all([
                api.getExpenses(),
                api.getTotalExpenses()
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
    }, []);

    const handleAddExpense = async (expense: Omit<Expense, 'id' | 'category'>) => {
        try {
            await api.createExpense(expense);
            fetchData();
            setIsAddDialogOpen(false);
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

    const chartData = {
        labels: totals ? Object.keys(totals.category_breakdown) : [],
        datasets: [{
            data: totals ? Object.values(totals.category_breakdown) : [],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
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
                        return `${label}: ₹${value.toFixed(2)}`;
                    }
                }
            }
        }
    };

    // Prepare data for line chart
    const aggregatedExpenses = expenses.reduce((acc, expense) => {
        const date = expense.date;
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += expense.amount;
        return acc;
    }, {} as { [key: string]: number });

    const sortedDates = Object.keys(aggregatedExpenses).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
    );

    const lineChartData = {
        labels: sortedDates,
        datasets: [{
            label: 'Daily Expenses',
            data: sortedDates.map(date => aggregatedExpenses[date]),
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
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount (₹)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                        <Box sx={{ display: 'flex', height: '100%' }}>
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Doughnut 
                                    data={chartData}
                                    options={chartOptions}
                                />
                            </Box>
                            <Box sx={{ flex: 1, p: 2 }}>
                                <Typography variant="h6">Total Expenses</Typography>
                                <Typography variant="h4">₹{totals?.overall_total.toFixed(2) || '0.00'}</Typography>
                                {totals && Object.entries(totals.category_breakdown).map(([category, amount]) => (
                                    <Box key={category} sx={{ mt: 1 }}>
                                        <Typography>{category}: ₹{amount.toFixed(2)}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Paper>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                        <Line 
                            data={lineChartData}
                            options={lineChartOptions}
                        />
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
                            <Tooltip title={!selectedExpense ? "Select an expense to delete" : ""}>
                                <span>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                        disabled={!selectedExpense}
                                    >
                                        Delete Expense
                                    </Button>
                                </span>
                            </Tooltip>
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
                        />
                    </Paper>
                </Box>
            </Box>

            <AddExpenseDialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAdd={handleAddExpense}
            />

            <DeleteExpenseDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onDelete={handleDeleteExpense}
                expense={selectedExpense}
            />

            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
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