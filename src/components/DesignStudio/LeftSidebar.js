import React from 'react';
import {
  Drawer,
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Grid,
  Button,
  alpha,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Slider,
  Chip,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Switch,
  FormControlLabel,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Upload,
  Image as ImageIcon,
  Delete,
  Add,
  PhotoLibrary,
  AspectRatio,
  TextFields,
  DragHandle,
  ExpandMore,
  Palette,
  Close,
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
  CheckCircle,
  Cancel,
  Link as LinkIcon,
} from '@mui/icons-material';
import IntegrationsPanel from './IntegrationsPanel';
import {
  G_START,
  G_MID,
  G_END,
  GRAD,
  textStyles,
  colorThemes,
  colorPalettes,
  getComponentIcon,
  getComponentName,
} from './DesignStudioUtils';

// Integration categories with icons
const INTEGRATION_CATEGORIES = {
  payments: { label: 'Payments', icon: <Payment />, color: '#635bff' },
  marketing: { label: 'Marketing', icon: <Mail />, color: '#ffc107' },
  social: { label: 'Social Media', icon: <WhatsApp />, color: '#25D366' },
  analytics: { label: 'Analytics', icon: <Analytics />, color: '#34A853' },
  storage: { label: 'Storage', icon: <Storage />, color: '#FF9900' },
  security: { label: 'Security', icon: <Security />, color: '#F38020' },
  ai: { label: 'AI Services', icon: <Api />, color: '#10a37f' },
  music: { label: 'Music', icon: <MusicNote />, color: '#1DB954' },
};

// Full integration list
const ALL_INTEGRATIONS = [
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
    connected: false,
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
    connected: false,
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
  {
    id: 13,
    name: 'PayPal',
    category: 'payments',
    description: 'Online payment processing',
    icon: <Payment />,
    color: '#003087',
    connected: false,
    popular: true,
  },
  {
    id: 14,
    name: 'SendGrid',
    category: 'marketing',
    description: 'Email delivery and marketing',
    icon: <Mail />,
    color: '#00A8A8',
    connected: false,
    popular: false,
  },
  {
    id: 15,
    name: 'Calendly',
    category: 'marketing',
    description: 'Scheduling and appointments',
    icon: <CalendarToday />,
    color: '#006BFF',
    connected: false,
    popular: false,
  },
  {
    id: 16,
    name: 'Google Ads',
    category: 'analytics',
    description: 'Advertising and campaigns',
    icon: <Campaign />,
    color: '#EA4335',
    connected: false,
    popular: false,
  },
];

