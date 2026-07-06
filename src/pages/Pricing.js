// Pricing.js - Complete fixed version with payment integration
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  Divider,
  CircularProgress,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Rocket,
  Business,
  Apartment,
  Star,
  Payment,
  Security,
  SupportAgent,
  Storage,
  Analytics,
  CloudQueue,
  TrendingUp,
  Close,
  CreditCard,
  Lock,
  Check,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  savePricingPlans,
  getPricingPlans,
  saveSelectedPlan,
} from '../PriceLocalStorage/pricinglocalstorage';

const G_START = '#4F6EF7';
const G_MID = '#2DBCB6';
const G_END = '#3ED67C';
const GRAD = `linear-gradient(135deg, ${G_START} 0%, ${G_MID} 50%, ${G_END} 100%)`;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// The API returns icon as a name string (e.g. "Rocket"); map it to the
// actual icon component here. Fallback plans below already pass a JSX
// element directly, so both cases are handled in renderPlanIcon().
const ICON_MAP = {
  Rocket: <Rocket />,
  Business: <Business />,
  Apartment: <Apartment />,
};

const renderPlanIcon = (icon) => {
  if (!icon) return <Rocket />;
  return typeof icon === 'string' ? ICON_MAP[icon] || <Rocket /> : icon;
};

// Addon options
const addons = [
  { name: 'Additional Credits (500)', price: 25, icon: <CloudQueue />, id: 'extra_credits' },
  { name: 'Priority Support', price: 49, icon: <SupportAgent />, id: 'priority_support' },
  { name: 'Advanced Analytics', price: 29, icon: <Analytics />, id: 'advanced_analytics' },
  { name: 'Extra Storage (10GB)', price: 15, icon: <Storage />, id: 'extra_storage' },
];

