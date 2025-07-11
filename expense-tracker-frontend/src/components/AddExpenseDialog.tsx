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
    Typography
} from '@mui/material';
import { Expense, CATEGORIES, IntentionType } from '../types/expense';
import { ThemeContext } from './Dashboard';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AddExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (expense: Omit<Expense, 'id' | 'category'>) => Promise<void>; // Updated to return Promise<void>
    onSubscriptionSuccess?: () => void;
    selectedMonth: number; // New prop
    selectedYear: number; // New prop
    onConverttoSubscription: (expenseData: Omit<Expense, 'id' | 'category'>) => void; // New prop
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ open, onClose, onAdd, selectedMonth, selectedYear, onConverttoSubscription }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const today = new Date();
    // const formattedDate = today.getFullYear() + '-' + 
    //     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    //     String(today.getDate()).padStart(2, '0');
    const [name, setName] = useState('');
    // const [date, setDate] = useState<Date | null>(new Date());
    const [date, setDate] = useState<Date | null>(today);

    // const [date, setDate] = useState(formattedDate);
    const [categoryId, setCategoryId] = useState<number>(1);
    const [amount, setAmount] = useState('');
    const [intention, setIntention] = useState<IntentionType>('Need');
    const [isRecurring, setIsRecurring] = useState(false);
    const [showDateWarning, setShowDateWarning] = useState(false); // New state for warning
    const [dateWarningMessage, setDateWarningMessage] = useState(''); // New state for warning message
    
    // const [isPredicting, setIsPredicting] = useState(false);

    // Add prediction effect
    useEffect(() => {
        const predictCategory = async () => {
            if (name.trim()) {
                // setIsPredicting(true);
                try {
                    const response = await fetch('http://localhost:8000/predict-category', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name }),
                    });
                    const data = await response.json();
                    if (data.category) {
                        // Find category ID from name
                        const categoryId = Object.entries(CATEGORIES).find(
                            ([_, catName]) => catName === data.category
                        )?.[0];
                        if (categoryId) {
                            setCategoryId(parseInt(categoryId));
                        }
                    }
                } catch (error) {
                    console.error('Error predicting category:', error);
                }
                // setIsPredicting(false);
            }
        };

        const timeoutId = setTimeout(predictCategory, 500); // Debounce for 500ms
        return () => clearTimeout(timeoutId);
    }, [name]);

    // Effect to show warning if expense date is outside selected month/year
    useEffect(() => {
        if (date) {
            const expenseMonth = date.getMonth() + 1; // Convert to 1-indexed for comparison
            const expenseYear = date.getFullYear();

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today to start of day

            if (date.getTime() > today.getTime()) {
                setDateWarningMessage("Future expense date is not allowed.");
                setShowDateWarning(true);
            } else if (selectedMonth !== undefined && selectedYear !== undefined) {
                if (expenseMonth !== selectedMonth || expenseYear !== selectedYear) {
                    setDateWarningMessage(`Warning: Expense date is not in the currently selected month (${selectedMonth}/${selectedYear}).`);
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
        setDate(new Date()); // ← directly reset to today
        setCategoryId(1);
        setAmount('');
        setIntention('Need');
        setIsRecurring(false);
      };
    // const resetForm = () => {
    //     setName('');
    //     setDate(formattedDate);
    //     setCategoryId(1);
    //     setAmount('');
    //     setIntention('Need');
    //     setIsRecurring(false);
    // };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const commonExpenseData = {
            name,
            date: date?.toISOString().split("T")[0] ?? "",
            category_id: categoryId,
            amount: parseFloat(amount),
            intention
        };

        if (isRecurring) {
            onConverttoSubscription(commonExpenseData);
            resetForm();
            onClose();
        } else {
            onAdd(commonExpenseData);
            resetForm();
        }
    };

    // const handleClose = () => {
    //     resetForm();
    //     onClose();
    // };

    // const handleSubscriptionSuccess = () => {
    //     setShowSubscriptionDialog(false);
    //     resetForm();
    //     onClose();
    //     if (onSubscriptionSuccess) {
    //         onSubscriptionSuccess();
    //     }
    // };

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
                Add New Expense
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
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
                    {showDateWarning && ( // Conditionally render warning message
                        <Typography variant="caption" color="error" sx={{ mt: -1 }}>
                            {dateWarningMessage}
                        </Typography>
                    )}

                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        required
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
                    <FormControl fullWidth required>
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : undefined }}>Category</InputLabel>
                        {/* <Select
                            value={categoryId}
                            label="Category"
                            onChange={(e) => setCategoryId(parseInt(e.target.value))}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : undefined
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#666666' : undefined
                                }
                            }}
                        >
                            {Object.entries(CATEGORIES).map(([id, name]) => (
                                <MenuItem key={id} value={id}>
                                    {name}
                                </MenuItem>
                            ))}
                        </Select> */}
                        <Select
                            value={categoryId}
                            label="Category"
                            onChange={(e) => setCategoryId(Number(e.target.value))} // Ensure number
                            >
                            {Object.entries(CATEGORIES).map(([id, name]) => (
                                <MenuItem key={id} value={Number(id)}>
                                {name}
                                </MenuItem>
                            ))}
                        </Select>

                    </FormControl>
                    <FormControl fullWidth required>
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : undefined }}>Intention</InputLabel>
                        <Select
                            value={intention}
                            label="Intention"
                            onChange={(e) => setIntention(e.target.value as IntentionType)}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : undefined
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#666666' : undefined
                                }
                            }}
                        >
                            {['Need', 'Want', 'Saving'].map((int) => (
                                <MenuItem key={int} value={int}>
                                    {int}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                        }
                        label="is this a recurring expense?"
                    />
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
                    disabled={!date || !amount || date.getTime() > today.getTime()} // Disable if date is in the future
                >
                    Add Expense
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddExpenseDialog; 