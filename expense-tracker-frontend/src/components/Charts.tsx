import React, { useContext } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { TotalExpenses } from '../types/expense';
import { DailyExpense } from '../services/api';
import TriColorChart from './TriColorChart';
import BudgetComparison from './BudgetComparison';
import { ThemeContext } from './Dashboard';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface ChartsProps {
    selectedMonth: number;
    selectedYear: number;
    refreshTrigger: number;
    totals: TotalExpenses | null;
    dailyExpenses: DailyExpense[];
    lineGraphLoading: boolean;
    lineGraphError: string;
}

const Charts: React.FC<ChartsProps> = ({
    selectedMonth,
    selectedYear,
    refreshTrigger,
    totals,
    dailyExpenses,
    lineGraphLoading,
    lineGraphError
}) => {
    const { isDarkMode } = useContext(ThemeContext);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Monthly Expenses Chart Data
    const chartData = {
        labels: totals ? Object.keys(totals.category_breakdown) : [],
        datasets: [{
            data: totals ? Object.values(totals.category_breakdown) : [],
            backgroundColor: [
                '#9ACD32',  // Food - Green
                '#36A2EB',  // Housing - Blue
                '#FFCE56',  // Transportation - Yellow
                '#4BC0C0',  // Personal - Teal
                '#9966FF',  // Utility - Purple
                '#FF9F40',  // Recreation - Orange
                '#FF6384',  // Health - Pink
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

    // Daily Expenses Line Chart Data
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
        <Box 
            sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 3,
                scrollMarginTop: '80px'
            }}
        >
            {/* Monthly Overview Chart (Income/Expenses/Savings) */}
            <TriColorChart 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                refreshTrigger={refreshTrigger}
            />

            {/* Monthly Expenses Chart */}
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Monthly Expenses
                    </Typography>
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
                    <Box sx={{ 
                        flex: 1, 
                        p: 2, 
                        overflowY: 'auto',
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
                    }}>
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

            {/* Budget Comparison Chart */}
            <BudgetComparison 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                refreshTrigger={refreshTrigger}
            />

            {/* Daily Expense Variation Chart */}
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '400px' }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Daily Expense Variation
                    </Typography>
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
    );
};

export default Charts;