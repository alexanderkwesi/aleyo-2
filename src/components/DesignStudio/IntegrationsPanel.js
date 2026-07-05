import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  LinearProgress,
  DialogContentText,
  alpha,
} from '@mui/material';
import {
  Avatar,
  Switch,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Payment,
  Mail,
  WhatsApp,
  Instagram,
  Facebook,
  Analytics,
  Storage,
  Security,
  Api,
  MusicNote,
  Chat,
  CloudUpload,
  CalendarToday,
  Campaign,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Search,
  Close,
  Code as ContentCopy,
  Delete, // ← ADD THIS - was missing
  DragHandle, // ← ADD THIS - was missing
} from '@mui/icons-material';
import { G_START, G_MID, G_END, GRAD, generateId } from './DesignStudioUtils';

export const IntegrationsPanel = ({
  showSnackbar,
  projectId,
  onAddIntegration,
  onRemoveIntegration,
}) => {
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configDialog, setConfigDialog] = useState(false);
  const [configData, setConfigData] = useState({
    type: '',
    provider: '',
    api_key: '',
    api_secret: '',
    settings: {},
    webhook_url: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeIntegrationFeatures, setActiveIntegrationFeatures] = useState([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [dragOverIntegration, setDragOverIntegration] = useState(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [selectedIntegrationCode, setSelectedIntegrationCode] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [prebuiltIntegrations, setPrebuiltIntegrations] = useState([
    {
      id: 1,
      name: 'Stripe',
      category: 'payments',
      description: 'Accept payments and manage subscriptions',
      icon: <Payment />,
      color: '#635bff',
      connected: false,
      popular: true,
    },
    {
      id: 2,
      name: 'Mailchimp',
      category: 'marketing',
      description: 'Email marketing and newsletters',
      icon: <Mail />,
      color: '#ffc107',
      connected: false,
      popular: true,
    },
    {
      id: 3,
      name: 'WhatsApp Business',
      category: 'social',
      description: 'Customer support and messaging',
      icon: <WhatsApp />,
      color: '#25D366',
      connected: false,
      popular: true,
    },
    {
      id: 4,
      name: 'Instagram',
      category: 'social',
      description: 'Social media integration and feeds',
      icon: <Instagram />,
      color: '#E4405F',
      connected: true,
      popular: true,
    },
    {
      id: 5,
      name: 'Facebook Pixel',
      category: 'analytics',
      description: 'Track conversions and retargeting',
      icon: <Facebook />,
      color: '#1877F2',
      connected: false,
      popular: true,
    },
    {
      id: 6,
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Website traffic and user behavior',
      icon: <Analytics />,
      color: '#34A853',
      connected: true,
      popular: true,
    },
    {
      id: 7,
      name: 'AWS S3',
      category: 'storage',
      description: 'Cloud storage for media files',
      icon: <Storage />,
      color: '#FF9900',
      connected: false,
      popular: false,
    },
    {
      id: 8,
      name: 'Cloudflare',
      category: 'security',
      description: 'CDN and security protection',
      icon: <Security />,
      color: '#F38020',
      connected: false,
      popular: false,
    },
    {
      id: 9,
      name: 'OpenAI API',
      category: 'ai',
      description: 'AI-powered content generation',
      icon: <Api />,
      color: '#10a37f',
      connected: false,
      popular: true,
    },
    {
      id: 10,
      name: 'Spotify',
      category: 'music',
      description: 'Music embed and playlists',
      icon: <MusicNote />,
      color: '#1DB954',
      connected: false,
      popular: false,
    },
    {
      id: 11,
      name: 'Discord',
      category: 'social',
      description: 'Community integration and webhooks',
      icon: <Chat />,
      color: '#5865F2',
      connected: false,
      popular: true,
    },
    {
      id: 12,
      name: 'Google Drive',
      category: 'storage',
      description: 'Cloud storage integration',
      icon: <CloudUpload />,
      color: '#4285F4',
      connected: false,
      popular: false,
    },
  ]);

  const integrationFeatures = {
    stripe: {
      name: 'Stripe Payment',
      icon: <Payment />,
      code: `<div id="stripe-payment"><div id="payment-element"></div><button id="payment-button">Pay Now</button><script src="https://js.stripe.com/v3/"></script><script>const stripe = Stripe('YOUR_API_KEY');</script></div>`,
      section: 'payment',
    },
    paypal: {
      name: 'PayPal Checkout',
      icon: <Payment />,
      code: `<div id="paypal-button-container"></div><script src="https://www.paypal.com/sdk/js?client-id=YOUR_API_KEY"></script><script>paypal.Buttons({createOrder: (data, actions) => {return actions.order.create({purchase_units: [{ amount: { value: '10.00' } }]});},onApprove: (data, actions) => {return actions.order.capture();}}).render('#paypal-button-container');</script>`,
      section: 'payment',
    },
    mailchimp: {
      name: 'Mailchimp Newsletter',
      icon: <Mail />,
      code: `<div id="mc_embed_signup"><form action="https://YOUR_DC.list-manage.com/subscribe/post" method="POST"><input type="email" name="EMAIL" placeholder="Subscribe to newsletter" required><button type="submit">Subscribe</button></form></div>`,
      section: 'marketing',
    },
    sendgrid: {
      name: 'SendGrid Contact Form',
      icon: <Mail />,
      code: `<form id="contact-form" action="/api/sendgrid/contact" method="POST"><input type="text" name="name" placeholder="Your Name" required><input type="email" name="email" placeholder="Your Email" required><textarea name="message" placeholder="Your Message" required></textarea><button type="submit">Send Message</button></form>`,
      section: 'marketing',
    },
    calendly: {
      name: 'Calendly Scheduling',
      icon: <CalendarToday />,
      code: `<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet"><script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script><div class="calendly-inline-widget" data-url="https://calendly.com/YOUR_USERNAME" style="min-width:320px;height:630px;"></div>`,
      section: 'calendar',
    },
    acuity: {
      name: 'Acuity Scheduling',
      icon: <CalendarToday />,
      code: `<div id="acuity-embed"><iframe src="https://acuityscheduling.com/schedule.php?owner=YOUR_OWNER_ID" width="100%" height="800" frameBorder="0"></iframe></div>`,
      section: 'calendar',
    },
    google_analytics: {
      name: 'Google Analytics',
      icon: <Analytics />,
      code: `<!-- Google Analytics --><script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'YOUR_GA_ID');</script>`,
      section: 'analytics',
    },
    meta_pixel: {
      name: 'Meta Pixel',
      icon: <Facebook />,
      code: `<!-- Meta Pixel Code --><script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', 'YOUR_PIXEL_ID');fbq('track', 'PageView');</script><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1" /></noscript>`,
      section: 'analytics',
    },
    google_ads: {
      name: 'Google Ads',
      icon: <Campaign />,
      code: `<!-- Google Ads --><script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_ADS_ID"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'YOUR_ADS_ID');</script>`,
      section: 'ads',
    },
    formspree: {
      name: 'Formspree Form',
      icon: <DescriptionIcon />,
      code: `<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST"><input type="text" name="name" placeholder="Your Name" required><input type="email" name="email" placeholder="Your Email" required><textarea name="message" placeholder="Your Message" required></textarea><button type="submit">Send Message</button></form>`,
      section: 'forms',
    },
    typeform: {
      name: 'Typeform Embed',
      icon: <DescriptionIcon />,
      code: `<div style="position:relative;width:100%;height:0;padding-bottom:56.25%;"><iframe src="https://embed.typeform.com/to/YOUR_FORM_ID" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`,
      section: 'forms',
    },
    whatsapp: {
      name: 'WhatsApp Chat',
      icon: <WhatsApp />,
      code: `<a href="https://wa.me/YOUR_PHONE_NUMBER" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Chat with us on WhatsApp</a>`,
      section: 'social',
    },
    discord: {
      name: 'Discord Widget',
      icon: <Chat />,
      code: `<iframe src="https://discord.com/widget?id=YOUR_SERVER_ID&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>`,
      section: 'social',
    },
    instagram: {
      name: 'Instagram Feed',
      icon: <Instagram />,
      code: `<div id="instagram-feed"><script src="https://cdn.jsdelivr.net/npm/@instagram-feed/embed@1.0.0/dist/ig-feed.min.js"></script><ig-feed username="YOUR_USERNAME" limit="6"></ig-feed></div>`,
      section: 'social',
    },
  };

  const integrationTypes = [
    {
      type: 'forms',
      label: 'Form Builder',
      icon: DescriptionIcon,
      providers: ['formspree', 'typeform', 'google_forms'],
    },
    {
      type: 'payment',
      label: 'Payment Gateway',
      icon: Payment,
      providers: ['stripe', 'paypal', 'square'],
    },
    {
      type: 'email',
      label: 'Email Marketing',
      icon: EmailIcon,
      providers: ['mailchimp', 'sendgrid', 'convertkit'],
    },
    {
      type: 'calendar',
      label: 'Calendar/Scheduling',
      icon: CalendarToday,
      providers: ['calendly', 'acuity', 'bookings'],
    },
    {
      type: 'ads',
      label: 'Ad Platforms',
      icon: Campaign,
      providers: ['google_ads', 'meta_ads', 'linkedin_ads'],
    },
  ];

  const integrationCategories = [
    { value: 'all', label: 'All' },
    { value: 'payments', label: 'Payments' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'social', label: 'Social' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'storage', label: 'Storage' },
    { value: 'security', label: 'Security' },
    { value: 'ai', label: 'AI' },
  ];

  const handleConfigure = async () => {
    if (!configData.provider || !configData.api_key) {
      showSnackbar('Please enter API key and select a provider', 'warning');
      return;
    }
    if (configData.api_key.length < 8) {
      showSnackbar('Invalid API key format. Please check your credentials.', 'error');
      return;
    }
    const newIntegration = {
      id: generateId(),
      type: configData.type,
      provider: configData.provider,
      api_key: configData.api_key,
      api_secret: configData.api_secret,
      settings: configData.settings,
      webhook_url: configData.webhook_url,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      features: integrationFeatures[configData.provider] || null,
    };
    setIntegrations((prev) => [...prev, newIntegration]);
    setConnectedIntegrations((prev) => [...prev, configData.provider]);
    setIntegrationStatus((prev) => ({ ...prev, [configData.provider]: 'connected' }));
    if (integrationFeatures[configData.provider]) {
      setActiveIntegrationFeatures((prev) => [
        ...prev,
        {
          ...integrationFeatures[configData.provider],
          provider: configData.provider,
          integrationId: newIntegration.id,
        },
      ]);
    }
    setConfigDialog(false);
    setConfigData({
      type: '',
      provider: '',
      api_key: '',
      api_secret: '',
      settings: {},
      webhook_url: '',
    });
    if (onAddIntegration) onAddIntegration(newIntegration);
    showSnackbar(`${configData.provider} integration added successfully! 🎉`, 'success');
  };

  const handleRemoveIntegration = (id) => {
    const integration = integrations.find((i) => i.id === id);
    if (integration) {
      setIntegrations(integrations.filter((i) => i.id !== id));
      setConnectedIntegrations((prev) => prev.filter((p) => p !== integration.provider));
      setActiveIntegrationFeatures((prev) => prev.filter((f) => f.integrationId !== id));
      setIntegrationStatus((prev) => ({ ...prev, [integration.provider]: 'disconnected' }));
      if (onRemoveIntegration) onRemoveIntegration(id);
      showSnackbar(`${integration.provider} integration removed`, 'info');
    }
  };

  const handleTogglePrebuilt = (id) => {
    setPrebuiltIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, connected: !integration.connected } : integration
      )
    );
    const integration = prebuiltIntegrations.find((i) => i.id === id);
    const newStatus = !integration.connected;
    if (newStatus) {
      setIntegrationStatus((prev) => ({ ...prev, [integration.name.toLowerCase()]: 'connected' }));
      if (integrationFeatures[integration.name.toLowerCase()]) {
        setActiveIntegrationFeatures((prev) => [
          ...prev,
          {
            ...integrationFeatures[integration.name.toLowerCase()],
            provider: integration.name.toLowerCase(),
            integrationId: `prebuilt-${id}`,
          },
        ]);
      }
      showSnackbar(`${integration.name} connected successfully! 🎉`, 'success');
    } else {
      setIntegrationStatus((prev) => ({
        ...prev,
        [integration.name.toLowerCase()]: 'disconnected',
      }));
      setActiveIntegrationFeatures((prev) =>
        prev.filter((f) => f.provider !== integration.name.toLowerCase())
      );
      showSnackbar(`${integration.name} disconnected`, 'info');
    }
  };

  const handleDragStart = (e, feature) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'integration', feature }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    setDragOverIntegration(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'integration' && data.feature) {
        setSelectedIntegrationCode(data.feature.code);
        setShowCodeDialog(true);
      }
    } catch (error) {
      console.error('Error dropping integration:', error);
    }
  };

  const copyIntegrationCode = () => {
    navigator.clipboard.writeText(selectedIntegrationCode);
    showSnackbar('Integration code copied to clipboard!', 'success');
  };

  const filteredPrebuilt = prebuiltIntegrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount =
    prebuiltIntegrations.filter((i) => i.connected).length + integrations.length;
  const totalCount = prebuiltIntegrations.length + integrations.length;

  // Rest of the component remains the same...
  // (The return statement with all JSX stays unchanged)

  return (
    <Box sx={{ p: 2 }}>
      {/* ... all the JSX content remains the same ... */}
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Third-Party Integrations
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
        Connect your website with popular services.
      </Typography>

      {/* ... rest of the JSX content ... */}
    </Box>
  );
};

export default IntegrationsPanel;
