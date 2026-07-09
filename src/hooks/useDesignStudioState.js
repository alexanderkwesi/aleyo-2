import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme, alpha } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  G_START,
  G_MID,
  G_END,
  GRAD,
  API_BASE,
  generateId,
  textStyles,
  imageStyles,
  colorThemes,
  colorPalettes,
  linkTypes,
  buttonStyles,
  getInitialProject,
  getDefaultContent,
  getComponentIcon,
  getComponentName,
  slugify,
  isExternalLink,
  getLinkType,
  getDocumentsPath,
  convertToFilePath,
} from '../components/DesignStudio/DesignStudioUtils';

import {
  downloadWebsiteAsZip,
  saveProjectToDatabase,
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
} from '../components/DesignStudio/DesignStudioService';

// Import MUI components needed for rendering
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';

import {
  Publish,
  Domain,
  OpenInNew,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  Link as LinkIcon,
  Edit as EditIcon,
  ContentCopy,
  Delete,
  RotateLeft,
  RotateRight,
  Flip,
  PhotoLibrary,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  YouTube,
  WhatsApp,
} from '@mui/icons-material';

import { motion } from 'framer-motion';

export const useDesignStudioState = ({
  externalProject,
  setCurrentProject,
  mergedDesign,
  setMergedDesign,
  wsConnection,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, logout } = useAuth();

  // ── State ──
  const [activeTab, setActiveTab] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedTextElement, setSelectedTextElement] = useState(null);
  const [selectedImageElement, setSelectedImageElement] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [components, setComponents] = useState([]);
  const [textElements, setTextElements] = useState([]);
  const [imageElements, setImageElements] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [savedProjectCard, setSavedProjectCard] = useState(null);
  const [selectedColorTarget, setSelectedColorTarget] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [dragDropMode, setDragDropMode] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  const [imageUploadTarget, setImageUploadTarget] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [websiteName, setWebsiteName] = useState('');
  const [isSavingToDB, setIsSavingToDB] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [pages, setPages] = useState([
    { id: 'page-1', name: 'Home', components: [], textElements: [], imageElements: [] },
  ]);
  const [activePageId, setActivePageId] = useState('page-1');
  const [addPageDialogOpen, setAddPageDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [showProjectsGallery, setShowProjectsGallery] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [galleryPreviewProject, setGalleryPreviewProject] = useState(null);
  const [imageUploadMode, setImageUploadMode] = useState('mock');
  const [mockImageUrl, setMockImageUrl] = useState('');
  const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const stored = localStorage.getItem('autoSaveEnabled');
    return stored === null ? true : stored === 'true';
  });
  const [paletteComponentOpen, setPaletteComponentOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [editingLink, setEditingLink] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hasComponents, setHasComponents] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(true);
  const [publishDomain, setPublishDomain] = useState('');
  const [publishDomainError, setPublishDomainError] = useState('');
  const [customDomainEnabled, setCustomDomainEnabled] = useState(false);
  const [websiteDescription, setWebsiteDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const fileInputRef = useRef(null);
  const replaceImageInputRef = useRef(null);
  const canvasRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const periodicAutoSaveRef = useRef(null);
  const latestStateRef = useRef(null);

  const [globalStyles, setGlobalStyles] = useState({
    primaryColor: G_START,
    secondaryColor: G_MID,
    accentColor: G_END,
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#080C14',
    textColor: '#FFFFFF',
    headingColor: '#FFFFFF',
    borderRadius: '12px',
    spacing: '24px',
    buttonStyle: 'rounded',
    animationEnabled: true,
    backgroundGradient: null,
    backgroundImage: null,
    backgroundBlur: 0,
    backgroundOpacity: 1,
  });

  // ── showSnackbar - defined ONCE before any function that uses it ──
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ── Use external project with memo to prevent re-renders ──
  const currentProject = useMemo(() => {
    if (externalProject) return externalProject;
    return getInitialProject();
  }, [externalProject]);

  // ── Check if components exist ──
  useEffect(() => {
    const hasComponentsCheck =
      components.length > 0 || textElements.length > 0 || imageElements.length > 0;
    setHasComponents(hasComponentsCheck);
  }, [components, textElements, imageElements]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditingMode) return;

      if (e.key === 'Escape') {
        setSelectedComponent(null);
        setSelectedTextElement(null);
        setSelectedImageElement(null);
        setEditingText(null);
        setEditingLink(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, isEditingMode]);

  // ── Load projects ──
  useEffect(() => {
    if (token) loadProjectsFromDatabase();
    else loadProjectsFromLocalStorage();
  }, [token]);

  // ── Load saved theme ──
  useEffect(() => {
    const savedThemeId = localStorage.getItem('currentColorTheme');
    if (savedThemeId) {
      const savedTheme = colorThemes.find((theme) => theme.id === savedThemeId);
      if (savedTheme) applyColorTheme(savedTheme);
    }
    const savedColors = localStorage.getItem('selectedDesignColors');
    if (savedColors) {
      try {
        const colors = JSON.parse(savedColors);
        setGlobalStyles((prev) => ({
          ...prev,
          primaryColor: colors.primaryColor || prev.primaryColor,
          secondaryColor: colors.secondaryColor || prev.secondaryColor,
          accentColor: colors.accentColor || prev.accentColor,
          backgroundColor: colors.backgroundColor || prev.backgroundColor,
          textColor: colors.textColor || prev.textColor,
          headingColor: colors.headingColor || prev.headingColor,
        }));
      } catch (e) {
        console.error('Error loading saved colors:', e);
      }
    }
    const savedImages = localStorage.getItem('uploadedImages');
    if (savedImages) {
      try {
        setUploadedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Error loading saved images:', e);
      }
    }

    // Check for template in localStorage
    const savedTemplate = localStorage.getItem('selectedTemplate');
    if (savedTemplate) {
      try {
        const template = JSON.parse(savedTemplate);
        loadDesignFromTemplates(template);
        localStorage.removeItem('selectedTemplate');
      } catch (e) {
        console.error('Error loading saved template:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  // ── Keep selected item panels in sync with live data ──
  useEffect(() => {
    if (!selectedComponent) return;
    const fresh = components.find((c) => c.id === selectedComponent.id);
    if (!fresh) setSelectedComponent(null);
    else if (fresh !== selectedComponent) setSelectedComponent(fresh);
  }, [components]);

  useEffect(() => {
    if (!selectedTextElement) return;
    const fresh = textElements.find((t) => t.id === selectedTextElement.id);
    if (!fresh) setSelectedTextElement(null);
    else if (fresh !== selectedTextElement) setSelectedTextElement(fresh);
  }, [textElements]);

  useEffect(() => {
    if (!selectedImageElement) return;
    const fresh = imageElements.find((i) => i.id === selectedImageElement.id);
    if (!fresh) setSelectedImageElement(null);
    else if (fresh !== selectedImageElement) setSelectedImageElement(fresh);
  }, [imageElements]);

  useEffect(() => {
    localStorage.setItem('autoSaveEnabled', String(autoSaveEnabled));
  }, [autoSaveEnabled]);

  // ── Auto-save ──
  useEffect(() => {
    const projectId = currentProject?.id || savedProjectCard?.id;
    if (!projectId || !autoSaveEnabled || !hasComponents) return;

    latestStateRef.current = {
      projectId,
      name: currentProject?.name || savedProjectCard?.name || 'Untitled',
      components,
      textElements,
      imageElements,
      uploadedImages,
      styles: globalStyles,
      pages,
      type: currentProject?.type || 'custom',
      status: currentProject?.status || 'draft',
      slug: currentProject?.slug || savedProjectCard?.slug,
    };
  }, [
    components,
    textElements,
    imageElements,
    globalStyles,
    pages,
    currentProject,
    savedProjectCard,
    hasComponents,
    autoSaveEnabled,
  ]);

  // Quick debounce save
  useEffect(() => {
    const projectId = currentProject?.id || savedProjectCard?.id;
    if (!projectId || !autoSaveEnabled || !hasComponents) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const projectData = {
          id: projectId,
          name: currentProject?.name || savedProjectCard?.name || 'Untitled',
          components,
          textElements,
          imageElements,
          uploadedImages,
          styles: globalStyles,
          pages,
          lastEdited: new Date().toISOString(),
          type: currentProject?.type || 'custom',
          status: currentProject?.status || 'draft',
          slug: currentProject?.slug || savedProjectCard?.slug,
        };
        saveProjectToLocalStorage(projectData);
        if (setCurrentProject) setCurrentProject(projectData);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (e) {
        setAutoSaveStatus('idle');
      }
    }, 1500);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [
    components,
    textElements,
    imageElements,
    globalStyles,
    pages,
    autoSaveEnabled,
    hasComponents,
  ]);

  // Periodic save every 10 minutes
  useEffect(() => {
    if (!autoSaveEnabled || !hasComponents) return;
    const TEN_MINUTES = 10 * 60 * 1000;
    periodicAutoSaveRef.current = setInterval(() => {
      const state = latestStateRef.current;
      if (!state || !state.projectId) return;
      try {
        const projectData = {
          id: state.projectId,
          name: state.name,
          components: state.components,
          textElements: state.textElements,
          imageElements: state.imageElements,
          uploadedImages: state.uploadedImages,
          styles: state.styles,
          pages: state.pages,
          lastEdited: new Date().toISOString(),
          type: state.type,
          status: state.status,
          slug: state.slug,
        };
        setAutoSaveStatus('saving');
        saveProjectToLocalStorage(projectData);
        if (setCurrentProject) setCurrentProject(projectData);

        if (token) {
          saveProjectToDatabase(projectData, token).catch((e) =>
            console.error('DB auto-save error:', e)
          );
        }

        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (e) {
        setAutoSaveStatus('idle');
      }
    }, TEN_MINUTES);
    return () => clearInterval(periodicAutoSaveRef.current);
  }, [autoSaveEnabled, hasComponents, token, setCurrentProject]);

  useEffect(() => {
    const page = pages.find((p) => p.id === activePageId);
    if (page) {
      setComponents(page.components || []);
      setTextElements(page.textElements || []);
      setImageElements(page.imageElements || []);
    }
  }, [activePageId]);

  // ── Load functions ──
  const loadProjectsFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const projectsData = response.data;
      setAllProjects(projectsData);
      if (currentProject?.id) {
        const dbProject = projectsData.find((p) => p.id === currentProject.id);
        if (dbProject) {
          setCurrentProject(dbProject);
          const customizations = dbProject.customizations || {};
          setComponents(customizations.components || []);
          setTextElements(customizations.textElements || []);
          setImageElements(customizations.imageElements || []);
          setUploadedImages(customizations.uploadedImages || []);
          if (customizations.styles)
            setGlobalStyles((prev) => ({ ...prev, ...customizations.styles }));
          if (customizations.pages) {
            setPages(customizations.pages);
            setActivePageId(customizations.pages[0]?.id || 'page-1');
          }
          if (dbProject.slug) {
            setSavedProjectCard((prev) => ({ ...prev, slug: dbProject.slug }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading projects from database:', error);
      loadProjectsFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsFromLocalStorage = () => {
    const projectList = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('project_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          if (data && data.id && data.name) projectList.push(data);
        } catch (e) {
          console.error('Error parsing project:', e);
        }
      }
    }
    setAllProjects(projectList);
  };

  const loadProjectFromUrl = async (projectId) => {
    setLoading(true);
    try {
      if (token) {
        const response = await axios.get(`${API_BASE}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const project = response.data;
        if (project) {
          handleOpenProjectInEditor(project);
          saveProjectToLocalStorage({ ...project, id: projectId });
          showSnackbar(`Loaded "${project.name}"`, 'success');
          return;
        }
      }
      const localData = localStorage.getItem(`project_${projectId}`);
      if (localData) {
        const project = JSON.parse(localData);
        handleOpenProjectInEditor(project);
        localStorage.setItem('latest_project_id', projectId);
        showSnackbar(`Loaded "${project.name}" from local storage`, 'success');
        return;
      }
      showSnackbar(`Project ${projectId} not found`, 'warning');
    } catch (error) {
      console.error('Error loading project from URL:', error);
      const localData = localStorage.getItem(`project_${projectId}`);
      if (localData) {
        try {
          const project = JSON.parse(localData);
          handleOpenProjectInEditor(project);
          localStorage.setItem('latest_project_id', projectId);
          showSnackbar(`Loaded "${project.name}" (offline)`, 'info');
        } catch (e) {
          showSnackbar('Failed to load project', 'error');
        }
      } else {
        showSnackbar('Failed to load project', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSlugUniqueness = async (slug) => {
    if (!slug || slug.length < 3) return true;
    setIsCheckingSlug(true);
    try {
      const response = await axios.get(`${API_BASE}/api/websites/check-slug`, {
        params: { slug },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setIsCheckingSlug(false);
      return response.data.isUnique;
    } catch (error) {
      setIsCheckingSlug(false);
      console.error('Error checking slug:', error);
      return false;
    }
  };

  // ── Theme functions ──
  const applyColorTheme = (theme) => {
    setGlobalStyles((prev) => ({
      ...prev,
      primaryColor: theme.styles.primaryColor,
      secondaryColor: theme.styles.secondaryColor,
      accentColor: theme.styles.accentColor,
      backgroundColor: theme.styles.backgroundColor,
      textColor: theme.styles.textColor,
      headingColor: theme.styles.headingColor,
      buttonStyle: theme.styles.buttonStyle,
    }));
    localStorage.setItem(
      'selectedDesignColors',
      JSON.stringify({
        primaryColor: theme.styles.primaryColor,
        secondaryColor: theme.styles.secondaryColor,
        accentColor: theme.styles.accentColor,
        backgroundColor: theme.styles.backgroundColor,
        textColor: theme.styles.textColor,
        headingColor: theme.styles.headingColor,
      })
    );
    localStorage.setItem('currentColorTheme', theme.id);
    showSnackbar(`${theme.name} theme applied!`, 'success');
  };

  const applyColorPalette = (palette) => {
    setGlobalStyles((prev) => ({
      ...prev,
      primaryColor: palette.colors[0],
      secondaryColor: palette.colors[1],
      accentColor: palette.colors[2],
    }));
    localStorage.setItem(
      'selectedDesignColors',
      JSON.stringify({
        primaryColor: palette.colors[0],
        secondaryColor: palette.colors[1],
        accentColor: palette.colors[2],
        backgroundColor: globalStyles.backgroundColor,
        textColor: globalStyles.textColor,
        headingColor: globalStyles.headingColor,
      })
    );
    showSnackbar(`${palette.name} palette applied`, 'success');
  };

  // ── SINGLE DEFINITION of loadDesignFromTemplates ──
  const loadDesignFromTemplates = useCallback(
    (template) => {
      if (!template) return;
      setLoading(true);
      try {
        const templateStyles = {
          primaryColor: template.colors?.primaryColor || G_START,
          secondaryColor: template.colors?.secondaryColor || G_MID,
          accentColor: template.colors?.accentColor || G_END,
          backgroundColor: template.colors?.backgroundColor || '#080C14',
          textColor: template.colors?.textColor || '#FFFFFF',
          headingColor: template.colors?.headingColor || '#FFFFFF',
          fontFamily: template.colors?.fontFamily || 'Inter, sans-serif',
          borderRadius: template.colors?.borderRadius || '12px',
          spacing: template.colors?.spacing || '24px',
          buttonStyle: template.colors?.buttonStyle || 'rounded',
          heroTitle: template.colors?.heroTitle || template.name || 'Welcome to Your Website',
          heroSubtitle: template.colors?.heroSubtitle || 'Create something amazing',
        };

        setGlobalStyles((prev) => ({ ...prev, ...templateStyles }));
        localStorage.setItem(
          'selectedDesignColors',
          JSON.stringify({
            primaryColor: templateStyles.primaryColor,
            secondaryColor: templateStyles.secondaryColor,
            accentColor: templateStyles.accentColor,
            backgroundColor: templateStyles.backgroundColor,
            textColor: templateStyles.textColor,
            headingColor: templateStyles.headingColor,
          })
        );

        // Create components based on template
        const templateComponents = [
          {
            id: generateId(),
            type: 'hero',
            content: {
              title: templateStyles.heroTitle,
              subtitle: templateStyles.heroSubtitle,
              buttonText: 'Get Started',
              buttonLink: '#',
              buttonLinkType: 'internal',
              image: template.image || null,
            },
            styles: {
              textAlign: 'center',
              padding: '80px 20px',
              backgroundColor: templateStyles.backgroundColor,
            },
          },
          {
            id: generateId(),
            type: 'features',
            content: {
              title: 'Features',
              subtitle: 'Everything you need',
              items: [
                { title: 'Responsive Design', description: 'Works on all devices' },
                { title: 'SEO Optimized', description: 'Built for search engines' },
                { title: 'Fast Loading', description: 'Optimized for performance' },
              ],
            },
            styles: {
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: `${templateStyles.secondaryColor}20`,
            },
          },
          {
            id: generateId(),
            type: 'cta',
            content: {
              title: 'Ready to get started?',
              subtitle: 'Join thousands of satisfied customers',
              buttonText: 'Start Now',
              buttonLink: '#',
              buttonLinkType: 'internal',
            },
            styles: {
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: templateStyles.primaryColor,
              color: '#FFFFFF',
            },
          },
        ];
        setComponents(templateComponents);

        // Create text elements
        const defaultTexts = [
          {
            id: generateId(),
            type: 'text',
            tag: 'h1',
            content: templateStyles.heroTitle,
            styles: {
              fontSize: '48px',
              fontWeight: 'bold',
              color: templateStyles.headingColor,
              textAlign: 'center',
              margin: '20px 0',
              fontFamily: templateStyles.fontFamily,
            },
            position: { x: 50, y: 100 },
          },
          {
            id: generateId(),
            type: 'text',
            tag: 'p',
            content: templateStyles.heroSubtitle,
            styles: {
              fontSize: '18px',
              fontWeight: 'normal',
              color: templateStyles.textColor,
              textAlign: 'center',
              margin: '20px 0',
              fontFamily: templateStyles.fontFamily,
              maxWidth: '800px',
            },
            position: { x: 50, y: 180 },
          },
        ];
        setTextElements(defaultTexts);
        setImageElements([]);

        // Update pages
        setPages([
          {
            id: 'page-1',
            name: 'Home',
            components: templateComponents,
            textElements: defaultTexts,
            imageElements: [],
          },
        ]);
        setActivePageId('page-1');

        const newProject = {
          id: `project_${Date.now()}`,
          name: template.name || 'Untitled Design',
          type: template.category || 'custom',
          lastEdited: new Date().toISOString(),
          status: 'draft',
          design: template.name,
          templateId: template.id,
          colors: templateStyles,
          components: templateComponents,
          textElements: defaultTexts,
          imageElements: [],
          uploadedImages: [],
          styles: templateStyles,
          pages: [
            {
              id: 'page-1',
              name: 'Home',
              components: templateComponents,
              textElements: defaultTexts,
              imageElements: [],
            },
          ],
        };

        setSavedProjectCard({ name: newProject.name, id: newProject.id, status: 'draft' });
        if (setCurrentProject) setCurrentProject(newProject);
        setInitialized(true);
        showSnackbar(`"${template.name}" template loaded successfully!`, 'success');
      } catch (error) {
        console.error('Error loading design from templates:', error);
        showSnackbar('Error loading template', 'error');
      } finally {
        setLoading(false);
      }
    },
    [setCurrentProject]
  );

  // ── Initialize ──
  const initializeDefaultComponents = () => {
    const defaultComps = [
      {
        id: generateId(),
        type: 'hero',
        content: {
          title: 'Welcome to Your Website',
          subtitle: 'Create something amazing with our drag-and-drop editor',
          buttonText: 'Get Started',
          buttonLink: '#',
          buttonLinkType: 'internal',
          image: null,
        },
        styles: { textAlign: 'center', padding: '80px 0' },
      },
      {
        id: generateId(),
        type: 'nav',
        content: {
          items: [
            { label: 'Home', url: '/', linkType: 'internal' },
            { label: 'About', url: '/about', linkType: 'internal' },
            { label: 'Services', url: '/services', linkType: 'internal' },
            { label: 'Contact', url: '/contact', linkType: 'internal' },
          ],
          alignment: 'center',
          style: 'horizontal',
        },
        styles: { padding: '16px 0' },
      },
    ];
    setComponents(defaultComps);
    return defaultComps;
  };

  const initializeDefaultTextElements = () => {
    const defaultTexts = [
      {
        id: generateId(),
        type: 'text',
        tag: 'h1',
        content: 'Welcome to Your Website',
        styles: {
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
          margin: '20px 0',
          fontFamily: globalStyles.fontFamily,
        },
        position: { x: 50, y: 100 },
      },
      {
        id: generateId(),
        type: 'text',
        tag: 'p',
        content:
          'Create something amazing with our drag-and-drop editor. Add text, images, and components to build your perfect website.',
        styles: {
          fontSize: '18px',
          fontWeight: 'normal',
          color: 'rgba(255,255,255,0.8)',
          textAlign: 'center',
          margin: '20px 0',
          fontFamily: globalStyles.fontFamily,
          maxWidth: '800px',
        },
        position: { x: 50, y: 180 },
      },
    ];
    setTextElements(defaultTexts);
    return defaultTexts;
  };

  // ── Initialize from design or project ──
  const initializeFromData = useCallback(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }

    const projectParam = searchParams.get('project');
    if (projectParam) {
      loadProjectFromUrl(projectParam);
      return;
    }

    const designParam = searchParams.get('design');
    if (designParam) {
      const decoded = decodeURIComponent(designParam);
      // Try to find template in localStorage
      const savedTemplate = localStorage.getItem('selectedTemplate');
      if (savedTemplate) {
        try {
          const template = JSON.parse(savedTemplate);
          if (template.name === decoded || template.id === decoded) {
            loadDesignFromTemplates(template);
            localStorage.removeItem('selectedTemplate');
            return;
          }
        } catch (e) {
          console.error('Error loading template from localStorage:', e);
        }
      }
    }

    if (mergedDesign?.components) {
      setComponents(mergedDesign.components);
      setTextElements(mergedDesign.textElements || []);
      setImageElements(mergedDesign.imageElements || []);
      setUploadedImages(mergedDesign.uploadedImages || []);
      if (mergedDesign.styles) setGlobalStyles((prev) => ({ ...prev, ...mergedDesign.styles }));
      setInitialized(true);
      return;
    }

    if (currentProject?.components) {
      setComponents(currentProject.components);
      setTextElements(currentProject.textElements || []);
      setImageElements(currentProject.imageElements || []);
      setUploadedImages(currentProject.uploadedImages || []);
      if (currentProject.styles) setGlobalStyles((prev) => ({ ...prev, ...currentProject.styles }));
      if (currentProject.pages) {
        setPages(currentProject.pages);
        setActivePageId(currentProject.pages[0]?.id || 'page-1');
      }
      setSavedProjectCard({
        name: currentProject.name,
        id: currentProject.id,
        status: currentProject.status || 'draft',
        slug: currentProject.slug,
      });
      setInitialized(true);
      return;
    }

    const savedProjectId = localStorage.getItem('latest_project_id');
    if (savedProjectId) {
      const savedData = localStorage.getItem(`project_${savedProjectId}`);
      if (savedData) {
        try {
          const project = JSON.parse(savedData);
          if (project.components) {
            setComponents(project.components);
            setTextElements(project.textElements || []);
            setImageElements(project.imageElements || []);
            setUploadedImages(project.uploadedImages || []);
            if (project.styles) setGlobalStyles((prev) => ({ ...prev, ...project.styles }));
            if (project.pages) {
              setPages(project.pages);
              setActivePageId(project.pages[0]?.id || 'page-1');
            }
            setSavedProjectCard({
              name: project.name,
              id: project.id,
              status: project.status || 'draft',
              slug: project.slug,
            });
            setInitialized(true);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved project:', e);
        }
      }
    }

    const defaultComps = initializeDefaultComponents();
    const defaultTexts = initializeDefaultTextElements();
    setPages([
      {
        id: 'page-1',
        name: 'Home',
        components: defaultComps,
        textElements: defaultTexts,
        imageElements: [],
      },
    ]);
    setInitialized(true);
  }, [currentProject, mergedDesign, searchParams]);

  // ── Effect to initialize once ──
  useEffect(() => {
    if (!initialized) {
      initializeFromData();
    }
  }, [initializeFromData, initialized]);

  // ── History ──
  const addToHistory = useCallback(
    (newComponents, newStyles, newTextElements, newImageElements, newUploadedImages) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        components: newComponents || components,
        styles: newStyles || globalStyles,
        textElements: newTextElements || textElements,
        imageElements: newImageElements || imageElements,
        uploadedImages: newUploadedImages || uploadedImages,
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex, components, globalStyles, textElements, imageElements, uploadedImages]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setComponents(prevState.components);
      setGlobalStyles(prevState.styles);
      setTextElements(prevState.textElements || []);
      setImageElements(prevState.imageElements || []);
      setUploadedImages(prevState.uploadedImages || []);
      setHistoryIndex(historyIndex - 1);
      showSnackbar('Undo successful', 'info');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setComponents(nextState.components);
      setGlobalStyles(nextState.styles);
      setTextElements(nextState.textElements || []);
      setImageElements(nextState.imageElements || []);
      setUploadedImages(nextState.uploadedImages || []);
      setHistoryIndex(historyIndex + 1);
      showSnackbar('Redo successful', 'info');
    }
  }, [history, historyIndex]);

  // ── Style change ──
  const handleStyleChange = useCallback(
    (property, value) => {
      const newStyles = { ...globalStyles, [property]: value };
      setGlobalStyles(newStyles);
      if (
        [
          'primaryColor',
          'secondaryColor',
          'accentColor',
          'backgroundColor',
          'textColor',
          'headingColor',
        ].includes(property)
      ) {
        localStorage.setItem(
          'selectedDesignColors',
          JSON.stringify({
            primaryColor: property === 'primaryColor' ? value : globalStyles.primaryColor,
            secondaryColor: property === 'secondaryColor' ? value : globalStyles.secondaryColor,
            accentColor: property === 'accentColor' ? value : globalStyles.accentColor,
            backgroundColor: property === 'backgroundColor' ? value : globalStyles.backgroundColor,
            textColor: property === 'textColor' ? value : globalStyles.textColor,
            headingColor: property === 'headingColor' ? value : globalStyles.headingColor,
          })
        );
      }
      addToHistory(components, newStyles, textElements, imageElements, uploadedImages);
    },
    [globalStyles, components, textElements, imageElements, uploadedImages, addToHistory]
  );

  // ── Component functions ──
  const handleAddComponent = useCallback(
    (type) => {
      const newComponent = {
        id: generateId(),
        type,
        content: getDefaultContent(type),
        styles: {},
        position: components.length,
      };
      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      addToHistory(newComponents, globalStyles, textElements, imageElements, uploadedImages);
      showSnackbar(`${getComponentName(type)} added`, 'success');
    },
    [components, globalStyles, textElements, imageElements, uploadedImages, addToHistory]
  );

  const handleUpdateComponent = useCallback(
    (id, updates) => {
      const newComponents = components.map((comp) =>
        comp.id === id ? { ...comp, ...updates } : comp
      );
      setComponents(newComponents);
      addToHistory(newComponents, globalStyles, textElements, imageElements, uploadedImages);
    },
    [components, globalStyles, textElements, imageElements, uploadedImages, addToHistory]
  );

  const handleDeleteComponent = useCallback(
    (id) => {
      const newComponents = components.filter((comp) => comp.id !== id);
      setComponents(newComponents);
      addToHistory(newComponents, globalStyles, textElements, imageElements, uploadedImages);
      if (selectedComponent?.id === id) setSelectedComponent(null);
      showSnackbar('Component deleted', 'info');
    },
    [
      components,
      globalStyles,
      textElements,
      imageElements,
      uploadedImages,
      selectedComponent,
      addToHistory,
    ]
  );

  const handleUpdateComponentContent = useCallback(
    (componentId, field, value, itemIndex = null) => {
      const component = components.find((c) => c.id === componentId);
      if (!component) return;
      let updatedContent = { ...component.content };

      if (itemIndex !== null) {
        if (component.type === 'features' && component.content.items) {
          const updatedItems = [...component.content.items];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
          updatedContent.items = updatedItems;
        } else if (component.type === 'gallery' && component.content.items) {
          const updatedItems = [...component.content.items];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
          updatedContent.items = updatedItems;
        } else if (component.type === 'pricing' && component.content.plans) {
          const updatedPlans = [...component.content.plans];
          updatedPlans[itemIndex] = { ...updatedPlans[itemIndex], [field]: value };
          updatedContent.plans = updatedPlans;
        } else if (component.type === 'nav' && component.content.items) {
          const updatedItems = [...component.content.items];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
          updatedContent.items = updatedItems;
        }
      } else {
        updatedContent[field] = value;
      }

      handleUpdateComponent(componentId, { content: updatedContent });
    },
    [components, handleUpdateComponent]
  );

  const handleAddComponentItem = useCallback(
    (componentId, type) => {
      const component = components.find((c) => c.id === componentId);
      if (!component) return;
      let updatedContent = { ...component.content };
      const newItem = { title: 'New Item', description: 'Description', image: null };

      if (component.type === 'features' && updatedContent.items) {
        updatedContent.items = [...updatedContent.items, newItem];
      } else if (component.type === 'gallery' && updatedContent.items) {
        updatedContent.items = [...updatedContent.items, newItem];
      } else if (component.type === 'pricing' && updatedContent.plans) {
        updatedContent.plans = [
          ...updatedContent.plans,
          {
            name: 'New Plan',
            price: '$0',
            features: ['Feature 1'],
            buttonText: 'Choose Plan',
            buttonLink: '#',
            buttonLinkType: 'internal',
          },
        ];
      } else if (component.type === 'nav' && updatedContent.items) {
        updatedContent.items = [
          ...updatedContent.items,
          { label: 'New Page', url: '/new-page', linkType: 'internal' },
        ];
      } else if (component.type === 'footer') {
        if (type === 'link') {
          updatedContent.links = [
            ...(updatedContent.links || []),
            { label: 'New Link', url: '#', linkType: 'internal' },
          ];
        } else if (type === 'social') {
          updatedContent.socialLinks = [
            ...(updatedContent.socialLinks || []),
            { platform: 'Social', url: '#', linkType: 'external' },
          ];
        }
      }
      handleUpdateComponent(componentId, { content: updatedContent });
      showSnackbar('New item added', 'success');
    },
    [components, handleUpdateComponent]
  );

  const handleDeleteComponentItem = useCallback(
    (componentId, type, index) => {
      const component = components.find((c) => c.id === componentId);
      if (!component) return;
      let updatedContent = { ...component.content };

      if (type === 'feature' && updatedContent.items) {
        updatedContent.items = updatedContent.items.filter((_, i) => i !== index);
      } else if (type === 'gallery' && updatedContent.items) {
        updatedContent.items = updatedContent.items.filter((_, i) => i !== index);
      } else if (type === 'plan' && updatedContent.plans) {
        updatedContent.plans = updatedContent.plans.filter((_, i) => i !== index);
      } else if (type === 'nav' && updatedContent.items) {
        updatedContent.items = updatedContent.items.filter((_, i) => i !== index);
      } else if (type === 'link' && updatedContent.links) {
        updatedContent.links = updatedContent.links.filter((_, i) => i !== index);
      } else if (type === 'social' && updatedContent.socialLinks) {
        updatedContent.socialLinks = updatedContent.socialLinks.filter((_, i) => i !== index);
      }
      handleUpdateComponent(componentId, { content: updatedContent });
      showSnackbar('Item deleted', 'info');
    },
    [components, handleUpdateComponent]
  );

  // ── Text element functions ──
  const handleAddTextElement = useCallback(
    (textStyle) => {
      const newTextElement = {
        id: generateId(),
        type: 'text',
        tag: textStyle.tag,
        content: textStyle.defaultText,
        styles: {
          fontSize: textStyle.fontSize,
          fontWeight: textStyle.fontWeight,
          color: globalStyles.textColor,
          textAlign: 'center',
          margin: '10px 0',
          fontFamily: globalStyles.fontFamily,
          ...(textStyle.tag === 'a' && { textDecoration: 'underline', cursor: 'pointer' }),
          ...(textStyle.isNav && {
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px 0',
            flexWrap: 'wrap',
          }),
        },
        position: { x: 50, y: Math.random() * 300 + 100 },
        href: textStyle.href,
        isNav: textStyle.isNav || false,
        isLink: textStyle.isLink || false,
        linkType: textStyle.isLink ? 'internal' : undefined,
      };
      const newTextElements = [...textElements, newTextElement];
      setTextElements(newTextElements);
      addToHistory(components, globalStyles, newTextElements, imageElements, uploadedImages);
      showSnackbar(`${textStyle.name} added to canvas`, 'success');
    },
    [textElements, components, globalStyles, imageElements, uploadedImages, addToHistory]
  );

  const handleUpdateTextElement = useCallback(
    (id, updates) => {
      const newTextElements = textElements.map((el) => (el.id === id ? { ...el, ...updates } : el));
      setTextElements(newTextElements);
      addToHistory(components, globalStyles, newTextElements, imageElements, uploadedImages);
    },
    [textElements, components, globalStyles, imageElements, uploadedImages, addToHistory]
  );

  const handleDeleteTextElement = useCallback(
    (id) => {
      const newTextElements = textElements.filter((el) => el.id !== id);
      setTextElements(newTextElements);
      addToHistory(components, globalStyles, newTextElements, imageElements, uploadedImages);
      if (selectedTextElement?.id === id) setSelectedTextElement(null);
      showSnackbar('Element deleted', 'info');
    },
    [
      textElements,
      components,
      globalStyles,
      imageElements,
      uploadedImages,
      selectedTextElement,
      addToHistory,
    ]
  );

  const handleTextStyleChange = useCallback(
    (id, property, value) => {
      const element = textElements.find((el) => el.id === id);
      if (element)
        handleUpdateTextElement(id, { styles: { ...element.styles, [property]: value } });
    },
    [textElements, handleUpdateTextElement]
  );

  const handleTextPositionChange = useCallback(
    (id, x, y) => {
      const element = [...textElements, ...imageElements].find((el) => el.id === id);
      if (element) {
        if (element.type === 'text') handleUpdateTextElement(id, { position: { x, y } });
        else handleUpdateImageElement(id, { position: { x, y } });
      }
    },
    [textElements, imageElements, handleUpdateTextElement]
  );

  // ── Image functions ──
  const processImages = useCallback(
    (files) => {
      const newImages = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target.result;
          const newImage = {
            id: generateId(),
            url: result,
            name: file.name,
            size: file.size,
            type: file.type,
            width: 0,
            height: 0,
            dateAdded: new Date().toISOString(),
          };
          const img = new Image();
          img.onload = () => {
            newImage.width = img.width;
            newImage.height = img.height;
            setUploadedImages((prev) => [...prev, newImage]);
            addToHistory(components, globalStyles, textElements, imageElements, [
              ...uploadedImages,
              newImage,
            ]);
          };
          img.src = result;
        };
        reader.readAsDataURL(file);
      });
      showSnackbar(`${files.length} image(s) uploaded successfully`, 'success');
    },
    [components, globalStyles, textElements, imageElements, uploadedImages, addToHistory]
  );

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    processImages(files);
  };

  const handleAddMockImage = useCallback(() => {
    const url = mockImageUrl.trim();
    if (!url) {
      showSnackbar('Please enter an image URL', 'warning');
      return;
    }
    const newImage = {
      id: generateId(),
      url,
      name: `mock-${Date.now()}.jpg`,
      size: 0,
      type: 'image/jpeg',
      width: 800,
      height: 600,
      dateAdded: new Date().toISOString(),
      isMock: true,
    };
    setUploadedImages((prev) => [...prev, newImage]);
    setMockImageUrl('');
    showSnackbar('Mock image added to library', 'success');
  }, [mockImageUrl]);

  const handleAddImageToCanvas = useCallback(
    (image, imageStyle = null) => {
      const styleToUse = imageStyle || imageStyles[0];
      const newImageElement = {
        id: generateId(),
        type: 'image',
        imageId: image.id,
        imageUrl: image.url,
        alt: image.name,
        width: styleToUse.width,
        height: styleToUse.height,
        objectFit: styleToUse.objectFit || 'cover',
        borderRadius: styleToUse.borderRadius || globalStyles.borderRadius,
        filters: {
          brightness: 100,
          contrast: 100,
          saturate: 100,
          blur: 0,
          grayscale: 0,
          sepia: 0,
          hueRotate: 0,
        },
        position: { x: 50, y: Math.random() * 300 + 100 },
        styles: {
          width: styleToUse.width,
          height: styleToUse.height,
          objectFit: styleToUse.objectFit || 'cover',
          borderRadius: styleToUse.borderRadius || globalStyles.borderRadius,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        },
      };
      const newImageElements = [...imageElements, newImageElement];
      setImageElements(newImageElements);
      addToHistory(components, globalStyles, textElements, newImageElements, uploadedImages);
      showSnackbar('Image added to canvas', 'success');
    },
    [imageElements, components, globalStyles, textElements, uploadedImages, addToHistory]
  );

  const handleUpdateImageElement = useCallback(
    (id, updates) => {
      const newImageElements = imageElements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      );
      setImageElements(newImageElements);
      addToHistory(components, globalStyles, textElements, newImageElements, uploadedImages);
    },
    [imageElements, components, globalStyles, textElements, uploadedImages, addToHistory]
  );

  const handleDeleteImageElement = useCallback(
    (id) => {
      const newImageElements = imageElements.filter((el) => el.id !== id);
      setImageElements(newImageElements);
      addToHistory(components, globalStyles, textElements, newImageElements, uploadedImages);
      if (selectedImageElement?.id === id) setSelectedImageElement(null);
      showSnackbar('Image removed from canvas', 'info');
    },
    [
      imageElements,
      components,
      globalStyles,
      textElements,
      uploadedImages,
      selectedImageElement,
      addToHistory,
    ]
  );

  const handleDeleteUploadedImage = useCallback(
    (imageId) => {
      setUploadedImages(uploadedImages.filter((img) => img.id !== imageId));
      const newImageElements = imageElements.filter((el) => el.imageId !== imageId);
      setImageElements(newImageElements);
      addToHistory(
        components,
        globalStyles,
        textElements,
        newImageElements,
        uploadedImages.filter((img) => img.id !== imageId)
      );
      if (selectedLibraryImage?.id === imageId) setSelectedLibraryImage(null);
      showSnackbar('Image deleted from library', 'info');
    },
    [
      uploadedImages,
      imageElements,
      components,
      globalStyles,
      textElements,
      selectedLibraryImage,
      addToHistory,
    ]
  );

  const handleResizeImage = useCallback(
    (id, newWidth, newHeight) => {
      const imageElement = imageElements.find((el) => el.id === id);
      if (imageElement)
        handleUpdateImageElement(id, {
          width: newWidth,
          height: newHeight,
          styles: { ...imageElement.styles, width: newWidth, height: newHeight },
        });
    },
    [imageElements, handleUpdateImageElement]
  );

  const handleApplyImageStyle = useCallback(
    (id, style) => {
      const imageElement = imageElements.find((el) => el.id === id);
      if (imageElement) {
        handleUpdateImageElement(id, {
          width: style.width,
          height: style.height,
          objectFit: style.objectFit,
          borderRadius: style.borderRadius,
          styles: {
            ...imageElement.styles,
            width: style.width,
            height: style.height,
            objectFit: style.objectFit,
            borderRadius: style.borderRadius,
          },
        });
        showSnackbar(`Applied ${style.name} style`, 'success');
      }
    },
    [imageElements, handleUpdateImageElement]
  );

  const handleApplyImageFilter = useCallback(
    (id, filterType, value) => {
      const imageElement = imageElements.find((el) => el.id === id);
      if (imageElement) {
        const newFilters = { ...imageElement.filters, [filterType]: value };
        const filterString = `brightness(${newFilters.brightness}%) contrast(${newFilters.contrast}%) saturate(${newFilters.saturate}%) blur(${newFilters.blur}px) grayscale(${newFilters.grayscale}%) sepia(${newFilters.sepia}%) hue-rotate(${newFilters.hueRotate}deg)`;
        handleUpdateImageElement(id, {
          filters: newFilters,
          styles: { ...imageElement.styles, filter: filterString },
        });
      }
    },
    [imageElements, handleUpdateImageElement]
  );

  const handleRotateImage = useCallback(
    (id, degrees) => {
      const imageElement = imageElements.find((el) => el.id === id);
      if (imageElement) {
        const currentRotate = imageElement.rotate || 0;
        const newRotate = currentRotate + degrees;
        handleUpdateImageElement(id, {
          rotate: newRotate,
          styles: { ...imageElement.styles, transform: `rotate(${newRotate}deg)` },
        });
      }
    },
    [imageElements, handleUpdateImageElement]
  );

  const handleFlipImage = useCallback(
    (id, direction) => {
      const imageElement = imageElements.find((el) => el.id === id);
      if (imageElement) {
        const currentFlip = imageElement.flip || { horizontal: false, vertical: false };
        const newFlip = { ...currentFlip, [direction]: !currentFlip[direction] };
        const transform = `scaleX(${newFlip.horizontal ? -1 : 1}) scaleY(${newFlip.vertical ? -1 : 1}) rotate(${imageElement.rotate || 0}deg)`;
        handleUpdateImageElement(id, {
          flip: newFlip,
          styles: { ...imageElement.styles, transform },
        });
      }
    },
    [imageElements, handleUpdateImageElement]
  );

  const handleReplaceImage = useCallback(
    (id, file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        handleUpdateImageElement(id, { imageUrl: result });
        const newUploadedImage = {
          id: generateId(),
          url: result,
          name: file.name,
          size: file.size,
          type: file.type,
          dateAdded: new Date().toISOString(),
        };
        setUploadedImages((prev) => [...prev, newUploadedImage]);
        showSnackbar('Image replaced', 'success');
      };
      reader.onerror = () => showSnackbar('Failed to replace image', 'error');
      reader.readAsDataURL(file);
    },
    [handleUpdateImageElement]
  );

  const handleAddImageToComponent = useCallback(
    (image, componentId, itemIndex = null) => {
      const updatedComponents = components.map((comp) => {
        if (comp.id === componentId) {
          if (comp.type === 'hero')
            return { ...comp, content: { ...comp.content, image: image.url } };
          if (comp.type === 'logo')
            return { ...comp, content: { ...comp.content, image: image.url } };
          if (comp.type === 'footer')
            return { ...comp, content: { ...comp.content, logo: image.url } };
          if (comp.type === 'features' && itemIndex !== null) {
            const updatedItems = [...comp.content.items];
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], image: image.url };
            return { ...comp, content: { ...comp.content, items: updatedItems } };
          }
          if (comp.type === 'gallery' && itemIndex !== null) {
            const updatedItems = [...comp.content.items];
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], image: image.url };
            return { ...comp, content: { ...comp.content, items: updatedItems } };
          }
        }
        return comp;
      });
      setComponents(updatedComponents);
      addToHistory(updatedComponents, globalStyles, textElements, imageElements, uploadedImages);
      showSnackbar('Image added to component', 'success');
    },
    [components, globalStyles, textElements, imageElements, uploadedImages, addToHistory]
  );

  // ── Download Website ──
  const handleDownloadWebsite = useCallback(
    async (project) => {
      setDownloading(true);
      try {
        const hasContent =
          components.length > 0 || textElements.length > 0 || imageElements.length > 0;
        if (!hasContent) {
          showSnackbar('Add some content before downloading', 'warning');
          setDownloading(false);
          return;
        }

        const projectToDownload = project || {
          id: currentProject?.id || savedProjectCard?.id,
          name: currentProject?.name || savedProjectCard?.name || 'My Website',
          components,
          textElements,
          imageElements,
          uploadedImages,
          styles: globalStyles,
          pages,
          status: currentProject?.status || 'draft',
          slug: currentProject?.slug || savedProjectCard?.slug,
        };
        await downloadWebsiteAsZip(projectToDownload);
        showSnackbar('Website downloaded successfully! 📦', 'success');
      } catch (error) {
        console.error('Error downloading website:', error);
        showSnackbar('Error downloading website. Please try again.', 'error');
      } finally {
        setDownloading(false);
      }
    },
    [
      currentProject,
      savedProjectCard,
      components,
      textElements,
      imageElements,
      uploadedImages,
      globalStyles,
      pages,
    ]
  );

  // ── Save and Publish ──
  const handleSave = useCallback(() => {
    const hasContent = components.length > 0 || textElements.length > 0 || imageElements.length > 0;
    if (!hasContent) {
      showSnackbar('Add some content before saving', 'warning');
      return;
    }
    setProjectNameInput(currentProject?.name || savedProjectCard?.name || 'Untitled Project');
    setSaveModalOpen(true);
  }, [currentProject, savedProjectCard, components, textElements, imageElements]);

  const handleSaveConfirm = useCallback(async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const projectId = currentProject?.id || savedProjectCard?.id || Date.now().toString();
      const projectName = projectNameInput.trim() || 'Untitled Project';
      const updatedPages = pages.map((p) =>
        p.id === activePageId ? { ...p, components, textElements, imageElements } : p
      );
      const projectData = {
        id: projectId,
        name: projectName,
        components,
        textElements,
        imageElements,
        uploadedImages,
        styles: globalStyles,
        pages: updatedPages,
        lastEdited: new Date().toISOString(),
        type: currentProject?.type || 'custom',
        status: currentProject?.status || 'draft',
        slug: currentProject?.slug || savedProjectCard?.slug,
      };

      saveProjectToLocalStorage(projectData);

      if (token) {
        await saveProjectToDatabase(projectData, token);
        await loadProjectsFromDatabase();
      }

      if (setCurrentProject) setCurrentProject(projectData);
      setPages(updatedPages);
      setSavedProjectCard({
        name: projectName,
        id: projectId,
        status: 'draft',
        slug: projectData.slug,
      });
      setSaveModalOpen(false);
      setSaveStatus('saved');
      showSnackbar('Project saved successfully!', 'success');

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving project:', error);
      setSaveStatus('error');
      showSnackbar('Error saving project. Please try again.', 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [
    currentProject,
    savedProjectCard,
    projectNameInput,
    pages,
    activePageId,
    components,
    textElements,
    imageElements,
    uploadedImages,
    globalStyles,
    token,
    setCurrentProject,
  ]);

  const handlePublish = useCallback(() => {
    const hasContent = components.length > 0 || textElements.length > 0 || imageElements.length > 0;
    if (!hasContent) {
      showSnackbar('Add some content before publishing', 'warning');
      return;
    }
    setPublishModalOpen(true);
    setWebsiteName(currentProject?.name || savedProjectCard?.name || 'My Website');
    setGeneratedSlug(currentProject?.slug || savedProjectCard?.slug || '');
    setSlugError('');
    setPublishDomain('');
    setPublishDomainError('');
    setCustomDomainEnabled(false);
  }, [currentProject, savedProjectCard, components, textElements, imageElements]);

  // ── GENERATE FULL HTML FOR PUBLISHING ──
  const generateFullHTML = useCallback(() => {
    const docsPath = getDocumentsPath();

    const generatePageHTML = (pageData, pageName) => {
      const {
        components: pageComponents = [],
        textElements: pageTextElements = [],
        imageElements: pageImageElements = [],
        styles: pageStyles = {},
      } = pageData;

      const gStyles = {
        primaryColor: pageStyles.primaryColor || globalStyles.primaryColor || G_START,
        secondaryColor: pageStyles.secondaryColor || globalStyles.secondaryColor || G_MID,
        accentColor: pageStyles.accentColor || globalStyles.accentColor || G_END,
        backgroundColor: pageStyles.backgroundColor || globalStyles.backgroundColor || '#080C14',
        textColor: pageStyles.textColor || globalStyles.textColor || '#FFFFFF',
        headingColor: pageStyles.headingColor || globalStyles.headingColor || '#FFFFFF',
        fontFamily: pageStyles.fontFamily || globalStyles.fontFamily || 'Inter, sans-serif',
        borderRadius: pageStyles.borderRadius || globalStyles.borderRadius || '12px',
        buttonStyle: pageStyles.buttonStyle || globalStyles.buttonStyle || 'rounded',
      };

      const renderLinkHTML = (url, linkType, content) => {
        if (!url || url === '#') return content;
        const detectedType = linkType || getLinkType(url);

        if (detectedType === 'internal' || detectedType === 'anchor') {
          const filePath = convertToFilePath(url, detectedType);
          return `<a href="${filePath}">${content}</a>`;
        }

        if (detectedType === 'email') {
          return `<a href="mailto:${url.replace(/^mailto:/, '')}">${content}</a>`;
        }
        if (detectedType === 'phone') {
          return `<a href="tel:${url.replace(/^tel:/, '')}">${content}</a>`;
        }
        if (detectedType === 'external' || isExternalLink(url)) {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${content}</a>`;
        }
        const filePath = convertToFilePath(url, 'internal');
        return `<a href="${filePath}">${content}</a>`;
      };

      const renderComponentHTML = (component) => {
        const styles = `color: ${gStyles.textColor}; ${Object.entries(component.styles || {})
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
          .join(' ')}`;

        switch (component.type) {
          case 'hero':
            return `<div style="text-align: center; padding: 80px 20px; ${styles}">
              ${component.content.image ? `<img src="${component.content.image}" alt="Hero" style="max-width: 100%; height: auto; margin-bottom: 32px; border-radius: ${gStyles.borderRadius};" />` : ''}
              <h1 style="font-size: 3rem; margin-bottom: 16px; color: ${gStyles.headingColor};">${component.content.title}</h1>
              <p style="font-size: 1.5rem; margin-bottom: 32px; color: ${alpha(gStyles.textColor, 0.8)}; max-width: 800px; margin-left: auto; margin-right: auto;">${component.content.subtitle}</p>
              ${
                component.content.buttonText
                  ? renderLinkHTML(
                      component.content.buttonLink || '#',
                      component.content.buttonLinkType || 'internal',
                      `<button style="background: ${gStyles.primaryColor}; border: none; padding: 12px 32px; border-radius: ${gStyles.buttonStyle === 'rounded' ? '999px' : gStyles.borderRadius}; color: white; font-size: 1.1rem; cursor: pointer;">${component.content.buttonText}</button>`
                    )
                  : ''
              }
            </div>`;

          case 'nav':
            return `<div style="display: flex; justify-content: ${component.content.alignment || 'center'}; gap: 16px; padding: 16px 20px; flex-wrap: wrap; ${styles}">
              ${component.content.items
                ?.map((item) =>
                  renderLinkHTML(
                    item.url || '#',
                    item.linkType || 'internal',
                    `<span style="color: ${gStyles.textColor}; text-decoration: none; padding: 8px 16px; border-radius: ${gStyles.borderRadius}; transition: all 0.3s ease;">${item.label}</span>`
                  )
                )
                .join('')}
            </div>`;

          case 'logo':
            return `<div style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; ${styles}">
              ${
                component.content.image
                  ? renderLinkHTML(
                      component.content.link || '/',
                      'internal',
                      `<img src="${component.content.image}" alt="Logo" style="height: ${component.content.size === 'small' ? 32 : component.content.size === 'large' ? 64 : 48}px; width: auto; object-fit: contain;" />`
                    )
                  : renderLinkHTML(
                      component.content.link || '/',
                      'internal',
                      `<span style="font-size: ${component.content.size === 'small' ? '1.2rem' : component.content.size === 'large' ? '2rem' : '1.5rem'}; font-weight: 700; background: linear-gradient(135deg, ${gStyles.primaryColor}, ${gStyles.secondaryColor}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${component.content.text || 'Your Logo'}</span>`
                    )
              }
              ${component.content.tagline ? `<span style="color: ${alpha(gStyles.textColor, 0.6)}; margin-left: 8px;">${component.content.tagline}</span>` : ''}
            </div>`;

          case 'footer': {
            const footerLinks = component.content.links || [];
            const socialLinks = component.content.socialLinks || [];
            return `<div style="padding: 48px 20px; margin-top: 32px; background: ${alpha(gStyles.primaryColor, 0.05)}; border-top: 1px solid ${alpha(gStyles.primaryColor, 0.1)}; ${styles}">
              <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px;">
                <div>
                  ${
                    component.content.logo
                      ? renderLinkHTML(
                          component.content.logoLink || '/',
                          'internal',
                          `<img src="${component.content.logo}" alt="Footer Logo" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 8px;" />`
                        )
                      : `<h3 style="color: ${gStyles.headingColor}; margin-bottom: 16px;">${component.content.companyName || 'Your Company'}</h3>`
                  }
                  ${component.content.tagline ? `<p style="color: ${alpha(gStyles.textColor, 0.7)}; margin-bottom: 16px;">${component.content.tagline}</p>` : ''}
                </div>
                <div>
                  <h4 style="color: ${gStyles.headingColor}; margin-bottom: 12px;">Quick Links</h4>
                  ${footerLinks
                    .map((link) =>
                      renderLinkHTML(
                        link.url || '#',
                        link.linkType || 'internal',
                        `<div style="color: ${alpha(gStyles.textColor, 0.7)}; text-decoration: none; margin-bottom: 8px;">${link.label}</div>`
                      )
                    )
                    .join('')}
                </div>
                <div>
                  <h4 style="color: ${gStyles.headingColor}; margin-bottom: 12px;">Connect</h4>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${socialLinks
                      .map((social) =>
                        renderLinkHTML(
                          social.url || '#',
                          social.linkType || 'external',
                          `<span style="padding: 8px;">${social.platform}</span>`
                        )
                      )
                      .join('')}
                  </div>
                </div>
              </div>
              <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid ${alpha(gStyles.textColor, 0.1)}; color: ${alpha(gStyles.textColor, 0.5)};">
                ${component.content.copyright || `© ${new Date().getFullYear()} ${component.content.companyName || 'Your Company'}. All rights reserved.`}
              </div>
            </div>`;
          }

          default:
            return `<div style="${styles}">${component.content?.text || ''}</div>`;
        }
      };

      const renderTextElementHTML = (element) => {
        if (element.isNav) {
          return `<div style="display: flex; gap: 24px; justify-content: center; align-items: center; padding: 12px 0; flex-wrap: wrap; ${Object.entries(
            element.styles || {}
          )
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
            .join(' ')}">
            ${element.content
              .split('|')
              .map((item) => {
                const parts = item.trim().split('||');
                const label = parts[0] || item.trim();
                const url = parts[1] || '#';
                const linkType = parts[2] || 'internal';
                return renderLinkHTML(
                  url,
                  linkType,
                  `<span style="color: ${gStyles.textColor}; text-decoration: none; padding: 8px 16px; border-radius: ${gStyles.borderRadius}; font-size: ${element.styles?.fontSize || '16px'}; font-weight: ${element.styles?.fontWeight || 'normal'};">${label}</span>`
                );
              })
              .join('')}
          </div>`;
        }

        if (element.tag === 'a' && element.href) {
          return renderLinkHTML(
            element.href,
            element.linkType || 'internal',
            `<span style="${Object.entries(element.styles || {})
              .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
              .join(' ')}">${element.content}</span>`
          );
        }

        const tag = element.tag || 'p';
        const style = Object.entries(element.styles || {})
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
          .join(' ');
        return `<${tag} style="${style}">${element.content}</${tag}>`;
      };

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName || 'My Website'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background-color: ${gStyles.backgroundColor}; 
      color: ${gStyles.textColor}; 
      font-family: ${gStyles.fontFamily}; 
      line-height: 1.6; 
    }
    h1, h2, h3, h4, h5, h6 { color: ${gStyles.headingColor}; }
    a { color: ${gStyles.primaryColor}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .published-site { min-height: 100vh; }
    a.external-link::after {
      content: " ↗";
      font-size: 0.8em;
    }
    html {
      scroll-behavior: smooth;
    }
  </style>
</head>
<body>
  <div class="published-site">
    ${pageTextElements.map((el) => renderTextElementHTML(el)).join('')}
    ${pageImageElements
      .map(
        (el) =>
          `<img src="${el.imageUrl}" alt="${el.alt || ''}" style="width: ${el.width}; height: ${el.height}; object-fit: ${el.objectFit}; border-radius: ${el.borderRadius}; ${Object.entries(
            el.styles || {}
          )
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
            .join(' ')}" />`
      )
      .join('')}
    ${pageComponents.map((c) => renderComponentHTML(c)).join('')}
  </div>
</body>
</html>`;
    };

    const allPages =
      pages.length > 0
        ? pages
        : [{ id: 'page-1', name: 'Home', components, textElements, imageElements }];

    const firstPage = allPages[0];
    return generatePageHTML(firstPage, firstPage.name || 'Home');
  }, [globalStyles, components, textElements, imageElements, pages]);

  // ── Save website to database ──
  const saveWebsiteToDatabase = useCallback(async () => {
    if (!websiteName.trim()) {
      showSnackbar('Please enter a website name', 'warning');
      return;
    }

    const hasContent = components.length > 0 || textElements.length > 0 || imageElements.length > 0;
    if (!hasContent) {
      showSnackbar('Add some content before publishing', 'warning');
      return;
    }

    if (customDomainEnabled && publishDomain.trim()) {
      const domainPattern =
        /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;
      if (!domainPattern.test(publishDomain.trim())) {
        setPublishDomainError('Please enter a valid domain name (e.g., example.com)');
        return;
      }
      setPublishDomainError('');
    }

    let finalSlug = generatedSlug;
    if (!finalSlug) finalSlug = slugify(websiteName);

    if (!/^[a-z0-9-]+$/.test(finalSlug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }
    if (finalSlug.length < 3 || finalSlug.length > 50) {
      setSlugError('Slug must be between 3 and 50 characters');
      return;
    }

    const isUnique = await checkSlugUniqueness(finalSlug);
    if (!isUnique) {
      setSlugError('This URL slug is already taken. Please choose another one.');
      return;
    }

    setIsSavingToDB(true);
    try {
      const projectId = savedProjectCard?.id || currentProject?.id || Date.now().toString();
      const updatedPages = pages.map((p) =>
        p.id === activePageId ? { ...p, components, textElements, imageElements } : p
      );

      const docsPath = getDocumentsPath();
      const htmlCode = generateFullHTML();

      let publishedUrl = `${docsPath}/${finalSlug}`;
      if (customDomainEnabled && publishDomain.trim()) {
        publishedUrl = `https://${publishDomain.trim()}`;
      }

      const projectData = {
        id: projectId,
        name: websiteName.trim(),
        components,
        textElements,
        imageElements,
        uploadedImages,
        styles: globalStyles,
        pages: updatedPages,
        lastEdited: new Date().toISOString(),
        type: 'custom',
        status: 'published',
        slug: finalSlug,
        published_url: publishedUrl,
        html_code: htmlCode,
        custom_domain: customDomainEnabled ? publishDomain.trim() : null,
      };

      if (token) {
        await saveProjectToDatabase(projectData, token);
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        const publishResponse = await axios.post(
          `${API_BASE}/api/projects/${projectId}/publish`,
          {
            html_code: htmlCode,
            custom_domain: customDomainEnabled ? publishDomain.trim() : null,
            domain_configured: customDomainEnabled,
          },
          { headers }
        );
        setPublishUrl(publishResponse.data.published_url || projectData.published_url);
      } else {
        saveProjectToLocalStorage(projectData);
        setPublishUrl(projectData.published_url);
      }

      setSavedProjectCard({
        name: websiteName.trim(),
        id: projectId,
        slug: finalSlug,
        status: 'published',
      });
      setPublishModalOpen(false);
      setPublishDialogOpen(true);
      if (setCurrentProject)
        setCurrentProject({
          ...currentProject,
          ...projectData,
          status: 'published',
          id: projectId,
        });
      setPages(updatedPages);

      const domainMessage =
        customDomainEnabled && publishDomain.trim()
          ? `🌐 Domain: ${publishDomain.trim()}`
          : `📁 ${docsPath}/${finalSlug}`;
      showSnackbar(`Website published successfully! ${domainMessage}`, 'success');

      if (token) await loadProjectsFromDatabase();
    } catch (error) {
      console.error('Error publishing website:', error);
      const errorMessage = error.response?.data?.detail || 'Error publishing website';
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsSavingToDB(false);
    }
  }, [
    websiteName,
    generatedSlug,
    savedProjectCard,
    currentProject,
    pages,
    activePageId,
    components,
    textElements,
    imageElements,
    uploadedImages,
    globalStyles,
    token,
    setCurrentProject,
    customDomainEnabled,
    publishDomain,
    generateFullHTML,
  ]);

  // ── Generate preview code ──
  const generateHTMLCode = useCallback(() => {
    const html = generateFullHTML();
    setGeneratedCode(html);
  }, [generateFullHTML]);

  useEffect(() => {
    if (showCode) generateHTMLCode();
  }, [showCode, generateHTMLCode]);

  // ── Copy functions ──
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(publishUrl);
    showSnackbar('Link copied to clipboard!', 'success');
  }, [publishUrl]);

  const copyCodeToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedCode);
    showSnackbar('Code copied to clipboard!', 'success');
  }, [generatedCode]);

  // ── Drag and drop handlers ──
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      processImages(imageFiles);
    },
    [processImages]
  );

  // ── Handle preview ──
  const handlePreview = useCallback(() => {
    const hasContent = components.length > 0 || textElements.length > 0 || imageElements.length > 0;
    if (!hasContent) {
      showSnackbar('Add some content before previewing', 'warning');
      return;
    }
    const projectId = currentProject?.id || savedProjectCard?.id || Date.now().toString();
    const projectData = {
      id: projectId,
      name: currentProject?.name || savedProjectCard?.name || 'Untitled Project',
      components,
      textElements,
      imageElements,
      uploadedImages,
      styles: globalStyles,
      pages,
      lastEdited: new Date().toISOString(),
      type: currentProject?.type || 'custom',
      status: currentProject?.status || 'draft',
      slug: currentProject?.slug || savedProjectCard?.slug,
    };
    saveProjectToLocalStorage(projectData);
    navigate(`/preview?id=${projectId}&t=${Date.now()}`);
    showSnackbar('Opening preview...', 'info');
  }, [
    currentProject,
    savedProjectCard,
    components,
    textElements,
    imageElements,
    uploadedImages,
    globalStyles,
    pages,
    navigate,
  ]);

  // ── Open project in editor ──
  const handleOpenProjectInEditor = useCallback(
    (project) => {
      if (setCurrentProject) setCurrentProject(project);
      const customizations = project.customizations || {};
      setComponents(customizations.components || project.components || []);
      setTextElements(customizations.textElements || project.textElements || []);
      setImageElements(customizations.imageElements || project.imageElements || []);
      setUploadedImages(customizations.uploadedImages || project.uploadedImages || []);
      if (customizations.styles || project.styles)
        setGlobalStyles((prev) => ({
          ...prev,
          ...(customizations.styles || project.styles || {}),
        }));
      if (customizations.pages || project.pages) {
        const pagesData = customizations.pages || project.pages;
        setPages(pagesData);
        setActivePageId(pagesData[0]?.id || 'page-1');
      }
      setSavedProjectCard({
        name: project.name,
        id: project.id,
        slug: project.slug || project.publishSlug,
        status: project.status || 'draft',
      });
      setShowProjectsGallery(false);
      showSnackbar(`Opened "${project.name}"`, 'success');
    },
    [setCurrentProject]
  );

  // ── Load project from saved pages ──
  const loadProjectFromSavedPages = useCallback(
    (project) => {
      if (!project) return;
      setLoading(true);
      try {
        const customizations = project.customizations || {};
        setComponents(customizations.components || project.components || []);
        setTextElements(customizations.textElements || project.textElements || []);
        setImageElements(customizations.imageElements || project.imageElements || []);
        setUploadedImages(customizations.uploadedImages || project.uploadedImages || []);
        if (customizations.styles || project.styles)
          setGlobalStyles((prev) => ({
            ...prev,
            ...(customizations.styles || project.styles || {}),
          }));
        if (customizations.pages || project.pages) {
          const pagesData = customizations.pages || project.pages;
          setPages(pagesData);
          setActivePageId(pagesData[0]?.id || 'page-1');
        }
        setSavedProjectCard({
          name: project.name,
          id: project.id,
          slug: project.slug || project.publishSlug,
          status: project.status || 'draft',
        });
        if (setCurrentProject) setCurrentProject(project);
        setShowProjectsGallery(false);
        showSnackbar(`Loaded "${project.name}" successfully!`, 'success');
      } catch (error) {
        console.error('Error loading project from Saved Pages:', error);
        showSnackbar('Error loading project', 'error');
      } finally {
        setLoading(false);
      }
    },
    [setCurrentProject]
  );

  // ── Delete project ──
  const handleDeleteProject = useCallback(
    async (projectId) => {
      if (!window.confirm('Are you sure you want to delete this project?')) return;
      try {
        if (token)
          await axios.delete(`${API_BASE}/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        localStorage.removeItem(`project_${projectId}`);
        setAllProjects((prev) => prev.filter((p) => p.id !== projectId));
        setShowProjectsGallery(false);
        showSnackbar('Project deleted successfully', 'info');
        if (token) await loadProjectsFromDatabase();
      } catch (error) {
        console.error('Error deleting project:', error);
        showSnackbar('Error deleting project', 'error');
      }
    },
    [token]
  );

  // ── Page management ──
  const handleSwitchPage = useCallback(
    (pageId) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, components, textElements, imageElements } : p
        )
      );
      setActivePageId(pageId);
    },
    [activePageId, components, textElements, imageElements]
  );

  const handleAddPage = useCallback(() => {
    const name = newPageName.trim() || `Page ${pages.length + 1}`;
    const newPage = {
      id: `page-${Date.now()}`,
      name,
      components: [],
      textElements: [],
      imageElements: [],
    };
    setPages((prev) => [...prev, newPage]);
    setNewPageName('');
    setAddPageDialogOpen(false);
    handleSwitchPage(newPage.id);
    showSnackbar(`Page "${name}" created`, 'success');
  }, [newPageName, pages.length, handleSwitchPage]);

  const handleDeletePage = useCallback(
    (pageId) => {
      if (pages.length === 1) {
        showSnackbar('Cannot delete the only page', 'warning');
        return;
      }
      const remaining = pages.filter((p) => p.id !== pageId);
      setPages(remaining);
      if (activePageId === pageId) handleSwitchPage(remaining[0].id);
      showSnackbar('Page deleted', 'info');
    },
    [pages, activePageId, handleSwitchPage]
  );

  // ── Color picker ──
  const handleColorPickerOpen = useCallback((event, target, property) => {
    setColorPickerAnchor(event.currentTarget);
    setSelectedColorTarget({ target, property });
  }, []);

  const handleColorPickerClose = useCallback(() => {
    setColorPickerAnchor(null);
    setSelectedColorTarget(null);
  }, []);

  const handleColorChange = useCallback(
    (color) => {
      if (selectedColorTarget) {
        if (selectedColorTarget.target === 'global')
          handleStyleChange(selectedColorTarget.property, color.hex);
        else if (selectedColorTarget.target === 'text' && selectedTextElement)
          handleTextStyleChange(selectedTextElement.id, selectedColorTarget.property, color.hex);
        else if (selectedColorTarget.target === 'component' && selectedComponent)
          handleUpdateComponent(selectedComponent.id, {
            styles: { ...selectedComponent.styles, [selectedColorTarget.property]: color.hex },
          });
      }
    },
    [
      selectedColorTarget,
      selectedTextElement,
      selectedComponent,
      handleStyleChange,
      handleTextStyleChange,
      handleUpdateComponent,
    ]
  );

  // ── Component rendering ──
  const renderComponent = useCallback(
    (component) => {
      const styles = { color: globalStyles.textColor, ...component.styles };

      const renderLink = (url, linkType, children) => {
        if (!url || url === '#') return <>{children}</>;

        const detectedType = linkType || getLinkType(url);

        if (detectedType === 'internal' || detectedType === 'anchor') {
          const filePath = convertToFilePath(url, detectedType);
          return (
            <a href={filePath} style={{ color: 'inherit', textDecoration: 'none' }}>
              {children}
            </a>
          );
        }

        if (detectedType === 'email')
          return (
            <a
              href={`mailto:${url.replace(/^mailto:/, '')}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {children}
            </a>
          );
        if (detectedType === 'phone')
          return (
            <a
              href={`tel:${url.replace(/^tel:/, '')}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {children}
            </a>
          );

        const isExternal = detectedType === 'external' || isExternalLink(url);
        const href = isExternal ? url : url.startsWith('/') ? url : `/${url}`;
        const target = isExternal ? '_blank' : '_self';
        const rel = isExternal ? 'noopener noreferrer' : '';

        return (
          <a
            href={href}
            target={target}
            rel={rel}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {children}
            {isExternal && (
              <OpenInNew sx={{ fontSize: '0.7em', ml: 0.5, verticalAlign: 'middle' }} />
            )}
          </a>
        );
      };

      switch (component.type) {
        case 'hero':
          return (
            <Box sx={{ ...styles, textAlign: 'center', py: 8, px: 4 }}>
              {component.content.image && (
                <Box
                  component="img"
                  src={component.content.image}
                  alt="Hero"
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    mb: 4,
                    borderRadius: globalStyles.borderRadius,
                  }}
                />
              )}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  mb: 2,
                  fontWeight: 'bold',
                  color: globalStyles.headingColor,
                }}
              >
                {component.content.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: alpha(globalStyles.textColor, 0.8),
                  maxWidth: '800px',
                  mx: 'auto',
                }}
              >
                {component.content.subtitle}
              </Typography>
              {component.content.buttonText &&
                renderLink(
                  component.content.buttonLink || '#',
                  component.content.buttonLinkType || 'internal',
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: globalStyles.primaryColor,
                      '&:hover': { bgcolor: globalStyles.secondaryColor },
                      borderRadius:
                        globalStyles.buttonStyle === 'rounded'
                          ? '999px'
                          : globalStyles.borderRadius,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {component.content.buttonText}
                  </Button>
                )}
            </Box>
          );

        case 'nav':
          return (
            <Box
              sx={{
                ...styles,
                py: 2,
                px: 4,
                display: 'flex',
                justifyContent: component.content.alignment || 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              {component.content.items?.map((item, idx) =>
                renderLink(
                  item.url || '#',
                  item.linkType || 'internal',
                  <Typography
                    key={idx}
                    component="span"
                    sx={{
                      color: globalStyles.textColor,
                      textDecoration: 'none',
                      padding: '8px 16px',
                      borderRadius: globalStyles.borderRadius,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        color: globalStyles.primaryColor,
                        backgroundColor: alpha(globalStyles.primaryColor, 0.1),
                      },
                    }}
                  >
                    {item.label}
                  </Typography>
                )
              )}
            </Box>
          );

        case 'logo':
          return (
            <Box sx={{ ...styles, display: 'flex', alignItems: 'center', gap: 2, py: 2, px: 4 }}>
              {component.content.image
                ? renderLink(
                    component.content.link || '/',
                    'internal',
                    <Box
                      component="img"
                      src={component.content.image}
                      alt="Logo"
                      sx={{
                        height:
                          component.content.size === 'small'
                            ? 32
                            : component.content.size === 'large'
                              ? 64
                              : 48,
                        width: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                  )
                : renderLink(
                    component.content.link || '/',
                    'internal',
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${globalStyles.primaryColor}, ${globalStyles.secondaryColor})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        fontSize:
                          component.content.size === 'small'
                            ? '1.2rem'
                            : component.content.size === 'large'
                              ? '2rem'
                              : '1.5rem',
                      }}
                    >
                      {component.content.text || 'Your Logo'}
                    </Typography>
                  )}
              {component.content.tagline && (
                <Typography
                  variant="body2"
                  sx={{ color: alpha(globalStyles.textColor, 0.6), ml: 1 }}
                >
                  {component.content.tagline}
                </Typography>
              )}
            </Box>
          );

        case 'footer': {
          const footerLinks = component.content.links || [];
          const socialLinks = component.content.socialLinks || [];
          const columns = component.content.columns || 4;
          return (
            <Box
              sx={{
                ...styles,
                py: 6,
                px: 4,
                mt: 4,
                backgroundColor: alpha(globalStyles.primaryColor, 0.05),
                borderTop: `1px solid ${alpha(globalStyles.primaryColor, 0.1)}`,
              }}
            >
              <Grid container spacing={4}>
                <Grid item xs={12} md={3}>
                  {component.content.logo ? (
                    renderLink(
                      component.content.logoLink || '/',
                      'internal',
                      <Box
                        component="img"
                        src={component.content.logo}
                        alt="Footer Logo"
                        sx={{ height: 40, width: 'auto', objectFit: 'contain', mb: 1 }}
                      />
                    )
                  ) : (
                    <Typography
                      variant="h6"
                      sx={{ color: globalStyles.headingColor, fontWeight: 600, mb: 2 }}
                    >
                      {component.content.companyName || 'Your Company'}
                    </Typography>
                  )}
                  {component.content.tagline && (
                    <Typography
                      variant="body2"
                      sx={{ color: alpha(globalStyles.textColor, 0.7), mb: 2 }}
                    >
                      {component.content.tagline}
                    </Typography>
                  )}
                  {component.content.showNewsletter && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        size="small"
                        placeholder="Subscribe to newsletter"
                        sx={{
                          '& .MuiInputBase-input': { color: globalStyles.textColor },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(globalStyles.textColor, 0.2),
                          },
                          mr: 1,
                          width: '70%',
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: globalStyles.primaryColor,
                          '&:hover': { bgcolor: globalStyles.secondaryColor },
                          mt: { xs: 1, sm: 0 },
                        }}
                      >
                        Subscribe
                      </Button>
                    </Box>
                  )}
                </Grid>
                {columns > 1 && (
                  <Grid item xs={12} md={3}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: globalStyles.headingColor, fontWeight: 600, mb: 2 }}
                    >
                      Quick Links
                    </Typography>
                    {footerLinks.slice(0, Math.ceil(footerLinks.length / 2)).map((link, idx) =>
                      renderLink(
                        link.url || '#',
                        link.linkType || 'internal',
                        <Typography
                          key={idx}
                          component="span"
                          sx={{
                            display: 'block',
                            color: alpha(globalStyles.textColor, 0.7),
                            textDecoration: 'none',
                            mb: 1,
                            '&:hover': { color: globalStyles.primaryColor },
                            cursor: 'pointer',
                          }}
                        >
                          {link.label}
                        </Typography>
                      )
                    )}
                  </Grid>
                )}
                {columns > 2 && (
                  <Grid item xs={12} md={3}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: globalStyles.headingColor, fontWeight: 600, mb: 2 }}
                    >
                      Resources
                    </Typography>
                    {footerLinks.slice(Math.ceil(footerLinks.length / 2)).map((link, idx) =>
                      renderLink(
                        link.url || '#',
                        link.linkType || 'internal',
                        <Typography
                          key={idx}
                          component="span"
                          sx={{
                            display: 'block',
                            color: alpha(globalStyles.textColor, 0.7),
                            textDecoration: 'none',
                            mb: 1,
                            '&:hover': { color: globalStyles.primaryColor },
                            cursor: 'pointer',
                          }}
                        >
                          {link.label}
                        </Typography>
                      )
                    )}
                  </Grid>
                )}
                {columns > 3 && (
                  <Grid item xs={12} md={3}>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: globalStyles.headingColor, fontWeight: 600, mb: 2 }}
                    >
                      Connect With Us
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {socialLinks.map((social, idx) =>
                        renderLink(
                          social.url || '#',
                          social.linkType || 'external',
                          <IconButton
                            key={idx}
                            component="span"
                            sx={{
                              color: globalStyles.textColor,
                              bgcolor: alpha(globalStyles.primaryColor, 0.1),
                              '&:hover': { bgcolor: globalStyles.primaryColor, color: '#FFFFFF' },
                            }}
                          >
                            {social.platform === 'Facebook' && <Facebook />}
                            {social.platform === 'Twitter' && <Twitter />}
                            {social.platform === 'Instagram' && <Instagram />}
                            {social.platform === 'LinkedIn' && <LinkedIn />}
                            {social.platform === 'YouTube' && <YouTube />}
                            {social.platform === 'WhatsApp' && <WhatsApp />}
                          </IconButton>
                        )
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 3, borderColor: alpha(globalStyles.textColor, 0.1) }} />
              <Typography
                variant="body2"
                sx={{ textAlign: 'center', color: alpha(globalStyles.textColor, 0.5) }}
              >
                {component.content.copyright ||
                  `© ${new Date().getFullYear()} ${component.content.companyName || 'Your Company'}. All rights reserved.`}
              </Typography>
            </Box>
          );
        }

        case 'features':
          return (
            <Box sx={{ ...styles, py: 6, px: 4 }}>
              <Typography
                variant="h2"
                sx={{
                  textAlign: 'center',
                  mb: 6,
                  color: globalStyles.headingColor,
                  fontWeight: 'bold',
                }}
              >
                {component.content.title}
              </Typography>
              <Grid container spacing={4}>
                {component.content.items?.map((item, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    {renderLink(
                      item.link || '#',
                      item.linkType || 'internal',
                      <Paper
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          bgcolor: alpha(globalStyles.primaryColor, 0.05),
                          borderRadius: globalStyles.borderRadius,
                          transition: 'transform 0.3s',
                          cursor: 'pointer',
                          '&:hover': { transform: 'translateY(-8px)' },
                        }}
                      >
                        {item.image && (
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.title}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: globalStyles.borderRadius,
                              mb: 2,
                            }}
                          />
                        )}
                        <Typography variant="h5" sx={{ mb: 2, color: globalStyles.primaryColor }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ color: alpha(globalStyles.textColor, 0.7) }}>
                          {item.description}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          );

        case 'gallery':
          return (
            <Box sx={{ ...styles, py: 6, px: 4 }}>
              <Typography
                variant="h2"
                sx={{
                  textAlign: 'center',
                  mb: 6,
                  color: globalStyles.headingColor,
                  fontWeight: 'bold',
                }}
              >
                {component.content.title}
              </Typography>
              <Grid container spacing={3}>
                {component.content.items?.map((item, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    {renderLink(
                      item.link || '#',
                      item.linkType || 'internal',
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          bgcolor: alpha(globalStyles.primaryColor, 0.05),
                          borderRadius: globalStyles.borderRadius,
                          transition: 'transform 0.3s',
                          cursor: 'pointer',
                          '&:hover': { transform: 'translateY(-5px)' },
                        }}
                      >
                        {item.image ? (
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.title}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: globalStyles.borderRadius,
                              mb: 2,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: 200,
                              bgcolor: alpha(globalStyles.primaryColor, 0.2),
                              borderRadius: globalStyles.borderRadius,
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <PhotoLibrary sx={{ fontSize: 48, color: globalStyles.primaryColor }} />
                          </Box>
                        )}
                        <Typography variant="h6">{item.title}</Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: alpha(globalStyles.textColor, 0.7) }}
                        >
                          {item.description}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          );

        case 'contact':
          return (
            <Box sx={{ ...styles, py: 6, px: 4 }}>
              <Typography
                variant="h2"
                sx={{
                  textAlign: 'center',
                  mb: 6,
                  color: globalStyles.headingColor,
                  fontWeight: 'bold',
                }}
              >
                {component.content.title}
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 4,
                      bgcolor: alpha(globalStyles.primaryColor, 0.05),
                      borderRadius: globalStyles.borderRadius,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Name"
                      sx={{ mb: 2 }}
                      InputLabelProps={{ sx: { color: alpha(globalStyles.textColor, 0.7) } }}
                      InputProps={{ sx: { color: globalStyles.textColor } }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      sx={{ mb: 2 }}
                      InputLabelProps={{ sx: { color: alpha(globalStyles.textColor, 0.7) } }}
                      InputProps={{ sx: { color: globalStyles.textColor } }}
                    />
                    <TextField
                      fullWidth
                      label="Message"
                      multiline
                      rows={4}
                      sx={{ mb: 2 }}
                      InputLabelProps={{ sx: { color: alpha(globalStyles.textColor, 0.7) } }}
                      InputProps={{ sx: { color: globalStyles.textColor } }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        bgcolor: globalStyles.primaryColor,
                        '&:hover': { bgcolor: globalStyles.secondaryColor },
                      }}
                    >
                      Send Message
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 4,
                      bgcolor: alpha(globalStyles.primaryColor, 0.05),
                      borderRadius: globalStyles.borderRadius,
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2, color: globalStyles.headingColor }}>
                      Contact Information
                    </Typography>
                    <Typography sx={{ mb: 1, color: alpha(globalStyles.textColor, 0.8) }}>
                      📍 {component.content.address}
                    </Typography>
                    <Typography sx={{ mb: 1, color: alpha(globalStyles.textColor, 0.8) }}>
                      📧 {component.content.email}
                    </Typography>
                    <Typography sx={{ color: alpha(globalStyles.textColor, 0.8) }}>
                      📞 {component.content.phone}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          );

        case 'pricing':
          return (
            <Box sx={{ ...styles, py: 6, px: 4 }}>
              <Typography
                variant="h2"
                sx={{
                  textAlign: 'center',
                  mb: 6,
                  color: globalStyles.headingColor,
                  fontWeight: 'bold',
                }}
              >
                {component.content.title}
              </Typography>
              <Grid container spacing={4} justifyContent="center">
                {component.content.plans?.map((plan, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: alpha(globalStyles.primaryColor, 0.05),
                        borderRadius: globalStyles.borderRadius,
                        transition: 'transform 0.3s',
                        '&:hover': { transform: 'translateY(-8px)' },
                      }}
                    >
                      <Typography variant="h4" sx={{ mb: 2, color: globalStyles.primaryColor }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {plan.price}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      {plan.features?.map((feature, fIdx) => (
                        <Typography
                          key={fIdx}
                          sx={{ mb: 1, color: alpha(globalStyles.textColor, 0.7) }}
                        >
                          ✓ {feature}
                        </Typography>
                      ))}
                      {plan.buttonText &&
                        renderLink(
                          plan.buttonLink || '#',
                          plan.buttonLinkType || 'internal',
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{
                              mt: 3,
                              bgcolor: globalStyles.primaryColor,
                              '&:hover': { bgcolor: globalStyles.secondaryColor },
                            }}
                          >
                            {plan.buttonText}
                          </Button>
                        )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );

        default:
          return (
            <Typography variant="body1" sx={styles}>
              {component.content?.text}
            </Typography>
          );
      }
    },
    [globalStyles]
  );

  // ── Render floating toolbars ──
  const renderTextFloatingToolbar = useCallback(
    (element) => (
      <Box
        sx={{
          position: 'absolute',
          top: -48,
          left: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: '#1A1F2E',
          border: `1px solid ${alpha(G_START, 0.4)}`,
          borderRadius: '10px',
          px: 1,
          py: 0.5,
          boxShadow: `0 4px 20px ${alpha('#000', 0.5)}`,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Bold">
          <IconButton
            size="small"
            onClick={() =>
              handleTextStyleChange(
                element.id,
                'fontWeight',
                element.styles?.fontWeight === 'bold' ? 'normal' : 'bold'
              )
            }
            sx={{ color: element.styles?.fontWeight === 'bold' ? G_START : 'white', p: 0.5 }}
          >
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton
            size="small"
            onClick={() =>
              handleTextStyleChange(
                element.id,
                'fontStyle',
                element.styles?.fontStyle === 'italic' ? 'normal' : 'italic'
              )
            }
            sx={{ color: element.styles?.fontStyle === 'italic' ? G_START : 'white', p: 0.5 }}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton
            size="small"
            onClick={() =>
              handleTextStyleChange(
                element.id,
                'textDecoration',
                element.styles?.textDecoration === 'underline' ? 'none' : 'underline'
              )
            }
            sx={{
              color: element.styles?.textDecoration === 'underline' ? G_START : 'white',
              p: 0.5,
            }}
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 1, height: 20, bgcolor: alpha('#FFFFFF', 0.2) }} />
        <Tooltip title="Align Left">
          <IconButton
            size="small"
            onClick={() => handleTextStyleChange(element.id, 'textAlign', 'left')}
            sx={{ color: element.styles?.textAlign === 'left' ? G_START : 'white', p: 0.5 }}
          >
            <FormatAlignLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <IconButton
            size="small"
            onClick={() => handleTextStyleChange(element.id, 'textAlign', 'center')}
            sx={{ color: element.styles?.textAlign === 'center' ? G_START : 'white', p: 0.5 }}
          >
            <FormatAlignCenter fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <IconButton
            size="small"
            onClick={() => handleTextStyleChange(element.id, 'textAlign', 'right')}
            sx={{ color: element.styles?.textAlign === 'right' ? G_START : 'white', p: 0.5 }}
          >
            <FormatAlignRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 1, height: 20, bgcolor: alpha('#FFFFFF', 0.2) }} />
        {element.isLink && (
          <>
            <Tooltip title="Edit Link">
              <IconButton
                size="small"
                onClick={() => setEditingLink(element.id)}
                sx={{ color: G_START, p: 0.5 }}
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ width: 1, height: 20, bgcolor: alpha('#FFFFFF', 0.2) }} />
          </>
        )}
        <Tooltip title="Edit Text">
          <IconButton
            size="small"
            onClick={() => setEditingText(element.id)}
            sx={{ color: G_MID, p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate">
          <IconButton
            size="small"
            onClick={() => {
              const newElement = { ...element, id: generateId() };
              const newTextElements = [...textElements, newElement];
              setTextElements(newTextElements);
              addToHistory(
                components,
                globalStyles,
                newTextElements,
                imageElements,
                uploadedImages
              );
              showSnackbar('Text element duplicated', 'success');
            }}
            sx={{ color: G_START, p: 0.5 }}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => handleDeleteTextElement(element.id)}
            sx={{ color: '#ff4444', p: 0.5 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [
      textElements,
      components,
      globalStyles,
      imageElements,
      uploadedImages,
      handleTextStyleChange,
      handleDeleteTextElement,
      addToHistory,
    ]
  );

  const renderImageFloatingToolbar = useCallback(
    (element) => (
      <Box
        sx={{
          position: 'absolute',
          top: -48,
          left: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: '#1A1F2E',
          border: `1px solid ${alpha(G_MID, 0.4)}`,
          borderRadius: '10px',
          px: 1,
          py: 0.5,
          boxShadow: `0 4px 20px ${alpha('#000', 0.5)}`,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Rotate Left">
          <IconButton
            size="small"
            onClick={() => handleRotateImage(element.id, -90)}
            sx={{ color: 'white', p: 0.5 }}
          >
            <RotateLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Rotate Right">
          <IconButton
            size="small"
            onClick={() => handleRotateImage(element.id, 90)}
            sx={{ color: 'white', p: 0.5 }}
          >
            <RotateRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Flip H">
          <IconButton
            size="small"
            onClick={() => handleFlipImage(element.id, 'horizontal')}
            sx={{ color: 'white', p: 0.5 }}
          >
            <Flip fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 1, height: 20, bgcolor: alpha('#FFFFFF', 0.2) }} />
        <Tooltip title="Duplicate">
          <IconButton
            size="small"
            onClick={() => {
              const newElement = { ...element, id: generateId() };
              const newImageElements = [...imageElements, newElement];
              setImageElements(newImageElements);
              addToHistory(
                components,
                globalStyles,
                textElements,
                newImageElements,
                uploadedImages
              );
              showSnackbar('Image duplicated', 'success');
            }}
            sx={{ color: G_START, p: 0.5 }}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => handleDeleteImageElement(element.id)}
            sx={{ color: '#ff4444', p: 0.5 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [
      imageElements,
      components,
      globalStyles,
      textElements,
      uploadedImages,
      handleRotateImage,
      handleFlipImage,
      handleDeleteImageElement,
      addToHistory,
    ]
  );

  const renderComponentFloatingToolbar = useCallback(
    (component) => (
      <Box
        sx={{
          position: 'absolute',
          top: -48,
          left: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: '#1A1F2E',
          border: `1px solid ${alpha(G_END, 0.4)}`,
          borderRadius: '10px',
          px: 1,
          py: 0.5,
          boxShadow: `0 4px 20px ${alpha('#000', 0.5)}`,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="caption" sx={{ color: G_END, px: 1, fontWeight: 600 }}>
          {getComponentName(component.type)}
        </Typography>
        <Box sx={{ width: 1, height: 20, bgcolor: alpha('#FFFFFF', 0.2) }} />
        <Tooltip title="Move Up">
          <IconButton
            size="small"
            onClick={() => {
              const idx = components.findIndex((c) => c.id === component.id);
              if (idx > 0) {
                const newComps = [...components];
                [newComps[idx - 1], newComps[idx]] = [newComps[idx], newComps[idx - 1]];
                setComponents(newComps);
                addToHistory(newComps, globalStyles, textElements, imageElements, uploadedImages);
              }
            }}
            sx={{ color: 'white', p: 0.5 }}
          >
            <Typography sx={{ fontSize: 14, lineHeight: 1 }}>↑</Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Move Down">
          <IconButton
            size="small"
            onClick={() => {
              const idx = components.findIndex((c) => c.id === component.id);
              if (idx < components.length - 1) {
                const newComps = [...components];
                [newComps[idx], newComps[idx + 1]] = [newComps[idx + 1], newComps[idx]];
                setComponents(newComps);
                addToHistory(newComps, globalStyles, textElements, imageElements, uploadedImages);
              }
            }}
            sx={{ color: 'white', p: 0.5 }}
          >
            <Typography sx={{ fontSize: 14, lineHeight: 1 }}>↓</Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate">
          <IconButton
            size="small"
            onClick={() => {
              const newComp = { ...component, id: generateId() };
              const newComps = [...components, newComp];
              setComponents(newComps);
              addToHistory(newComps, globalStyles, textElements, imageElements, uploadedImages);
              showSnackbar('Component duplicated', 'success');
            }}
            sx={{ color: G_START, p: 0.5 }}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => handleDeleteComponent(component.id)}
            sx={{ color: '#ff4444', p: 0.5 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [
      components,
      globalStyles,
      textElements,
      imageElements,
      uploadedImages,
      handleDeleteComponent,
      addToHistory,
    ]
  );

  // ── Render preview ──
  const renderPreview = useCallback(() => {
    const previewWidth = { mobile: '375px', tablet: '768px', desktop: '100%' }[previewMode];

    const renderLinkPreview = (url, linkType, children) => {
      if (!url || url === '#') return children;

      const detectedType = linkType || getLinkType(url);

      if (detectedType === 'internal' || detectedType === 'anchor') {
        const filePath = convertToFilePath(url, detectedType);
        return (
          <a href={filePath} style={{ color: 'inherit', textDecoration: 'none' }}>
            {children}
          </a>
        );
      }

      if (detectedType === 'email')
        return (
          <a
            href={`mailto:${url.replace(/^mailto:/, '')}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {children}
          </a>
        );
      if (detectedType === 'phone')
        return (
          <a
            href={`tel:${url.replace(/^tel:/, '')}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {children}
          </a>
        );

      const isExternal = detectedType === 'external' || isExternalLink(url);
      const href = isExternal ? url : url.startsWith('/') ? url : `/${url}`;
      const target = isExternal ? '_blank' : '_self';
      const rel = isExternal ? 'noopener noreferrer' : '';

      return (
        <a
          href={href}
          target={target}
          rel={rel}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {children}
          {isExternal && <OpenInNew sx={{ fontSize: '0.7em', ml: 0.5, verticalAlign: 'middle' }} />}
        </a>
      );
    };

    const handleCanvasClick = (e) => {
      if (isEditingMode) {
        const target = e.target;
        const isTextElement =
          target.closest('.text-element') ||
          target.closest('.image-element') ||
          target.closest('.component-element');
        if (!isTextElement) {
          setSelectedComponent(null);
          setSelectedTextElement(null);
          setSelectedImageElement(null);
        }
      } else {
        setSelectedComponent(null);
        setSelectedTextElement(null);
        setSelectedImageElement(null);
      }
    };

    return (
      <Box
        ref={canvasRef}
        sx={{
          width: previewWidth,
          margin: '0 auto',
          transition: 'all 0.3s ease',
          color: globalStyles.textColor,
          fontFamily: globalStyles.fontFamily,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'auto',
          pointerEvents: isEditingMode ? 'auto' : 'auto',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundColor: globalStyles.backgroundColor,
            filter: globalStyles.backgroundBlur ? `blur(${globalStyles.backgroundBlur}px)` : 'none',
            opacity: globalStyles.backgroundOpacity ?? 1,
          }}
        />
        <div
          className="preview-container"
          style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}
        >
          {textElements.map((element, index) => (
            <motion.div
              key={element.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                position: dragDropMode ? 'absolute' : 'relative',
                left: dragDropMode ? `${element.position?.x || 50}px` : 'auto',
                top: dragDropMode ? `${element.position?.y || 100}px` : 'auto',
                cursor: dragDropMode ? 'move' : isEditingMode ? 'pointer' : 'pointer',
                ...element.styles,
                ...(selectedTextElement?.id === element.id && !dragDropMode && isEditingMode
                  ? {
                      outline: `2px solid ${G_START}`,
                      outlineOffset: '4px',
                      borderRadius: '4px',
                      position: 'relative',
                    }
                  : {}),
                ...(isEditingMode ? { pointerEvents: 'auto' } : { pointerEvents: 'auto' }),
              }}
              className="text-element"
              onClick={(e) => {
                e.stopPropagation();
                if (!dragDropMode && isEditingMode) {
                  setSelectedTextElement(element);
                  setSelectedComponent(null);
                  setSelectedImageElement(null);
                }
              }}
              onMouseDown={(e) => {
                if (dragDropMode && isEditingMode) {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startPos = { x: element.position?.x || 50, y: element.position?.y || 100 };
                  const onMouseMove = (moveEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    handleTextPositionChange(element.id, startPos.x + dx, startPos.y + dy);
                  };
                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }
              }}
            >
              {selectedTextElement?.id === element.id &&
                !dragDropMode &&
                isEditingMode &&
                renderTextFloatingToolbar(element)}
              {editingText === element.id && isEditingMode ? (
                <TextField
                  autoFocus
                  fullWidth
                  multiline={element.tag === 'p' || element.tag === 'div' || element.isNav}
                  value={element.content}
                  onChange={(e) => handleUpdateTextElement(element.id, { content: e.target.value })}
                  onBlur={() => setEditingText(null)}
                  onKeyPress={(e) => e.key === 'Enter' && setEditingText(null)}
                  sx={{
                    '& .MuiInputBase-root': {
                      color: element.styles.color,
                      fontSize: element.styles.fontSize,
                      fontWeight: element.styles.fontWeight,
                      fontFamily: element.styles.fontFamily,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                  }}
                />
              ) : element.isNav ? (
                <Box
                  sx={{
                    display: 'flex',
                    gap: '24px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '12px 0',
                    flexWrap: 'wrap',
                    ...element.styles,
                  }}
                >
                  {element.content.split('|').map((item, idx) => {
                    const parts = item.trim().split('||');
                    const label = parts[0] || item.trim();
                    const url = parts[1] || '#';
                    const linkType = parts[2] || 'internal';
                    return renderLinkPreview(
                      url,
                      linkType,
                      <Typography
                        key={idx}
                        component="span"
                        sx={{
                          color: globalStyles.textColor,
                          textDecoration: 'none',
                          padding: '8px 16px',
                          borderRadius: globalStyles.borderRadius,
                          transition: 'all 0.3s ease',
                          fontSize: element.styles.fontSize,
                          fontWeight: element.styles.fontWeight,
                          '&:hover': {
                            color: globalStyles.primaryColor,
                            backgroundColor: alpha(globalStyles.primaryColor, 0.1),
                          },
                          cursor: isEditingMode ? 'pointer' : 'pointer',
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!dragDropMode && isEditingMode) setEditingText(element.id);
                        }}
                      >
                        {label}
                      </Typography>
                    );
                  })}
                </Box>
              ) : element.isLink ? (
                renderLinkPreview(
                  element.href || '#',
                  element.linkType || 'internal',
                  <Typography
                    component="span"
                    sx={{ ...element.styles, cursor: isEditingMode ? 'pointer' : 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!dragDropMode && isEditingMode) setEditingText(element.id);
                    }}
                  >
                    {element.content}
                  </Typography>
                )
              ) : (
                React.createElement(
                  element.tag,
                  {
                    style: element.styles,
                    onClick: (e) => {
                      e.stopPropagation();
                      if (!dragDropMode && isEditingMode) setEditingText(element.id);
                    },
                    ...(element.tag === 'a' && { href: element.href || '#', target: '_blank' }),
                  },
                  element.content
                )
              )}
            </motion.div>
          ))}

          {imageElements.map((element, index) => (
            <motion.div
              key={element.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                position: dragDropMode ? 'absolute' : 'relative',
                left: dragDropMode ? `${element.position?.x || 50}px` : 'auto',
                top: dragDropMode ? `${element.position?.y || 100}px` : 'auto',
                cursor: dragDropMode ? 'move' : isEditingMode ? 'pointer' : 'pointer',
                display: 'inline-block',
                ...(selectedImageElement?.id === element.id && !dragDropMode && isEditingMode
                  ? { outline: `2px solid ${G_MID}`, outlineOffset: '4px', borderRadius: '4px' }
                  : {}),
              }}
              className="image-element"
              onClick={(e) => {
                e.stopPropagation();
                if (!dragDropMode && isEditingMode) {
                  setSelectedImageElement(element);
                  setSelectedComponent(null);
                  setSelectedTextElement(null);
                }
              }}
            >
              {selectedImageElement?.id === element.id &&
                !dragDropMode &&
                isEditingMode &&
                renderImageFloatingToolbar(element)}
              <img
                src={element.imageUrl}
                alt={element.alt}
                style={{
                  width: element.width,
                  height: element.height,
                  objectFit: element.objectFit,
                  borderRadius: element.borderRadius,
                  filter: element.styles?.filter,
                  transform: element.styles?.transform,
                  cursor: isEditingMode ? 'pointer' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'block',
                }}
              />
            </motion.div>
          ))}

          {components.map((component, index) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="component-element"
              onClick={(e) => {
                e.stopPropagation();
                if (isEditingMode) {
                  setSelectedComponent(component);
                  setSelectedTextElement(null);
                  setSelectedImageElement(null);
                }
              }}
              style={{
                cursor: isEditingMode ? 'pointer' : 'default',
                position: 'relative',
                ...component.styles,
                ...(selectedComponent?.id === component.id && isEditingMode
                  ? { outline: `2px solid ${G_END}`, outlineOffset: '2px' }
                  : {}),
                pointerEvents: isEditingMode ? 'auto' : 'auto',
              }}
            >
              {selectedComponent?.id === component.id &&
                isEditingMode &&
                renderComponentFloatingToolbar(component)}
              {renderComponent(component)}
            </motion.div>
          ))}
        </div>
      </Box>
    );
  }, [
    previewMode,
    globalStyles,
    textElements,
    imageElements,
    components,
    dragDropMode,
    selectedTextElement,
    selectedImageElement,
    selectedComponent,
    editingText,
    isEditingMode,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    renderTextFloatingToolbar,
    renderImageFloatingToolbar,
    renderComponentFloatingToolbar,
    renderComponent,
    handleTextPositionChange,
    handleUpdateTextElement,
  ]);

  // ── Publish Modal ──
  const renderPublishModal = useCallback(
    () => (
      <Dialog
        open={publishModalOpen}
        onClose={() => !isSavingToDB && setPublishModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            backgroundImage: 'none',
            borderRadius: '20px',
            border: `1px solid ${alpha(G_START, 0.25)}`,
            color: 'white',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ height: 4, background: GRAD }} />
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: GRAD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Publish sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Publish Your Website
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.45) }}>
              Your website will be saved to your Documents folder
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1 }}>
                Website Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g., My Awesome Portfolio"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                disabled={isSavingToDB}
                sx={{
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(G_START, 0.6) },
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1 }}>
                Save Location
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: alpha('#FFFFFF', 0.5), fontSize: '14px' }}>
                  {getDocumentsPath()}/
                </Typography>
                <TextField
                  placeholder="my-website-folder"
                  value={generatedSlug}
                  onChange={(e) => {
                    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setGeneratedSlug(newSlug);
                    setSlugError('');
                  }}
                  disabled={isSavingToDB}
                  error={!!slugError}
                  helperText={slugError}
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-input': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(G_START, 0.6),
                    },
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: alpha('#FFFFFF', 0.35), mt: 0.5, display: 'block' }}
              >
                Your website files will be saved in your Documents folder.
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={customDomainEnabled}
                    onChange={(e) => {
                      setCustomDomainEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setPublishDomain('');
                        setPublishDomainError('');
                      }
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: G_START },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: G_START,
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: 'white', fontWeight: 500 }}>
                    <Domain sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                    Use Custom Domain
                  </Typography>
                }
              />
              {customDomainEnabled && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.7), mb: 1 }}>
                    Custom Domain
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., mywebsite.com"
                    value={publishDomain}
                    onChange={(e) => {
                      setPublishDomain(e.target.value);
                      setPublishDomainError('');
                    }}
                    disabled={isSavingToDB}
                    error={!!publishDomainError}
                    helperText={
                      publishDomainError || 'Enter the domain where your website will be hosted'
                    }
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(G_START, 0.6),
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.35), mt: 0.5, display: 'block' }}
                  >
                    Configure your DNS settings to point to this domain.
                  </Typography>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: alpha(G_START, 0.05),
                border: `1px solid ${alpha(G_START, 0.15)}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: G_START, mb: 1.5 }}>
                Publish Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                    Components
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {components.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                    Text Elements
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {textElements.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                    Images
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {imageElements.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                    Uploaded Assets
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {uploadedImages.length}
                  </Typography>
                </Box>
                {customDomainEnabled && publishDomain.trim() && (
                  <Box>
                    <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                      Custom Domain
                    </Typography>
                    <Typography variant="body2" sx={{ color: G_START, fontWeight: 600 }}>
                      {publishDomain.trim()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Alert
              severity="info"
              sx={{
                bgcolor: alpha(G_START, 0.1),
                color: alpha('#FFFFFF', 0.8),
                '& .MuiAlert-icon': { color: G_START },
              }}
            >
              <Typography variant="caption">
                Your website will be saved as HTML files in your Documents folder.
                {components.length > 0
                  ? ` ${components.length} components will be included.`
                  : ' Add components to publish.'}
                {customDomainEnabled &&
                  publishDomain.trim() &&
                  ` 🌐 Published to: https://${publishDomain.trim()}`}
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setPublishModalOpen(false)}
            disabled={isSavingToDB}
            sx={{ color: alpha('#FFFFFF', 0.6), '&:hover': { color: 'white' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveWebsiteToDatabase}
            variant="contained"
            disabled={isSavingToDB || !websiteName.trim() || components.length === 0}
            startIcon={isSavingToDB ? <CircularProgress size={18} /> : <Publish />}
            sx={{
              background: GRAD,
              borderRadius: '10px',
              fontWeight: 700,
              px: 4,
              '&:hover': { opacity: 0.9 },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {isSavingToDB ? 'Publishing...' : 'Publish Website'}
          </Button>
        </DialogActions>
      </Dialog>
    ),
    [
      publishModalOpen,
      isSavingToDB,
      websiteName,
      generatedSlug,
      slugError,
      components,
      textElements,
      imageElements,
      uploadedImages,
      customDomainEnabled,
      publishDomain,
      publishDomainError,
      saveWebsiteToDatabase,
    ]
  );

  // ── Return all state and functions ──
  return {
    activeTab,
    setActiveTab,
    selectedComponent,
    setSelectedComponent,
    selectedTextElement,
    setSelectedTextElement,
    selectedImageElement,
    setSelectedImageElement,
    previewMode,
    setPreviewMode,
    showCode,
    setShowCode,
    generatedCode,
    setGeneratedCode,
    saving,
    setSaving,
    publishing,
    setPublishing,
    loading,
    setLoading,
    snackbar,
    setSnackbar,
    components,
    setComponents,
    textElements,
    setTextElements,
    imageElements,
    setImageElements,
    uploadedImages,
    setUploadedImages,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    publishDialogOpen,
    setPublishDialogOpen,
    publishUrl,
    setPublishUrl,
    colorPickerAnchor,
    setColorPickerAnchor,
    saveModalOpen,
    setSaveModalOpen,
    projectNameInput,
    setProjectNameInput,
    savedProjectCard,
    setSavedProjectCard,
    selectedColorTarget,
    setSelectedColorTarget,
    editingText,
    setEditingText,
    dragDropMode,
    setDragDropMode,
    canvasScale,
    setCanvasScale,
    imageUploadDialogOpen,
    setImageUploadDialogOpen,
    imageUploadTarget,
    setImageUploadTarget,
    dragOver,
    setDragOver,
    publishModalOpen,
    setPublishModalOpen,
    websiteName,
    setWebsiteName,
    isSavingToDB,
    setIsSavingToDB,
    generatedSlug,
    setGeneratedSlug,
    slugError,
    setSlugError,
    isCheckingSlug,
    setIsCheckingSlug,
    pages,
    setPages,
    activePageId,
    setActivePageId,
    addPageDialogOpen,
    setAddPageDialogOpen,
    newPageName,
    setNewPageName,
    showProjectsGallery,
    setShowProjectsGallery,
    allProjects,
    setAllProjects,
    galleryPreviewProject,
    setGalleryPreviewProject,
    imageUploadMode,
    setImageUploadMode,
    mockImageUrl,
    setMockImageUrl,
    selectedLibraryImage,
    setSelectedLibraryImage,
    autoSaveStatus,
    setAutoSaveStatus,
    autoSaveEnabled,
    setAutoSaveEnabled,
    paletteComponentOpen,
    setPaletteComponentOpen,
    initialized,
    setInitialized,
    isInitialLoad,
    setIsInitialLoad,
    editingLink,
    setEditingLink,
    downloading,
    setDownloading,
    saveStatus,
    setSaveStatus,
    hasComponents,
    setHasComponents,
    isEditingMode,
    setIsEditingMode,
    publishDomain,
    setPublishDomain,
    publishDomainError,
    setPublishDomainError,
    customDomainEnabled,
    setCustomDomainEnabled,
    websiteDescription,
    setWebsiteDescription,
    isPublished,
    setIsPublished,
    publishError,
    setPublishError,
    globalStyles,
    setGlobalStyles,
    fileInputRef,
    replaceImageInputRef,
    canvasRef,
    autoSaveTimerRef,
    periodicAutoSaveRef,
    latestStateRef,
    initializeFromData,
    loadDesignFromTemplates,
    addToHistory,
    handleUndo,
    handleRedo,
    handleStyleChange,
    handleAddComponent,
    handleUpdateComponent,
    handleDeleteComponent,
    handleUpdateComponentContent,
    handleAddComponentItem,
    handleDeleteComponentItem,
    handleAddTextElement,
    handleUpdateTextElement,
    handleDeleteTextElement,
    handleTextStyleChange,
    handleTextPositionChange,
    processImages,
    handleImageUpload,
    handleAddMockImage,
    handleAddImageToCanvas,
    handleUpdateImageElement,
    handleDeleteImageElement,
    handleDeleteUploadedImage,
    handleResizeImage,
    handleApplyImageStyle,
    handleApplyImageFilter,
    handleRotateImage,
    handleFlipImage,
    handleReplaceImage,
    handleAddImageToComponent,
    handleDownloadWebsite,
    handleSave,
    handleSaveConfirm,
    handlePublish,
    generateFullHTML,
    saveWebsiteToDatabase,
    generateHTMLCode,
    copyToClipboard,
    copyCodeToClipboard,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePreview,
    handleOpenProjectInEditor,
    loadProjectFromSavedPages,
    handleDeleteProject,
    handleSwitchPage,
    handleAddPage,
    handleDeletePage,
    handleColorPickerOpen,
    handleColorPickerClose,
    handleColorChange,
    renderComponent,
    renderTextFloatingToolbar,
    renderImageFloatingToolbar,
    renderComponentFloatingToolbar,
    renderPreview,
    renderPublishModal,
    showSnackbar,
    applyColorTheme,
    applyColorPalette,
    currentProject,
  };
};

export default useDesignStudioState;
