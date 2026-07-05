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
  IconButton,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Backdrop,
  Fade,
  Modal,
} from '@mui/material';
import {
  Add,
  Rocket,
  DesignServices,
  IntegrationInstructions,
  Payment,
  TrendingUp,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Storefront,
  School,
  Restaurant,
  Business,
  Code,
  Speed,
  CloudQueue,
  Download,
  Publish,
  Close,
  Lock,
  Warning as WarningIcon,
  ShoppingCart,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Chart from 'react-apexcharts';
import { downloadWebsiteAsZip } from './DesignStudio';

const G_START = '#4F6EF7';
const G_MID = '#2DBCB6';
const G_END = '#3ED67C';
const GRAD = `linear-gradient(135deg, ${G_START} 0%, ${G_MID} 50%, ${G_END} 100%)`;
const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const TOKEN_LOCK_THRESHOLD = 50;

// ── Helper to get component count ──
const getComponentCount = (project) => {
  const customizations = project.customizations || {};
  return (customizations.components || project.components || []).length;
};

const getTextElementCount = (project) => {
  const customizations = project.customizations || {};
  return (customizations.textElements || project.textElements || []).length;
};

// ── Helper to get project icon ──
const getProjectIcon = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('business') || n.includes('company') || n.includes('corp')) return <Business />;
  if (n.includes('portfolio') || n.includes('creative')) return <DesignServices />;
  if (n.includes('shop') || n.includes('store') || n.includes('ecom')) return <Storefront />;
  if (n.includes('school') || n.includes('edu') || n.includes('learn')) return <School />;
  if (n.includes('restaurant') || n.includes('food') || n.includes('cafe')) return <Restaurant />;
  return <Code />;
};

// ── Helper to check if project has published URL ──
const isPublished = (project) => {
  return project.status === 'published' || !!project.published_url;
};

// ── Helper to get publish URL ──
const getPublishUrl = (project) => {
  if (project.published_url) return project.published_url;
  if (project.slug) return `${window.location.origin}/p/${project.slug}`;
  return null;
};

// ── Time ago function ──
const timeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
};

