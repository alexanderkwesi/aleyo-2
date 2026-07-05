// HostingPlatform.js - Web hosting dashboard with preview integration

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  alpha,
  Tooltip,
  Divider,
  Stack,
  Tabs,
  Tab,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  CircularProgress,
  Menu,
  MenuItem,
  Badge,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  OpenInNew,
  Public,
  Lock,
  LockOpen,
  CloudDone,
  CloudOff,
  Refresh,
  MoreVert,
  TrendingUp,
  Visibility,
  Share,
  ContentCopy,
  Settings,
  Security,
  Speed,
  Storage,
  Dns,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  ArrowForward,
  Launch,
  QrCode,
  Timeline,
  BarChart,
  People,
  Language,
  Dashboard,
  Code,
  Preview,
  CloudUpload,
} from '@mui/icons-material';
import { G_START, G_MID, G_END, GRAD } from '../components/DesignStudio/DesignStudioUtils';
import { useNavigate } from 'react-router-dom';

// Status configurations
const STATUS_CONFIG = {
  published: {
    label: 'Live',
    color: '#4CAF50',
    icon: <CloudDone fontSize="small" />,
    bgColor: alpha('#4CAF50', 0.15),
  },
  publishing: {
    label: 'Publishing',
    color: '#FF9800',
    icon: <Refresh fontSize="small" />,
    bgColor: alpha('#FF9800', 0.15),
  },
  draft: {
    label: 'Draft',
    color: '#78909C',
    icon: <CloudOff fontSize="small" />,
    bgColor: alpha('#78909C', 0.15),
  },
  error: {
    label: 'Error',
    color: '#f44336',
    icon: <ErrorIcon fontSize="small" />,
    bgColor: alpha('#f44336', 0.15),
  },
  offline: {
    label: 'Offline',
    color: '#9E9E9E',
    icon: <CloudOff fontSize="small" />,
    bgColor: alpha('#9E9E9E', 0.15),
  },
};

// Target environment configs
const TARGET_CONFIGS = {
  development: { label: 'Dev', color: '#4FC3F7', icon: '🔧' },
  staging: { label: 'Staging', color: '#FFB74D', icon: '🧪' },
  production: { label: 'Production', color: '#4CAF50', icon: '🚀' },
  custom: { label: 'Custom', color: '#AB47BC', icon: '⚙️' },
};

