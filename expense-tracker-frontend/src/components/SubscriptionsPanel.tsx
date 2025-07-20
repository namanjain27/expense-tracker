import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, Typography, Button, Box, Tooltip, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { api } from '../services/api';
import { Subscription } from '../types/subscription';
import AddSubscriptionDialog from './AddSubscriptionDialog';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Period {
  value: number;
  unit: string;
}

export interface SubscriptionsPanelRef {
  fetchSubscriptions: () => void;
}

interface SubscriptionsPanelProps {
  onPaymentSuccess?: () => void;
}

const SubscriptionsPanel = forwardRef<SubscriptionsPanelRef, SubscriptionsPanelProps>(({ onPaymentSuccess }, ref) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchSubscriptions = async () => {
    try {
      const data = await api.getRecurringExpenses();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchSubscriptions
  }));

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Format date in user's local timezone to prevent timezone offset issues
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePayClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setPaymentDate(new Date());
    setPaymentAmount(subscription.amount.toString());
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedSubscription || !paymentDate || !paymentAmount) return;
    
    try {
      await api.createExpense({
        date: formatDateForAPI(paymentDate),
        category_id: selectedSubscription.category_id,
        amount: parseFloat(paymentAmount),
        intention: selectedSubscription.intention,
        name: selectedSubscription.name
      });
      
      await api.updateSubscriptionEffectiveDate(selectedSubscription.id);
      fetchSubscriptions();
      setPaymentDialogOpen(false);
      setSelectedSubscription(null);
      // Notify parent component to refresh charts and transaction list
      onPaymentSuccess?.();
    } catch (error) {
      console.error('Error paying subscription:', error);
    }
  };

  const handlePaymentCancel = () => {
    setPaymentDialogOpen(false);
    setSelectedSubscription(null);
    setPaymentDate(new Date());
    setPaymentAmount('');
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingSubscription(null);
  };

  const handleDelete = async (subscription: Subscription) => {
    if (window.confirm(`Are you sure you want to delete the subscription "${subscription.name}"?`)) {
      try {
        await api.deleteRecurringExpense(subscription.id);
        fetchSubscriptions();
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPeriod = (period: Period) => {
    return `${period.value} ${period.unit}`;
  };

  // Helper function to add period to date
  const addPeriodToDate = (date: Date, period: Period): Date => {
    const newDate = new Date(date);
    if (period.unit === 'days') {
      newDate.setDate(newDate.getDate() + period.value);
    } else if (period.unit === 'weeks') {
      newDate.setDate(newDate.getDate() + (period.value * 7));
    } else if (period.unit === 'months') {
      newDate.setMonth(newDate.getMonth() + period.value);
    } else if (period.unit === 'years') {
      newDate.setFullYear(newDate.getFullYear() + period.value);
    }
    return newDate;
  };

  const isOverdue = (subscription: Subscription) => {
    const billingDate = new Date(subscription.effective_date);
    const dueDate = addPeriodToDate(billingDate, subscription.due_period);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    dueDate.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  const isPaymentDisabled = (subscription: Subscription) => {
    const effectiveDate = new Date(subscription.effective_date);
    const today = new Date();
    return effectiveDate > today;
  };

  const getSubscriptionStatus = (subscription: Subscription) => {
    if (isOverdue(subscription)) {
      return 'overdue';
    }
    if (isPaymentDisabled(subscription)) {
      return 'paid';
    }
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'paid': return 'success';
      case 'active': return 'default';
      default: return 'default';
    }
  };

  const getPaymentTooltip = (subscription: Subscription) => {
    if (isPaymentDisabled(subscription)) {
      return `payment done for this billing cycle`;
    }
    return 'Make Payment';
  };

  const getNextBillingDate = (subscription: Subscription): Date => {
    const currentBillingDate = new Date(subscription.effective_date);
    return addPeriodToDate(currentBillingDate, subscription.billing_period);
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                        src="subscriptions.png" 
                        alt="Subscriptions" 
                        style={{ width: '50px', height: '50px' }}
                    /> Recurring TransX and Subscriptions
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Recurring TransX
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto', 
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }}>
          {subscriptions.map((subscription) => (
            <Box 
              key={subscription.id}
              sx={{ 
                width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' },
                minWidth: 0
              }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Typography variant="h6" component="div">
                        {subscription.name}
                      </Typography>
                      <Chip 
                        label={getSubscriptionStatus(subscription)} 
                        color={getStatusColor(getSubscriptionStatus(subscription)) as any} 
                        size="small" 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(subscription)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(subscription)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h5" color="primary">
                        {formatAmount(subscription.amount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / {formatPeriod(subscription.billing_period)}
                      </Typography>
                    </Box>
                    <Tooltip title={getPaymentTooltip(subscription)}>
                      <span>
                        <Button
                          variant="contained"
                          color={isOverdue(subscription) ? "error" : "primary"}
                          size="small"
                          onClick={() => handlePayClick(subscription)}
                          disabled={isPaymentDisabled(subscription)}
                          sx={{ minWidth: '80px' }}
                        >
                          Pay
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Category: {subscription.category} [{subscription.intention}]
                    </Typography>
                    <Typography variant="body2">
                      Billing Date: {format(new Date(subscription.effective_date), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="body2">
                      Due Period: {formatPeriod(subscription.due_period)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
          {subscriptions.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Typography variant="body1">
                No active subscriptions
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <AddSubscriptionDialog
        open={isAddDialogOpen}
        onClose={handleDialogClose}
        onSuccess={fetchSubscriptions}
        editData={editingSubscription}
      />

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handlePaymentCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          Payment for {selectedSubscription?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={paymentDate}
                onChange={(newDate) => setPaymentDate(newDate)}
                format="dd/MM/yyyy"
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
            
            <TextField
              label="Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
              }}
            />
            
            <TextField
              label="Next Billing Date"
              value={selectedSubscription ? format(getNextBillingDate(selectedSubscription), 'MMM dd, yyyy') : ''}
              fullWidth
              disabled
              helperText="This is calculated automatically based on the current billing period"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePaymentCancel} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentConfirm} 
            variant="contained" 
            color="primary"
            disabled={!paymentDate || !paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            Pay ₹{paymentAmount || '0'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
});

export default SubscriptionsPanel; 