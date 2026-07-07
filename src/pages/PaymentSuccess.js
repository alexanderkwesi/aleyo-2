// PaymentSuccess.js
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Paper, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
//const REACT_APP_API_URL = "https://aleyo-2-six.vercel.app";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setLoading(false);
      setMessage('No payment session found');
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/payment/verify?session_id=${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setMessage(`Payment successful! ${data.credits_added} credits added to your account.`);
      } else {
        const error = await response.json();
        setSuccess(false);
        setMessage(error.detail || 'Payment verification failed');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Error verifying payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#4F6EF7' }} />
          <Typography sx={{ mt: 2, color: 'white' }}>Verifying your payment...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: 4,
          background: '#0A0F1A',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
      >
        {success ? (
          <>
            <CheckCircle sx={{ fontSize: 80, color: '#3ED67C', mb: 2 }} />
            <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
              Payment Successful! 🎉
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              sx={{
                background: 'linear-gradient(135deg, #4F6EF7 0%, #2DBCB6 50%, #3ED67C 100%)',
                px: 4,
                py: 1.5,
              }}
            >
              Go to Dashboard
            </Button>
          </>
        ) : (
          <>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Button
              variant="outlined"
              onClick={() => navigate('/pricing')}
              sx={{
                borderColor: '#4F6EF7',
                color: '#4F6EF7',
                '&:hover': { borderColor: '#2DBCB6' },
              }}
            >
              Back to Pricing
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;
