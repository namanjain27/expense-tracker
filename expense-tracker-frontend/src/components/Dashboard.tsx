import React, { useEffect, useState, useRef, createContext } from 'react';
import { Box, Button, Container, Paper, Typography, Tooltip } from '@mui/material';
import MonthlyDataPanel from './MonthlyDataPanel';
import { TotalExpenses } from '../types/expense';
import { Expense, Income, Saving, RecordType } from '../types/records';
import { api, DailyExpense } from '../services/api';
import { User } from '../types/user';
import AddRecordDialog from './AddRecordDialog';
import TransactionSummaryDialog from './TransactionSummaryDialog';
import DeleteExpenseDialog from './DeleteExpenseDialog';
import SubscriptionsPanel, { SubscriptionsPanelRef } from './SubscriptionsPanel';
import BudgetDialog from './BudgetDialog';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SavingGoalsPanel from './SavingGoalsPanel';
import MonthlyReportDialog from './MonthlyReportDialog';
import AddSubscriptionDialog from './AddSubscriptionDialog';
import NavigationBar from './NavigationBar';
import BalanceComponent from './BalanceComponent';

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
    
    // Section refs for navigation
    const chartsRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const expensesRef = useRef<HTMLDivElement>(null);
    const subscriptionsRef = useRef<HTMLDivElement>(null);
    const savingGoalsRef = useRef<HTMLDivElement>(null);
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
            const user = await api.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            // If user fetch fails, user might not be authenticated
        } finally {
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);


    useEffect(() => {
        fetchDailyExpenses();
    }, [selectedMonth, selectedYear]);

    // Centralized data refresh function
    const refreshAllData = async () => {
        await Promise.all([
            fetchData(),
            fetchDailyExpenses()
        ]);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleAddExpense = async (expense: Omit<Expense, 'id' | 'category' | 'created_at'>) => {
        try {
            await api.createExpense(expense);
            await refreshAllData();
            setIsAddDialogOpen(false);
            subscriptionsPanelRef.current?.fetchSubscriptions();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleAddIncome = async (income: Omit<Income, 'id' | 'category' | 'created_at'>) => {
        try {
            await api.createIncome(income);
            await refreshAllData();
            setIsAddDialogOpen(false);
        } catch (error) {
            console.error('Error adding income:', error);
        }
    };

    const handleAddSaving = async (saving: Omit<Saving, 'id' | 'category' | 'created_at'>) => {
        try {
            await api.createSaving(saving);
            await refreshAllData();
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
            await refreshAllData();
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



    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];


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
                    onNavigateToSection={handleNavigateToSection}
                    username={currentUser?.name || currentUser?.email || 'User'}
                    onLogout={handleLogout}
                />
                
                <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
                    
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
                                <Typography variant="h6" sx={{ mb: 2, color: isDarkMode ? '#ffffff' : '#333333', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Actions
                                </Typography>
                                <Box sx={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(5, 1fr)', 
                                    gap: 2,
                                    maxWidth: '1000px'
                                }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => setIsAddDialogOpen(true)}
                                        sx={{ 
                                            aspectRatio: '3/2',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem',
                                            gap: 0.5
                                        }}
                                    >
                                        <img 
                                            src="/Add record.png" 
                                            alt="Add Record" 
                                            style={{ width: '40px', height: '40px' }}
                                        />
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
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem',
                                                gap: 0.5
                                            }}
                                        >
                                            <img 
                                                src="/export (1).png" 
                                                alt="Export Data" 
                                                style={{ width: '40px', height: '40px' }}
                                            />
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
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem',
                                                gap: 0.5
                                            }}
                                        >
                                            <img 
                                                src="/import.png" 
                                                alt="Import Transactions" 
                                                style={{ width: '40px', height: '40px' }}
                                            />
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
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.875rem',
                                                    width: '100%',
                                                    gap: 0.5
                                                }}
                                            >
                                                <img 
                                                    src="/report.png" 
                                                    alt="Monthly Report" 
                                                    style={{ width: '40px', height: '40px' }}
                                                />
                                                {reportLoading ? 'Loading Report...' : 'Show Monthly Report'}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Button
                                        variant="contained"
                                        onClick={() => setOpenBudgetDialog(true)}
                                        color="primary"
                                        sx={{ 
                                            aspectRatio: '3/2',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem',
                                            gap: 0.5
                                        }}
                                    >
                                        <img 
                                            src="/budget (1).png" 
                                            alt="Budget" 
                                            style={{ width: '40px', height: '40px' }}
                                        />
                                        Budget
                                    </Button>
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
                        {/* Monthly Data Panel */}
                        <MonthlyDataPanel
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            onMonthChange={setSelectedMonth}
                            onYearChange={setSelectedYear}
                            availableMonths={availableMonths}
                            availableYears={availableYears}
                            refreshTrigger={refreshTrigger}
                            totals={totals}
                            dailyExpenses={dailyExpenses}
                            lineGraphLoading={lineGraphLoading}
                            lineGraphError={lineGraphError}
                            expenses={expenses}
                            incomes={incomes}
                            savings={savings}
                            selectedRecord={selectedRecord}
                            onSelectRecord={setSelectedRecord}
                            onDeleteClick={handleDeleteClick}
                            chartsRef={chartsRef}
                            expensesRef={expensesRef}
                        />

                        {/* Subscriptions Panel - Full Width */}
                        <Box ref={subscriptionsRef} sx={{ width: '100%', scrollMarginTop: '80px' }}>
                            <SubscriptionsPanel 
                                ref={subscriptionsPanelRef} 
                                onPaymentSuccess={refreshAllData}
                            />
                        </Box>

                        {/* Saving Goals Panel - Full Width */}
                        <Box ref={savingGoalsRef} sx={{ width: '100%', scrollMarginTop: '80px' }}>
                            <SavingGoalsPanel onDataChange={refreshAllData} />
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