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
    RadioGroup,
    Radio,
    FormControl,
    FormLabel,
    InputLabel,
    Select,
    Typography,
    useTheme
} from '@mui/material';
import { Expense, CATEGORIES, IntentionType } from '../types/expense';
import AddSubscriptionDialog from './AddSubscriptionDialog';
import { ThemeContext } from './Dashboard';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AddExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (expense: Omit<Expense, 'id' | 'category'>) => void;
    onSubscriptionSuccess?: () => void;
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ open, onClose, onAdd, onSubscriptionSuccess }) => {
    const theme = useTheme();
    const { isDarkMode } = useContext(ThemeContext);
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
    const [name, setName] = useState('');
    const [date, setDate] = useState(formattedDate);
    const [categoryId, setCategoryId] = useState<number>(1);
    const [amount, setAmount] = useState('');
    const [intention, setIntention] = useState<IntentionType>('Need');
    const [isRecurring, setIsRecurring] = useState(false);
    const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);

    // Add prediction effect
    useEffect(() => {
        const predictCategory = async () => {
            if (name.trim()) {
                setIsPredicting(true);
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
                setIsPredicting(false);
            }
        };

        const timeoutId = setTimeout(predictCategory, 500); // Debounce for 500ms
        return () => clearTimeout(timeoutId);
    }, [name]);

    const resetForm = () => {
        setName('');
        setDate(formattedDate);
        setCategoryId(1);
        setAmount('');
        setIntention('Need');
        setIsRecurring(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isRecurring) {
            setShowSubscriptionDialog(true);
        } else {
            onAdd({
                name,
                date,
                category_id: categoryId,
                amount: parseFloat(amount),
                intention
            });
            resetForm();
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubscriptionSuccess = () => {
        setShowSubscriptionDialog(false);
        resetForm();
        onClose();
        if (onSubscriptionSuccess) {
            onSubscriptionSuccess();
        }
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
                        <Select
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
                    disabled={!date || !amount}
                >
                    Add Expense
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddExpenseDialog; 