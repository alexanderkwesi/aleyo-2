// EditorCanvas.js - Complete rewrite with individual element editing and right-aligned tooltips

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  alpha,
  Tooltip,
  IconButton,
  Popover,
  TextField,
  Select,
  MenuItem,
  Slider,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  Edit,
  TextFields,
  Close,
  Check,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  ArrowUpward,
  ArrowDownward,
  Style,
  Link as LinkIcon,
  Settings,
  Add,
  Delete,
  ExpandMore,
  Palette,
  Crop,
  Image as ImageIcon,
  BorderColor,
  FontDownload,
  Transform,
  Filter,
  RotateLeft,
  RotateRight,
  Flip,
  FormatColorFill,
  ColorLens,
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

// Component property configurations
const COMPONENT_PROPERTIES = {
  logo: {
    label: 'Logo',
    icon: '🏷️',
    properties: [
      { key: 'text', label: 'Logo Text', type: 'text', default: 'BrandName' },
      { key: 'tagline', label: 'Tagline', type: 'text', default: '' },
      { key: 'link', label: 'Logo Link URL', type: 'url', default: '/' },
      {
        key: 'linkTarget',
        label: 'Link Target',
        type: 'select',
        options: ['_self', '_blank', '_parent', '_top'],
        default: '_self',
      },
      { key: 'fontSize', label: 'Font Size', type: 'range', min: 12, max: 72, default: 28 },
      {
        key: 'fontWeight',
        label: 'Font Weight',
        type: 'select',
        options: ['300', '400', '500', '600', '700', '800', '900'],
        default: '700',
      },
      { key: 'color', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: 'transparent' },
      { key: 'padding', label: 'Padding', type: 'text', default: '8px 16px' },
      { key: 'borderRadius', label: 'Border Radius', type: 'range', min: 0, max: 50, default: 8 },
    ],
  },
  nav: {
    label: 'Navigation',
    icon: '📋',
    properties: [
      { key: 'links', label: 'Navigation Links', type: 'links', default: [] },
      {
        key: 'linkStyle',
        label: 'Link Style',
        type: 'select',
        options: ['horizontal', 'vertical', 'dropdown'],
        default: 'horizontal',
      },
      { key: 'showLogin', label: 'Show Login', type: 'boolean', default: true },
      { key: 'showSignup', label: 'Show Signup', type: 'boolean', default: true },
      { key: 'loginText', label: 'Login Button Text', type: 'text', default: 'Login' },
      { key: 'signupText', label: 'Signup Button Text', type: 'text', default: 'Sign Up' },
      { key: 'loginUrl', label: 'Login URL', type: 'url', default: '/login' },
      { key: 'signupUrl', label: 'Signup URL', type: 'url', default: '/signup' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: 'transparent' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'fontSize', label: 'Font Size', type: 'range', min: 12, max: 32, default: 16 },
    ],
  },
  hero: {
    label: 'Hero Section',
    icon: '🌟',
    properties: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Welcome to Our Website' },
      {
        key: 'subheading',
        label: 'Subheading',
        type: 'text',
        default: 'Build amazing websites with ease',
      },
      { key: 'buttonText', label: 'Primary Button Text', type: 'text', default: 'Get Started' },
      { key: 'buttonUrl', label: 'Primary Button URL', type: 'url', default: '/get-started' },
      {
        key: 'secondaryButtonText',
        label: 'Secondary Button Text',
        type: 'text',
        default: 'Learn More',
      },
      { key: 'secondaryButtonUrl', label: 'Secondary Button URL', type: 'url', default: '/about' },
      {
        key: 'alignment',
        label: 'Content Alignment',
        type: 'select',
        options: ['left', 'center', 'right'],
        default: 'center',
      },
      { key: 'showImage', label: 'Show Image', type: 'boolean', default: true },
      { key: 'imageUrl', label: 'Image URL', type: 'image', default: '' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#0A0F1A' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'buttonColor', label: 'Button Color', type: 'color', default: '#4FC3F7' },
      { key: 'padding', label: 'Padding', type: 'text', default: '60px 20px' },
    ],
  },
  features: {
    label: 'Features',
    icon: '⚡',
    properties: [
      { key: 'heading', label: 'Section Heading', type: 'text', default: 'Our Features' },
      {
        key: 'subheading',
        label: 'Section Subheading',
        type: 'text',
        default: 'Everything you need to succeed',
      },
      { key: 'features', label: 'Feature Items', type: 'features', default: [] },
      {
        key: 'columns',
        label: 'Number of Columns',
        type: 'select',
        options: ['2', '3', '4'],
        default: '3',
      },
      {
        key: 'iconStyle',
        label: 'Icon Style',
        type: 'select',
        options: ['rounded', 'circle', 'square'],
        default: 'rounded',
      },
      { key: 'showDescriptions', label: 'Show Descriptions', type: 'boolean', default: true },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#0A0F1A' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'iconColor', label: 'Icon Color', type: 'color', default: '#4FC3F7' },
    ],
  },
  gallery: {
    label: 'Gallery',
    icon: '🖼️',
    properties: [
      { key: 'heading', label: 'Gallery Heading', type: 'text', default: 'Our Gallery' },
      { key: 'images', label: 'Gallery Images', type: 'gallery', default: [] },
      {
        key: 'layout',
        label: 'Gallery Layout',
        type: 'select',
        options: ['grid', 'masonry', 'carousel'],
        default: 'grid',
      },
      { key: 'columns', label: 'Columns', type: 'select', options: ['2', '3', '4'], default: '3' },
      { key: 'showCaptions', label: 'Show Captions', type: 'boolean', default: true },
      { key: 'enableLightbox', label: 'Enable Lightbox', type: 'boolean', default: true },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#0A0F1A' },
    ],
  },
  contact: {
    label: 'Contact Form',
    icon: '📧',
    properties: [
      { key: 'heading', label: 'Contact Heading', type: 'text', default: 'Get in Touch' },
      {
        key: 'subheading',
        label: 'Contact Subheading',
        type: 'text',
        default: "We'd love to hear from you",
      },
      { key: 'email', label: 'Email Address', type: 'email', default: 'contact@example.com' },
      { key: 'phone', label: 'Phone Number', type: 'text', default: '+1 (555) 123-4567' },
      { key: 'address', label: 'Address', type: 'text', default: '123 Main St, City, Country' },
      {
        key: 'formFields',
        label: 'Form Fields',
        type: 'formfields',
        default: ['name', 'email', 'message'],
      },
      { key: 'submitText', label: 'Submit Button Text', type: 'text', default: 'Send Message' },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#0A0F1A' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'buttonColor', label: 'Button Color', type: 'color', default: '#4FC3F7' },
    ],
  },
  pricing: {
    label: 'Pricing',
    icon: '💰',
    properties: [
      { key: 'heading', label: 'Pricing Heading', type: 'text', default: 'Choose Your Plan' },
      {
        key: 'subheading',
        label: 'Pricing Subheading',
        type: 'text',
        default: 'Flexible plans for every budget',
      },
      { key: 'plans', label: 'Pricing Plans', type: 'pricing', default: [] },
      { key: 'currency', label: 'Currency Symbol', type: 'text', default: '$' },
      {
        key: 'billingCycle',
        label: 'Billing Cycle',
        type: 'select',
        options: ['monthly', 'yearly'],
        default: 'monthly',
      },
      { key: 'showAnnualSavings', label: 'Show Annual Savings', type: 'boolean', default: true },
      {
        key: 'highlightPlan',
        label: 'Highlight Plan',
        type: 'select',
        options: ['none', 'first', 'second', 'third'],
        default: 'second',
      },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#0A0F1A' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'buttonColor', label: 'Button Color', type: 'color', default: '#4FC3F7' },
    ],
  },
  footer: {
    label: 'Footer',
    icon: '📄',
    properties: [
      {
        key: 'copyright',
        label: 'Copyright Text',
        type: 'text',
        default: '© 2024 All Rights Reserved',
      },
      { key: 'links', label: 'Footer Links', type: 'links', default: [] },
      {
        key: 'columns',
        label: 'Number of Columns',
        type: 'select',
        options: ['1', '2', '3', '4'],
        default: '4',
      },
      { key: 'showSocialIcons', label: 'Show Social Icons', type: 'boolean', default: true },
      { key: 'socialLinks', label: 'Social Media Links', type: 'social', default: [] },
      { key: 'newsletter', label: 'Show Newsletter Signup', type: 'boolean', default: false },
      { key: 'backgroundColor', label: 'Background Color', type: 'color', default: '#1A1F2E' },
      { key: 'textColor', label: 'Text Color', type: 'color', default: '#FFFFFF' },
      { key: 'linkColor', label: 'Link Color', type: 'color', default: '#4FC3F7' },
    ],
  },
};

