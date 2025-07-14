import React, { useEffect, useState, useRef, createContext } from 'react';
import { Box, Button, Container, Paper, Typography, Tooltip } from '@mui/material';
import { Doughnut, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { TotalExpenses } from '../types/expense';
import { Expense, Income, Saving, RecordType } from '../types/records';
import { api, DailyExpense } from '../services/api';
import { User } from '../types/user';
import AddRecordDialog from './AddRecordDialog';
import TransactionSummaryDialog from './TransactionSummaryDialog';
import DeleteExpenseDialog from './DeleteExpenseDialog';
import MonthlyTransactionList from './ExpenseList';
import SubscriptionsPanel, { SubscriptionsPanelRef } from './SubscriptionsPanel';
import BudgetDialog from './BudgetDialog';
import BudgetComparison from './BudgetComparison';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SavingGoalsPanel from './SavingGoalsPanel';
import MonthlyReportDialog from './MonthlyReportDialog';
import AddSubscriptionDialog from './AddSubscriptionDialog';
import NavigationBar from './NavigationBar';
import BalanceComponent from './BalanceComponent';
import TriColorChart from './TriColorChart';

// Create theme context
export const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => {},
});

interface Transaction {
    Date: string;
    Description: string;
    Withdrawal: number;
    Deposit: number;
}

