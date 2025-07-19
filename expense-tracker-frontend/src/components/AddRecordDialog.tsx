import React, { useState, useEffect, useContext } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    Typography,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { 
    RecordType, 
    Expense, 
    Income, 
    Saving, 
    IntentionType, 
    getCategoriesByType,
    EXPENSE_CATEGORIES 
} from '../types/records';
import { ThemeContext } from './Dashboard';
import { api } from '../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AddRecordDialogProps {
    open: boolean;
    onClose: () => void;
    onAddExpense: (expense: Omit<Expense, 'id' | 'category' | 'created_at'>) => Promise<void>;
    onAddIncome: (income: Omit<Income, 'id' | 'category' | 'created_at'>) => Promise<void>;
    onAddSaving: (saving: Omit<Saving, 'id' | 'category' | 'created_at'>) => Promise<void>;
    onSubscriptionSuccess?: () => void;
    selectedMonth: number;
    selectedYear: number;
    onConverttoSubscription: (expenseData: Omit<Expense, 'id' | 'category' | 'created_at'>) => void;
}

const AddRecordDialog: React.FC<AddRecordDialogProps> = ({ 
    open, 
    onClose, 
    onAddExpense,
    onAddIncome,
    onAddSaving,
    selectedMonth, 
    selectedYear, 
    onConverttoSubscription 
}) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [recordType, setRecordType] = useState<RecordType>('Expense');
    const [name, setName] = useState('');
    const [date, setDate] = useState<Date | null>(null);
    const [categoryId, setCategoryId] = useState<number>(1);
    const [amount, setAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [showDateWarning, setShowDateWarning] = useState(false);
    const [dateWarningMessage, setDateWarningMessage] = useState('');
    
    // Get categories for current record type
    const currentCategories = getCategoriesByType(recordType);
    
    // Reset category when record type changes
    useEffect(() => {
        setCategoryId(1);
    }, [recordType]);

    useEffect(() => {
        const predictCategory = async () => {
            if (name.trim() && recordType === 'Expense') {
                try {
                    const data = await api.predictCategory(name);
                    if (data.category) {
                        const categoryId = Object.entries(EXPENSE_CATEGORIES).find(
                            ([_, catName]) => catName === data.category
                        )?.[0];
                        if (categoryId) {
                            setCategoryId(parseInt(categoryId));
                        }
                    }
                } catch (error) {
                    console.error('Error predicting category:', error);
                }
            }
        };

        const timeoutId = setTimeout(predictCategory, 500); // Debounce for 500ms
        return () => clearTimeout(timeoutId);
    }, [name, recordType]);

    // Effect to show warning if record date is outside selected month/year
    useEffect(() => {
        if (date) {
            const recordMonth = date.getMonth() + 1; // Convert to 1-indexed for comparison
            const recordYear = date.getFullYear();

            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date

            if (date.getTime() > today.getTime()) {
                setDateWarningMessage("Future record date is not allowed.");
                setShowDateWarning(true);
            } else if (selectedMonth !== undefined && selectedYear !== undefined) {
                if (recordMonth !== selectedMonth || recordYear !== selectedYear) {
                    setDateWarningMessage(`Warning: Record date is not in the currently selected month (${selectedMonth}/${selectedYear}).`);
                    setShowDateWarning(true);
                } else {
                    setShowDateWarning(false);
                    setDateWarningMessage('');
                }
            } else {
                setShowDateWarning(false);
                setDateWarningMessage('');
            }
        } else {
            setShowDateWarning(false);
            setDateWarningMessage('');
        }
    }, [date, selectedMonth, selectedYear]);

    const resetForm = () => {
        setName('');
        setDate(new Date()); // Use current date in user's timezone
        setCategoryId(1);
        setAmount('');
        setIsRecurring(false);
    };

    // Set date to current date when dialog opens
    useEffect(() => {
        if (open) {
            setDate(new Date()); // Use current date in user's timezone
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Format date in user's local timezone to prevent timezone offset issues
        const formatDateForAPI = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const baseRecordData = {
            name,
            date: date ? formatDateForAPI(date) : "",
            category_id: categoryId,
            amount: parseFloat(amount),
        };

        try {
            if (recordType === 'Expense') {
                const expenseData = {
                    ...baseRecordData,
                    intention: 'Need' as IntentionType
                };

                if (isRecurring) {
                    onConverttoSubscription(expenseData);
                } else {
                    await onAddExpense(expenseData);
                }
            } else if (recordType === 'Income') {
                await onAddIncome(baseRecordData);
            } else if (recordType === 'Saving') {
                await onAddSaving(baseRecordData);
            }

            resetForm();
            onClose();
        } catch (error) {
            console.error('Error adding record:', error);
        }
    };

    const handleRecordTypeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newRecordType: RecordType | null,
    ) => {
        if (newRecordType !== null) {
            setRecordType(newRecordType);
        }
    };

    const isFormValid = () => {
        return (
            name.trim() !== '' &&
            amount !== '' &&
            date &&
            date.getTime() <= new Date(new Date().setHours(23, 59, 59, 999)).getTime()
        );
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                }
            }}
        >
            <DialogTitle sx={{ 
                color: isDarkMode ? '#ffffff' : undefined,
                borderBottom: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`
            }}>
                Add New Record
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Record Type Toggle */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <ToggleButtonGroup
                            value={recordType}
                            exclusive
                            onChange={handleRecordTypeChange}
                            aria-label="record type"
                            size="small"
                            sx={{
                                '& .MuiToggleButton-root': {
                                    color: isDarkMode ? '#b0b0b0' : undefined,
                                    borderColor: isDarkMode ? '#333333' : undefined,
                                    '&.Mui-selected': {
                                        backgroundColor: isDarkMode ? '#333333' : undefined,
                                        color: isDarkMode ? '#ffffff' : undefined,
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="Income" aria-label="income">
                                Income
                            </ToggleButton>
                            <ToggleButton value="Expense" aria-label="expense">
                                Expense
                            </ToggleButton>
                            <ToggleButton value="Saving" aria-label="saving">
                                Saving
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <TextField
                        label="Name (Optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        sx={{
                            '& .MuiInputLabel-root': {
                                color: isDarkMode ? '#b0b0b0' : undefined
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: isDarkMode ? '#333333' : undefined
                                },
                                '&:hover fieldset': {
                                    borderColor: isDarkMode ? '#666666' : undefined
                                }
                            }
                        }}
                    />
                    
                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                                setAmount(value);
                            }
                        }}
                        fullWidth
                        required
                        inputProps={{ min: 0, step: "1" }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1, color: isDarkMode ? '#b0b0b0' : undefined }}>₹</Typography>
                        }}
                        sx={{
                            '& .MuiInputLabel-root': {
                                color: isDarkMode ? '#b0b0b0' : undefined
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: isDarkMode ? '#333333' : undefined
                                },
                                '&:hover fieldset': {
                                    borderColor: isDarkMode ? '#666666' : undefined
                                }
                            }
                        }}
                    />
                    
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Date"
                            value={date}
                            onChange={(newDate) => setDate(newDate)}
                            format="dd/MM/yyyy"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: isDarkMode ? '#b0b0b0' : undefined
                                },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: isDarkMode ? '#333333' : undefined
                                    },
                                    '&:hover fieldset': {
                                        borderColor: isDarkMode ? '#666666' : undefined
                                    }
                                }
                            }}
                        />
                    </LocalizationProvider>
                    
                    {showDateWarning && (
                        <Typography variant="caption" color="error" sx={{ mt: -1 }}>
                            {dateWarningMessage}
                        </Typography>
                    )}
                    
                    <FormControl fullWidth required>
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : undefined }}>Category</InputLabel>
                        <Select
                            value={categoryId}
                            label="Category"
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : undefined
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#666666' : undefined
                                }
                            }}
                        >
                            {Object.entries(currentCategories).map(([id, name]) => (
                                <MenuItem key={id} value={Number(id)}>
                                    {name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    
                    {/* Show recurring checkbox only for expenses */}
                    {recordType === 'Expense' && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                />
                            }
                            label="Is this a recurring expense?"
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ 
                borderTop: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`,
                p: 2
            }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    disabled={!isFormValid()}
                >
                    Add {recordType}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddRecordDialog;