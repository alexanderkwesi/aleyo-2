// Tutorials.js - Complete updated version with all API endpoints connected
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  alpha,
  useTheme,
  Dialog,
  DialogContent,
  IconButton,
  Rating,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress,
  Skeleton,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Pagination,
  useMediaQuery,
  Tooltip,
  Badge,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search,
  PlayCircle,
  Code,
  DesignServices,
  Speed,
  Security,
  Payment,
  Analytics,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  School,
  VideoLibrary,
  Article,
  Quiz,
  Timer,
  AutoAwesome,
  Link as LinkIcon,
  TrendingUp,
  BarChart,
  FilterList,
  Clear,
  ThumbUp,
  ThumbDown,
  Share,
  Bookmark,
  BookmarkBorder,
  ArrowBack,
  History,
  Star,
  Whatshot,
  NewReleases,
  Recommend,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const G_START = '#4F6EF7';
const G_MID = '#2DBCB6';
const G_END = '#3ED67C';
const GRAD = `linear-gradient(135deg, ${G_START} 0%, ${G_MID} 50%, ${G_END} 100%)`;
//const REACT_APP_API_URL = "https://aleyo-2-six.vercel.app";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com' || "http://127.0.0.1:*" ;

// Category icons mapping
const CATEGORY_ICONS = {
  beginner: <School />,
  design: <DesignServices />,
  advanced: <Code />,
  seo: <Analytics />,
  ecommerce: <Payment />,
  performance: <Speed />,
  ai: <AutoAwesome />,
  integrations: <LinkIcon />,
  marketing: <TrendingUp />,
  analytics: <BarChart />,
};

// Tab configurations
const TABS = [
  { value: 'all', label: 'All Tutorials', icon: <VideoLibrary /> },
  { value: 'in-progress', label: 'In Progress', icon: <Timer /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle /> },
  { value: 'bookmarked', label: 'Bookmarked', icon: <Bookmark /> },
];

