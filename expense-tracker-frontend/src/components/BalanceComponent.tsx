import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Paper
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { ThemeContext } from './Dashboard';
import { api, AccountBalance } from '../services/api';

interface Account {
    id: number;
    balance: number;
    created_at: string;
    modified_at: string;
}

interface BalanceComponentProps {
    refreshTrigger: number;
}

const BalanceComponent: React.FC<BalanceComponentProps> = ({ refreshTrigger }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [account, setAccount] = useState<Account | null>(null);
    const [balanceData, setBalanceData] = useState<AccountBalance | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newBalance, setNewBalance] = useState<string>('');
    const [isHovered, setIsHovered] = useState(false);

    const fetchAccountData = async () => {
        try {
            const accounts = await api.getAccounts();
            if (accounts.length > 0) {
                const userAccount = accounts[0];
                setAccount(userAccount);
                
                // Fetch balance data from new API
                const balance = await api.getAccountBalance();
                setBalanceData(balance);
            }
        } catch (error) {
            console.error('Error fetching account data:', error);
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [refreshTrigger]);

    const handleEditClick = () => {
        if (account) {
            setNewBalance(account.balance.toString());
            setIsEditDialogOpen(true);
        }
    };

    const handleSaveBalance = async () => {
        if (account && newBalance) {
            try {
                const updatedAccount = await api.updateAccountBalance(account.id, {
                    balance: parseFloat(newBalance)
                });
                setAccount(updatedAccount);
                
                // Fetch updated balance data
                const balance = await api.getAccountBalance();
                setBalanceData(balance);
                
                setIsEditDialogOpen(false);
                setNewBalance('');
            } catch (error) {
                console.error('Error updating balance:', error);
            }
        }
    };

    const handleCreateAccount = async () => {
        try {
            const newAccount = await api.createAccount({
                balance: 0
            });
            setAccount(newAccount);
            
            // Fetch balance data for new account
            const balance = await api.getAccountBalance();
            setBalanceData(balance);
        } catch (error) {
            console.error('Error creating account:', error);
        }
    };

    // If no account exists, show create account option
    if (!account) {
        return (
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDarkMode 
                        ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                    border: `2px solid ${isDarkMode ? '#444444' : '#cccccc'}`,
                    minWidth: 280,
                    textAlign: 'center'
                }}
            >
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: isDarkMode ? '#ffffff' : '#333333',
                        mb: 2
                    }}
                >
                    No Account Found
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={handleCreateAccount}
                    sx={{ mt: 1 }}
                >
                    Create Account
                </Button>
            </Paper>
        );
    }

    return (
        <>
            <Paper
                elevation={3}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDarkMode 
                        ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                    border: `2px solid ${isDarkMode ? '#444444' : '#cccccc'}`,
                    minWidth: 280,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDarkMode 
                            ? '0 8px 25px rgba(255,255,255,0.1)' 
                            : '0 8px 25px rgba(0,0,0,0.15)'
                    }
                }}
                onClick={handleEditClick}
            >
                <Box sx={{ position: 'relative' }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: isDarkMode ? '#b0b0b0' : '#666666',
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    ><img 
                    src="balance.png" 
                    alt="Monthly Overview" 
                    style={{ width: '50px', height: '50px'}}
                    />
                        Total Balance
                    </Typography>
                    
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            color: isDarkMode ? '#ffffff' : '#333333',
                            fontSize: '2.2rem',
                            fontWeight: 'bold',
                            mb: 1
                        }}
                    >
                        Real: ₹{balanceData?.real_balance.toLocaleString() || '0'}
                    </Typography>
                    
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: isDarkMode ? '#888888' : '#777777',
                            fontSize: '1rem',
                            fontWeight: 500
                        }}
                    >
                        Apparent: ₹{balanceData?.apparent_balance.toLocaleString() || '0'}
                    </Typography>

                    {/* Edit Icon */}
                    {isHovered && (
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: isDarkMode ? '#444444' : '#ffffff',
                                color: isDarkMode ? '#ffffff' : '#333333',
                                '&:hover': {
                                    backgroundColor: isDarkMode ? '#555555' : '#f5f5f5',
                                },
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                width: 32,
                                height: 32
                            }}
                            size="small"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Paper>

            {/* Edit Balance Dialog */}
            <Dialog 
                open={isEditDialogOpen} 
                onClose={() => setIsEditDialogOpen(false)}
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
                    Update Account Balance
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField
                        label="Account Balance"
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        fullWidth
                        required
                        inputProps={{ min: 0, step: "0.01" }}
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
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            mt: 1, 
                            display: 'block',
                            color: isDarkMode ? '#888888' : '#666666'
                        }}
                    >
                        This will update your base account balance. The apparent balance will include transactions after this update, and the real balance will show your available funds (excluding money locked in saving goals).
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ 
                    borderTop: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`,
                    p: 2
                }}>
                    <Button onClick={() => setIsEditDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveBalance} 
                        variant="contained" 
                        color="primary"
                        disabled={!newBalance || parseFloat(newBalance) < 0}
                    >
                        Update Balance
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BalanceComponent;