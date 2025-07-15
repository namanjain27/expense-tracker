import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid
} from '@mui/material';

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

interface TransactionSummaryDialogProps {
    open: boolean;
    onClose: () => void;
    summary: TransactionSummaryData | null;
}

const TransactionSummaryDialog: React.FC<TransactionSummaryDialogProps> = ({ open, onClose, summary }) => {
    if (!summary) {
        return null;
    }

    const {
        data,
        total_amount_withdrawn,
        total_amount_deposited,
        net_monthly_expenditure,
        total_transcations
    } = summary;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Transaction Summary</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Total Withdrawn</Typography>
                                <Typography variant="h6" color="error">₹{total_amount_withdrawn.toFixed(2)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Total Deposited</Typography>
                                <Typography variant="h6" color="primary">₹{total_amount_deposited.toFixed(2)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Net Expenditure</Typography>
                                <Typography variant="h6">₹{net_monthly_expenditure.toFixed(2)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">Total Transactions</Typography>
                                <Typography variant="h6">{total_transcations}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Withdrawal</TableCell>
                                <TableCell align="right">Deposit</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((transaction, index) => (
                                <TableRow key={index}>
                                    <TableCell>{transaction.Date}</TableCell>
                                    <TableCell>{transaction.Description}</TableCell>
                                    <TableCell align="right">{transaction.Withdrawal > 0 ? `₹${transaction.Withdrawal.toFixed(2)}` : '-'}</TableCell>
                                    <TableCell align="right">{transaction.Deposit > 0 ? `₹${transaction.Deposit.toFixed(2)}` : '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TransactionSummaryDialog; 