// Get component properties
const getComponentProperties = (type) => {
  return COMPONENT_PROPERTIES[type] || null;
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const EditorCanvas = ({
  showCode,
  generatedCode,
  copyCodeToClipboard,
  canvasScale,
  renderPreview,
  globalStyles,
  components = [],
  setComponents = () => {},
  selectedComponent = null,
  setSelectedComponent = () => {},
  selectedTextElement = null,
  setSelectedTextElement = () => {},
  selectedImageElement = null,
  setSelectedImageElement = () => {},
  handleUpdateComponentContent = () => {},
  handleTextStyleChange = () => {},
  handleDeleteTextElement = () => {},
  handleDeleteComponent = () => {}, // FIX #2, #4: Added missing prop
}) => {
  // State for editing
  const [editingElement, setEditingElement] = useState(null);
  const [editAnchor, setEditAnchor] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editField, setEditField] = useState('text');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [hoveredElement, setHoveredElement] = useState(null);

  // State for component property editor
  const [componentEditorOpen, setComponentEditorOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    appearance: true,
    layout: true,
    specific: true,
    advanced: false,
  });

  // State for color picker
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);
  const [colorPickerCurrentColor, setColorPickerCurrentColor] = useState('#FFFFFF');

  // FIX #1, #9: Moved handleDeleteComponent BEFORE renderEditablePreview
  // Handle delete component - now receives the prop or uses local fallback
  const handleDeleteComponentLocal = (componentId) => {
    if (handleDeleteComponent && handleDeleteComponent !== (() => {})) {
      handleDeleteComponent(componentId);
    } else {
      setComponents(components.filter((comp) => comp.id !== componentId));
    }
    setSelectedComponent(null);
  };

  // Handle edit popover open
  const handleEditOpen = (event, element, type, initialValue = '') => {
    // FIX #10: Ensure anchor element is valid
    const anchorEl = event?.currentTarget;
    if (!anchorEl) return;

    setEditingElement(element);
    setEditAnchor(anchorEl);
    setEditValue(initialValue);
    setEditField(type);

    if (type === 'text' && element?.styles) {
      setFontSize(element.styles.fontSize || 16);
      setTextColor(element.styles.color || '#FFFFFF');
      setFontFamily(element.styles.fontFamily || 'Inter, sans-serif');
    }
  };

  const handleEditClose = () => {
    setEditAnchor(null);
    setEditingElement(null);
  };

  // Save text edit
  const handleSaveTextEdit = () => {
    if (editingElement && editValue) {
      if (selectedTextElement?.id === editingElement.id) {
        handleTextStyleChange(editingElement.id, 'text', editValue);
      } else if (selectedComponent?.id === editingElement.id) {
        handleUpdateComponentContent(editingElement.id, 'text', editValue);
      }
    }
    handleEditClose();
  };

  // Apply text style changes
  const applyTextStyle = (styleKey, value) => {
    if (editingElement && selectedTextElement?.id === editingElement.id) {
      handleTextStyleChange(editingElement.id, styleKey, value);
    }
  };

  // Move element up/down
  const moveElement = (direction) => {
    if (selectedComponent) {
      const newY = (selectedComponent.position?.y || 0) + (direction === 'up' ? -20 : 20);
      handleUpdateComponentContent(selectedComponent.id, 'position', {
        ...selectedComponent.position,
        y: newY,
      });
    } else if (selectedTextElement) {
      const newY = (selectedTextElement.position?.y || 0) + (direction === 'up' ? -20 : 20);
      handleTextStyleChange(selectedTextElement.id, 'position', {
        ...selectedTextElement.position,
        y: newY,
      });
    }
  };

  // Open component property editor
  const openComponentEditor = (comp) => {
    setEditingComponent(comp);
    setComponentEditorOpen(true);
  };

  // Close component property editor
  const closeComponentEditor = () => {
    setComponentEditorOpen(false);
    setEditingComponent(null);
  };

  // Handle component property change
  const handleComponentPropChange = (key, value) => {
    if (editingComponent) {
      handleUpdateComponentContent(editingComponent.id, key, value);
    }
  };

  // Handle color picker
  const handleColorPick = (target, currentColor) => {
    setColorPickerTarget(target);
    setColorPickerCurrentColor(currentColor || '#FFFFFF');
    setColorPickerOpen(true);
  };

  const handleColorChange = (color) => {
    if (colorPickerTarget && editingComponent) {
      const { key } = colorPickerTarget;
      handleUpdateComponentContent(editingComponent.id, key, color.hex);
      setColorPickerCurrentColor(color.hex);
    }
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get component edit actions
  const getComponentEditActions = (comp) => {
    const actions = [];
    const props = getComponentProperties(comp.type);

    if (props) {
      props.properties.forEach((prop) => {
        if (prop.type === 'text' || prop.type === 'url' || prop.type === 'email') {
          actions.push({
            key: prop.key,
            label: prop.label,
            icon:
              prop.type === 'url' || prop.type === 'email' ? (
                <LinkIcon fontSize="small" />
              ) : (
                <Edit fontSize="small" />
              ),
            value: comp.content?.[prop.key] || prop.default || '',
            type: prop.type,
          });
        }
      });
    }

    return actions;
  };

  // Get all text elements from components
  // FIX #5: Added null-safety for textElements
  const getAllTextElements = () => {
    const textEls = [];
    components.forEach((comp) => {
      if (comp?.textElements && Array.isArray(comp.textElements)) {
        comp.textElements.forEach((textEl) => {
          if (textEl && textEl.id) {
            textEls.push({ ...textEl, parentComponentId: comp.id });
          }
        });
      }
    });
    return textEls;
  };

  // Render component-specific property editor
  const renderComponentEditor = () => {
    if (!editingComponent) return null;

    const comp = editingComponent;
    const config = getComponentProperties(comp.type);
    if (!config) return null;

    const styles = comp.styles || {};
    const content = comp.content || {};

    return (
      <Dialog
        open={componentEditorOpen}
        onClose={closeComponentEditor}
        maxWidth="md"
        fullWidth
        // FIX #3, #12: Removed conflicting position:absolute and zIndex. Let MUI handle Dialog positioning.
        PaperProps={{
          sx: {
            bgcolor: '#1A1F2E',
            borderRadius: '16px',
            border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
            maxHeight: '70vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}`,
            pb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {config.icon} {config.label} Properties
            </Typography>
            <Chip
              label={comp.type}
              size="small"
              sx={{ bgcolor: alpha('#4FC3F7', 0.2), color: '#4FC3F7', fontWeight: 500 }}
            />
            <Chip
              label={`ID: ${comp.id.slice(0, 6)}`}
              size="small"
              sx={{
                bgcolor: alpha('#FFFFFF', 0.05),
                color: alpha('#FFFFFF', 0.5),
                fontSize: '0.6rem',
              }}
            />
          </Box>
          <IconButton
            onClick={closeComponentEditor}
            sx={{ color: alpha('#FFFFFF', 0.5), '&:hover': { color: '#ff4444' } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#0A0F1A' }}>
          <Box sx={{ p: 1 }}>
            {/* Content Section */}
            <Accordion
              expanded={expandedSections.content}
              onChange={() => toggleSection('content')}
              sx={{
                bgcolor: 'transparent',
                color: 'white',
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />} sx={{ px: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
                >
                  <Edit fontSize="small" sx={{ color: '#4FC3F7' }} /> Content
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Stack spacing={2}>
                  {config.properties
                    .filter(
                      (p) =>
                        p.type === 'text' ||
                        p.type === 'url' ||
                        p.type === 'email' ||
                        p.type === 'image'
                    )
                    .map((prop) => {
                      const value = content[prop.key] || prop.default || '';
                      if (prop.type === 'image') {
                        return (
                          <Box key={prop.key}>
                            <Typography
                              variant="caption"
                              sx={{ color: alpha('#FFFFFF', 0.7), display: 'block', mb: 0.5 }}
                            >
                              {prop.label}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                value={value}
                                onChange={(e) =>
                                  handleComponentPropChange(prop.key, e.target.value)
                                }
                                placeholder="https://example.com/image.jpg"
                                sx={{
                                  '& .MuiInputBase-root': { color: 'white', fontSize: '0.8rem' },
                                  '& .MuiInputLabel-root': {
                                    color: alpha('#FFFFFF', 0.5),
                                    fontSize: '0.75rem',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha('#FFFFFF', 0.2),
                                  },
                                }}
                              />
                              {value && (
                                <Box
                                  component="img"
                                  src={value}
                                  alt="Preview"
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        );
                      }
                      return (
                        <TextField
                          key={prop.key}
                          fullWidth
                          label={prop.label}
                          value={value}
                          onChange={(e) => handleComponentPropChange(prop.key, e.target.value)}
                          multiline={
                            prop.key === 'heading' ||
                            prop.key === 'subheading' ||
                            prop.key === 'description'
                          }
                          rows={prop.key === 'heading' ? 2 : prop.key === 'subheading' ? 3 : 1}
                          sx={{
                            '& .MuiInputBase-root': { color: 'white' },
                            '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha('#FFFFFF', 0.2),
                            },
                            '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4FC3F7',
                            },
                          }}
                        />
                      );
                    })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Appearance Section */}
            <Accordion
              expanded={expandedSections.appearance}
              onChange={() => toggleSection('appearance')}
              sx={{
                bgcolor: 'transparent',
                color: 'white',
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />} sx={{ px: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
                >
                  <Palette fontSize="small" sx={{ color: '#4FC3F7' }} /> Appearance
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Stack spacing={2}>
                  {config.properties
                    .filter(
                      (p) => p.type === 'color' || p.type === 'select' || p.type === 'boolean'
                    )
                    .map((prop) => {
                      const value =
                        prop.type === 'color'
                          ? content[prop.key] || prop.default || '#FFFFFF'
                          : content[prop.key] !== undefined
                            ? content[prop.key]
                            : prop.default;

                      if (prop.type === 'color') {
                        return (
                          <Box key={prop.key}>
                            <Typography
                              variant="caption"
                              sx={{ color: alpha('#FFFFFF', 0.7), display: 'block', mb: 0.5 }}
                            >
                              {prop.label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: value,
                                  borderRadius: '8px',
                                  border: `2px solid ${alpha('#FFFFFF', 0.2)}`,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s',
                                  '&:hover': { transform: 'scale(1.05)' },
                                }}
                                onClick={() => handleColorPick({ key: prop.key }, value)}
                              />
                              <TextField
                                value={value}
                                onChange={(e) =>
                                  handleComponentPropChange(prop.key, e.target.value)
                                }
                                size="small"
                                sx={{
                                  flex: 1,
                                  '& .MuiInputBase-root': { color: 'white', fontSize: '0.8rem' },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha('#FFFFFF', 0.2),
                                  },
                                }}
                              />
                              <input
                                type="color"
                                value={value}
                                onChange={(e) =>
                                  handleComponentPropChange(prop.key, e.target.value)
                                }
                                style={{
                                  width: 40,
                                  height: 40,
                                  padding: 0,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: 'none',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      }

                      if (prop.type === 'boolean') {
                        return (
                          <FormControlLabel
                            key={prop.key}
                            control={
                              <Switch
                                checked={value}
                                onChange={(e) =>
                                  handleComponentPropChange(prop.key, e.target.checked)
                                }
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4FC3F7' } }}
                              />
                            }
                            label={prop.label}
                            sx={{ color: 'white' }}
                          />
                        );
                      }

                      if (prop.type === 'select') {
                        return (
                          <FormControl key={prop.key} fullWidth size="small">
                            <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>
                              {prop.label}
                            </InputLabel>
                            <Select
                              value={value}
                              onChange={(e) => handleComponentPropChange(prop.key, e.target.value)}
                              label={prop.label}
                              sx={{
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: alpha('#FFFFFF', 0.2),
                                },
                                '& .MuiSelect-icon': { color: alpha('#FFFFFF', 0.5) },
                              }}
                            >
                              {prop.options.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {typeof option === 'string'
                                    ? option.charAt(0).toUpperCase() + option.slice(1)
                                    : option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        );
                      }

                      return null;
                    })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Component Specific Properties */}
            <Accordion
              expanded={expandedSections.specific}
              onChange={() => toggleSection('specific')}
              sx={{
                bgcolor: 'transparent',
                color: 'white',
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />} sx={{ px: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
                >
                  <Settings fontSize="small" sx={{ color: '#4FC3F7' }} /> Component Settings
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Stack spacing={2}>
                  {config.properties
                    .filter(
                      (p) =>
                        p.type === 'links' ||
                        p.type === 'features' ||
                        p.type === 'gallery' ||
                        p.type === 'pricing' ||
                        p.type === 'social' ||
                        p.type === 'formfields'
                    )
                    .map((prop) => {
                      const items = content[prop.key] || prop.default || [];

                      return (
                        <Box key={prop.key}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: alpha('#FFFFFF', 0.7),
                              mb: 1,
                              display: 'block',
                              fontWeight: 600,
                            }}
                          >
                            {prop.label}
                          </Typography>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => {
                              let newItem = {};
                              if (prop.type === 'links') {
                                newItem = { label: 'New Link', url: '/', id: generateId() };
                              } else if (prop.type === 'features') {
                                newItem = {
                                  title: 'New Feature',
                                  description: 'Description',
                                  icon: '⭐',
                                  id: generateId(),
                                };
                              } else if (prop.type === 'pricing') {
                                newItem = {
                                  name: 'New Plan',
                                  price: '0',
                                  features: ['Feature 1'],
                                  id: generateId(),
                                };
                              } else if (prop.type === 'gallery') {
                                newItem = {
                                  url: 'https://via.placeholder.com/300x200',
                                  caption: 'Image caption',
                                  id: generateId(),
                                };
                              } else if (prop.type === 'social') {
                                newItem = {
                                  platform: 'twitter',
                                  url: 'https://twitter.com/',
                                  id: generateId(),
                                };
                              } else if (prop.type === 'formfields') {
                                newItem = {
                                  label: 'New Field',
                                  type: 'text',
                                  required: false,
                                  id: generateId(),
                                };
                              }
                              const updated = [...items, newItem];
                              handleComponentPropChange(prop.key, updated);
                            }}
                            sx={{
                              mb: 1,
                              color: 'white',
                              borderColor: alpha('#FFFFFF', 0.2),
                              '&:hover': { borderColor: '#4FC3F7' },
                            }}
                          >
                            Add {prop.label.slice(0, -1)}
                          </Button>

                          {items.map((item, index) => (
                            <Paper
                              key={item.id || index}
                              sx={{
                                p: 1.5,
                                mb: 1,
                                bgcolor: alpha('#FFFFFF', 0.03),
                                border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
                                borderRadius: '10px',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: alpha('#FFFFFF', 0.5), fontWeight: 500 }}
                                >
                                  Item {index + 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const updated = items.filter((_, i) => i !== index);
                                    handleComponentPropChange(prop.key, updated);
                                  }}
                                  sx={{
                                    color: '#ff4444',
                                    '&:hover': { bgcolor: alpha('#ff4444', 0.1) },
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                              {Object.keys(item).map((field) => {
                                if (field === 'id' || field === 'features') return null;
                                return (
                                  <TextField
                                    key={field}
                                    fullWidth
                                    size="small"
                                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                                    value={item[field] || ''}
                                    onChange={(e) => {
                                      const updated = [...items];
                                      updated[index] = {
                                        ...updated[index],
                                        [field]: e.target.value,
                                      };
                                      handleComponentPropChange(prop.key, updated);
                                    }}
                                    sx={{
                                      mb: 0.5,
                                      '& .MuiInputBase-root': {
                                        color: 'white',
                                        fontSize: '0.8rem',
                                      },
                                      '& .MuiInputLabel-root': {
                                        color: alpha('#FFFFFF', 0.5),
                                        fontSize: '0.75rem',
                                      },
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha('#FFFFFF', 0.15),
                                      },
                                    }}
                                  />
                                );
                              })}
                              {item.features && Array.isArray(item.features) && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: alpha('#FFFFFF', 0.4), display: 'block', mb: 0.5 }}
                                  >
                                    Features
                                  </Typography>
                                  {item.features.map((feature, fIdx) => (
                                    <Box key={fIdx} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={feature}
                                        onChange={(e) => {
                                          const updated = [...items];
                                          const newFeatures = [...updated[index].features];
                                          newFeatures[fIdx] = e.target.value;
                                          updated[index] = {
                                            ...updated[index],
                                            features: newFeatures,
                                          };
                                          handleComponentPropChange(prop.key, updated);
                                        }}
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            color: 'white',
                                            fontSize: '0.8rem',
                                          },
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha('#FFFFFF', 0.15),
                                          },
                                        }}
                                      />
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const updated = [...items];
                                          const newFeatures = updated[index].features.filter(
                                            (_, i) => i !== fIdx
                                          );
                                          updated[index] = {
                                            ...updated[index],
                                            features: newFeatures,
                                          };
                                          handleComponentPropChange(prop.key, updated);
                                        }}
                                        sx={{ color: '#ff4444' }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ))}
                                  <Button
                                    size="small"
                                    startIcon={<Add />}
                                    onClick={() => {
                                      const updated = [...items];
                                      const newFeatures = [
                                        ...(updated[index].features || []),
                                        'New Feature',
                                      ];
                                      updated[index] = { ...updated[index], features: newFeatures };
                                      handleComponentPropChange(prop.key, updated);
                                    }}
                                    sx={{ color: '#4FC3F7', fontSize: '0.7rem' }}
                                  >
                                    Add Feature
                                  </Button>
                                </Box>
                              )}
                            </Paper>
                          ))}
                        </Box>
                      );
                    })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Layout Section */}
            <Accordion
              expanded={expandedSections.layout}
              onChange={() => toggleSection('layout')}
              sx={{
                bgcolor: 'transparent',
                color: 'white',
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />} sx={{ px: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
                >
                  <Crop fontSize="small" sx={{ color: '#4FC3F7' }} /> Layout & Positioning
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Stack spacing={2}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        label="X Position"
                        type="number"
                        size="small"
                        value={comp.position?.x || 0}
                        onChange={(e) =>
                          handleComponentPropChange('position', {
                            ...comp.position,
                            x: parseInt(e.target.value) || 0,
                          })
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Y Position"
                        type="number"
                        size="small"
                        value={comp.position?.y || 0}
                        onChange={(e) =>
                          handleComponentPropChange('position', {
                            ...comp.position,
                            y: parseInt(e.target.value) || 0,
                          })
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        label="Width"
                        type="number"
                        size="small"
                        value={comp.size?.width || ''}
                        onChange={(e) =>
                          handleComponentPropChange('size', { ...comp.size, width: e.target.value })
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Height"
                        type="number"
                        size="small"
                        value={comp.size?.height || ''}
                        onChange={(e) =>
                          handleComponentPropChange('size', {
                            ...comp.size,
                            height: e.target.value,
                          })
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        label="Padding"
                        type="number"
                        size="small"
                        value={parseInt(styles.padding) || 0}
                        onChange={(e) =>
                          handleComponentPropChange('padding', `${e.target.value}px`)
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Margin"
                        type="number"
                        size="small"
                        value={parseInt(styles.margin) || 0}
                        onChange={(e) => handleComponentPropChange('margin', `${e.target.value}px`)}
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        label="Border Radius"
                        type="number"
                        size="small"
                        value={parseInt(styles.borderRadius) || 0}
                        onChange={(e) =>
                          handleComponentPropChange('borderRadius', `${e.target.value}px`)
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Z-Index"
                        type="number"
                        size="small"
                        value={styles.zIndex || 0}
                        onChange={(e) =>
                          handleComponentPropChange('zIndex', parseInt(e.target.value) || 0)
                        }
                        sx={{
                          '& .MuiInputBase-root': { color: 'white' },
                          '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#FFFFFF', 0.2),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Advanced Section */}
            <Accordion
              expanded={expandedSections.advanced}
              onChange={() => toggleSection('advanced')}
              sx={{
                bgcolor: 'transparent',
                color: 'white',
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />} sx={{ px: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
                >
                  <Transform fontSize="small" sx={{ color: '#4FC3F7' }} /> Advanced
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={styles.visible !== false}
                        onChange={(e) => handleComponentPropChange('visible', e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4FC3F7' } }}
                      />
                    }
                    label="Visible"
                    sx={{ color: 'white' }}
                  />
                  <TextField
                    fullWidth
                    label="Custom CSS Class"
                    value={styles.customClass || ''}
                    onChange={(e) => handleComponentPropChange('customClass', e.target.value)}
                    placeholder="my-custom-class"
                    sx={{
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Custom CSS Styles"
                    multiline
                    rows={2}
                    value={styles.customCSS || ''}
                    onChange={(e) => handleComponentPropChange('customCSS', e.target.value)}
                    placeholder="color: red; font-size: 20px;"
                    sx={{
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                    }}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ bgcolor: '#0A0F1A', p: 2, borderTop: `1px solid ${alpha('#FFFFFF', 0.05)}` }}
        >
          <Button onClick={closeComponentEditor} sx={{ color: alpha('#FFFFFF', 0.6) }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={closeComponentEditor}
            sx={{
              background: 'linear-gradient(135deg, #4FC3F7, #26C6DA)',
              '&:hover': { opacity: 0.9 },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render color picker dialog
  const renderColorPicker = () => (
    <Dialog
      open={colorPickerOpen}
      onClose={() => setColorPickerOpen(false)}
      PaperProps={{
        sx: {
          bgcolor: '#1A1F2E',
          borderRadius: '16px',
          border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Choose Color
        </Typography>
        <IconButton onClick={() => setColorPickerOpen(false)} sx={{ color: alpha('#FFFFFF', 0.5) }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <ChromePicker color={colorPickerCurrentColor} onChange={handleColorChange} disableAlpha />
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha('#FFFFFF', 0.05)}` }}>
        <Button onClick={() => setColorPickerOpen(false)} sx={{ color: alpha('#FFFFFF', 0.6) }}>
          Cancel
        </Button>
        <Button onClick={() => setColorPickerOpen(false)} sx={{ color: '#4FC3F7' }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Wrap renderPreview with edit overlays - Tooltips on RIGHT side with individual element editing
  const renderEditablePreview = () => {
    if (typeof renderPreview !== 'function') {
      return <Box sx={{ color: 'white', p: 4 }}>No preview available</Box>;
    }

    try {
      const preview = renderPreview();

      if (React.isValidElement(preview)) {
        const allTextElements = getAllTextElements();

        return (
          <Box sx={{ position: 'relative', width: '100%' }}>
            {preview}

            {/* Edit overlays for components */}
            {components?.map((comp) => {
              const compActions = getComponentEditActions(comp);
              const isSelected = selectedComponent?.id === comp.id;

              return (
                <Box
                  key={comp.id}
                  sx={{
                    position: 'absolute',
                    top: comp.position?.y || 0,
                    left: comp.position?.x || 0,
                    width: comp.size?.width || 'auto',
                    height: comp.size?.height || 'auto',
                    cursor: 'pointer',
                    '&:hover .edit-overlay': {
                      opacity: 1,
                    },
                    '&:hover .element-highlight': {
                      opacity: 1,
                    },
                  }}
                  onMouseEnter={() => setHoveredElement(comp.id)}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  {/* Component type badge - RIGHT side */}
                  <Chip
                    label={comp.type}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -24,
                      right: 0,
                      bgcolor: alpha('#4FC3F7', 0.9),
                      color: '#000',
                      fontSize: '0.5rem',
                      height: 18,
                      fontWeight: 600,
                      opacity: isSelected || hoveredElement === comp.id ? 1 : 0,
                      transition: 'opacity 0.2s',
                      zIndex: 10,
                    }}
                  />

                  {/* Element highlight overlay */}
                  <Box
                    className="element-highlight"
                    sx={{
                      position: 'absolute',
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      borderRadius: '6px',
                      border: isSelected
                        ? `2px solid ${alpha('#4FC3F7', 0.4)}`
                        : `2px solid ${alpha('#4FC3F7', 0.1)}`,
                      opacity: isSelected || hoveredElement === comp.id ? 1 : 0,
                      transition: 'opacity 0.2s',
                      zIndex: 1,
                      pointerEvents: 'none',
                      boxShadow: isSelected ? `0 0 30px ${alpha('#4FC3F7', 0.1)}` : 'none',
                    }}
                  />

                  {/* Hover overlay with edit controls - RIGHT side with LEFT tooltips */}
                  <Box
                    className="edit-overlay"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      display: 'flex',
                      gap: 0.5,
                      opacity: isSelected || hoveredElement === comp.id ? 1 : 0,
                      transition: 'opacity 0.2s',
                      zIndex: 10,
                      bgcolor: 'rgba(0,0,0,0.9)',
                      borderRadius: '8px',
                      p: 0.75,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${alpha('#FFFFFF', 0.15)}`,
                      flexWrap: 'wrap',
                      maxWidth: 240,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Edit Component Properties" placement="left" arrow>
                      <IconButton
                        size="small"
                        sx={{
                          color: '#4FC3F7',
                          '&:hover': { color: '#FFFFFF', bgcolor: alpha('#4FC3F7', 0.2) },
                        }}
                        onClick={() => {
                          setSelectedComponent(comp);
                          openComponentEditor(comp);
                        }}
                      >
                        <Settings fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {compActions.slice(0, 2).map((action) => (
                      <Tooltip key={action.key} title={action.label} placement="left" arrow>
                        <IconButton
                          size="small"
                          sx={{
                            color: '#FFFFFF',
                            '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComponent(comp);
                            openComponentEditor(comp);
                          }}
                        >
                          {action.icon}
                        </IconButton>
                      </Tooltip>
                    ))}

                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: alpha('#FFFFFF', 0.15) }}
                    />

                    <Tooltip title="Move Up" placement="left" arrow>
                      <IconButton
                        size="small"
                        sx={{
                          color: '#FFFFFF',
                          '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                        }}
                        onClick={() => {
                          setSelectedComponent(comp);
                          moveElement('up');
                        }}
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Move Down" placement="left" arrow>
                      <IconButton
                        size="small"
                        sx={{
                          color: '#FFFFFF',
                          '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                        }}
                        onClick={() => {
                          setSelectedComponent(comp);
                          moveElement('down');
                        }}
                      >
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" placement="left" arrow>
                      <IconButton
                        size="small"
                        sx={{
                          color: '#ff4444',
                          '&:hover': { color: '#FFFFFF', bgcolor: alpha('#ff4444', 0.2) },
                        }}
                        onClick={() => {
                          // FIX #1, #9: Use handleDeleteComponentLocal instead of undefined handleDeleteComponent
                          handleDeleteComponentLocal(comp.id);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Clickable area to select */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '4px',
                      position: 'relative',
                      zIndex: 2,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComponent(comp);
                      setSelectedTextElement(null);
                      setSelectedImageElement(null);
                    }}
                  />
                </Box>
              );
            })}

            {/* Edit overlays for text elements - RIGHT side with LEFT tooltips */}
            {allTextElements.map((textEl) => (
              <Box
                key={textEl.id}
                sx={{
                  position: 'absolute',
                  top: textEl.position?.y || 0,
                  left: textEl.position?.x || 0,
                  cursor: 'pointer',
                  '&:hover .edit-overlay': {
                    opacity: 1,
                  },
                  '&:hover .element-highlight': {
                    opacity: 1,
                  },
                }}
                onMouseEnter={() => setHoveredElement(textEl.id)}
                onMouseLeave={() => setHoveredElement(null)}
              >
                {/* Element highlight overlay */}
                <Box
                  className="element-highlight"
                  sx={{
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    right: -4,
                    bottom: -4,
                    borderRadius: '4px',
                    border:
                      selectedTextElement?.id === textEl.id
                        ? `2px solid ${alpha('#4FC3F7', 0.4)}`
                        : `2px solid ${alpha('#4FC3F7', 0.1)}`,
                    opacity:
                      selectedTextElement?.id === textEl.id || hoveredElement === textEl.id ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 1,
                    pointerEvents: 'none',
                    boxShadow:
                      selectedTextElement?.id === textEl.id
                        ? `0 0 30px ${alpha('#4FC3F7', 0.1)}`
                        : 'none',
                  }}
                />

                <Box
                  className="edit-overlay"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    display: 'flex',
                    gap: 0.5,
                    opacity:
                      hoveredElement === textEl.id || selectedTextElement?.id === textEl.id ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.9)',
                    borderRadius: '8px',
                    p: 0.75,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha('#FFFFFF', 0.15)}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Edit Text" placement="left" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFFFFF',
                        '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTextElement(textEl);
                        setSelectedComponent(null);
                        setSelectedImageElement(null);
                        handleEditOpen(e, textEl, 'text', textEl.text || '');
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Text Style" placement="left" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFFFFF',
                        '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTextElement(textEl);
                        setSelectedComponent(null);
                        setSelectedImageElement(null);
                        handleEditOpen(e, textEl, 'style', '');
                      }}
                    >
                      <Style fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ bgcolor: alpha('#FFFFFF', 0.15) }}
                  />

                  <Tooltip title="Move Up" placement="left" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFFFFF',
                        '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                      }}
                      onClick={() => {
                        setSelectedTextElement(textEl);
                        moveElement('up');
                      }}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move Down" placement="left" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFFFFF',
                        '&:hover': { color: '#4FC3F7', bgcolor: alpha('#FFFFFF', 0.1) },
                      }}
                      onClick={() => {
                        setSelectedTextElement(textEl);
                        moveElement('down');
                      }}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" placement="left" arrow>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#ff4444',
                        '&:hover': { color: '#FFFFFF', bgcolor: alpha('#ff4444', 0.2) },
                      }}
                      onClick={() => {
                        handleDeleteTextElement(textEl.id);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '2px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextElement(textEl);
                    setSelectedComponent(null);
                    setSelectedImageElement(null);
                  }}
                />
              </Box>
            ))}
          </Box>
        );
      }

      return preview;
    } catch (error) {
      console.error('Error rendering preview:', error);
      return <Box sx={{ color: 'white', p: 4 }}>Error rendering preview</Box>;
    }
  };

  // FIX #1, #9: Removed duplicate handleDeleteComponent definition that was here originally
  // The function is now defined at the top of the component as handleDeleteComponentLocal

  // Render the main content
  return (
    <>
      {showCode ? (
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: '#0A0F1A',
            height: '100%',
            width: '100%',
          }}
        >
          <Paper
            sx={{
              bgcolor: '#1A1F2E',
              borderRadius: globalStyles?.borderRadius || '12px',
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                Generated HTML/CSS Code
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={copyCodeToClipboard}
                sx={{
                  color: 'white',
                  borderColor: alpha('#FFFFFF', 0.2),
                  fontSize: '0.7rem',
                  '&:hover': { borderColor: alpha('#FFFFFF', 0.5) },
                }}
              >
                Copy Code
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                flex: 1,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha('#FFFFFF', 0.05),
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha('#FFFFFF', 0.3),
                  borderRadius: '4px',
                  '&:hover': {
                    background: alpha('#FFFFFF', 0.5),
                  },
                },
              }}
            >
              <pre
                style={{
                  color: '#E0E0E0',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflow: 'auto',
                  maxWidth: '100%',
                }}
              >
                {generatedCode}
              </pre>
            </Box>
          </Paper>
        </Box>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: '#080C14',
            position: 'relative',
            zIndex: 0,
            width: '100%',
            height: '100%',
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: alpha('#FFFFFF', 0.03),
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha('#FFFFFF', 0.3),
              borderRadius: '4px',
              '&:hover': {
                background: alpha('#FFFFFF', 0.5),
              },
            },
          }}
        >
          <Box
            sx={{
              transform: `scale(${canvasScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.3s ease',
              width: '100%',
              minHeight: '100%',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {renderEditablePreview()}
          </Box>

          {/* Edit Popover */}
          <Popover
            open={Boolean(editAnchor)}
            anchorEl={editAnchor}
            onClose={handleEditClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                bgcolor: '#1A1F2E',
                border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                borderRadius: '12px',
                p: 2,
                minWidth: 300,
                maxWidth: 360,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              },
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                Edit {editField === 'text' ? 'Text' : 'Style'}
              </Typography>
              <IconButton
                size="small"
                onClick={handleEditClose}
                sx={{ color: alpha('#FFFFFF', 0.5) }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Divider sx={{ borderColor: alpha('#FFFFFF', 0.1), mb: 2 }} />

            {editField === 'text' && (
              <>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter text content..."
                  sx={{
                    mb: 2,
                    '& .MuiInputBase-root': {
                      color: '#FFFFFF',
                      bgcolor: alpha('#FFFFFF', 0.05),
                      borderRadius: '8px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha('#FFFFFF', 0.2),
                    },
                    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4FC3F7',
                    },
                  }}
                />

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Close />}
                    onClick={handleEditClose}
                    sx={{
                      color: alpha('#FFFFFF', 0.6),
                      borderColor: alpha('#FFFFFF', 0.2),
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    startIcon={<Check />}
                    onClick={handleSaveTextEdit}
                    sx={{
                      background: 'linear-gradient(135deg, #4FC3F7, #26C6DA)',
                      '&:hover': { opacity: 0.9 },
                    }}
                  >
                    Save
                  </Button>
                </Stack>
              </>
            )}

            {editField === 'style' && (
              <>
                {/* Font Size */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.7), display: 'block', mb: 0.5 }}
                  >
                    Font Size
                  </Typography>
                  <Slider
                    value={fontSize}
                    onChange={(_, val) => {
                      setFontSize(val);
                      applyTextStyle('fontSize', val);
                    }}
                    min={10}
                    max={72}
                    size="small"
                    sx={{ color: '#4FC3F7' }}
                  />
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.4) }}>
                    {fontSize}px
                  </Typography>
                </Box>

                {/* Text Color */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.7), display: 'block', mb: 0.5 }}
                  >
                    Text Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        applyTextStyle('color', e.target.value);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        padding: 0,
                        border: `2px solid ${alpha('#FFFFFF', 0.2)}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: 'none',
                      }}
                    />
                    <TextField
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        applyTextStyle('color', e.target.value);
                      }}
                      size="small"
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-root': {
                          color: '#FFFFFF',
                          bgcolor: alpha('#FFFFFF', 0.05),
                          borderRadius: '8px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha('#FFFFFF', 0.2),
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Font Family */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha('#FFFFFF', 0.7), display: 'block', mb: 0.5 }}
                  >
                    Font Family
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      applyTextStyle('fontFamily', e.target.value);
                    }}
                    sx={{
                      color: '#FFFFFF',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha('#FFFFFF', 0.2),
                      },
                      '& .MuiSelect-icon': {
                        color: alpha('#FFFFFF', 0.5),
                      },
                    }}
                  >
                    <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                    <MenuItem value="Poppins, sans-serif">Poppins</MenuItem>
                    <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                    <MenuItem value="Montserrat, sans-serif">Montserrat</MenuItem>
                    <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                    <MenuItem value="Playfair Display, serif">Playfair Display</MenuItem>
                  </Select>
                </Box>

                {/* Formatting options */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Tooltip title="Bold">
                    <IconButton
                      size="small"
                      onClick={() => applyTextStyle('fontWeight', 'bold')}
                      sx={{
                        color: '#FFFFFF',
                        border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
                        borderRadius: '6px',
                        '&:hover': { borderColor: '#4FC3F7', color: '#4FC3F7' },
                      }}
                    >
                      <FormatBold fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic">
                    <IconButton
                      size="small"
                      onClick={() => applyTextStyle('fontStyle', 'italic')}
                      sx={{
                        color: '#FFFFFF',
                        border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
                        borderRadius: '6px',
                        '&:hover': { borderColor: '#4FC3F7', color: '#4FC3F7' },
                      }}
                    >
                      <FormatItalic fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Underline">
                    <IconButton
                      size="small"
                      onClick={() => applyTextStyle('textDecoration', 'underline')}
                      sx={{
                        color: '#FFFFFF',
                        border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
                        borderRadius: '6px',
                        '&:hover': { borderColor: '#4FC3F7', color: '#4FC3F7' },
                      }}
                    >
                      <FormatUnderlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={handleEditClose}
                    sx={{
                      color: alpha('#FFFFFF', 0.6),
                      borderColor: alpha('#FFFFFF', 0.2),
                    }}
                  >
                    Done
                  </Button>
                </Stack>
              </>
            )}
          </Popover>
        </Box>
      )}

      {/* Component Editor Dialog */}
      {renderComponentEditor()}

      {/* Color Picker Dialog */}
      {renderColorPicker()}
    </>
  );
};

export default EditorCanvas;
