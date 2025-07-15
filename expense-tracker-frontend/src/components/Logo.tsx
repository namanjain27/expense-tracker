import React, { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { ThemeContext } from './Dashboard';
import logo from '../assets/logo.png';
const Logo: React.FC = () => {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': {
                    opacity: 0.8
                },
                transition: 'opacity 0.2s ease'
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
            <img src={logo} alt="Logo" style={{ width: '60px', height: '60px' }} />
            {/* TrackX Text */}
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: isDarkMode ? '#ffffff' : '#000000',
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    letterSpacing: '0.5px',
                    userSelect: 'none'
                }}
            >
                TrackX
            </Typography>
        </Box>
    );
};

export default Logo;