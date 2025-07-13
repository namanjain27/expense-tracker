import React, { useState, useContext } from 'react';
import {
    Box,
    Button,
    Menu,
    MenuItem,
    Typography,
    Divider,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    ArrowDropDown,
    AccountCircle,
    Logout,
    Person
} from '@mui/icons-material';
import { ThemeContext } from './Dashboard';

interface ProfileDropdownProps {
    username?: string;
    onLogout?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
    username = "User", // Default fallback
    onLogout
}) => {
    const { isDarkMode } = useContext(ThemeContext);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        if (onLogout) {
            onLogout();
        } else {
            // Default logout behavior
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    return (
        <Box>
            <Button
                onClick={handleClick}
                sx={{
                    color: isDarkMode ? '#ffffff' : '#000000',
                    textTransform: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    minWidth: 'auto',
                    '&:hover': {
                        backgroundColor: isDarkMode 
                            ? 'rgba(255,255,255,0.08)' 
                            : 'rgba(0,0,0,0.04)'
                    },
                    transition: 'all 0.2s ease'
                }}
                endIcon={
                    <ArrowDropDown 
                        sx={{ 
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        }} 
                    />
                }
                startIcon={
                    <AccountCircle sx={{ 
                        color: isDarkMode ? '#b0b0b0' : '#666666' 
                    }} />
                }
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        mx: 0.5
                    }}
                >
                    Hello, {username}
                </Typography>
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`,
                        borderRadius: '8px',
                        boxShadow: isDarkMode
                            ? '0 4px 20px rgba(0,0,0,0.3)'
                            : '0 4px 20px rgba(0,0,0,0.1)',
                        minWidth: '200px',
                        mt: 1
                    }
                }}
            >
                {/* User Info Section */}
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: isDarkMode ? '#ffffff' : '#000000',
                            fontWeight: 600
                        }}
                    >
                        {username}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: isDarkMode ? '#b0b0b0' : '#666666'
                        }}
                    >
                        Manage your account
                    </Typography>
                </Box>

                <Divider sx={{ 
                    borderColor: isDarkMode ? '#333333' : '#e0e0e0' 
                }} />

                {/* Profile Menu Item (for future expansion) */}
                <MenuItem
                    onClick={handleClose}
                    sx={{
                        color: isDarkMode ? '#ffffff' : '#000000',
                        '&:hover': {
                            backgroundColor: isDarkMode 
                                ? 'rgba(255,255,255,0.08)' 
                                : 'rgba(0,0,0,0.04)'
                        },
                        py: 1.5
                    }}
                >
                    <ListItemIcon>
                        <Person sx={{ 
                            color: isDarkMode ? '#b0b0b0' : '#666666',
                            fontSize: '20px'
                        }} />
                    </ListItemIcon>
                    <ListItemText>
                        <Typography variant="body2">
                            Profile Settings
                        </Typography>
                    </ListItemText>
                </MenuItem>

                <Divider sx={{ 
                    borderColor: isDarkMode ? '#333333' : '#e0e0e0' 
                }} />

                {/* Logout Menu Item */}
                <MenuItem
                    onClick={handleLogout}
                    sx={{
                        color: '#f44336', // Red color for logout
                        '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.08)'
                        },
                        py: 1.5
                    }}
                >
                    <ListItemIcon>
                        <Logout sx={{ 
                            color: '#f44336',
                            fontSize: '20px'
                        }} />
                    </ListItemIcon>
                    <ListItemText>
                        <Typography variant="body2" sx={{ color: '#f44336' }}>
                            Logout
                        </Typography>
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default ProfileDropdown;