const Tutorials = () => {
  const theme = useTheme();
  const { token, user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [loading, setLoading] = useState(true);
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [page, setPage] = useState(1);
  const [totalTutorials, setTotalTutorials] = useState(0);
  const [limit] = useState(9);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterLevel, setFilterLevel] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recent, setRecent] = useState([]);
  const [likedTutorials, setLikedTutorials] = useState({});
  const [bookmarkedTutorials, setBookmarkedTutorials] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ==================== API Service Functions ====================

  // Get user's progress for all tutorials
  const getUserProgress = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  };

  // Get bookmarked tutorials
  const getBookmarkedTutorials = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  };

  // Get completed tutorials
  const getCompletedTutorials = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/completed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching completed tutorials:', error);
      return [];
    }
  };

  // Get tutorial stats
  const getTutorialStats = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  };

  // Get recommended tutorials
  const getRecommendedTutorials = async (token, limit = 6) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/recommended?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching recommended:', error);
      return [];
    }
  };

  // Get popular tutorials
  const getPopularTutorials = async (token, limit = 6) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/popular?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching popular:', error);
      return [];
    }
  };

  // Get recent tutorials
  const getRecentTutorials = async (token, limit = 6) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/recent?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching recent:', error);
      return [];
    }
  };

  // Unlike a tutorial
  const unlikeTutorial = async (tutorialId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}/like`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error unliking tutorial:', error);
      return null;
    }
  };

  // Unbookmark a tutorial
  const unbookmarkTutorial = async (tutorialId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}/bookmark`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error unbookmarking tutorial:', error);
      return null;
    }
  };

  // Rate a tutorial
  const rateTutorial = async (tutorialId, rating, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error rating tutorial:', error);
      return null;
    }
  };

  // Track watch time
  const trackWatchTime = async (tutorialId, durationWatched, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration_watched: durationWatched }),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error tracking watch time:', error);
      return null;
    }
  };

  // ==================== Effects ====================

  // Fetch tutorials and data on mount and filter changes
  useEffect(() => {
    fetchAllData();
  }, [selectedCategory, searchTerm, page, filterLevel, activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTutorials(),
        fetchCategories(),
        fetchStats(),
        fetchRecommended(),
        fetchPopular(),
        fetchRecent(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

const fetchTutorials = async () => {
  try {
    const offset = (page - 1) * limit;

    // Build URL with query parameters
    let url = `http://127.0.0.1:8000/api/tutorials?limit=${limit}&offset=${offset}`;

    // Add optional filters
    if (selectedCategory !== 'all') {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    if (filterLevel !== 'all') {
      url += `&level=${encodeURIComponent(filterLevel)}`;
    }
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    // Only show free (non-premium) tutorials
    url += `&is_premium=false`;

    // Add tab filtering
    if (activeTab === 'in-progress') {
      url += `&in_progress=true`;
    } else if (activeTab === 'completed') {
      const completed = await getCompletedTutorials(token);
      if (completed.length > 0) {
        const ids = completed.map((t) => t.id).join(',');
        url += `&ids=${encodeURIComponent(ids)}`;
      } else {
        setTutorials([]);
        setTotalTutorials(0);
        return;
      }
    } else if (activeTab === 'bookmarked') {
      const bookmarked = await getBookmarkedTutorials(token);
      if (bookmarked.length > 0) {
        const ids = bookmarked.map((t) => t.id).join(',');
        url += `&ids=${encodeURIComponent(ids)}`;
      } else {
        setTutorials([]);
        setTotalTutorials(0);
        return;
      }
    }

    // Make the GET request
    const response = await fetch(url, {
      method: 'GET', // Explicitly set method to GET
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Tutorials data:', data); // Add logging for debugging
      setTutorials(data.tutorials || []);
      setTotalTutorials(data.total || 0);

      // Update progress from API data
      const progressData = {};
      data.tutorials?.forEach((t) => {
        if (t.user_progress) {
          progressData[t.id] = t.user_progress;
        }
      });
      setProgress(progressData);
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch tutorials:', errorData);
      showSnackbar(`Failed to load tutorials: ${errorData.detail || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    console.error('Error fetching tutorials:', error);
    showSnackbar('Error loading tutorials', 'error');
  }
};
  
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    const statsData = await getTutorialStats(token);
    if (statsData) {
      setStats(statsData);
    }
  };

  const fetchRecommended = async () => {
    const recommendedData = await getRecommendedTutorials(token, 4);
    setRecommended(recommendedData);
  };

  const fetchPopular = async () => {
    const popularData = await getPopularTutorials(token, 4);
    setPopular(popularData);
  };

  const fetchRecent = async () => {
    const recentData = await getRecentTutorials(token, 4);
    setRecent(recentData);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ==================== Tutorial Interaction Handlers ====================

  const handleOpenTutorial = async (tutorial) => {
    setSelectedTutorial(tutorial);
    setExpandedSection(null);
    setDialogOpen(true);

    // Fetch full tutorial details
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorial.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTutorial(data);

        // Update progress
        if (data.user_progress) {
          setProgress((prev) => ({
            ...prev,
            [data.id]: data.user_progress,
          }));
        }

        // Update completed lessons
        if (data.user_progress?.completed_sections) {
          const sections = data.sections || [];
          const completed = sections
            .map((s, idx) => (data.user_progress.completed_sections.includes(idx) ? s.title : null))
            .filter(Boolean);
          setCompletedLessons(completed);
        }

        // Track view
        await fetch(`${API_BASE_URL}/api/tutorials/${tutorial.id}/view`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching tutorial details:', error);
    }
  };

  const handleCompleteLesson = async (lessonTitle, sectionIndex) => {
    if (!selectedTutorial || !user) return;

    // Update local state
    setCompletedLessons((prev) => (prev.includes(lessonTitle) ? prev : [...prev, lessonTitle]));

    // Calculate progress
    const total = selectedTutorial.sections?.length || 0;
    const completed = [...completedLessons, lessonTitle];
    const percentage = Math.round((completed.length / total) * 100);

    // Update progress on server
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tutorials/${selectedTutorial.id}/progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_section: sectionIndex || 0,
            completed_sections: selectedTutorial.sections
              .map((_, idx) => idx)
              .filter((idx) => completed.includes(selectedTutorial.sections[idx]?.title)),
            progress_percentage: percentage,
          }),
        }
      );

      if (response.ok) {
        // Update progress state
        setProgress((prev) => ({
          ...prev,
          [selectedTutorial.id]: {
            ...prev[selectedTutorial.id],
            progress_percentage: percentage,
            completed_sections: selectedTutorial.sections
              .map((_, idx) => idx)
              .filter((idx) => completed.includes(selectedTutorial.sections[idx]?.title)),
          },
        }));

        if (percentage === 100) {
          showSnackbar('🎉 Tutorial completed!', 'success');
          // Refresh stats
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleToggleBookmark = async (tutorialId) => {
    const isBookmarked = bookmarkedTutorials[tutorialId];
    try {
      if (isBookmarked) {
        await unbookmarkTutorial(tutorialId, token);
        setBookmarkedTutorials((prev) => ({ ...prev, [tutorialId]: false }));
        showSnackbar('Bookmark removed', 'info');
      } else {
        const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}/bookmark`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          setBookmarkedTutorials((prev) => ({ ...prev, [tutorialId]: true }));
          showSnackbar('📚 Bookmarked!', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleToggleLike = async (tutorialId) => {
    const isLiked = likedTutorials[tutorialId];
    try {
      if (isLiked) {
        await unlikeTutorial(tutorialId, token);
        setLikedTutorials((prev) => ({ ...prev, [tutorialId]: false }));
      } else {
        const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ liked: true }),
        });
        if (response.ok) {
          setLikedTutorials((prev) => ({ ...prev, [tutorialId]: true }));
          showSnackbar('👍 Liked!', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const getProgressValue = (tutorialId) => {
    return progress[tutorialId]?.progress_percentage || 0;
  };

  const getCompletedSections = (tutorialId) => {
    return progress[tutorialId]?.completed_sections || [];
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilterLevel('all');
    setPage(1);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  // ==================== Render Helpers ====================

  const categoryList = [
    { value: 'all', label: 'All', icon: <VideoLibrary /> },
    ...categories.map((cat) => ({
      value: cat.name,
      label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      icon: CATEGORY_ICONS[cat.name] || <VideoLibrary />,
      count: cat.count,
    })),
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' },
  ];

  // ==================== Stats Cards ====================

  const renderStats = () => {
    if (!stats) return null;
    return (
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ color: G_START, fontWeight: 'bold' }}>
              {stats.completed || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Completed
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ color: G_MID, fontWeight: 'bold' }}>
              {stats.in_progress || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              In Progress
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ color: G_END, fontWeight: 'bold' }}>
              {stats.bookmarked || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Bookmarked
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
              {stats.completion_rate || 0}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Completion Rate
            </Typography>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // ==================== Sidebar Sections ====================

  const renderSidebar = () => {
    if (isMobile) return null;
    return (
      <Box sx={{ position: 'sticky', top: 24 }}>
        {/* Recommended */}
        {recommended.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Recommend sx={{ fontSize: 16 }} /> Recommended For You
            </Typography>
            {recommended.map((t) => (
              <Card
                key={t.id}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  mb: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
                onClick={() => handleOpenTutorial(t)}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 40,
                      borderRadius: '4px',
                      bgcolor: alpha(G_START, 0.2),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PlayCircle sx={{ color: G_START, fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'white', noWrap: true, fontSize: '0.8rem' }}
                    >
                      {t.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {t.duration}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 3 }} />

        {/* Popular */}
        {popular.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Whatshot sx={{ fontSize: 16 }} /> Most Popular
            </Typography>
            {popular.map((t) => (
              <Card
                key={t.id}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  mb: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
                onClick={() => handleOpenTutorial(t)}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 40,
                      borderRadius: '4px',
                      bgcolor: alpha('#FF6B6B', 0.2),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Whatshot sx={{ color: '#FF6B6B', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'white', noWrap: true, fontSize: '0.8rem' }}
                    >
                      {t.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {t.views?.toLocaleString() || 0} views
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 3 }} />

        {/* Recent */}
        {recent.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <NewReleases sx={{ fontSize: 16 }} /> New Releases
            </Typography>
            {recent.map((t) => (
              <Card
                key={t.id}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  mb: 1,
                  p: 1.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
                onClick={() => handleOpenTutorial(t)}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 40,
                      borderRadius: '4px',
                      bgcolor: alpha(G_END, 0.2),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <NewReleases sx={{ color: G_END, fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'white', noWrap: true, fontSize: '0.8rem' }}
                    >
                      {t.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // ==================== Main Render ====================

  return (
    <Box sx={{ bgcolor: '#080C14', minHeight: '100vh', pt: 2 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                Tutorials & Learning
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Master website building with our comprehensive video tutorials
              </Typography>
            </Box>
            {stats && (
              <Badge
                badgeContent={stats.completed || 0}
                color="success"
                sx={{ '& .MuiBadge-badge': { bgcolor: G_START } }}
              >
                <Chip
                  icon={<CheckCircle />}
                  label={`${stats.completed || 0} Completed`}
                  sx={{ bgcolor: alpha(G_START, 0.2), color: G_START }}
                />
              </Badge>
            )}
          </Box>
        </motion.div>

        {/* Stats Cards */}
        {renderStats()}

        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.5)',
                '&.Mui-selected': { color: G_START },
              },
              '& .MuiTabs-indicator': { backgroundColor: G_START },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Main Content */}
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            {/* Filters */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} size="small">
                          <Clear sx={{ color: 'rgba(255,255,255,0.5)' }} />
                        </IconButton>
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
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  {categoryList.slice(0, 5).map((cat) => (
                    <Chip
                      key={cat.value}
                      icon={cat.icon}
                      label={cat.count !== undefined ? `${cat.label} (${cat.count})` : cat.label}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setPage(1);
                      }}
                      sx={{
                        bgcolor:
                          selectedCategory === cat.value
                            ? alpha(G_START, 0.2)
                            : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${selectedCategory === cat.value ? G_START : 'rgba(255,255,255,0.1)'}`,
                        color: selectedCategory === cat.value ? G_START : 'rgba(255,255,255,0.7)',
                        '&:hover': {
                          bgcolor: alpha(G_START, 0.1),
                        },
                      }}
                    />
                  ))}
                  {categoryList.length > 5 && (
                    <Chip
                      label={`+${categoryList.length - 5} more`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                    />
                  )}
                  {(searchTerm || selectedCategory !== 'all' || filterLevel !== 'all') && (
                    <Chip
                      icon={<Clear />}
                      label="Clear"
                      onClick={clearFilters}
                      sx={{
                        bgcolor: alpha('#FF4444', 0.1),
                        border: '1px solid rgba(255,68,68,0.3)',
                        color: '#FF4444',
                        '&:hover': { bgcolor: alpha('#FF4444', 0.2) },
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Level Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }}>
                Level:
              </Typography>
              {levels.map((level) => (
                <Chip
                  key={level.value}
                  label={level.label}
                  size="small"
                  onClick={() => {
                    setFilterLevel(level.value);
                    setPage(1);
                  }}
                  sx={{
                    bgcolor:
                      filterLevel === level.value ? alpha(G_START, 0.2) : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${filterLevel === level.value ? G_START : 'rgba(255,255,255,0.1)'}`,
                    color: filterLevel === level.value ? G_START : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </Box>

            {/* Tutorial Grid */}
            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '16px', p: 2 }}>
                      <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="text" sx={{ mt: 2, width: '80%' }} />
                      <Skeleton variant="text" sx={{ width: '60%' }} />
                      <Skeleton variant="text" sx={{ width: '40%' }} />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : tutorials.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <VideoLibrary sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="h6" sx={{ color: 'white', mt: 2 }}>
                  No tutorials found
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Try adjusting your filters or search terms
                </Typography>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ mt: 2, borderColor: G_START, color: G_START }}
                >
                  Clear Filters
                </Button>
              </Box>
            ) : (
              <>
                <Grid container spacing={3}>
                  {tutorials.map((tutorial, index) => (
                    <Grid item xs={12} sm={6} md={4} key={tutorial.id}>
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
                            overflow: 'hidden',
                            transition: 'transform 0.3s, border-color 0.3s',
                            cursor: 'pointer',
                            position: 'relative',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              borderColor: alpha(G_START, 0.3),
                            },
                          }}
                          onClick={() => handleOpenTutorial(tutorial)}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia
                              component="img"
                              height="160"
                              image={
                                tutorial.thumbnail_url ||
                                'https://placehold.co/600x340/2A2A2A/FFFFFF?text=No+Image'
                              }
                              alt={tutorial.title}
                              onError={(e) => {
                                e.target.src =
                                  'https://placehold.co/600x340/2A2A2A/FFFFFF?text=No+Image';
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                bgcolor: 'rgba(0,0,0,0.7)',
                                borderRadius: '50%',
                                width: 48,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PlayCircle sx={{ fontSize: 40, color: G_START }} />
                            </Box>
                            <Chip
                              label={tutorial.duration}
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                              }}
                            />
                            {tutorial.is_premium && (
                              <Chip
                                label="PREMIUM"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: '#FFD700',
                                  color: 'black',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                            {getProgressValue(tutorial.id) > 0 && (
                              <LinearProgress
                                variant="determinate"
                                value={getProgressValue(tutorial.id)}
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 3,
                                  '& .MuiLinearProgress-bar': { background: GRAD },
                                }}
                              />
                            )}
                          </Box>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Avatar sx={{ bgcolor: alpha(G_START, 0.1), width: 28, height: 28 }}>
                                {CATEGORY_ICONS[tutorial.category] || <PlayCircle />}
                              </Avatar>
                              <Chip
                                label={tutorial.level}
                                size="small"
                                sx={{
                                  bgcolor: alpha(G_START, 0.2),
                                  color: G_START,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                              <Box sx={{ flex: 1 }} />
                              <Tooltip
                                title={bookmarkedTutorials[tutorial.id] ? 'Bookmarked' : 'Bookmark'}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleBookmark(tutorial.id);
                                  }}
                                  sx={{
                                    color: bookmarkedTutorials[tutorial.id]
                                      ? G_START
                                      : 'rgba(255,255,255,0.3)',
                                  }}
                                >
                                  {bookmarkedTutorials[tutorial.id] ? (
                                    <Bookmark />
                                  ) : (
                                    <BookmarkBorder />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{ color: 'white', mb: 1 }}
                            >
                              {tutorial.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}
                            >
                              {tutorial.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Rating
                                value={tutorial.rating || 4.5}
                                precision={0.1}
                                size="small"
                                readOnly
                              />
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                {tutorial.views?.toLocaleString() || 0} views
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {totalTutorials > limit && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={Math.ceil(totalTutorials / limit)}
                      page={page}
                      onChange={handlePageChange}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: 'rgba(255,255,255,0.6)',
                          '&.Mui-selected': {
                            background: GRAD,
                            color: 'white',
                          },
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {renderSidebar()}
          </Grid>
        </Grid>
      </Container>

      {/* Tutorial Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
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
        {selectedTutorial && (
          <DialogContent sx={{ p: 0 }}>
            {/* Video Player */}
            <Box sx={{ position: 'relative' }}>
              {selectedTutorial.video_embed_code ? (
                <Box
                  dangerouslySetInnerHTML={{ __html: selectedTutorial.video_embed_code }}
                  sx={{
                    '& iframe': {
                      width: '100%',
                      height: 340,
                      border: 'none',
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 340,
                    bgcolor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha(G_START, 0.2)} 0%, #000 100%)`,
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      width: 80,
                      height: 80,
                    }}
                    onClick={() => {
                      if (selectedTutorial.video_url) {
                        window.open(selectedTutorial.video_url, '_blank');
                      }
                    }}
                  >
                    <PlayCircle sx={{ fontSize: 60, color: 'white' }} />
                  </IconButton>
                </Box>
              )}
              <IconButton
                onClick={() => setDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                ✕
              </IconButton>
            </Box>

            {/* Tutorial Details */}
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                    {selectedTutorial.title}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}
                  >
                    <Chip
                      label={selectedTutorial.level}
                      size="small"
                      sx={{ bgcolor: alpha(G_START, 0.2), color: G_START }}
                    />
                    <Chip
                      icon={<Timer />}
                      label={selectedTutorial.duration}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                    <Rating
                      value={selectedTutorial.rating || 4.5}
                      precision={0.1}
                      size="small"
                      readOnly
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {selectedTutorial.views?.toLocaleString() || 0} views
                    </Typography>
                    {selectedTutorial.is_premium && (
                      <Chip
                        label="⭐ Premium"
                        size="small"
                        sx={{ bgcolor: '#FFD700', color: 'black', fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={likedTutorials[selectedTutorial.id] ? 'Unlike' : 'Like'}>
                    <IconButton
                      onClick={() => handleToggleLike(selectedTutorial.id)}
                      sx={{
                        color: likedTutorials[selectedTutorial.id]
                          ? G_START
                          : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {likedTutorials[selectedTutorial.id] ? <ThumbUp /> : <ThumbUp />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title={bookmarkedTutorials[selectedTutorial.id] ? 'Unbookmark' : 'Bookmark'}
                  >
                    <IconButton
                      onClick={() => handleToggleBookmark(selectedTutorial.id)}
                      sx={{
                        color: bookmarkedTutorials[selectedTutorial.id]
                          ? G_START
                          : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {bookmarkedTutorials[selectedTutorial.id] ? <Bookmark /> : <BookmarkBorder />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share">
                    <IconButton
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: selectedTutorial.title,
                            text: selectedTutorial.description,
                            url: window.location.href,
                          });
                        }
                      }}
                      sx={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      <Share />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                {selectedTutorial.description}
              </Typography>

              {/* Progress */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>
                    Course Progress
                  </Typography>
                  <Typography variant="caption" sx={{ color: G_START }}>
                    {getProgressValue(selectedTutorial.id)}% Complete
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressValue(selectedTutorial.id)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { background: GRAD },
                  }}
                />
              </Box>

              {/* Sections */}
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                Course Content
              </Typography>
              <List sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                {selectedTutorial.sections?.map((section, idx) => {
                  const completed = getCompletedSections(selectedTutorial.id).includes(idx);
                  return (
                    <React.Fragment key={section.title || idx}>
                      <ListItem
                        button
                        onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                        sx={{
                          borderBottom:
                            idx < selectedTutorial.sections.length - 1
                              ? '1px solid rgba(255,255,255,0.05)'
                              : 'none',
                        }}
                      >
                        <ListItemIcon>
                          {completed ? (
                            <CheckCircle sx={{ color: G_END }} />
                          ) : (
                            <PlayCircle sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={section.title}
                          primaryTypographyProps={{ sx: { color: 'white' } }}
                          secondary={section.duration}
                          secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                        />
                        {expandedSection === idx ? (
                          <ExpandLess sx={{ color: 'white' }} />
                        ) : (
                          <ExpandMore sx={{ color: 'white' }} />
                        )}
                      </ListItem>
                      <Collapse in={expandedSection === idx} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, pl: 7, bgcolor: 'rgba(0,0,0,0.2)' }}>
                          <Button
                            size="small"
                            variant={completed ? 'contained' : 'outlined'}
                            startIcon={completed ? <CheckCircle /> : <PlayCircle />}
                            onClick={() => handleCompleteLesson(section.title, idx)}
                            sx={
                              completed
                                ? { background: GRAD }
                                : { borderColor: G_START, color: G_START }
                            }
                          >
                            {completed ? 'Completed' : 'Mark as Complete'}
                          </Button>
                        </Box>
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            bgcolor: '#1A1F2E',
            color: 'white',
            border: `1px solid ${snackbar.severity === 'success' ? G_END : G_START}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tutorials;
