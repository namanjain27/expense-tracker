import React, { useContext } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Box, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    IconButton 
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeContext } from './Dashboard';
import Logo from './Logo';
import NavigationButton from './NavigationButton';
import ProfileDropdown from './ProfileDropdown';

interface NavigationBarProps {
    selectedMonth: number;
    selectedYear: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    availableMonths: string[];
    availableYears: number[];
    onNavigateToSection: (sectionId: string) => void;
    username?: string;
    onLogout?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
    availableMonths,
    availableYears,
    onNavigateToSection,
    username,
    onLogout
}) => {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    const navigationItems = [
        { id: 'actions', label: 'Actions' },
        { id: 'monthly-expenses', label: 'Transactions' },
        { id: 'subscriptions', label: 'Subscriptions' },
        { id: 'saving-goals', label: 'Saving Goals' }
    ];

    return (
        <AppBar 
            position="sticky" 
            sx={{ 
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                borderBottom: `1px solid ${isDarkMode ? '#333333' : '#e0e0e0'}`,
                boxShadow: isDarkMode 
                    ? '0 2px 4px rgba(255,255,255,0.1)' 
                    : '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1100
            }}
        >
            <Toolbar sx={{ 
                justifyContent: 'space-between', 
                minHeight: '64px !important',
                px: { xs: 2, sm: 3 }
            }}>
                {/* Left Section: Logo + Navigation Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Logo />
                    
                    <Box sx={{ 
                        display: { xs: 'none', md: 'flex' }, 
                        gap: 1 
                    }}>
                        {navigationItems.map((item) => (
                            <NavigationButton
                                key={item.id}
                                label={item.label}
                                onClick={() => onNavigateToSection(item.id)}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Right Section: Month/Year Selectors + Theme Toggle + Profile */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Month Selector */}
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                            Month
                        </InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => onMonthChange(Number(e.target.value))}
                            sx={{
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : '#e0e0e0',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#555555' : '#cccccc',
                                },
                                '& .MuiSvgIcon-root': {
                                    color: isDarkMode ? '#ffffff' : '#000000',
                                }
                            }}
                        >
                            {availableMonths.map((month, index) => (
                                <MenuItem key={month} value={index + 1}>
                                    {month}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Year Selector */}
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel sx={{ color: isDarkMode ? '#b0b0b0' : '#666666' }}>
                            Year
                        </InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => onYearChange(Number(e.target.value))}
                            sx={{
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#333333' : '#e0e0e0',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDarkMode ? '#555555' : '#cccccc',
                                },
                                '& .MuiSvgIcon-root': {
                                    color: isDarkMode ? '#ffffff' : '#000000',
                                }
                            }}
                        >
                            {availableYears.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Theme Toggle */}
                    <IconButton 
                        onClick={toggleTheme} 
                        sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                                backgroundColor: isDarkMode 
                                    ? 'rgba(255,255,255,0.08)' 
                                    : 'rgba(0,0,0,0.04)'
                            }
                        }}
                    >
                        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>

                    {/* Profile Dropdown */}
                    <ProfileDropdown username={username} onLogout={onLogout} />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default NavigationBar;