const Pricing = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [userCredits, setUserCredits] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [plans, setPlans] = useState([]);

  // Get user info
  useEffect(() => {
    const getUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            setUserCredits(userData.credits || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  // Fetch plans
  useEffect(() => {
    // Show cached prices immediately (if any) while the network request runs
    const cached = getPricingPlans();
    if (cached && cached.length > 0) {
      setPlans(cached);
    }

    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/payment/plans`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans);
          savePricingPlans(data.plans); // cache for other pages/components
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Use default plans if API fails
        setPlans([
          {
            id: 'starter',
            name: 'Starter',
            icon: <Rocket />,
            price_monthly: 29,
            price_yearly: 290,
            credits: 500,
            features: [
              '500 AI credits per month',
              'Up to 3 websites',
              'Basic templates',
              'Email support',
              'SSL certificate',
              'Custom domain',
            ],
            popular: false,
            color: G_START,
          },
          {
            id: 'pro',
            name: 'Pro',
            icon: <Business />,
            price_monthly: 79,
            price_yearly: 790,
            credits: 2000,
            features: [
              '2000 AI credits per month',
              'Up to 15 websites',
              'All templates',
              'Priority support',
              'Advanced analytics',
              'Custom code injection',
              'E-commerce features',
              'API access',
            ],
            popular: true,
            color: G_MID,
          },
          {
            id: 'enterprise',
            name: 'Enterprise',
            icon: <Apartment />,
            price_monthly: 199,
            price_yearly: 1990,
            credits: 10000,
            features: [
              '10000 AI credits per month',
              'Unlimited websites',
              'Custom templates',
              '24/7 dedicated support',
              'White-label options',
              'Team collaboration',
              'Advanced security',
              'SLA guarantee',
              'Custom integrations',
            ],
            popular: false,
            color: G_END,
          },
        ]);
      }
    };
    fetchPlans();
  }, []);

  // Check for session ID in URL (payment success callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSelectedAddons([]);
    setActiveStep(0);
    setCheckoutOpen(true);
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  const getTotalPrice = () => {
    if (!selectedPlan) return 0;
    const planPrice = isYearly ? selectedPlan.price_yearly : selectedPlan.price_monthly;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return planPrice + addonsPrice;
  };

  const getPlanPrice = () => {
    if (!selectedPlan) return 0;
    return isYearly ? selectedPlan.price_yearly : selectedPlan.price_monthly;
  };

  // Handle checkout with Stripe
  const handleCheckout = async () => {
    if (!selectedPlan) {
      showSnackbar('Please select a plan', 'error');
      return;
    }

    // Persist the selection so PaymentPage.js can read the exact plan the
    // user picked, even without React Router navigation state (e.g. the
    // "please log in" redirect below).
    saveSelectedPlan(selectedPlan, { isYearly, addons: selectedAddons });

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('Please log in to continue', 'error');
        navigate('/payment');
        return;
      }

      // Create checkout session
      const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          interval: isYearly ? 'yearly' : 'monthly',
          addons: selectedAddons,
          promo_code: promoCode || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      if (data.url) {
        setPaymentStatus('redirecting');
        window.location.href = data.url;
      } else if (data.session_id) {
        setPaymentStatus('verifying');
        window.location.href = `${API_BASE_URL}/payment/checkout/${data.session_id}`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showSnackbar(`Payment error: ${error.message}`, 'error');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const verifyPayment = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/payment/verify?session_id=${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.total_credits);
        showSnackbar(`Payment successful! Added ${data.credits_added} credits.`, 'success');
        setPaymentStatus('completed');
        setCheckoutOpen(false);
        refreshUserCredits();
        // Navigate to success page
        navigate('/payment/success');
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.detail || 'Payment verification failed', 'error');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      showSnackbar('Payment verification failed. Please contact support.', 'error');
    }
  };

  const refreshUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/credits/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setSelectedPlan(null);
    setSelectedAddons([]);
    setActiveStep(0);
    setPaymentStatus('idle');
    // Navigate to cancel page if payment was in progress
    if (paymentStatus === 'processing' || paymentStatus === 'redirecting') {
      navigate('/payment/cancel');
    }
  };

  // Handle back to pricing
  const handleBackToPricing = () => {
    navigate('/pricing');
  };

  return (
    <Box sx={{ bgcolor: '#080C14', minHeight: '100vh', pt: 2 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Back Button */}
        <Box
          onClick={handleBackToPricing}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            mb: 3,
            '&:hover': { opacity: 0.7 },
          }}
        >
          <ArrowBack sx={{ color: 'rgba(255,255,255,0.6)', mr: 1 }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Back</Typography>
        </Box>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ color: 'white', textAlign: 'center' }}
          >
            Simple, Transparent Pricing
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Choose the plan that fits your needs. All plans include AI-powered website building
            tools.
          </Typography>

          {/* User credits display */}
          {currentUser && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Chip
                label={`💰 ${userCredits} Credits Available`}
                sx={{
                  bgcolor: alpha(G_START, 0.2),
                  color: G_START,
                  border: `1px solid ${alpha(G_START, 0.3)}`,
                }}
              />
            </Box>
          )}
        </motion.div>

        {/* Toggle */}
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 6, gap: 2 }}
        >
          <Typography variant="body1" sx={{ color: !isYearly ? 'white' : 'rgba(255,255,255,0.5)' }}>
            Monthly
          </Typography>
          <Switch
            checked={isYearly}
            onChange={() => setIsYearly(!isYearly)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: G_START,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: G_START,
              },
            }}
          />
          <Typography variant="body1" sx={{ color: isYearly ? 'white' : 'rgba(255,255,255,0.5)' }}>
            Yearly{' '}
            <Chip
              label="Save 20%"
              size="small"
              sx={{ ml: 1, bgcolor: alpha(G_END, 0.2), color: G_END, height: 20 }}
            />
          </Typography>
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    position: 'relative',
                    background: plan.popular
                      ? `linear-gradient(135deg, ${alpha(plan.color, 0.1)} 0%, rgba(0,0,0,0.8) 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${plan.popular ? plan.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '24px',
                    height: '100%',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      icon={<Star />}
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: GRAD,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ bgcolor: alpha(plan.color, 0.2), color: plan.color }}>
                        {renderPlanIcon(plan.icon)}
                      </Avatar>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                        {plan.name}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{ color: 'white', display: 'inline' }}
                      >
                        ${isYearly ? plan.price_yearly : plan.price_monthly}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255,255,255,0.5)', display: 'inline', ml: 1 }}
                      >
                        /{isYearly ? 'year' : 'month'}
                      </Typography>
                      {isYearly && (
                        <Typography
                          variant="caption"
                          sx={{ color: G_END, display: 'block', mt: 0.5 }}
                        >
                          Save ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)}/year
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                        Includes:
                      </Typography>
                      <List dense disablePadding>
                        {plan.features.map((feature, idx) => (
                          <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle sx={{ fontSize: 16, color: plan.color }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={feature}
                              primaryTypographyProps={{
                                variant: 'body2',
                                sx: { color: 'rgba(255,255,255,0.7)' },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        🎁 {plan.credits} AI credits included
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        ~ {Math.floor(plan.credits / 100)} full websites
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={plan.popular ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => handlePlanSelect(plan)}
                      sx={{
                        ...(plan.popular && { background: GRAD }),
                        borderColor: plan.popular ? 'transparent' : 'rgba(255,255,255,0.2)',
                        color: plan.popular ? 'white' : 'rgba(255,255,255,0.9)',
                        '&:hover': {
                          borderColor: plan.color,
                          bgcolor: alpha(plan.color, 0.1),
                        },
                        borderRadius: '40px',
                        py: 1.5,
                      }}
                    >
                      {currentUser ? 'Get Started' : 'Sign Up to Subscribe'}
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            All plans include a 14-day money-back guarantee. No questions asked.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1 }}>
            Need a custom plan?{' '}
            <span
              style={{ color: G_START, cursor: 'pointer' }}
              onClick={() => (window.location.href = 'mailto:sales@aleyo.app')}
            >
              Contact our sales team
            </span>
          </Typography>
        </Box>
      </Container>

      {/* Checkout Dialog */}
      <Dialog
        open={checkoutOpen}
        onClose={handleCloseCheckout}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0A0F1A',
            borderRadius: '16px',
            border: `1px solid ${alpha(G_START, 0.3)}`,
            maxHeight: '90vh',
          },
        }}
      >
        {selectedPlan && (
          <>
            <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Checkout - {selectedPlan.name} Plan</Typography>
                <IconButton onClick={handleCloseCheckout} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2, overflowY: 'auto' }}>
              {/* Step indicator */}
              <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
                <Step>
                  <StepLabel StepIconComponent={StepIcon}>Plan & Add-ons</StepLabel>
                  <StepContent>
                    <Alert
                      severity="info"
                      sx={{ mb: 2, bgcolor: alpha(G_START, 0.1), color: 'white' }}
                    >
                      You're getting {selectedPlan.credits} AI credits per month
                    </Alert>

                    <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                      Add-ons (optional)
                    </Typography>
                    <Grid container spacing={1} sx={{ mb: 3 }}>
                      {addons.map((addon) => (
                        <Grid item xs={12} key={addon.id}>
                          <Card
                            sx={{
                              bgcolor: selectedAddons.find((a) => a.id === addon.id)
                                ? alpha(G_START, 0.1)
                                : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${selectedAddons.find((a) => a.id === addon.id) ? G_START : 'rgba(255,255,255,0.1)'}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: G_START,
                              },
                            }}
                            onClick={() => handleAddonToggle(addon)}
                          >
                            <CardContent
                              sx={{
                                py: 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {addon.icon}
                                <Typography sx={{ color: 'white' }}>{addon.name}</Typography>
                              </Box>
                              <Typography sx={{ color: G_START, fontWeight: 'bold' }}>
                                ${addon.price}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <TextField
                      fullWidth
                      placeholder="Promo code"
                      variant="outlined"
                      size="small"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                          '&:hover fieldset': { borderColor: G_START },
                        },
                      }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => setActiveStep(1)}
                      sx={{ background: GRAD }}
                    >
                      Continue to Payment
                    </Button>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel StepIconComponent={StepIcon}>Payment</StepLabel>
                  <StepContent>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {selectedPlan.name} ({isYearly ? 'Yearly' : 'Monthly'})
                        </Typography>
                        <Typography sx={{ color: 'white' }}>${getPlanPrice()}</Typography>
                      </Box>
                      {selectedAddons.map((addon) => (
                        <Box
                          key={addon.id}
                          sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                        >
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {addon.name}
                          </Typography>
                          <Typography sx={{ color: 'white' }}>+${addon.price}</Typography>
                        </Box>
                      ))}
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>Total</Typography>
                        <Typography sx={{ color: G_START, fontWeight: 'bold', fontSize: '1.5rem' }}>
                          ${getTotalPrice()}
                        </Typography>
                      </Box>
                    </Paper>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setActiveStep(0)}
                        sx={{
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                          handleCheckout();
                        }}
                        disabled={loading}
                        sx={{
                          background: GRAD,
                          '&:hover': { opacity: 0.9 },
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : (
                          'Pay Now'
                        )}
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Lock sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Secured by Stripe
                      </Typography>
                      <CreditCard sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Button onClick={handleCloseCheckout} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Cancel
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            background: '#0A0F1A',
            border: `1px solid ${snackbar.severity === 'success' ? G_END : snackbar.severity === 'error' ? '#FF4444' : G_START}`,
            color: 'white',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Custom Step Icon
const StepIcon = (props) => {
  const { active, completed, icon } = props;
  const isActive = active || completed;

  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? GRAD : 'rgba(255,255,255,0.1)',
        color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
        fontSize: '0.875rem',
        fontWeight: 'bold',
      }}
    >
      {completed ? <Check sx={{ fontSize: 16 }} /> : icon}
    </Box>
  );
};

export default Pricing;
