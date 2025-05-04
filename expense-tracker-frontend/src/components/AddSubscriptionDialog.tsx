import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  SelectChangeEvent
} from '@mui/material';
import { api } from '../services/api';
import { CATEGORIES } from '../types/expense';

interface Period {
  value: number;
  unit: string;
}

interface FormData {
  name: string;
  amount: string;
  category_id: string;
  subscription_period: Period;
  effective_date: string;
  billing_period: Period;
  due_period: Period;
}

interface AddSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

const PERIOD_UNITS = ['days', 'months', 'years'];
const PERIOD_VALUES = Array.from({ length: 30 }, (_, i) => i + 1);
const DEFAULT_PERIOD = { value: 1, unit: 'years' };

const AddSubscriptionDialog: React.FC<AddSubscriptionDialogProps> = ({ open, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    amount: '',
    category_id: '',
    subscription_period: DEFAULT_PERIOD,
    effective_date: new Date().toISOString().split('T')[0],
    billing_period: DEFAULT_PERIOD,
    due_period: DEFAULT_PERIOD
  });

  React.useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        amount: editData.amount.toString(),
        category_id: editData.category_id.toString(),
        subscription_period: editData.subscription_period,
        effective_date: editData.effective_date,
        billing_period: editData.billing_period,
        due_period: editData.due_period
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePeriodChange = (field: keyof FormData, type: 'value' | 'unit') => (e: SelectChangeEvent<string>) => {
    const value = type === 'value' ? parseInt(e.target.value) : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field] as Period,
        [type]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id)
      };

      if (editData) {
        await api.updateRecurringExpense(editData.id, submitData);
      } else {
        await api.createRecurringExpense(submitData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editData ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            required
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category_id"
              value={formData.category_id}
              onChange={handleSelectChange}
              label="Category"
              required
            >
              {Object.entries(CATEGORIES).map(([id, name]) => (
                <MenuItem key={id} value={id}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Effective Date"
            name="effective_date"
            type="date"
            value={formData.effective_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          
          {/* Subscription Period */}
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Subscription Period</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Value</InputLabel>
                <Select
                  value={formData.subscription_period.value.toString()}
                  onChange={handlePeriodChange('subscription_period', 'value')}
                  label="Value"
                  required
                >
                  {PERIOD_VALUES.map(value => (
                    <MenuItem key={value} value={value}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.subscription_period.unit}
                  onChange={handlePeriodChange('subscription_period', 'unit')}
                  label="Unit"
                  required
                >
                  {PERIOD_UNITS.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Billing Period */}
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Billing Period</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Value</InputLabel>
                <Select
                  value={formData.billing_period.value.toString()}
                  onChange={handlePeriodChange('billing_period', 'value')}
                  label="Value"
                  required
                >
                  {PERIOD_VALUES.map(value => (
                    <MenuItem key={value} value={value}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.billing_period.unit}
                  onChange={handlePeriodChange('billing_period', 'unit')}
                  label="Unit"
                  required
                >
                  {PERIOD_UNITS.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Due Period */}
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Due Period</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Value</InputLabel>
                <Select
                  value={formData.due_period.value.toString()}
                  onChange={handlePeriodChange('due_period', 'value')}
                  label="Value"
                  required
                >
                  {PERIOD_VALUES.map(value => (
                    <MenuItem key={value} value={value}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.due_period.unit}
                  onChange={handlePeriodChange('due_period', 'unit')}
                  label="Unit"
                  required
                >
                  {PERIOD_UNITS.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {editData ? 'Update' : 'Add'} Subscription
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSubscriptionDialog; 