export const LeftSidebar = ({
  open = false,
  onClose = () => {},
  activeTab,
  setActiveTab,
  handleAddComponent,
  handleAddTextElement,
  fileInputRef,
  handleImageUpload,
  uploadedImages,
  handleDeleteUploadedImage,
  handleAddMockImage,
  imageUploadMode,
  setImageUploadMode,
  mockImageUrl,
  setMockImageUrl,
  handleAddImageToCanvas,
  applyColorTheme,
  applyColorPalette,
  globalStyles,
  handleStyleChange,
  showSnackbar,
  projectNameInput,
  projectId,
  onAddIntegration,
  onRemoveIntegration,
  // Pages props
  pages = [],
  activePageId,
  handleSwitchPage,
  handleDeletePage,
  setAddPageDialogOpen,
  // Other props
  dragDropMode = false,
  setDragDropMode = () => {},
  canvasScale = 1,
  setCanvasScale = () => {},
  setSelectedComponent = () => {},
  setSelectedTextElement = () => {},
  setSelectedImageElement = () => {},
  // Integration state
  connectedIntegrations = [],
  setConnectedIntegrations = () => {},
  integrationStatus = {},
  setIntegrationStatus = () => {},
}) => {
  const safePages = Array.isArray(pages) ? pages : [];

  // Get category color
  const getCategoryColor = (category) => {
    return INTEGRATION_CATEGORIES[category]?.color || '#9E9E9E';
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    return INTEGRATION_CATEGORIES[category]?.icon || <LinkIcon />;
  };

  // Get category label
  const getCategoryLabel = (category) => {
    return INTEGRATION_CATEGORIES[category]?.label || category;
  };

  // Toggle integration connection
  const handleToggleIntegration = (integrationId) => {
    const integration = ALL_INTEGRATIONS.find((i) => i.id === integrationId);
    if (!integration) return;

    const isConnected = connectedIntegrations.includes(integrationId);

    if (isConnected) {
      setConnectedIntegrations(connectedIntegrations.filter((id) => id !== integrationId));
      setIntegrationStatus((prev) => ({
        ...prev,
        [integration.name.toLowerCase()]: 'disconnected',
      }));
      showSnackbar(`${integration.name} disconnected`, 'info');
      if (onRemoveIntegration) onRemoveIntegration(integrationId);
    } else {
      setConnectedIntegrations([...connectedIntegrations, integrationId]);
      setIntegrationStatus((prev) => ({ ...prev, [integration.name.toLowerCase()]: 'connected' }));
      showSnackbar(`${integration.name} connected successfully! 🎉`, 'success');
      if (onAddIntegration) {
        onAddIntegration({
          id: integrationId,
          provider: integration.name.toLowerCase(),
          name: integration.name,
          status: 'connected',
          connectedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Render integrations tab content
  const renderIntegrationsContent = () => {
    const categories = Object.keys(INTEGRATION_CATEGORIES);
    const allIntegrations = ALL_INTEGRATIONS;

    return (
      <Box sx={{ pb: 2 }}>
        {/* Summary Stats */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 2,
            p: 1.5,
            bgcolor: alpha('#FFFFFF', 0.05),
            borderRadius: '12px',
            border: `1px solid ${alpha('#FFFFFF', 0.08)}`,
          }}
        >
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: G_START, fontWeight: 700 }}>
              {connectedIntegrations.length}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
              Connected
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#FFFFFF', 0.1) }} />
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#FFB74D', fontWeight: 700 }}>
              {allIntegrations.length}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
              Available
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#FFFFFF', 0.1) }} />
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#4FC3F7', fontWeight: 700 }}>
              {categories.length}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
              Categories
            </Typography>
          </Box>
        </Box>

        {/* Category Filters */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label="All"
            size="small"
            sx={{
              bgcolor: alpha(G_START, 0.2),
              color: G_START,
              border: `1px solid ${alpha(G_START, 0.3)}`,
            }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={getCategoryLabel(cat)}
              size="small"
              icon={getCategoryIcon(cat)}
              sx={{
                bgcolor: alpha(getCategoryColor(cat), 0.15),
                color: getCategoryColor(cat),
                border: `1px solid ${alpha(getCategoryColor(cat), 0.2)}`,
                '& .MuiChip-icon': { color: getCategoryColor(cat) },
              }}
            />
          ))}
        </Box>

        {/* All Integrations Grid */}
        <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1.5 }}>
          All Integrations ({allIntegrations.length})
        </Typography>
        <Grid container spacing={1}>
          {allIntegrations.map((integration) => {
            const isConnected = connectedIntegrations.includes(integration.id);
            return (
              <Grid item xs={12} key={integration.id}>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: isConnected ? alpha(G_START, 0.08) : alpha('#FFFFFF', 0.03),
                    border: `1px solid ${isConnected ? alpha(G_START, 0.3) : alpha('#FFFFFF', 0.06)}`,
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: isConnected ? G_START : alpha('#FFFFFF', 0.15),
                      bgcolor: isConnected ? alpha(G_START, 0.12) : alpha('#FFFFFF', 0.06),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(integration.color, 0.15),
                        color: integration.color,
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {integration.icon}
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {integration.name}
                        </Typography>
                        {integration.popular && (
                          <Chip
                            label="Popular"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.5rem',
                              bgcolor: alpha('#FFB74D', 0.2),
                              color: '#FFB74D',
                            }}
                          />
                        )}
                        <Chip
                          label={getCategoryLabel(integration.category)}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.5rem',
                            bgcolor: alpha(getCategoryColor(integration.category), 0.15),
                            color: getCategoryColor(integration.category),
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: alpha('#FFFFFF', 0.4), display: 'block' }}
                      >
                        {integration.description}
                      </Typography>
                    </Box>

                    {/* Toggle Switch */}
                    <Tooltip title={isConnected ? 'Disconnect' : 'Connect'}>
                      <Switch
                        checked={isConnected}
                        onChange={() => handleToggleIntegration(integration.id)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: G_START },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: G_START,
                          },
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Integrations Panel (Full) */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.08) }} />
          <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1.5 }}>
            Advanced Integration Configuration
          </Typography>
          <IntegrationsPanel
            showSnackbar={showSnackbar}
            projectId={projectId}
            onAddIntegration={onAddIntegration}
            onRemoveIntegration={onRemoveIntegration}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 380,
          boxSizing: 'border-box',
          bgcolor: '#0A0F1A',
          borderRight: `1px solid ${alpha('#FFFFFF', 0.1)}`,
          top: 0,
          height: '100vh',
          zIndex: 1200,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header with close button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.08)}`,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Design Tools
        </Typography>
        <IconButton onClick={onClose} sx={{ color: alpha('#FFFFFF', 0.6) }}>
          <Close />
        </IconButton>
      </Box>

      {/* Pages Bar inside sidebar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 2,
          py: 1,
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          overflowX: 'auto',
          flexShrink: 0,
          minHeight: '44px',
          '&::-webkit-scrollbar': {
            height: '3px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha('#FFFFFF', 0.03),
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(G_START, 0.5),
            borderRadius: '4px',
          },
        }}
      >
        <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.4), mr: 0.5, flexShrink: 0 }}>
          Pages:
        </Typography>
        {safePages.length > 0 ? (
          safePages.map((page) => (
            <Chip
              key={page.id}
              label={page.name}
              size="small"
              onClick={() => {
                if (typeof handleSwitchPage === 'function') handleSwitchPage(page.id);
                onClose();
              }}
              onDelete={
                safePages.length > 1 && typeof handleDeletePage === 'function'
                  ? () => handleDeletePage(page.id)
                  : undefined
              }
              sx={{
                bgcolor: activePageId === page.id ? alpha(G_START, 0.25) : alpha('#FFFFFF', 0.07),
                color: activePageId === page.id ? G_START : alpha('#FFFFFF', 0.7),
                border: `1px solid ${activePageId === page.id ? alpha(G_START, 0.5) : 'transparent'}`,
                fontWeight: activePageId === page.id ? 700 : 400,
                '& .MuiChip-deleteIcon': {
                  color: alpha('#FFFFFF', 0.4),
                  '&:hover': { color: '#ff4444' },
                },
                flexShrink: 0,
                fontSize: '0.7rem',
                height: 28,
              }}
            />
          ))
        ) : (
          <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.3) }}>
            No pages yet
          </Typography>
        )}
        <Tooltip title="Add new page">
          <IconButton
            size="small"
            onClick={() => typeof setAddPageDialogOpen === 'function' && setAddPageDialogOpen(true)}
            sx={{
              color: alpha('#FFFFFF', 0.4),
              '&:hover': { color: G_START },
              flexShrink: 0,
            }}
          >
            <Add fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main content - scrollable */}
      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        <Tabs
          value={Math.min(Math.max(activeTab || 0, 0), 5)}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Components" sx={{ color: 'white', fontSize: '0.75rem', minWidth: 80 }} />
          <Tab label="Text" sx={{ color: 'white', fontSize: '0.75rem', minWidth: 60 }} />
          <Tab label="Images" sx={{ color: 'white', fontSize: '0.75rem', minWidth: 70 }} />
          <Tab label="Themes" sx={{ color: 'white', fontSize: '0.75rem', minWidth: 70 }} />
          <Tab label="Colors" sx={{ color: 'white', fontSize: '0.75rem', minWidth: 70 }} />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>Integrations</span>
                {connectedIntegrations.length > 0 && (
                  <Chip
                    label={connectedIntegrations.length}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.5rem',
                      bgcolor: G_START,
                      color: 'white',
                      minWidth: 16,
                    }}
                  />
                )}
              </Box>
            }
            sx={{ color: 'white', fontSize: '0.75rem', minWidth: 90 }}
          />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ color: alpha('#FFFFFF', 0.7) }}>
              Components
            </Typography>
            <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />
            <Grid container spacing={1}>
              {['hero', 'features', 'gallery', 'contact', 'pricing', 'logo', 'footer', 'nav'].map(
                (type) => (
                  <Grid item xs={6} key={type}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={getComponentIcon(type)}
                      onClick={() => {
                        if (typeof handleAddComponent === 'function') handleAddComponent(type);
                        onClose();
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        mb: 0.5,
                        color: 'white',
                        borderColor: alpha('#FFFFFF', 0.2),
                        fontSize: '0.7rem',
                        py: 0.75,
                        '&:hover': { borderColor: G_START, bgcolor: alpha(G_START, 0.1) },
                      }}
                    >
                      {getComponentName(type)}
                    </Button>
                  </Grid>
                )
              )}
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7) }}>
                Text Styles
              </Typography>
              <Tooltip title="Drag & Drop Mode">
                <IconButton
                  size="small"
                  onClick={() => setDragDropMode(!dragDropMode)}
                  sx={{
                    color: dragDropMode ? G_START : 'white',
                    bgcolor: dragDropMode ? alpha(G_START, 0.2) : 'transparent',
                  }}
                >
                  <DragHandle fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />
            <Typography
              variant="caption"
              sx={{ color: alpha('#FFFFFF', 0.5), mb: 1, display: 'block' }}
            >
              {dragDropMode
                ? 'Drag mode active - click and drag elements'
                : 'Click on text to edit, drag icon to move.'}
            </Typography>
            <Grid container spacing={1}>
              {(textStyles || []).map((style) => (
                <Grid item xs={12} key={style.id}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<TextFields fontSize="small" />}
                    onClick={() => {
                      if (typeof handleAddTextElement === 'function') handleAddTextElement(style);
                      onClose();
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      mb: 0.5,
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      fontSize: '0.7rem',
                      py: 0.75,
                      '&:hover': { borderColor: G_START, bgcolor: alpha(G_START, 0.1) },
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {style.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: style.fontSize, opacity: 0.6 }}>
                        {style.defaultText.substring(0, 25)}...
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {activeTab === 2 && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ color: alpha('#FFFFFF', 0.7) }}>
              Image Library
            </Typography>
            <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: alpha('#FFFFFF', 0.5), display: 'block', mb: 1 }}
              >
                Upload Mode
              </Typography>
              <ToggleButtonGroup
                value={imageUploadMode}
                exclusive
                onChange={(_, v) => v && setImageUploadMode(v)}
                size="small"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    color: alpha('#FFFFFF', 0.6),
                    borderColor: alpha('#FFFFFF', 0.2),
                    fontSize: '0.7rem',
                    py: 0.5,
                  },
                  '& .Mui-selected': {
                    color: G_START,
                    bgcolor: alpha(G_START, 0.15) + ' !important',
                  },
                }}
              >
                <ToggleButton value="mock">Mock (URL)</ToggleButton>
                <ToggleButton value="production">Upload (File)</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {imageUploadMode === 'mock' ? (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.4), display: 'block', mb: 0.5 }}
                >
                  Paste any image URL
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://example.com/image.jpg"
                  value={mockImageUrl}
                  onChange={(e) => setMockImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMockImage()}
                  sx={{
                    mb: 0.5,
                    '& .MuiInputBase-input': { color: 'white', fontSize: '0.8rem' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                  }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => typeof handleAddMockImage === 'function' && handleAddMockImage()}
                  sx={{
                    color: 'white',
                    borderColor: alpha(G_START, 0.5),
                    fontSize: '0.7rem',
                    '&:hover': { borderColor: G_START, bgcolor: alpha(G_START, 0.1) },
                  }}
                >
                  Add Mock Image
                </Button>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `2px dashed ${alpha(G_START, 0.5)}`,
                    bgcolor: alpha(G_START, 0.05),
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: G_START, bgcolor: alpha(G_START, 0.1) },
                  }}
                  onClick={() => fileInputRef?.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) =>
                      typeof handleImageUpload === 'function' && handleImageUpload(e)
                    }
                  />
                  <Upload sx={{ fontSize: 32, color: alpha(G_START, 0.6), mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                    Click or drag images here
                  </Typography>
                </Paper>
              </Box>
            )}
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
              Uploaded Images ({(uploadedImages || []).length})
            </Typography>
            <ImageList sx={{ mt: 1 }} cols={2} gap={6}>
              {(uploadedImages || []).map((image) => (
                <ImageListItem
                  key={image.id}
                  sx={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      height: 70,
                      objectFit: 'cover',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (typeof handleAddImageToCanvas === 'function')
                        handleAddImageToCanvas(image);
                      onClose();
                    }}
                  />
                  {image.isMock && (
                    <Box sx={{ position: 'absolute', top: 2, left: 2 }}>
                      <Chip
                        label="mock"
                        size="small"
                        sx={{
                          height: 14,
                          fontSize: '0.5rem',
                          bgcolor: alpha(G_MID, 0.8),
                          color: 'white',
                        }}
                      />
                    </Box>
                  )}
                  <ImageListItemBar
                    title={
                      image.name
                        ? image.name.length > 15
                          ? image.name.substring(0, 15) + '…'
                          : image.name
                        : 'Untitled'
                    }
                    actionIcon={
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof handleDeleteUploadedImage === 'function')
                            handleDeleteUploadedImage(image.id);
                        }}
                        sx={{ color: '#ff4444' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                    sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
            {uploadedImages.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <PhotoLibrary sx={{ fontSize: 32, color: alpha('#FFFFFF', 0.2) }} />
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.3), display: 'block' }}
                >
                  No images uploaded
                </Typography>
              </Box>
            )}
          </>
        )}

        {activeTab === 3 && (
          <>
            <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1 }}>
              Color Themes
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: alpha('#FFFFFF', 0.4), display: 'block', mb: 2 }}
            >
              Transform your website's look
            </Typography>
            <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />
            <Grid container spacing={1.5}>
              {(colorThemes || []).slice(0, 4).map((theme) => (
                <Grid item xs={12} key={theme.id}>
                  <Card
                    sx={{
                      bgcolor: alpha(theme.styles.backgroundColor, 0.3),
                      border: `1px solid ${alpha(theme.styles.primaryColor, 0.3)}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: theme.styles.primaryColor,
                      },
                    }}
                    onClick={() => {
                      applyColorTheme(theme);
                      onClose();
                    }}
                  >
                    <Box
                      sx={{
                        height: 60,
                        background: `linear-gradient(135deg, ${theme.styles.primaryColor}, ${theme.styles.secondaryColor})`,
                        borderRadius: '10px 10px 0 0',
                      }}
                    />
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {theme.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {[
                          theme.styles.primaryColor,
                          theme.styles.secondaryColor,
                          theme.styles.accentColor,
                        ].map((color, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: 14,
                              height: 14,
                              bgcolor: color,
                              borderRadius: '3px',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {activeTab === 4 && (
          <>
            <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1 }}>
              Color Palettes
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: alpha('#FFFFFF', 0.4), display: 'block', mb: 2 }}
            >
              Click any swatch to assign
            </Typography>
            <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />
            <Stack spacing={1.5}>
              {(colorPalettes || []).map((palette) => (
                <Box key={palette.name}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                      {palette.name}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        applyColorPalette(palette);
                        onClose();
                      }}
                      sx={{
                        color: G_START,
                        fontSize: '0.6rem',
                        textTransform: 'none',
                        minWidth: 0,
                      }}
                    >
                      Apply All
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {palette.colors.map((color, idx) => (
                      <Tooltip key={idx} title={`Color ${idx + 1}`}>
                        <Box
                          onClick={() => {
                            const roles = [
                              'primaryColor',
                              'secondaryColor',
                              'accentColor',
                              'backgroundColor',
                              'textColor',
                            ];
                            const role = roles[idx] || 'accentColor';
                            handleStyleChange(role, color);
                            showSnackbar(`${role.replace('Color', '')} → ${color}`, 'success');
                          }}
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: color,
                            borderRadius: '4px',
                            border: `1px solid ${alpha('#FFFFFF', 0.15)}`,
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                            '&:hover': { transform: 'scale(1.15)' },
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
            <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.6), mt: 2, mb: 1 }}>
              Custom Colors
            </Typography>
            <Divider sx={{ mb: 1.5, borderColor: alpha('#FFFFFF', 0.1) }} />
            <Stack spacing={1}>
              {[
                'primaryColor',
                'secondaryColor',
                'accentColor',
                'backgroundColor',
                'textColor',
                'headingColor',
              ].map((key) => (
                <Button
                  key={key}
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<Palette fontSize="small" />}
                  onClick={(e) => {
                    // Simple color picker via input
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = globalStyles?.[key] || '#000000';
                    input.style.position = 'absolute';
                    input.style.visibility = 'hidden';
                    input.style.pointerEvents = 'none';
                    document.body.appendChild(input);
                    input.addEventListener('change', (ev) => {
                      handleStyleChange(key, ev.target.value);
                      if (input.parentNode) input.parentNode.removeChild(input);
                    });
                    input.addEventListener('blur', () => {
                      if (input.parentNode) input.parentNode.removeChild(input);
                    });
                    input.click();
                  }}
                  sx={{
                    color: 'white',
                    borderColor: alpha('#FFFFFF', 0.15),
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    py: 0.5,
                  }}
                >
                  {key.replace('Color', '')}
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: globalStyles[key],
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </Button>
              ))}
            </Stack>
          </>
        )}

        {activeTab === 5 && renderIntegrationsContent()}

        {/* Global Styles section - always visible at bottom */}
        <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.6), mt: 3, mb: 1 }}>
          Global Styles
        </Typography>
        <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />

        <Accordion sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="caption">Typography</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: alpha('#FFFFFF', 0.7), fontSize: '0.75rem' }}>
                Font Family
              </InputLabel>
              <Select
                value={globalStyles?.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                label="Font Family"
                sx={{
                  color: 'white',
                  fontSize: '0.8rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              >
                <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                <MenuItem value="Poppins, sans-serif">Poppins</MenuItem>
                <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                <MenuItem value="Montserrat, sans-serif">Montserrat</MenuItem>
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="caption">Layout</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.6) }}>
                Border Radius
              </Typography>
              <Slider
                value={parseInt(globalStyles?.borderRadius) || 12}
                onChange={(e, val) => handleStyleChange('borderRadius', `${val}px`)}
                min={0}
                max={32}
                size="small"
                sx={{ color: G_START }}
              />
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.6) }}>
                Canvas Scale
              </Typography>
              <Slider
                value={canvasScale}
                onChange={(e, val) => setCanvasScale(val)}
                min={0.5}
                max={1.5}
                step={0.05}
                size="small"
                sx={{ color: G_START }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
};

export default LeftSidebar;