// Mock analytics data generator
const generateMockAnalytics = (websiteId) => ({
  visitors: Math.floor(Math.random() * 5000) + 100,
  pageViews: Math.floor(Math.random() * 15000) + 500,
  avgSessionTime: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 59)}s`,
  bounceRate: `${Math.floor(Math.random() * 40) + 20}%`,
  topCountries: ['United States', 'United Kingdom', 'Germany', 'France', 'Japan'].slice(0, 3),
  last24h: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
});

export const HostingPlatform = ({
  websites = [],
  onRefresh,
  onToggleStatus,
  onDeleteWebsite,
  onUpdateWebsite,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTarget, setFilterTarget] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [websiteAnalytics, setWebsiteAnalytics] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuWebsiteId, setMenuWebsiteId] = useState(null);
  const [previewWebsiteId, setPreviewWebsiteId] = useState(null);

  // Check for preview website from localStorage
  useEffect(() => {
    const previewId = localStorage.getItem('preview_website_id');
    if (previewId) {
      setPreviewWebsiteId(previewId);
      // Clear after reading
      localStorage.removeItem('preview_website_id');
    }
  }, []);

  // Load analytics when websites change
  useEffect(() => {
    const analytics = {};
    websites.forEach((site) => {
      if (site.status === 'published') {
        analytics[site.id] = generateMockAnalytics(site.id);
      }
    });
    setWebsiteAnalytics(analytics);
  }, [websites]);

  // Filter websites
  const filteredWebsites = websites.filter((site) => {
    const matchesSearch =
      site.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTarget = filterTarget === 'all' || site.target === filterTarget;
    return matchesSearch && matchesTarget;
  });

  // Group by status for tabs
  const liveSites = filteredWebsites.filter((s) => s.status === 'published');
  const draftSites = filteredWebsites.filter((s) => s.status === 'draft');
  const publishingSites = filteredWebsites.filter((s) => s.status === 'publishing');
  const errorSites = filteredWebsites.filter((s) => s.status === 'error');

  const getTabWebsites = () => {
    let sites;
    switch (activeTab) {
      case 0:
        sites = filteredWebsites;
        break;
      case 1:
        sites = liveSites;
        break;
      case 2:
        sites = draftSites;
        break;
      case 3:
        sites = publishingSites;
        break;
      case 4:
        sites = errorSites;
        break;
      default:
        sites = filteredWebsites;
    }

    // If there's a preview website ID, highlight it at the top
    if (previewWebsiteId) {
      const previewSite = sites.find((s) => s.id === previewWebsiteId);
      if (previewSite) {
        // Remove from current position and add to top
        const rest = sites.filter((s) => s.id !== previewWebsiteId);
        return [previewSite, ...rest];
      }
    }
    return sites;
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setSnackbar({ open: true, message: 'URL copied to clipboard!', severity: 'success' });
    });
  };

  const handleOpenWebsite = (domain) => {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    window.open(url, '_blank');
  };

  const handleMenuOpen = (event, websiteId) => {
    setAnchorEl(event.currentTarget);
    setMenuWebsiteId(websiteId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuWebsiteId(null);
  };

  const showDetailDialog = (website) => {
    setSelectedWebsite(website);
    setDetailDialogOpen(true);
  };

  const showAnalyticsDialog = (website) => {
    setSelectedWebsite(website);
    setAnalyticsDialogOpen(true);
  };

  const showShareDialog = (website) => {
    setSelectedWebsite(website);
    setShareDialogOpen(true);
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const getTargetConfig = (target) => TARGET_CONFIGS[target] || TARGET_CONFIGS.custom;

  // Navigate back to PublishManager
  const handleBackToPublish = () => {
    navigate('/publish-manager');
  };

  // Navigate to studio for editing
  const handleEditInStudio = (website) => {
    // Store website data in localStorage
    localStorage.setItem('edit_website_id', website.id);
    localStorage.setItem('edit_website_data', JSON.stringify(website));
    navigate('/studio');
  };

  // Stats cards
  const StatsBar = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[
        { label: 'Total Sites', value: websites.length, icon: <Language />, color: G_START },
        { label: 'Live', value: liveSites.length, icon: <CloudDone />, color: '#4CAF50' },
        {
          label: 'Visitors (24h)',
          value: Object.values(websiteAnalytics)
            .reduce((a, b) => a + (b?.visitors || 0), 0)
            .toLocaleString(),
          icon: <People />,
          color: '#4FC3F7',
        },
        {
          label: 'Storage Used',
          value: `${(websites.length * 12.5).toFixed(1)} MB`,
          icon: <Storage />,
          color: '#FFB74D',
        },
      ].map((stat, idx) => (
        <Grid item xs={6} md={3} key={idx}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha('#FFFFFF', 0.03),
              border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(stat.color, 0.15),
                color: stat.color,
              }}
            >
              {React.cloneElement(stat.icon, { fontSize: 'small' })}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
                {loading ? <Skeleton width={40} /> : stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                {stat.label}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  // Website card component
  const WebsiteCard = ({ website, isPreview }) => {
    const status = getStatusConfig(website.status);
    const target = getTargetConfig(website.target);
    const analytics = websiteAnalytics[website.id];
    const isMenuOpen = Boolean(anchorEl) && menuWebsiteId === website.id;

    return (
      <Card
        sx={{
          bgcolor: isPreview ? alpha(G_START, 0.08) : alpha('#FFFFFF', 0.03),
          border: isPreview
            ? `2px solid ${alpha(G_START, 0.4)}`
            : `1px solid ${alpha('#FFFFFF', 0.08)}`,
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: alpha(G_START, 0.3),
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 32px ${alpha('#000', 0.3)}`,
          },
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {isPreview && (
          <Chip
            label="Preview"
            size="small"
            sx={{
              position: 'absolute',
              top: -10,
              right: 16,
              bgcolor: G_START,
              color: 'white',
              fontWeight: 600,
              height: 20,
              fontSize: '0.6rem',
              zIndex: 10,
            }}
          />
        )}

        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha(target.color, 0.2),
                  color: target.color,
                  fontSize: '1.5rem',
                }}
              >
                {target.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                  {website.name}
                  {isPreview && (
                    <Chip
                      label="Viewing"
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: alpha(G_START, 0.2),
                        color: G_START,
                        height: 16,
                        fontSize: '0.5rem',
                      }}
                    />
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.4) }}>
                  {website.domain || 'No domain configured'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                icon={status.icon}
                label={status.label}
                size="small"
                sx={{
                  bgcolor: status.bgColor,
                  color: status.color,
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: status.color },
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, website.id)}
                sx={{ color: alpha('#FFFFFF', 0.4) }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Description */}
          {website.description && (
            <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5), mb: 2, minHeight: 40 }}>
              {website.description}
            </Typography>
          )}

          {/* Tags */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={target.label}
              size="small"
              sx={{
                bgcolor: alpha(target.color, 0.1),
                color: target.color,
                border: `1px solid ${alpha(target.color, 0.2)}`,
                height: 22,
                fontSize: '0.65rem',
              }}
            />
            {website.isPrivate && (
              <Chip
                icon={<Lock fontSize="small" />}
                label="Private"
                size="small"
                sx={{
                  bgcolor: alpha('#FF9800', 0.1),
                  color: '#FF9800',
                  border: `1px solid ${alpha('#FF9800', 0.2)}`,
                  height: 22,
                  fontSize: '0.65rem',
                }}
              />
            )}
            {website.customDomain && (
              <Chip
                icon={<Dns fontSize="small" />}
                label="Custom Domain"
                size="small"
                sx={{
                  bgcolor: alpha('#4FC3F7', 0.1),
                  color: '#4FC3F7',
                  border: `1px solid ${alpha('#4FC3F7', 0.2)}`,
                  height: 22,
                  fontSize: '0.65rem',
                }}
              />
            )}
          </Box>

          {/* Analytics preview */}
          {analytics && (
            <Paper
              sx={{
                p: 1.5,
                bgcolor: alpha('#FFFFFF', 0.02),
                borderRadius: '10px',
                border: `1px solid ${alpha('#FFFFFF', 0.04)}`,
              }}
            >
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.4), display: 'block' }}
                  >
                    Visitors
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {analytics.visitors.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.4), display: 'block' }}
                  >
                    Views
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {analytics.pageViews.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.4), display: 'block' }}
                  >
                    Bounce
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {analytics.bounceRate}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Last published */}
          {website.lastPublish && (
            <Typography
              variant="caption"
              sx={{ color: alpha('#FFFFFF', 0.3), mt: 1.5, display: 'block' }}
            >
              Last published: {new Date(website.lastPublish).toLocaleDateString()} at{' '}
              {new Date(website.lastPublish).toLocaleTimeString()}
            </Typography>
          )}
        </CardContent>

        <CardActions sx={{ px: 2.5, pb: 2, pt: 0, gap: 1 }}>
          {website.status === 'published' && website.domain && (
            <>
              <Button
                variant="contained"
                size="small"
                startIcon={<Launch fontSize="small" />}
                onClick={() => handleOpenWebsite(website.domain)}
                sx={{
                  background: GRAD,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                Visit Site
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Dashboard fontSize="small" />}
                onClick={() => showDetailDialog(website)}
                sx={{
                  color: 'white',
                  borderColor: alpha('#FFFFFF', 0.2),
                  textTransform: 'none',
                  fontSize: '0.75rem',
                }}
              >
                Details
              </Button>
            </>
          )}
          {website.status === 'draft' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudDone fontSize="small" />}
              onClick={() => onToggleStatus?.(website.id, 'published')}
              sx={{
                color: '#4CAF50',
                borderColor: alpha('#4CAF50', 0.3),
                textTransform: 'none',
                fontSize: '0.75rem',
              }}
            >
              Go Live
            </Button>
          )}
          {website.status === 'error' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh fontSize="small" />}
              onClick={() => onToggleStatus?.(website.id, 'publishing')}
              sx={{
                color: '#FF9800',
                borderColor: alpha('#FF9800', 0.3),
                textTransform: 'none',
                fontSize: '0.75rem',
              }}
            >
              Retry
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Edit in Studio">
            <IconButton
              size="small"
              onClick={() => handleEditInStudio(website)}
              sx={{ color: '#4FC3F7' }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Analytics">
            <IconButton
              size="small"
              onClick={() => showAnalyticsDialog(website)}
              sx={{ color: alpha('#FFFFFF', 0.4) }}
            >
              <BarChart fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton
              size="small"
              onClick={() => showShareDialog(website)}
              sx={{ color: alpha('#FFFFFF', 0.4) }}
            >
              <Share fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardActions>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              bgcolor: '#1A1F2E',
              border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
              borderRadius: '10px',
              minWidth: 180,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              showDetailDialog(website);
              handleMenuClose();
            }}
            sx={{ color: 'white', fontSize: '0.85rem', gap: 1 }}
          >
            <Visibility fontSize="small" sx={{ color: alpha('#FFFFFF', 0.5) }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleEditInStudio(website);
              handleMenuClose();
            }}
            sx={{ color: '#4FC3F7', fontSize: '0.85rem', gap: 1 }}
          >
            <Edit fontSize="small" />
            Edit in Studio
          </MenuItem>
          <MenuItem
            onClick={() => {
              showAnalyticsDialog(website);
              handleMenuClose();
            }}
            sx={{ color: 'white', fontSize: '0.85rem', gap: 1 }}
          >
            <BarChart fontSize="small" sx={{ color: alpha('#FFFFFF', 0.5) }} />
            Analytics
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCopyUrl(website.domain);
              handleMenuClose();
            }}
            sx={{ color: 'white', fontSize: '0.85rem', gap: 1 }}
          >
            <ContentCopy fontSize="small" sx={{ color: alpha('#FFFFFF', 0.5) }} />
            Copy URL
          </MenuItem>
          <Divider sx={{ borderColor: alpha('#FFFFFF', 0.1), my: 0.5 }} />
          <MenuItem
            onClick={() => {
              if (typeof onDeleteWebsite === 'function') onDeleteWebsite(website.id);
              handleMenuClose();
            }}
            sx={{ color: '#ff4444', fontSize: '0.85rem', gap: 1 }}
          >
            <Delete fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      </Card>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0F1A', p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              Hosting Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5) }}>
              Manage and monitor your published websites
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowForward />}
              onClick={handleBackToPublish}
              sx={{
                color: 'white',
                borderColor: alpha('#FFFFFF', 0.2),
                textTransform: 'none',
                '&:hover': { borderColor: G_START },
              }}
            >
              Publish Manager
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              sx={{
                color: 'white',
                borderColor: alpha('#FFFFFF', 0.2),
                textTransform: 'none',
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleBackToPublish}
              sx={{
                background: GRAD,
                textTransform: 'none',
                '&:hover': { opacity: 0.9 },
              }}
            >
              New Deployment
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <StatsBar />

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha('#FFFFFF', 0.02),
          border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          borderRadius: '12px',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search websites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            minWidth: 250,
            '& .MuiInputBase-root': {
              color: 'white',
              bgcolor: alpha('#FFFFFF', 0.05),
              borderRadius: '8px',
            },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.1) },
          }}
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {['all', 'development', 'staging', 'production', 'custom'].map((target) => (
            <Chip
              key={target}
              label={target === 'all' ? 'All' : TARGET_CONFIGS[target]?.label || target}
              onClick={() => setFilterTarget(target)}
              sx={{
                bgcolor: filterTarget === target ? alpha(G_START, 0.2) : alpha('#FFFFFF', 0.05),
                color: filterTarget === target ? G_START : alpha('#FFFFFF', 0.6),
                border: `1px solid ${filterTarget === target ? alpha(G_START, 0.3) : alpha('#FFFFFF', 0.1)}`,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: `1px solid ${alpha('#FFFFFF', 0.08)}` }}
      >
        <Tab
          label={`All (${filteredWebsites.length})`}
          sx={{ color: 'white', textTransform: 'none' }}
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CloudDone fontSize="small" sx={{ color: '#4CAF50' }} />
              Live ({liveSites.length})
            </Box>
          }
          sx={{ color: 'white', textTransform: 'none' }}
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CloudOff fontSize="small" sx={{ color: '#78909C' }} />
              Drafts ({draftSites.length})
            </Box>
          }
          sx={{ color: 'white', textTransform: 'none' }}
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Refresh fontSize="small" sx={{ color: '#FF9800' }} />
              Publishing ({publishingSites.length})
            </Box>
          }
          sx={{ color: 'white', textTransform: 'none' }}
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ErrorIcon fontSize="small" sx={{ color: '#f44336' }} />
              Errors ({errorSites.length})
            </Box>
          }
          sx={{ color: 'white', textTransform: 'none' }}
        />
      </Tabs>

      {/* Website Grid */}
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton
                variant="rectangular"
                height={300}
                sx={{ bgcolor: alpha('#FFFFFF', 0.05), borderRadius: '16px' }}
              />
            </Grid>
          ))}
        </Grid>
      ) : getTabWebsites().length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Public sx={{ fontSize: 80, color: alpha('#FFFFFF', 0.1), mb: 2 }} />
          <Typography variant="h6" sx={{ color: alpha('#FFFFFF', 0.4), mb: 1 }}>
            No websites found
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.3) }}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Publish your first website to get started'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {getTabWebsites().map((website) => (
            <Grid item xs={12} md={6} lg={4} key={website.id}>
              <WebsiteCard website={website} isPreview={website.id === previewWebsiteId} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1F2E',
            borderRadius: '16px',
            border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 1 }}>Website Details</DialogTitle>
        <DialogContent>
          {selectedWebsite && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: alpha(getTargetConfig(selectedWebsite.target).color, 0.2),
                    color: getTargetConfig(selectedWebsite.target).color,
                    fontSize: '2rem',
                  }}
                >
                  {getTargetConfig(selectedWebsite.target).icon}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    {selectedWebsite.name}
                  </Typography>
                  <Chip
                    icon={getStatusConfig(selectedWebsite.status).icon}
                    label={getStatusConfig(selectedWebsite.status).label}
                    size="small"
                    sx={{
                      bgcolor: getStatusConfig(selectedWebsite.status).bgColor,
                      color: getStatusConfig(selectedWebsite.status).color,
                      mt: 0.5,
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ borderColor: alpha('#FFFFFF', 0.1) }} />

              {[
                { label: 'Domain', value: selectedWebsite.domain || 'Not configured' },
                { label: 'Custom Domain', value: selectedWebsite.customDomain || 'None' },
                { label: 'Target', value: getTargetConfig(selectedWebsite.target).label },
                { label: 'Project ID', value: selectedWebsite.projectId || 'N/A' },
                { label: 'Description', value: selectedWebsite.description || 'No description' },
                { label: 'Password Protected', value: selectedWebsite.isPrivate ? 'Yes' : 'No' },
                {
                  label: 'Published At',
                  value: selectedWebsite.publishedAt
                    ? new Date(selectedWebsite.publishedAt).toLocaleString()
                    : 'Never',
                },
                {
                  label: 'Last Publish',
                  value: selectedWebsite.lastPublish
                    ? new Date(selectedWebsite.lastPublish).toLocaleString()
                    : 'Never',
                },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}

              {selectedWebsite.publishHistory && selectedWebsite.publishHistory.length > 0 && (
                <>
                  <Divider sx={{ borderColor: alpha('#FFFFFF', 0.1) }} />
                  <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                    Publish History ({selectedWebsite.publishHistory.length})
                  </Typography>
                  <List dense>
                    {selectedWebsite.publishHistory.slice(-5).map((entry, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(G_START, 0.2) }}>
                            <CheckCircle fontSize="small" sx={{ color: G_START }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={new Date(entry.timestamp).toLocaleString()}
                          secondary={entry.status || 'Published'}
                          primaryTypographyProps={{ color: 'white', fontSize: '0.85rem' }}
                          secondaryTypographyProps={{
                            color: alpha('#FFFFFF', 0.4),
                            fontSize: '0.75rem',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDetailDialogOpen(false)}
            sx={{ color: alpha('#FFFFFF', 0.6), textTransform: 'none' }}
          >
            Close
          </Button>
          {selectedWebsite?.domain && (
            <Button
              variant="contained"
              startIcon={<Launch />}
              onClick={() => handleOpenWebsite(selectedWebsite.domain)}
              sx={{ background: GRAD, textTransform: 'none' }}
            >
              Visit Site
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog
        open={analyticsDialogOpen}
        onClose={() => setAnalyticsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1F2E',
            borderRadius: '16px',
            border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart sx={{ color: G_START }} />
            Analytics Dashboard
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedWebsite && websiteAnalytics[selectedWebsite.id] && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {selectedWebsite.name}
              </Typography>

              <Grid container spacing={2}>
                {[
                  {
                    label: 'Total Visitors',
                    value: websiteAnalytics[selectedWebsite.id].visitors.toLocaleString(),
                    icon: <People />,
                    color: '#4FC3F7',
                  },
                  {
                    label: 'Page Views',
                    value: websiteAnalytics[selectedWebsite.id].pageViews.toLocaleString(),
                    icon: <Visibility />,
                    color: '#4CAF50',
                  },
                  {
                    label: 'Avg Session',
                    value: websiteAnalytics[selectedWebsite.id].avgSessionTime,
                    icon: <Timeline />,
                    color: '#FFB74D',
                  },
                  {
                    label: 'Bounce Rate',
                    value: websiteAnalytics[selectedWebsite.id].bounceRate,
                    icon: <TrendingUp />,
                    color: '#AB47BC',
                  },
                ].map((stat) => (
                  <Grid item xs={6} md={3} key={stat.label}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha('#FFFFFF', 0.03),
                        border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                        {stat.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha('#FFFFFF', 0.03),
                  border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
                  borderRadius: '12px',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
                  Top Countries
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {websiteAnalytics[selectedWebsite.id].topCountries.map((country) => (
                    <Chip
                      key={country}
                      icon={<Language fontSize="small" />}
                      label={country}
                      sx={{
                        bgcolor: alpha('#FFFFFF', 0.05),
                        color: 'white',
                        border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                      }}
                    />
                  ))}
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha('#FFFFFF', 0.03),
                  border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
                  borderRadius: '12px',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
                  Hourly Traffic (Last 24h)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120 }}>
                  {websiteAnalytics[selectedWebsite.id].last24h.map((value, idx) => (
                    <Tooltip key={idx} title={`${value} visits`}>
                      <Box
                        sx={{
                          flex: 1,
                          height: `${(value / 100) * 100}%`,
                          minHeight: 4,
                          bgcolor: alpha(G_START, 0.3 + value / 200),
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.3s ease',
                          '&:hover': { bgcolor: G_START },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.3) }}>
                    24h ago
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.3) }}>
                    Now
                  </Typography>
                </Box>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAnalyticsDialogOpen(false)}
            sx={{ color: alpha('#FFFFFF', 0.6), textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1F2E',
            borderRadius: '16px',
            border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Share Website</DialogTitle>
        <DialogContent>
          {selectedWebsite && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                value={
                  selectedWebsite.domain
                    ? `https://${selectedWebsite.domain}`
                    : 'No domain configured'
                }
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => handleCopyUrl(`https://${selectedWebsite.domain}`)}
                sx={{
                  color: 'white',
                  borderColor: alpha('#FFFFFF', 0.2),
                  textTransform: 'none',
                }}
              >
                Copy Link
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<OpenInNew />}
                onClick={() => handleOpenWebsite(selectedWebsite.domain)}
                sx={{
                  background: GRAD,
                  textTransform: 'none',
                }}
              >
                Open in New Tab
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShareDialogOpen(false)}
            sx={{ color: alpha('#FFFFFF', 0.6), textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            bgcolor:
              snackbar.severity === 'success' ? alpha('#4CAF50', 0.15) : alpha('#f44336', 0.15),
            color: snackbar.severity === 'success' ? '#4CAF50' : '#f44336',
            border: `1px solid ${snackbar.severity === 'success' ? alpha('#4CAF50', 0.3) : alpha('#f44336', 0.3)}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HostingPlatform;
