import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Button, Box, Tooltip, IconButton } from '@mui/material';
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

const SubscriptionsPanel = forwardRef<SubscriptionsPanelRef>((_, ref) => {
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

  const handlePay = async (subscription: Subscription) => {
    try {
      // Create a new expense from the subscription
      await api.createExpense({
        date: new Date().toISOString().split('T')[0],
        category_id: subscription.category_id,
        amount: subscription.amount,
        intention: subscription.intention
      });
      
      // Update the subscription's effective date
      await api.updateSubscriptionEffectiveDate(subscription.id);
      
      // Reload the page to refresh all components
      window.location.reload();
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
        fetchSubscriptions(); // Refresh the list
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
          <Typography variant="h5" component="div">
            Active Subscriptions
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Subscription
          </Button>
        </Box>
        <List>
          {subscriptions.map((subscription, index) => (
            <React.Fragment key={subscription.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{subscription.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
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
                        <Tooltip title={getPaymentTooltip(subscription)}>
                          <span>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handlePay(subscription)}
                              disabled={isPaymentDisabled(subscription)}
                            >
                              Pay Now
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {formatAmount(subscription.amount)} / {formatPeriod(subscription.billing_period)}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Category: {subscription.category}
                        <br />
                        Intention: {subscription.intention}
                        <br />
                        Billing Date: {format(new Date(subscription.effective_date), 'MMM dd, yyyy')}
                        <br />
                        Due Period: {formatPeriod(subscription.due_period)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < subscriptions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {subscriptions.length === 0 && (
            <ListItem>
              <ListItemText primary="No active subscriptions" />
            </ListItem>
          )}
        </List>
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