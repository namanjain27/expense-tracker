import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { api } from '../services/api';
import { ThemeContext } from './Dashboard';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TriColorChartProps {
    selectedMonth: number;
    selectedYear: number;
    refreshTrigger: number;
}

interface MonthlyData {
    income: number;
    expenses: number;
    savings: number;
}

const TriColorChart: React.FC<TriColorChartProps> = ({
    selectedMonth,
    selectedYear,
    refreshTrigger
}) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [monthlyData, setMonthlyData] = useState<MonthlyData>({
        income: 0,
        expenses: 0,
        savings: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchMonthlyData = async () => {
        try {
            setLoading(true);
            
            // Fetch data for the selected month and year
            const [incomeData, expenseData, savingsData] = await Promise.all([
                api.getTotalIncomes(selectedMonth, selectedYear),
                api.getTotalExpenses(selectedMonth, selectedYear),
                api.getTotalSavings(selectedMonth, selectedYear)
            ]);

            setMonthlyData({
                income: incomeData.overall_total || 0,
                expenses: expenseData.overall_total || 0,
                savings: savingsData.overall_total || 0
            });
        } catch (error) {
            console.error('Error fetching monthly data:', error);
            setMonthlyData({ income: 0, expenses: 0, savings: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyData();
    }, [selectedMonth, selectedYear, refreshTrigger]);

    const total = monthlyData.income + monthlyData.expenses + monthlyData.savings;

    // Generate chart data
    const chartData = {
        labels: ['Income', 'Expenses', 'Savings'],
        datasets: [
            {
                data: [monthlyData.income, monthlyData.expenses, monthlyData.savings],
                backgroundColor: [
                    '#4CAF50', // Green for Income
                    '#FF5252', // Red for Expenses  
                    '#36A2EB'  // Blue for Savings
                ],
                borderColor: [
                    '#388E3C',
                    '#E53935',
                    '#1E88E5'
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                    '#66BB6A',
                    '#FF6B6B',
                    '#5BA2F5'
                ],
                hoverBorderColor: [
                    '#2E7D32',
                    '#D32F2F',
                    '#1976D2'
                ],
                hoverBorderWidth: 3
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: isDarkMode ? '#ffffff' : '#333333',
                    font: {
                        size: 12,
                        weight: 500
                    },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'square'
                }
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#2c2c2c' : '#ffffff',
                titleColor: isDarkMode ? '#ffffff' : '#333333',
                bodyColor: isDarkMode ? '#ffffff' : '#333333',
                borderColor: isDarkMode ? '#555555' : '#cccccc',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context: any) {
                        const label = context.label;
                        const value = context.parsed;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        },
        elements: {
            arc: {
                borderAlign: 'center' as const,
                borderJoinStyle: 'round' as const
            }
        }
    };

    if (loading) {
        return (
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography color={isDarkMode ? '#ffffff' : '#333333'}>
                    Loading...
                </Typography>
            </Paper>
        );
    }

    if (total === 0) {
        return (
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    height: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography 
                    variant="h6" 
                    sx={{ 
                        mb: 2, 
                        color: isDarkMode ? '#ffffff' : '#333333',
                        textAlign: 'center'
                    }}
                >
                    Monthly Overview
                </Typography>
                <Typography 
                    color={isDarkMode ? '#888888' : '#666666'}
                    textAlign="center"
                >
                    No data available for {selectedMonth}/{selectedYear}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                height: 400
            }}
        >
            <Typography 
                variant="h6" 
                sx={{ 
                    mb: 2, 
                    color: isDarkMode ? '#ffffff' : '#333333',
                    textAlign: 'center',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}
            > 
                Monthly Overview
            </Typography>
            
            <Box sx={{ height: 280, position: 'relative' }}>
                <Doughnut data={chartData} options={options} />
                
                {/* Center summary */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -60%)',
                        textAlign: 'center',
                        pointerEvents: 'none'
                    }}
                >
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: isDarkMode ? '#888888' : '#666666',
                            fontSize: '0.7rem'
                        }}
                    >
                        Net Balance
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: monthlyData.income - monthlyData.expenses - monthlyData.savings >= 0 
                                ? '#4CAF50' 
                                : '#FF5252',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                    >
                        ₹{(monthlyData.income - monthlyData.expenses - monthlyData.savings).toLocaleString()}
                    </Typography>
                </Box>
            </Box>

            {/* Summary Stats */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                        variant="caption" 
                        sx={{ color: '#4CAF50', fontWeight: 'bold' }}
                    >
                        Income
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}
                    >
                        ₹{monthlyData.income.toLocaleString()}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                        variant="caption" 
                        sx={{ color: '#FF5252', fontWeight: 'bold' }}
                    >
                        Expenses
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}
                    >
                        ₹{monthlyData.expenses.toLocaleString()}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                        variant="caption" 
                        sx={{ color: '#36A2EB', fontWeight: 'bold' }}
                    >
                        Savings
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}
                    >
                        ₹{monthlyData.savings.toLocaleString()}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default TriColorChart;