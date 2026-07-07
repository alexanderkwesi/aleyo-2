// Integrations.js - Fixed API Endpoints
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
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  LinearProgress,
  Alert,
  Snackbar,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Payment,
  Mail,
  WhatsApp,
  Instagram,
  Facebook,
  Twitter,
  CloudUpload,
  Analytics,
  Security,
  Storage,
  Api,
  CheckCircle,
  Link as LinkIcon,
  Language,
  MusicNote,
  Chat,
  Close,
  Campaign,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const G_START = '#4F6EF7';
const G_MID = '#2DBCB6';
const G_END = '#3ED67C';
const GRAD = `linear-gradient(135deg, ${G_START} 0%, ${G_MID} 50%, ${G_END} 100%)`;
const REACT_APP_API_URL = "https://aleyo-2-six.vercel.app";
const API_BASE_URL = REACT_APP_API_URL || 'http://127.0.0.1:3001';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'forms', label: 'Forms' },
  { value: 'payment', label: 'Payments' },
  { value: 'email', label: 'Email' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'ads', label: 'Advertising' },
];

const Integrations = () => {
  const theme = useTheme();
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableIntegrations, setAvailableIntegrations] = useState([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configData, setConfigData] = useState({
    project_id: '',
    settings: {},
    is_active: true,
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (token) {
      fetchIntegrations();
      fetchProjects();
    }
  }, [token]);

  const fetchIntegrations = async () => {
    if (!token) {
      setAvailableIntegrations([]);
      setConnectedIntegrations([]);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [availableRes, connectedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/integrations/available`, { headers }),
        fetch(`${API_BASE_URL}/api/integrations/connected`, { headers }),
      ]);
      if (!availableRes.ok || !connectedRes.ok) {
        throw new Error('Failed to fetch integrations');
      }
      const available = await availableRes.json();
      const connected = await connectedRes.json();
      setAvailableIntegrations(Array.isArray(available) ? available : []);
      setConnectedIntegrations(Array.isArray(connected) ? connected : []);
    } catch (error) {
      setAvailableIntegrations([]);
      setConnectedIntegrations([]);
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
    setConfigData({
      project_id: projects.length > 0 ? projects[0].id : '',
      settings: {},
      is_active: true,
    });
    setConfigDialog(true);
  };

  const handleConfigure = async () => {
    if (!selectedIntegration) return;

    // Build settings from the integration's required fields
    const settings = {};
    if (selectedIntegration.settings) {
      selectedIntegration.settings.forEach((field) => {
        if (field.key === 'api_key') {
          // Get the API key from the config dialog
          const apiKeyInput = document.getElementById('api_key_input');
          if (apiKeyInput) {
            settings[field.key] = apiKeyInput.value;
          }
        } else {
          // For other fields, use the configData.settings
          settings[field.key] = configData.settings[field.key] || '';
        }
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/integrations/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider_id: selectedIntegration.id,
          project_id: configData.project_id,
          settings: settings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to connect integration');
      }

      const data = await response.json();
      showSnackbar(`${selectedIntegration.name} connected successfully!`, 'success');
      setConfigDialog(false);
      fetchIntegrations();
    } catch (error) {
      console.error('Error connecting integration:', error);
      showSnackbar(error.message || 'Failed to connect integration', 'error');
    }
  };

  const handleDisconnect = async (integrationId, integrationName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to disconnect');
      }

      showSnackbar(`${integrationName} disconnected successfully`, 'info');
      fetchIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      showSnackbar(error.message || 'Failed to disconnect integration', 'error');
    }
  };

  const isConnected = (integrationId) => {
    return connectedIntegrations.some((conn) => conn.provider === integrationId);
  };

  const getConnectedIntegrationId = (integrationId) => {
    const integration = connectedIntegrations.find((conn) => conn.provider === integrationId);
    return integration?.id;
  };

  const getIcon = (iconName) => {
    const icons = {
      Payment: Payment,
      Mail: Mail,
      WhatsApp: WhatsApp,
      Instagram: Instagram,
      Facebook: Facebook,
      Twitter: Twitter,
      Analytics: Analytics,
      Storage: Storage,
      Security: Security,
      Api: Api,
      MusicNote: MusicNote,
      Chat: Chat,
      CloudUpload: CloudUpload,
      Calendar: Chat,
      Forms: Chat,
      Advertising: Campaign,
    };
    const Icon = icons[iconName] || Api;
    return <Icon />;
  };

  const filteredIntegrations = availableIntegrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = connectedIntegrations.length;
  const totalCount = availableIntegrations.length;

  return (
    <Box sx={{ bgcolor: '#080C14', minHeight: '100vh', pt: 2 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            Integrations
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Connect your favorite tools and services to enhance your website
          </Typography>
        </motion.div>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
                sx: {
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: G_START,
                  },
                },
              }}
              sx={{ '& input': { color: 'white' } }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <Chip
                  key={cat.value}
                  label={cat.label}
                  onClick={() => setSelectedCategory(cat.value)}
                  sx={{
                    bgcolor:
                      selectedCategory === cat.value
                        ? alpha(G_START, 0.2)
                        : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${
                      selectedCategory === cat.value ? G_START : 'rgba(255,255,255,0.1)'
                    }`,
                    color: selectedCategory === cat.value ? G_START : 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      bgcolor: alpha(G_START, 0.1),
                    },
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        <Card
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(G_START, 0.1)} 0%, ${alpha(G_MID, 0.1)} 100%)`,
            border: `1px solid ${alpha(G_START, 0.2)}`,
            borderRadius: '16px',
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Integration Status
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {connectedCount} of {totalCount} integrations connected
                </Typography>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 300 } }}>
                <LinearProgress
                  variant="determinate"
                  value={totalCount > 0 ? (connectedCount / totalCount) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { background: GRAD },
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <LinearProgress sx={{ width: 200 }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredIntegrations.map((integration, index) => {
              const connected = isConnected(integration.id);
              return (
                <Grid item xs={12} sm={6} md={4} key={integration.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid rgba(255,255,255,0.08)`,
                        borderRadius: '16px',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: alpha(G_START, 0.3),
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: alpha('#4F6EF7', 0.2),
                              width: 48,
                              height: 48,
                              color: '#4F6EF7',
                            }}
                          >
                            {getIcon(integration.icon)}
                          </Avatar>
                          {connected && (
                            <Chip
                              label="Connected"
                              size="small"
                              sx={{
                                bgcolor: alpha(G_MID, 0.2),
                                color: G_MID,
                                fontSize: '0.7rem',
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                          {integration.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                          {integration.description}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        {connected ? (
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() =>
                              handleDisconnect(
                                getConnectedIntegrationId(integration.id),
                                integration.name
                              )
                            }
                            sx={{
                              borderColor: 'rgba(255,0,0,0.3)',
                              color: '#ff4444',
                              '&:hover': {
                                borderColor: '#ff4444',
                                bgcolor: alpha('#ff4444', 0.1),
                              },
                            }}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleConnect(integration)}
                            sx={{
                              background: GRAD,
                              color: 'white',
                              '&:hover': {
                                opacity: 0.9,
                              },
                            }}
                          >
                            Connect
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        )}

        {filteredIntegrations.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
              No integrations found. Try adjusting your search.
            </Typography>
          </Box>
        )}

        {/* Configuration Dialog */}
        <Dialog
          open={configDialog}
          onClose={() => setConfigDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: '#0D1220',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
            },
          }}
        >
          <DialogTitle
            sx={{
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Connect {selectedIntegration?.name}
            <IconButton
              onClick={() => setConfigDialog(false)}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {projects.length > 0 ? (
                <>
                  <TextField
                    select
                    fullWidth
                    label="Select Project"
                    value={configData.project_id}
                    onChange={(e) => setConfigData({ ...configData, project_id: e.target.value })}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    }}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  {selectedIntegration?.settings?.map((field) => (
                    <TextField
                      key={field.key}
                      fullWidth
                      label={field.label}
                      type={field.type === 'password' ? 'password' : 'text'}
                      id={field.key === 'api_key' ? 'api_key_input' : undefined}
                      value={configData.settings[field.key] || ''}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          settings: {
                            ...configData.settings,
                            [field.key]: e.target.value,
                          },
                        })
                      }
                      required={field.required}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                      }}
                    />
                  ))}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Switch
                      checked={configData.is_active}
                      onChange={(e) =>
                        setConfigData({ ...configData, is_active: e.target.checked })
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: G_START,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: G_START,
                        },
                      }}
                    />
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Enable this integration
                    </Typography>
                  </Box>
                </>
              ) : (
                <Alert severity="warning" sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}>
                  You need to create a project first before connecting integrations.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfigDialog(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfigure}
              disabled={
                !configData.project_id || Object.values(configData.settings).some((v) => !v)
              }
              sx={{
                background: GRAD,
                borderRadius: '999px',
                textTransform: 'none',
                '&:hover': { opacity: 0.9 },
              }}
            >
              Connect Integration
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              bgcolor: '#1A1F2A',
              color: 'white',
              '& .MuiAlert-icon': {
                color:
                  snackbar.severity === 'success'
                    ? G_MID
                    : snackbar.severity === 'error'
                      ? '#ff4444'
                      : G_START,
              },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Integrations;