interface TransactionSummaryData {
    data: Transaction[];
    total_amount_withdrawn: number;
    total_amount_deposited: number;
    net_monthly_expenditure: number;
    total_transcations: number;
}

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [savings, setSavings] = useState<Saving[]>([]);
    const [totals, setTotals] = useState<TotalExpenses | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<(Expense | Income | Saving) & { type: RecordType } | null>(null);
    const subscriptionsPanelRef = useRef<SubscriptionsPanelRef>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // User state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    
    // Section refs for navigation
    const chartsRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const expensesRef = useRef<HTMLDivElement>(null);
    const subscriptionsRef = useRef<HTMLDivElement>(null);
    const savingGoalsRef = useRef<HTMLDivElement>(null);
    const [intentionData, setIntentionData] = useState<{
        totals: { [key: string]: number },
        percentages: { [key: string]: number },
        total_amount: number,
        budget_income: number,
        Saving_Untouched: number
    } | null>(null);
    const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
    const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
    const [lineGraphLoading, setLineGraphLoading] = useState(false);
    const [lineGraphError, setLineGraphError] = useState<string>('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [transactionSummary, setTransactionSummary] = useState<TransactionSummaryData | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New state for monthly report dialog
    const [openReportDialog, setOpenReportDialog] = useState(false);
    const [reportHtmlContent, setReportHtmlContent] = useState<string | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const [emailSending, setEmailSending] = useState(false);
    const [emailSendSuccess, setEmailSendSuccess] = useState(false);

    // New state for AddSubscriptionDialog
    const [isAddSubscriptionDialogOpen, setIsAddSubscriptionDialogOpen] = useState(false);
    const [initialSubscriptionData, setInitialSubscriptionData] = useState<any>(null);

    const theme = createTheme({
        palette: {
            mode: isDarkMode ? 'dark' : 'light',
            background: {
                default: isDarkMode ? '#121212' : '#ffffff',
                paper: isDarkMode ? '#1e1e1e' : '#ffffff',
            },
            text: {
                primary: isDarkMode ? '#ffffff' : '#000000',
                secondary: isDarkMode ? '#b0b0b0' : '#666666',
            },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderColor: isDarkMode ? '#333333' : '#e0e0e0',
                    },
                },
            },
        },
    });

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const fetchData = async () => {
        try {
            const [expensesData, incomesData, savingsData, totalsData] = await Promise.all([
                api.getExpenses(selectedMonth, selectedYear),
                api.getIncomes(selectedMonth, selectedYear),
                api.getSavings(selectedMonth, selectedYear),
                api.getTotalExpenses(selectedMonth, selectedYear)
            ]);
            const sortedExpenses = expensesData.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const sortedIncomes = incomesData.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const sortedSavings = savingsData.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setExpenses(sortedExpenses);
            setIncomes(sortedIncomes);
            setSavings(sortedSavings);
            setTotals(totalsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

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

    const fetchUser = async () => {
        try {
            setUserLoading(true);
            const user = await api.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            // If user fetch fails, user might not be authenticated
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchIntentionData();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchDailyExpenses();
    }, [selectedMonth, selectedYear]);

    const handleAddExpense = async (expense: Omit<Expense, 'id' | 'category' | 'created_at'>) => {
        try {
            await api.createExpense(expense);
            // Reload all data
            await Promise.all([
                fetchData(),
                fetchIntentionData(),
                fetchDailyExpenses()
            ]);
            setRefreshTrigger(prev => prev + 1);
            setIsAddDialogOpen(false);
            subscriptionsPanelRef.current?.fetchSubscriptions();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleAddIncome = async (income: Omit<Income, 'id' | 'category' | 'created_at'>) => {
        try {
            await api.createIncome(income);
            // Reload data (you may want to add income-specific data fetching here)
            await Promise.all([
                fetchData(),
                fetchDailyExpenses()
            ]);
            setRefreshTrigger(prev => prev + 1);
            setIsAddDialogOpen(false);
        } catch (error) {
            console.error('Error adding income:', error);
        }
    };

    const handleAddSaving = async (saving: Omit<Saving, 'id' | 'category' | 'created_at'>) => {
        try {
            await api.createSaving(saving);
            // Reload data (you may want to add saving-specific data fetching here)
            await Promise.all([
                fetchData(),
                fetchDailyExpenses()
            ]);
            setRefreshTrigger(prev => prev + 1);
            setIsAddDialogOpen(false);
        } catch (error) {
            console.error('Error adding saving:', error);
        }
    };

    // New handler for converting expense to subscription
    const handleConverttoSubscription = (expenseData: Omit<Expense, 'id' | 'category' | 'created_at'>) => {
        // Pre-fill subscription dialog with expense data
        setInitialSubscriptionData({
            name: expenseData.name,
            amount: expenseData.amount,
            category_id: expenseData.category_id,
            intention: expenseData.intention,
            effective_date: expenseData.date, // Use the expense date as effective date
            // Set default periods, user can change later
            subscription_period: { value: 1, unit: 'months' }, 
            billing_period: { value: 1, unit: 'months' },
            due_period: { value: 1, unit: 'months' }
        });
        setIsAddSubscriptionDialogOpen(true);
    };

    const handleDeleteRecord = async (id: number, type: string) => {
        try {
            switch (type) {
                case 'Expense':
                    await api.deleteExpense(id);
                    break;
                case 'Income':
                    await api.deleteIncome(id);
                    break;
                case 'Saving':
                    await api.deleteSaving(id);
                    break;
                default:
                    throw new Error(`Unknown record type: ${type}`);
            }
            // Reload all data
            await Promise.all([
                fetchData(),
                fetchIntentionData(),
                fetchDailyExpenses()
            ]);
            setRefreshTrigger(prev => prev + 1);  // Increment refresh trigger
            setIsDeleteDialogOpen(false);
            setSelectedRecord(null);
        } catch (error) {
            console.error(`Error deleting ${type.toLowerCase()}:`, error);
        }
    };

    const handleDeleteClick = (record: (Expense | Income | Saving) & { type: RecordType }) => {
        setSelectedRecord(record);
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

    const currentMonth = new Date().getMonth() + 1; // 1-indexed
    const currentYear = new Date().getFullYear();

    const availableMonths = months.filter((_, index) => {
        if (selectedYear === currentYear) {
            return index + 1 <= currentMonth;
        }
        return true; // All months available for past years
    });

    const availableYears = Array.from(
        { length: currentYear - (currentYear - 5) + 1 }, // Adjust length to include current year and past 5 years (total 6 years)
        (_, i) => currentYear - i
    ).filter(year => year <= currentYear); // Ensure no future years

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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        setUploadError('');
        try {
            const summary = await api.uploadStatement(file);
            setTransactionSummary(summary);
            setIsTransactionDialogOpen(true);
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError('Failed to upload or process file.');
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleExportExpenses = () => {
        api.exportExpenses();
    };

    const handleShowMonthlyReport = async () => {
        setEmailSendSuccess(false); // Reset email sent status when opening report
        setReportLoading(true);
        setReportError(null);
        try {
            const htmlContent = await api.generateMonthlyReport(selectedMonth, selectedYear);
            setReportHtmlContent(htmlContent);
            setOpenReportDialog(true);
        } catch (error) {
            console.error('Error generating monthly report:', error);
            setReportError('Failed to generate monthly report.');
        } finally {
            setReportLoading(false);
        }
    };

    const handleSendMonthlyReportEmail = async () => {
        setEmailSending(true);
        setEmailSendSuccess(false);
        try {
            const success = await api.sendMonthlyReportEmail();
            setEmailSendSuccess(success);
        } catch (error) {
            console.error('Error sending monthly report email:', error);
            setReportError('Failed to send monthly report email.');
        } finally {
            setEmailSending(false);
        }
    };

    // Navigation functions
    const handleNavigateToSection = (sectionId: string) => {
        const refs = {
            'charts': chartsRef,
            'actions': actionsRef,
            'monthly-expenses': expensesRef,
            'subscriptions': subscriptionsRef,
            'saving-goals': savingGoalsRef
        };

        const targetRef = refs[sectionId as keyof typeof refs];
        if (targetRef?.current) {
            targetRef.current.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, redirect to login
            window.location.href = '/login';
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                
                {/* Navigation Bar */}
                <NavigationBar
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={setSelectedMonth}
                    onYearChange={setSelectedYear}
                    availableMonths={availableMonths}
                    availableYears={availableYears}
                    onNavigateToSection={handleNavigateToSection}
                    username={currentUser?.name || currentUser?.email || 'User'}
                    onLogout={handleLogout}
                />
                
                <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                    {/* Budget Button moved to top right of content area */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setOpenBudgetDialog(true)}
                        >
                            {months[selectedMonth - 1]} - Budget
                        </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
                        {/* Balance and Actions Section */}
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                            {/* Balance Component */}
                            <BalanceComponent refreshTrigger={refreshTrigger} />
                            
                            {/* Actions Panel */}
                            <Paper 
                                ref={actionsRef} 
                                sx={{ 
                                    p: 3, 
                                    scrollMarginTop: '80px',
                                    flex: 1,
                                    borderRadius: 4,
                                    background: isDarkMode 
                                        ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                                        : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                                    border: `2px solid ${isDarkMode ? '#444444' : '#cccccc'}`
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, color: isDarkMode ? '#ffffff' : '#333333' }}>
                                    Actions
                                </Typography>
                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(4, 1fr)', 
                                    gap: 2,
                                    maxWidth: '800px'
                                }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => setIsAddDialogOpen(true)}
                                        sx={{ 
                                            aspectRatio: '3/2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Add Record
                                    </Button>
                                    <Tooltip title="Download all expenses as Excel file">
                                        <Button
                                            variant="contained"
                                            onClick={handleExportExpenses}
                                            color="secondary"
                                            sx={{ 
                                                aspectRatio: '3/2',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Export Data
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Extract data from any bank statement in .xls or .xlsx">
                                        <Button
                                            variant="contained"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            color="info"
                                            sx={{ 
                                                aspectRatio: '3/2',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            {uploading ? 'Uploading...' : 'Import Transactions'}
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title={totals?.overall_total === 0 ? "No expenses to show this month" : ""}>
                                        <span>
                                            <Button
                                                variant="contained"
                                                onClick={handleShowMonthlyReport}
                                                disabled={reportLoading || (totals?.overall_total === 0)}
                                                color="success"
                                                sx={{ 
                                                    aspectRatio: '3/2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.875rem',
                                                    width: '100%'
                                                }}
                                            >
                                                {reportLoading ? 'Loading Report...' : 'Show Monthly Report'}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                                {uploadError && <Typography color="error" sx={{ mt: 2 }}>{uploadError}</Typography>}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept=".xls,.xlsx"
                                />
                            </Paper>
                        </Box>
                        {/* 2x2 Grid for Charts */}
                        <Box 
                            ref={chartsRef}
                            sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: 3,
                                scrollMarginTop: '80px' // Account for sticky nav height
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

                            {/* Budget Comparison Chart */}
                            <BudgetComparison 
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                refreshTrigger={refreshTrigger}
                            />

                            {/* Expense Intention Breakdown Chart */}
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

                            {/* Daily Expense Variation Chart */}
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


                        {/* Expense List - Full Width */}
                        <Paper ref={expensesRef} sx={{ p: 2, scrollMarginTop: '80px' }}>
                            <Box sx={{ height: '100%' }}>
                                <MonthlyTransactionList
                                    expenses={expenses}
                                    incomes={incomes}
                                    savings={savings}
                                    onSelectRecord={setSelectedRecord}
                                    selectedRecord={selectedRecord}
                                    onDeleteClick={handleDeleteClick}
                                />
                            </Box>
                        </Paper>

                        {/* Subscriptions Panel - Full Width */}
                        <Box ref={subscriptionsRef} sx={{ width: '100%', scrollMarginTop: '80px' }}>
                            <SubscriptionsPanel ref={subscriptionsPanelRef} />
                        </Box>

                        {/* Saving Goals Panel - Full Width */}
                        <Box ref={savingGoalsRef} sx={{ width: '100%', scrollMarginTop: '80px' }}>
                            <SavingGoalsPanel />
                        </Box>
                    </Box>

                    <AddRecordDialog
                        open={isAddDialogOpen}
                        onClose={() => setIsAddDialogOpen(false)}
                        onAddExpense={handleAddExpense}
                        onAddIncome={handleAddIncome}
                        onAddSaving={handleAddSaving}
                        onSubscriptionSuccess={() => subscriptionsPanelRef.current?.fetchSubscriptions()}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onConverttoSubscription={handleConverttoSubscription}
                    />

                    <DeleteExpenseDialog
                        open={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onDelete={(id) => selectedRecord && handleDeleteRecord(id, selectedRecord.type)}
                        expense={selectedRecord}
                    />
                    
                    <BudgetDialog
                        open={openBudgetDialog}
                        onClose={() => setOpenBudgetDialog(false)}
                        onSuccess={fetchData}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                    />

                    <TransactionSummaryDialog
                        open={isTransactionDialogOpen}
                        onClose={() => setIsTransactionDialogOpen(false)}
                        summary={transactionSummary}
                    />

                    <MonthlyReportDialog
                        open={openReportDialog}
                        onClose={() => { setOpenReportDialog(false); setEmailSendSuccess(false); } } // Reset email status on close
                        htmlContent={reportHtmlContent}
                        loading={reportLoading}
                        error={reportError}
                        onSendEmail={handleSendMonthlyReportEmail}
                        emailSending={emailSending}
                        emailSendSuccess={emailSendSuccess}
                    />

                    <AddSubscriptionDialog
                        open={isAddSubscriptionDialogOpen}
                        onClose={() => setIsAddSubscriptionDialogOpen(false)}
                        onSuccess={() => {
                            subscriptionsPanelRef.current?.fetchSubscriptions();
                            fetchData(); // Refresh expense data after adding subscription
                        }}
                        initialData={initialSubscriptionData}
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
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default Dashboard; 