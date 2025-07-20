import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, Typography, Button, Box, Tooltip, IconButton } from '@mui/material';
import { format } from 'date-fns';
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

  const handlePay = async (subscription: Subscription) => {
    try {
      await api.createExpense({
        date: formatDateForAPI(new Date()),
        category_id: subscription.category_id,
        amount: subscription.amount,
        intention: subscription.intention,
        name: subscription.name
      });
      
      await api.updateSubscriptionEffectiveDate(subscription.id);
      fetchSubscriptions();
      // Notify parent component to refresh charts and transaction list
      onPaymentSuccess?.();
    } catch (error) {
      console.error('Error paying subscription:', error);
    }
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

  const isPaymentDisabled = (subscription: Subscription) => {
    const effectiveDate = new Date(subscription.effective_date);
    const today = new Date();
    return effectiveDate > today;
  };

  const getPaymentTooltip = (subscription: Subscription) => {
    if (isPaymentDisabled(subscription)) {
      return `payment done for this billing cycle`;
    }
    return 'Pay Now';
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
                    /> Recurring Transactions and Subscriptions
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Subscription
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
                    <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                      {subscription.name}
                    </Typography>
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
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                    <Typography variant="h5" color="primary">
                      {formatAmount(subscription.amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / {formatPeriod(subscription.billing_period)}
                    </Typography>
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
                  
                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Tooltip title={getPaymentTooltip(subscription)}>
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handlePay(subscription)}
                          disabled={isPaymentDisabled(subscription)}
                        >
                          Pay Now
                        </Button>
                      </span>
                    </Tooltip>
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
    </Card>
  );
});

export default SubscriptionsPanel; 