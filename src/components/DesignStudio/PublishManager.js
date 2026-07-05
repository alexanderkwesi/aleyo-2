// PublishManager.js - Multi-website publishing component with HostingPlatform integration

import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Tooltip,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  CloudUpload,
  Link as LinkIcon,
  Public,
  Lock,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  ArrowForward,
  GitHub,
  Code,
  Settings,
  Dashboard,
} from '@mui/icons-material';
import { G_START, GRAD, generateId } from './DesignStudioUtils';
import { useNavigate } from 'react-router-dom';

// Define publish targets locally to avoid import issues
const PUBLISH_TARGETS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  CUSTOM: 'custom',
};

const publishTargetConfigs = {
  development: {
    label: 'Development',
    icon: '🔧',
    subdomain: 'dev',
    description: 'Development preview environment',
  },
  staging: {
    label: 'Staging',
    icon: '🧪',
    subdomain: 'staging',
    description: 'Staging environment for testing',
  },
  production: {
    label: 'Production',
    icon: '🚀',
    subdomain: '',
    description: 'Live production website',
  },
  custom: {
    label: 'Custom',
    icon: '⚙️',
    subdomain: '',
    description: 'Custom deployment target',
  },
};

export const PublishManager = ({
  websites = [],
  onAddWebsite,
  onUpdateWebsite,
  onDeleteWebsite,
  onPublishWebsite,
  onPreviewWebsite,
  currentProjectId,
  onClose = () => {},
}) => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [dialogData, setDialogData] = useState({
    name: '',
    domain: '',
    target: 'production',
    description: '',
    customDomain: '',
    password: '',
    isPrivate: false,
  });
  const [publishingId, setPublishingId] = useState(null);

  const handleOpenDialog = (website = null) => {
    if (website) {
      setEditingWebsite(website);
      setDialogData({
        name: website.name || '',
        domain: website.domain || '',
        target: website.target || 'production',
        description: website.description || '',
        customDomain: website.customDomain || '',
        password: website.password || '',
        isPrivate: website.isPrivate || false,
      });
    } else {
      setEditingWebsite(null);
      setDialogData({
        name: '',
        domain: '',
        target: 'production',
        description: '',
        customDomain: '',
        password: '',
        isPrivate: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingWebsite(null);
  };

  const handleSaveWebsite = () => {
    const websiteData = {
      id: editingWebsite?.id || generateId(),
      name: dialogData.name,
      domain: dialogData.domain,
      target: dialogData.target,
      description: dialogData.description,
      customDomain: dialogData.customDomain,
      password: dialogData.password,
      isPrivate: dialogData.isPrivate,
      projectId: currentProjectId,
      publishedAt: editingWebsite?.publishedAt || null,
      status: editingWebsite?.status || 'draft',
      lastPublish: editingWebsite?.lastPublish || null,
      publishHistory: editingWebsite?.publishHistory || [],
    };

    if (editingWebsite) {
      onUpdateWebsite(websiteData);
    } else {
      onAddWebsite(websiteData);
    }
    handleCloseDialog();
  };

  const handlePublish = async (websiteId) => {
    setPublishingId(websiteId);
    try {
      await onPublishWebsite(websiteId);
    } catch (error) {
      console.error('Publish error:', error);
    }
    setPublishingId(null);
  };

  // Navigate to HostingPlatform
  const handleViewInHosting = () => {
    navigate('/hosting');
    if (onClose) onClose();
  };

  // Handle preview - navigate to HostingPlatform with website ID
  const handlePreview = (websiteId) => {
    // Store the website ID in localStorage or state for the hosting page to use
    localStorage.setItem('preview_website_id', websiteId);
    navigate('/hosting');
    if (onClose) onClose();
  };

  // Handle open in hosting platform
  const handleOpenHosting = () => {
    navigate('/hosting');
    if (onClose) onClose();
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'published':
        return <Chip label="Published" size="small" sx={{ bgcolor: '#4CAF50', color: 'white' }} />;
      case 'publishing':
        return (
          <Chip label="Publishing..." size="small" sx={{ bgcolor: '#FF9800', color: 'white' }} />
        );
      case 'draft':
        return <Chip label="Draft" size="small" sx={{ bgcolor: '#78909C', color: 'white' }} />;
      case 'error':
        return <Chip label="Error" size="small" sx={{ bgcolor: '#f44336', color: 'white' }} />;
      default:
        return <Chip label="Unknown" size="small" />;
    }
  };

  const getTargetIcon = (target) => {
    const config = publishTargetConfigs[target];
    return config ? config.icon : '🌐';
  };

  const getTargetColor = (target) => {
    switch (target) {
      case 'development':
        return '#4FC3F7';
      case 'staging':
        return '#FFB74D';
      case 'production':
        return '#4CAF50';
      case 'custom':
        return '#AB47BC';
      default:
        return '#9E9E9E';
    }
  };

  // Safe check for publishTargetConfigs entries
  const getTargetEntries = () => {
    try {
      return Object.entries(publishTargetConfigs || {});
    } catch (e) {
      console.warn('Error getting target entries:', e);
      return [];
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Published Websites
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Hosting Dashboard">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Dashboard />}
              onClick={handleOpenHosting}
              sx={{
                color: '#4FC3F7',
                borderColor: alpha('#4FC3F7', 0.3),
                '&:hover': { borderColor: '#4FC3F7', bgcolor: alpha('#4FC3F7', 0.1) },
              }}
            >
              Hosting Dashboard
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: GRAD,
              '&:hover': { opacity: 0.9 },
            }}
          >
            New Website
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />

      {websites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Public sx={{ fontSize: 64, color: alpha('#FFFFFF', 0.2) }} />
          <Typography variant="body1" sx={{ color: alpha('#FFFFFF', 0.5), mt: 2 }}>
            No websites published yet
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.3) }}>
            Create your first website deployment
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2, color: 'white', borderColor: alpha('#FFFFFF', 0.2) }}
          >
            Publish Website
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {websites.map((website) => (
            <Grid item xs={12} key={website.id}>
              <Card
                sx={{
                  bgcolor: alpha('#FFFFFF', 0.05),
                  border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: alpha(G_START, 0.3),
                    boxShadow: `0 4px 20px ${alpha('#000', 0.3)}`,
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {website.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: alpha('#FFFFFF', 0.5), display: 'block', mt: 0.5 }}
                      >
                        {website.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${getTargetIcon(website.target)} ${website.target}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(getTargetColor(website.target), 0.2),
                            color: getTargetColor(website.target),
                            borderColor: getTargetColor(website.target),
                          }}
                        />
                        {getStatusChip(website.status)}
                        {website.isPrivate && (
                          <Chip
                            label="Private"
                            size="small"
                            icon={<Lock />}
                            sx={{ bgcolor: alpha('#FF9800', 0.2), color: '#FF9800' }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View in Hosting Platform">
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(website.id)}
                          sx={{ color: '#4FC3F7' }}
                        >
                          <Dashboard fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(website)}
                          sx={{ color: alpha('#FFFFFF', 0.5) }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => onDeleteWebsite(website.id)}
                          sx={{ color: '#ff4444' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {website.domain && (
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon sx={{ color: alpha('#FFFFFF', 0.4), fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: '#4FC3F7' }}>
                        {website.customDomain || website.domain}
                      </Typography>
                    </Box>
                  )}

                  {website.lastPublish && (
                    <Typography
                      variant="caption"
                      sx={{ color: alpha('#FFFFFF', 0.3), mt: 1, display: 'block' }}
                    >
                      Last published: {new Date(website.lastPublish).toLocaleString()}
                    </Typography>
                  )}

                  {website.publishHistory && website.publishHistory.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: alpha('#FFFFFF', 0.2), mt: 0.5, display: 'block' }}
                    >
                      Published {website.publishHistory.length} time
                      {website.publishHistory.length > 1 ? 's' : ''}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
                  {publishingId === website.id ? (
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress sx={{ bgcolor: alpha('#FFFFFF', 0.1) }} />
                      <Typography
                        variant="caption"
                        sx={{ color: alpha('#FFFFFF', 0.5), mt: 0.5, display: 'block' }}
                      >
                        Publishing...
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloudUpload />}
                        onClick={() => handlePublish(website.id)}
                        disabled={website.status === 'publishing'}
                        sx={{
                          color: G_START,
                          borderColor: G_START,
                          '&:hover': { bgcolor: alpha(G_START, 0.1) },
                        }}
                      >
                        {website.status === 'published' ? 'Republish' : 'Publish'}
                      </Button>
                      {website.domain && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Dashboard />}
                          onClick={() => handlePreview(website.id)}
                          sx={{
                            color: '#4FC3F7',
                            borderColor: alpha('#4FC3F7', 0.3),
                            '&:hover': { borderColor: '#4FC3F7', bgcolor: alpha('#4FC3F7', 0.1) },
                          }}
                        >
                          Hosting
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<GitHub />}
                        sx={{
                          color: 'white',
                          borderColor: alpha('#FFFFFF', 0.2),
                          '&:hover': { borderColor: '#4FC3F7' },
                        }}
                      >
                        Export Code
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1F2E',
            borderRadius: '12px',
            border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {editingWebsite ? 'Edit Website' : 'New Website Deployment'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Website Name"
              value={dialogData.name}
              onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })}
              placeholder="My Website"
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              }}
            />

            <TextField
              fullWidth
              label="Domain URL"
              value={dialogData.domain}
              onChange={(e) => setDialogData({ ...dialogData, domain: e.target.value })}
              placeholder="my-website.example.com"
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              }}
            />

            <TextField
              fullWidth
              label="Custom Domain (optional)"
              value={dialogData.customDomain}
              onChange={(e) => setDialogData({ ...dialogData, customDomain: e.target.value })}
              placeholder="www.mywebsite.com"
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              }}
            />

            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>Deployment Target</InputLabel>
              <Select
                value={dialogData.target}
                onChange={(e) => setDialogData({ ...dialogData, target: e.target.value })}
                label="Deployment Target"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              >
                {getTargetEntries().map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.icon} {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={dialogData.description}
              onChange={(e) => setDialogData({ ...dialogData, description: e.target.value })}
              placeholder="Brief description of this website deployment"
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              }}
            />

            <TextField
              fullWidth
              label="Password (optional)"
              type="password"
              value={dialogData.password}
              onChange={(e) => setDialogData({ ...dialogData, password: e.target.value })}
              placeholder="Set a password for private access"
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dialogData.isPrivate}
                  onChange={(e) => setDialogData({ ...dialogData, isPrivate: e.target.checked })}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: G_START } }}
                />
              }
              label="Private website (requires password)"
              sx={{ color: 'white' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: alpha('#FFFFFF', 0.6) }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveWebsite}
            variant="contained"
            sx={{
              background: GRAD,
              '&:hover': { opacity: 0.9 },
            }}
          >
            {editingWebsite ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublishManager;