// ─── TOKEN LOCK MODAL ──────────────────────────────────────────────────────
const TokenLockModal = ({ open, creditsRemaining, onClose, onBuyCredits }) => {
  return (
    <Modal
      open={open}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Fade in={open}>
        <Box
          sx={{
            bgcolor: '#0A0F1A',
            borderRadius: '20px',
            border: `1px solid ${alpha('#FF6B6B', 0.3)}`,
            maxWidth: 480,
            width: '95%',
            p: 4,
            position: 'relative',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          }}
        >
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: alpha('#FF6B6B', 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Lock sx={{ fontSize: 36, color: '#FF6B6B' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
              Low Credits
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              You need at least <strong style={{ color: '#FF6B6B' }}>50 credits</strong> to continue
              building and publishing websites.
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '12px',
              bgcolor: alpha('#FF6B6B', 0.08),
              border: `1px solid ${alpha('#FF6B6B', 0.15)}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Current Credits
            </Typography>
            <Typography variant="h6" sx={{ color: '#FF6B6B', fontWeight: 'bold' }}>
              {creditsRemaining}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 1 }}
            >
              Your projects are still saved. Purchase credits to unlock all features.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((creditsRemaining / 100) * 100, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.06)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #FF6B6B, #FFB347)',
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{
                color: 'rgba(255,255,255,0.6)',
                borderColor: 'rgba(255,255,255,0.15)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
                borderRadius: '10px',
                py: 1.5,
              }}
            >
              Close
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onBuyCredits}
              startIcon={<ShoppingCart />}
              sx={{
                background: GRAD,
                borderRadius: '10px',
                fontWeight: 700,
                py: 1.5,
                '&:hover': { opacity: 0.9 },
              }}
            >
              Buy Credits
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    creditsUsed: 0,
    creditsRemaining: 0,
    websitesPublished: 0,
    monthlyGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [creditUsage, setCreditUsage] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);

  // ── Dialog states ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [projectToPublish, setProjectToPublish] = useState(null);
  const [publishUrl, setPublishUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Token Lock state ──
  const [tokenLockOpen, setTokenLockOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // ── Snackbar ──
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── Check token lock status ──
  const checkTokenLock = (credits) => {
    if (credits < TOKEN_LOCK_THRESHOLD && credits >= 0) {
      setIsLocked(true);
      setTokenLockOpen(true);
      return true;
    }
    setIsLocked(false);
    setTokenLockOpen(false);
    return false;
  };

  // ── Handle buy credits ──
  const handleBuyCredits = () => {
    setTokenLockOpen(false);
    navigate('/pricing');
  };

  // ── Handle token lock close ──
  const handleTokenLockClose = () => {
    if (stats.creditsRemaining >= TOKEN_LOCK_THRESHOLD) {
      setTokenLockOpen(false);
      setIsLocked(false);
    } else {
      // Keep it open if still below threshold
      setTokenLockOpen(true);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [token]);

  // ── Keep dashboard data live ──
  useEffect(() => {
    if (!token) return;

    const POLL_INTERVAL = 60 * 1000;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    }, POLL_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [token]);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const projectsRes = await fetch(`${API_BASE}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectsRes.ok) {
        if (projectsRes.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch projects');
      }

      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      // Fetch credit balance
      const balanceRes = await fetch(`${API_BASE}/api/credits/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let creditsRemaining = 0;
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        creditsRemaining = balanceData.credits || 0;

        // ── Check token lock ──
        checkTokenLock(creditsRemaining);
      }

      // Fetch credit transactions
      const transactionsRes = await fetch(`${API_BASE}/api/credits/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let transactions = [];
      if (transactionsRes.ok) {
        transactions = await transactionsRes.json();
        setCreditTransactions(transactions);
      }

      // Calculate stats
      const totalProjects = projectsData.length;
      const publishedProjects = projectsData.filter((p) => isPublished(p)).length;

      const creditsUsed = transactions
        .filter((t) => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentProjects = projectsData.filter((p) => new Date(p.created_at) >= thirtyDaysAgo);
      const olderProjects = projectsData.filter(
        (p) => new Date(p.created_at) >= sixtyDaysAgo && new Date(p.created_at) < thirtyDaysAgo
      );

      const monthlyGrowth =
        olderProjects.length > 0
          ? Math.round(
              ((recentProjects.length - olderProjects.length) / olderProjects.length) * 100
            )
          : recentProjects.length > 0
            ? 100
            : 0;

      setStats({
        totalProjects,
        creditsUsed,
        creditsRemaining,
        websitesPublished: publishedProjects,
        monthlyGrowth: Math.max(0, monthlyGrowth),
      });

      // Prepare credit usage data for chart
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        last6Months.push(monthName);
      }

      const monthlyUsage = last6Months.map((month) => {
        const monthTransactions = transactions.filter((t) => {
          const txDate = new Date(t.created_at);
          return (
            txDate.toLocaleString('default', { month: 'short' }) === month && t.type === 'usage'
          );
        });
        return monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      });

      setCreditUsage(
        last6Months.map((month, index) => ({
          month,
          usage: monthlyUsage[index] || 0,
        }))
      );

      // Prepare recent activity
      const activities = [];

      projectsData.slice(0, 3).forEach((p) => {
        activities.push({
          id: `project-${p.id}`,
          action: 'Created project',
          project: p.name,
          timestamp: new Date(p.created_at).getTime(),
          time: timeAgo(p.created_at),
          icon: <DesignServices />,
        });
      });

      projectsData
        .filter((p) => isPublished(p))
        .slice(0, 2)
        .forEach((p) => {
          activities.push({
            id: `publish-${p.id}`,
            action: 'Published website',
            project: p.name,
            timestamp: new Date(p.updated_at).getTime(),
            time: timeAgo(p.updated_at),
            icon: <Rocket />,
          });
        });

      transactions.slice(0, 3).forEach((t) => {
        const isUsage = t.type === 'usage';
        activities.push({
          id: `tx-${t.id}`,
          action: isUsage ? `Used ${Math.abs(t.amount)} credits` : `Purchased ${t.amount} credits`,
          project: t.description || 'Credits',
          timestamp: new Date(t.created_at).getTime(),
          time: timeAgo(t.created_at),
          icon: isUsage ? <TrendingUp /> : <Payment />,
        });
      });

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 10));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (isLocked) {
      setTokenLockOpen(true);
      return;
    }
    navigate('/designs');
  };

  const handleEditProject = (project) => {
    if (isLocked) {
      setTokenLockOpen(true);
      return;
    }
    navigate(`/studio?project=${encodeURIComponent(project.id)}`);
  };

  const handleDeleteClick = (project) => {
    if (isLocked) {
      setTokenLockOpen(true);
      return;
    }
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== projectToDelete.id));
        showSnackbar(`"${projectToDelete.name}" deleted successfully`, 'info');
        loadDashboardData(true);
      } else {
        showSnackbar('Failed to delete project', 'error');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      showSnackbar('Error deleting project', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handlePublishClick = (project) => {
    if (isLocked) {
      setTokenLockOpen(true);
      return;
    }
    setProjectToPublish(project);
    setPublishUrl(getPublishUrl(project) || '');
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (!projectToPublish) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectToPublish.id}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.published_url || getPublishUrl(projectToPublish);
        setPublishUrl(url);
        showSnackbar(`"${projectToPublish.name}" published successfully! 🎉`, 'success');
        loadDashboardData(true);
      } else {
        const error = await res.json();
        showSnackbar(error.detail || 'Failed to publish website', 'error');
      }
    } catch (err) {
      console.error('Error publishing project:', err);
      showSnackbar('Error publishing website', 'error');
    } finally {
      setPublishing(false);
      setPublishDialogOpen(false);
      setProjectToPublish(null);
    }
  };

  const handleDownloadWebsite = async (project) => {
    if (isLocked) {
      setTokenLockOpen(true);
      return;
    }
    try {
      const projectData = {
        id: project.id,
        name: project.name,
        components: project.customizations?.components || project.components || [],
        textElements: project.customizations?.textElements || project.textElements || [],
        imageElements: project.customizations?.imageElements || project.imageElements || [],
        uploadedImages: project.customizations?.uploadedImages || project.uploadedImages || [],
        styles: project.customizations?.styles || project.styles || {},
        pages: project.customizations?.pages || project.pages || [],
        status: project.status || 'draft',
        slug: project.slug,
      };
      await downloadWebsiteAsZip(projectData);
      showSnackbar(`"${project.name}" downloaded successfully! 📦`, 'success');
    } catch (error) {
      console.error('Error downloading website:', error);
      showSnackbar('Error downloading website. Please try again.', 'error');
    }
  };

  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#ffffff',
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
    xaxis: {
      categories: creditUsage.map((item) => item.month),
      labels: { style: { colors: 'rgba(255,255,255,0.6)' } },
    },
    yaxis: {
      title: { text: 'Credits Used', style: { color: 'rgba(255,255,255,0.6)' } },
      labels: { style: { colors: 'rgba(255,255,255,0.6)' } },
    },
    colors: [G_START],
    tooltip: { theme: 'dark' },
  };

  const chartSeries = [{ name: 'Credit Usage', data: creditUsage.map((item) => item.usage) }];

  // ── Show lock overlay on project cards when locked ──
  const ProjectCard = ({ project, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLocked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isLocked ? alpha('#FF6B6B', 0.15) : 'rgba(255,255,255,0.05)'}`,
          borderRadius: '12px',
          transition: 'all 0.3s',
          position: 'relative',
          opacity: isLocked ? 0.6 : 1,
          '&:hover': {
            transform: isLocked ? 'none' : 'translateX(4px)',
            bgcolor: isLocked ? 'rgba(255,255,255,0.01)' : alpha(G_START, 0.05),
          },
        }}
      >
        {isLocked && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: alpha('#FF6B6B', 0.12),
              px: 1,
              py: 0.3,
              borderRadius: '6px',
            }}
          >
            <Lock sx={{ fontSize: 14, color: '#FF6B6B' }} />
            <Typography
              variant="caption"
              sx={{ color: '#FF6B6B', fontSize: '0.6rem', fontWeight: 600 }}
            >
              Locked
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha(G_START, 0.1), opacity: isLocked ? 0.4 : 1 }}>
            {getProjectIcon(project.name)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white' }}>
              {project.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={isPublished(project) ? 'Published' : 'Draft'}
                size="small"
                color={isPublished(project) ? 'success' : 'warning'}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Updated: {timeAgo(project.updated_at)}
              </Typography>
              {project.slug && (
                <Typography variant="caption" sx={{ color: G_START }}>
                  /{project.slug}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {!isPublished(project) && (
            <Tooltip title={isLocked ? 'Locked - Need credits' : 'Publish'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => handlePublishClick(project)}
                  disabled={isLocked}
                  sx={{ color: isLocked ? 'rgba(255,255,255,0.2)' : G_END }}
                >
                  <Publish />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {isPublished(project) && (
            <Tooltip title="View Live">
              <IconButton
                size="small"
                onClick={() => window.open(getPublishUrl(project), '_blank')}
                sx={{ color: G_START }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isLocked ? 'Locked - Need credits' : 'Edit'}>
            <span>
              <IconButton
                size="small"
                onClick={() => handleEditProject(project)}
                disabled={isLocked}
                sx={{ color: isLocked ? 'rgba(255,255,255,0.2)' : G_MID }}
              >
                <Edit />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isLocked ? 'Locked - Need credits' : 'Download ZIP'}>
            <span>
              <IconButton
                size="small"
                onClick={() => handleDownloadWebsite(project)}
                disabled={isLocked}
                sx={{ color: isLocked ? 'rgba(255,255,255,0.2)' : G_START }}
              >
                <Download />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isLocked ? 'Locked - Need credits' : 'Delete'}>
            <span>
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(project)}
                disabled={isLocked}
                sx={{ color: isLocked ? 'rgba(255,255,255,0.2)' : '#ff4444' }}
              >
                <Delete />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>
    </motion.div>
  );

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: '#080C14',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: G_START }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: '#080C14', minHeight: '100vh', pt: 4 }}>
        <Container maxWidth="xl">
          <Paper sx={{ p: 4, bgcolor: alpha('#FF4444', 0.1), borderRadius: 2 }}>
            <Typography color="#FF4444">{error}</Typography>
            <Button onClick={() => loadDashboardData()} sx={{ mt: 2, color: G_START }}>
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#080C14', minHeight: '100vh', pt: 2 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* ─── Token Lock Warning Banner ─── */}
        {stats.creditsRemaining < TOKEN_LOCK_THRESHOLD && stats.creditsRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{
                mb: 3,
                bgcolor: alpha('#FF6B6B', 0.08),
                border: `1px solid ${alpha('#FF6B6B', 0.2)}`,
                borderRadius: '12px',
                '& .MuiAlert-message': { color: 'rgba(255,255,255,0.8)', width: '100%' },
                '& .MuiAlert-icon': { color: '#FF6B6B' },
              }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleBuyCredits}
                  sx={{
                    color: G_START,
                    fontWeight: 600,
                    '&:hover': { color: G_MID },
                  }}
                >
                  Buy Credits
                </Button>
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <span>
                  <strong style={{ color: '#FF6B6B' }}>{stats.creditsRemaining}</strong> credits
                  remaining. You need at least <strong style={{ color: '#FF6B6B' }}>50</strong> to
                  continue building.
                </span>
                <Chip
                  label={`${stats.creditsRemaining} / 50`}
                  size="small"
                  sx={{
                    bgcolor: alpha('#FF6B6B', 0.15),
                    color: '#FF6B6B',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Alert>
          </motion.div>
        )}

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              mb: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                Welcome back, {user?.name || 'Creator'}! 👋
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Your AI-powered website building journey continues. You have{' '}
                <strong
                  style={{
                    color: stats.creditsRemaining < TOKEN_LOCK_THRESHOLD ? '#FF6B6B' : G_END,
                  }}
                >
                  {stats.creditsRemaining}
                </strong>{' '}
                credits remaining.
                {stats.creditsRemaining < TOKEN_LOCK_THRESHOLD && (
                  <span style={{ color: '#FF6B6B', marginLeft: 8 }}>
                    ⚠️ Low credits - please top up to continue.
                  </span>
                )}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={isLocked ? <Lock /> : <Add />}
              onClick={handleCreateProject}
              disabled={isLocked}
              sx={{
                background: isLocked ? 'rgba(255,255,255,0.1)' : GRAD,
                borderRadius: '999px',
                py: 1,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                color: isLocked ? 'rgba(255,255,255,0.4)' : 'white',
                '&:hover': {
                  transform: isLocked ? 'none' : 'scale(1.02)',
                  transition: 'all 0.2s ease',
                },
                '&.Mui-disabled': {
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {isLocked ? 'Locked - Buy Credits' : 'New Project'}
            </Button>
          </Box>
        </motion.div>

        {/* ─── Stats Cards ─── */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              label: 'Total Projects',
              value: stats.totalProjects,
              growth: stats.monthlyGrowth,
              icon: <Rocket />,
              color: G_START,
            },
            {
              label: 'Credits Used',
              value: stats.creditsUsed,
              subtitle: 'Total credits consumed',
              icon: <TrendingUp />,
              color: G_MID,
            },
            {
              label: 'Credits',
              value: stats.creditsRemaining,
              subtitle: 'Available to use',
              icon: <CloudQueue />,
              color: stats.creditsRemaining < TOKEN_LOCK_THRESHOLD ? '#FF6B6B' : G_END,
            },
            {
              label: 'Published Websites',
              value: stats.websitesPublished,
              subtitle: 'Live on the web',
              icon: <CheckCircle />,
              color: G_START,
            },
          ].map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  sx={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${alpha(item.color, 0.2)}`,
                    borderRadius: '16px',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {item.label}
                        </Typography>
                        <Typography
                          variant="h3"
                          fontWeight="bold"
                          sx={{
                            color:
                              item.label === 'Credits' &&
                              stats.creditsRemaining < TOKEN_LOCK_THRESHOLD
                                ? '#FF6B6B'
                                : 'white',
                          }}
                        >
                          {item.value}
                        </Typography>
                        {item.growth !== undefined && item.growth > 0 && (
                          <Typography variant="caption" sx={{ color: G_END }}>
                            +{item.growth}% this month
                          </Typography>
                        )}
                        {item.subtitle && (
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}
                          >
                            {item.subtitle}
                          </Typography>
                        )}
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: alpha(item.color, 0.2),
                          width: 56,
                          height: 56,
                          border:
                            item.label === 'Credits' &&
                            stats.creditsRemaining < TOKEN_LOCK_THRESHOLD
                              ? `2px solid ${alpha('#FF6B6B', 0.3)}`
                              : 'none',
                        }}
                      >
                        {item.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* ─── Projects and Activity ─── */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${isLocked ? alpha('#FF6B6B', 0.1) : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Your Projects ({projects.length})
                  </Typography>
                  {isLocked && (
                    <Chip
                      label="🔒 Locked"
                      size="small"
                      sx={{
                        bgcolor: alpha('#FF6B6B', 0.15),
                        color: '#FF6B6B',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
                <AnimatePresence>
                  {projects.length > 0 ? (
                    projects.map((project, index) => (
                      <ProjectCard key={project.id} project={project} index={index} />
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        No projects yet. Click "New Project" to get started!
                      </Typography>
                    </Box>
                  )}
                </AnimatePresence>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={handleCreateProject}
                  disabled={isLocked}
                  sx={{ color: isLocked ? 'rgba(255,255,255,0.3)' : G_START }}
                >
                  {isLocked ? '🔒 Locked - Buy Credits' : '+ Create New Project'}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              sx={{
                mb: 3,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                  Credit Usage Analytics
                </Typography>
                {creditUsage.some((c) => c.usage > 0) ? (
                  <Chart options={chartOptions} series={chartSeries} type="area" height={250} />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      No credit usage data yet. Start building!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                  Recent Activity
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
                {recentActivity.length > 0 ? (
                  <List>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: alpha(G_START, 0.1) }}>{activity.icon}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.action}
                            secondary={
                              <>
                                <Typography
                                  variant="caption"
                                  component="span"
                                  sx={{ color: 'rgba(255,255,255,0.6)' }}
                                >
                                  {activity.project}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ ml: 1, color: 'rgba(255,255,255,0.4)' }}
                                >
                                  • {activity.time}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < recentActivity.length - 1 && index < 4 && (
                          <Divider
                            variant="inset"
                            component="li"
                            sx={{ borderColor: 'rgba(255,255,255,0.08)' }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      No recent activity
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ─── Quick Actions ─── */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {[
              { icon: <DesignServices />, label: 'Browse Designs', action: '/designs' },
              {
                icon: <IntegrationInstructions />,
                label: 'Add Integrations',
                action: '/api-integration',
              },
              {
                icon: <Payment />,
                label: 'Buy Credits',
                action: '/pricing',
                highlight: stats.creditsRemaining < TOKEN_LOCK_THRESHOLD,
              },
              { icon: <Speed />, label: 'Quick Tutorial', action: '/tutorials' },
            ].map((item, idx) => (
              <Grid item xs={6} sm={4} md={2} key={idx}>
                <Button
                  fullWidth
                  variant={item.highlight ? 'contained' : 'outlined'}
                  startIcon={item.icon}
                  onClick={() => navigate(item.action)}
                  sx={{
                    py: 2,
                    borderColor: item.highlight ? 'transparent' : 'rgba(255,255,255,0.2)',
                    color: item.highlight ? 'white' : 'white',
                    borderRadius: '999px',
                    textTransform: 'none',
                    background: item.highlight ? GRAD : 'transparent',
                    '&:hover': {
                      borderColor: item.highlight ? 'transparent' : G_MID,
                      background: item.highlight ? GRAD : alpha(G_START, 0.1),
                    },
                  }}
                >
                  {item.label}
                  {item.highlight && (
                    <Chip
                      label="🔴 Low"
                      size="small"
                      sx={{
                        ml: 1,
                        height: 18,
                        bgcolor: alpha('#FF6B6B', 0.3),
                        color: '#FF6B6B',
                        fontSize: '0.55rem',
                      }}
                    />
                  )}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            borderRadius: '16px',
            border: `1px solid ${alpha('#ff4444', 0.3)}`,
            color: 'white',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: alpha('#ff4444', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Delete sx={{ color: '#ff4444' }} />
          </Box>
          Delete Project
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} /> : <Delete />}
            sx={{
              bgcolor: '#ff4444',
              '&:hover': { bgcolor: '#cc0000' },
              borderRadius: '10px',
              fontWeight: 700,
              px: 3,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Publish Dialog ─── */}
      <Dialog
        open={publishDialogOpen}
        onClose={() => !publishing && setPublishDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            borderRadius: '16px',
            border: `1px solid ${alpha(G_START, 0.3)}`,
            color: 'white',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: GRAD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Publish sx={{ color: 'white' }} />
          </Box>
          Publish "{projectToPublish?.name}"
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Your website will be published and accessible at:
          </Typography>
          <Paper
            sx={{ p: 2, bgcolor: alpha(G_START, 0.1), borderRadius: '8px', wordBreak: 'break-all' }}
          >
            <Typography variant="body2" sx={{ color: G_START }}>
              {publishUrl || 'Generating URL...'}
            </Typography>
          </Paper>
          {!publishUrl && (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 1 }}
            >
              A unique URL will be generated based on your project name.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setPublishDialogOpen(false)}
            disabled={publishing}
            sx={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublishConfirm}
            variant="contained"
            disabled={publishing}
            startIcon={publishing ? <CircularProgress size={18} /> : <Publish />}
            sx={{
              background: GRAD,
              borderRadius: '10px',
              fontWeight: 700,
              px: 3,
              '&:hover': { opacity: 0.9 },
            }}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Token Lock Modal ─── */}
      <TokenLockModal
        open={tokenLockOpen}
        creditsRemaining={stats.creditsRemaining}
        onClose={handleTokenLockClose}
        onBuyCredits={handleBuyCredits}
      />

      {/* ─── Snackbar ─── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ bgcolor: '#1A1F2E', color: 'white' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
