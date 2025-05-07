import React, { useState } from 'react';
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
    FormLabel
} from '@mui/material';
import { Expense, CATEGORIES, IntentionType } from '../types/expense';
import AddSubscriptionDialog from './AddSubscriptionDialog';

interface AddExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (expense: Omit<Expense, 'id' | 'category'>) => void;
    onSubscriptionSuccess?: () => void;
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ open, onClose, onAdd, onSubscriptionSuccess }) => {
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
    const [date, setDate] = useState(formattedDate);
    const [categoryId, setCategoryId] = useState<number>(1);
    const [amount, setAmount] = useState('');
    const [intention, setIntention] = useState<IntentionType>('Need');
    const [isRecurring, setIsRecurring] = useState(false);
    const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

    const resetForm = () => {
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
        <>
            <Dialog open={open && !showSubscriptionDialog} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Expense</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            <TextField
                                select
                                label="Category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(parseInt(e.target.value))}
                                required
                            >
                                {Object.entries(CATEGORIES).map(([id, name]) => (
                                    <MenuItem key={id} value={id}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Intention</FormLabel>
                                <RadioGroup
                                    row
                                    value={intention}
                                    onChange={(e) => setIntention(e.target.value as IntentionType)}
                                >
                                    <FormControlLabel value="Need" control={<Radio />} label="Need" />
                                    <FormControlLabel value="Want" control={<Radio />} label="Want" />
                                    <FormControlLabel value="Saving" control={<Radio />} label="Saving" />
                                </RadioGroup>
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
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button 
                            type="submit" 
                            variant="contained"
                            disabled={!date || !amount}
                        >
                            Add
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {showSubscriptionDialog && (
                <AddSubscriptionDialog
                    open={showSubscriptionDialog}
                    onClose={() => setShowSubscriptionDialog(false)}
                    onSuccess={handleSubscriptionSuccess}
                    editData={null}
                    initialData={{
                        name: `${CATEGORIES[categoryId as 1 | 2 | 3 | 4 | 5 | 6]} Subscription`,
                        amount: parseFloat(amount),
                        category_id: categoryId,
                        intention,
                        effective_date: date,
                        subscription_period: { value: 1, unit: 'years' },
                        billing_period: { value: 1, unit: 'months' },
                        due_period: { value: 7, unit: 'days' }
                    }}
                />
            )}
        </>
    );
};

export default AddExpenseDialog; 