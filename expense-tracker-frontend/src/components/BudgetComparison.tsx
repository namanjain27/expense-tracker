import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { api } from '../services/api';
import { Budget } from '../services/api';
import { TotalExpenses } from '../types/expense';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BudgetComparisonProps {
    selectedMonth: number;
    selectedYear: number;
}

const BudgetComparison: React.FC<BudgetComparisonProps> = ({ selectedMonth, selectedYear }) => {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [expenses, setExpenses] = useState<TotalExpenses | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - i
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const [budgetData, expensesData] = await Promise.all([
                    api.getLatestBudget(selectedMonth, selectedYear).catch(() => null),
                    api.getTotalExpenses(selectedMonth, selectedYear)
                ]);
                setBudget(budgetData);
                setExpenses(expensesData);
            } catch (error) {
                console.error('Error fetching comparison data:', error);
                setError('Failed to load expenses data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMonth, selectedYear]);

    const getColorForPercentage = (percentage: number) => {
        if (percentage <= 50) {
            // Green gradient for under 50%
            return 'rgba(75, 192, 192, 0.8)';
        } else if (percentage <= 75) {
            // Yellow gradient for 50-75%
            return 'rgba(255, 205, 86, 0.8)';
        } else if (percentage <= 100) {
            // Orange gradient for 75-100%
            return 'rgba(255, 159, 64, 0.8)';
        } else {
            // Red gradient for over 100%
            return 'rgba(255, 99, 132, 0.8)';
        }
    };

    const getBorderColorForPercentage = (percentage: number) => {
        if (percentage <= 50) {
            return 'rgba(75, 192, 192, 1)';
        } else if (percentage <= 75) {
            return 'rgba(255, 205, 86, 1)';
        } else if (percentage <= 100) {
            return 'rgba(255, 159, 64, 1)';
        } else {
            return 'rgba(255, 99, 132, 1)';
        }
    };

    const prepareChartData = () => {
        if (!expenses) return null;

        // If no budget exists, show only expenses
        if (!budget) {
            const categories = Object.keys(expenses.category_breakdown);
            const expenseValues = categories.map(category => {
                const amount = expenses.category_breakdown[category] || 0;
                return amount;
            });

            return {
                labels: categories,
                datasets: [
                    {
                        label: 'Actual Expenses (₹)',
                        data: expenseValues,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            };
        }

        const categories = Object.keys(budget.category_budgets);
        const budgetValues = categories.map(() => 100);
        const expenseValues = categories.map(category => {
            const budgetAmount = budget.category_budgets[category];
            const expenseAmount = expenses.category_breakdown[category] || 0;
            return budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
        });

        // Add savings comparison
        const totalBudget = budget.monthly_income;
        const totalExpenses = expenses.overall_total;
        const actualSavings = totalBudget - totalExpenses;
        const budgetedSavings = budget.saving_goal;

        categories.push('Savings');
        budgetValues.push(100);
        expenseValues.push(budgetedSavings > 0 ? (actualSavings / budgetedSavings) * 100 : 0);

        const maxPercentage = Math.max(...expenseValues, 100);
        const yAxisMax = Math.ceil(maxPercentage / 50) * 50;

        return {
            labels: categories,
            datasets: [
                {
                    label: 'Budget (100%)',
                    data: budgetValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Actual (%)',
                    data: expenseValues,
                    backgroundColor: expenseValues.map(value => getColorForPercentage(value)),
                    borderColor: expenseValues.map(value => getBorderColorForPercentage(value)),
                    borderWidth: 1
                }
            ],
            yAxisMax
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    boxWidth: 15,
                    padding: 15
                }
            },
            title: {
                display: true,
                text: budget ? 'Budget vs Actual Expenses (Percentage)' : 'Actual Expenses'
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        if (label.includes('Budget')) {
                            return `${label}`;
                        }
                        if (budget) {
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                        return `${label}: ₹${value.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: budget ? 200 : undefined,
                title: {
                    display: true,
                    text: budget ? 'Percentage (%)' : 'Amount (₹)'
                },
                ticks: {
                    callback: function(value: any) {
                        return budget ? `${value}%` : `₹${value}`;
                    }
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 2, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Loading comparison data...</Typography>
            </Paper>
        );
    }

    const chartData = prepareChartData();
    if (!chartData) {
        return (
            <Paper sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="error" sx={{ mb: 2 }}>No expense data available for the selected period</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, height: '400px' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Budget Comparison</Typography>
            </Box>
            {!budget && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No budget set for {months[selectedMonth - 1]} {selectedYear}
                    </Typography>
                </Box>
            )}
            <Box sx={{ 
                height: 'calc(100% - 60px)', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 0
                }}>
                    <Bar data={chartData} options={chartOptions} />
                </Box>
            </Box>
        </Paper>
    );
};

export default BudgetComparison;