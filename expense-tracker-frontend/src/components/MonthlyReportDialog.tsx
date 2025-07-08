import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, CircularProgress, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface MonthlyReportDialogProps {
  open: boolean;
  onClose: () => void;
  htmlContent: string | null;
  loading: boolean;
  error: string | null;
  onSendEmail: () => void;
  emailSending: boolean;
  emailSendSuccess: boolean;
}

const MonthlyReportDialog: React.FC<MonthlyReportDialogProps> = ({ open, onClose, htmlContent, loading, error, onSendEmail, emailSending, emailSendSuccess }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Monthly Report Preview
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading report...</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        )}
        {htmlContent && !loading && !error && (
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </Box>
        )}
        {!htmlContent && !loading && !error && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography color="text.secondary">No report available for the selected month/year.</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onSendEmail} color="primary" disabled={emailSending || !htmlContent}>
          {emailSending ? 'Sending...' : (emailSendSuccess ? 'Sent!' : 'Send as Email')}
        </Button>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MonthlyReportDialog; 