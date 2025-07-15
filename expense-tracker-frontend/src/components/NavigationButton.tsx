import React, { useContext } from 'react';
import { Button } from '@mui/material';
import { ThemeContext } from './Dashboard';

interface NavigationButtonProps {
    label: string;
    onClick: () => void;
    isActive?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
    label,
    onClick,
    isActive = false
}) => {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <Button
            onClick={onClick}
            sx={{
                color: isActive 
                    ? (isDarkMode ? '#4CAF50' : '#2196F3')
                    : (isDarkMode ? '#b0b0b0' : '#666666'),
                textTransform: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                minWidth: 'auto',
                position: 'relative',
                '&:hover': {
                    backgroundColor: isDarkMode 
                        ? 'rgba(255,255,255,0.08)' 
                        : 'rgba(0,0,0,0.04)',
                    color: isDarkMode ? '#ffffff' : '#000000'
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isActive ? '80%' : '0%',
                    height: '2px',
                    backgroundColor: isDarkMode ? '#4CAF50' : '#2196F3',
                    borderRadius: '1px',
                    transition: 'width 0.3s ease'
                },
                transition: 'all 0.2s ease'
            }}
        >
            {label}
        </Button>
    );
};

export default NavigationButton;