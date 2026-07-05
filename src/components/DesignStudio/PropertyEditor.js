import React, { useState } from 'react';
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  alpha,
  Grid,
  Paper,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Close,
  ExpandMore,
  ColorLens,
  Add,
  Delete,
  Edit as EditIcon,
  Palette,
  FormatColorFill,
  Image as ImageIcon,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  Upload,
  RotateLeft,
  RotateRight,
  Flip,
  BorderColor,
  TextFields,
  FontDownload,
  LineWeight,
  SpaceBar,
  Margin,
  Padding,
  BorderAll,
  Box as BoxIcon,
  Visibility,
  VisibilityOff,
  ContentCopy,
  ArrowUpward,
  ArrowDownward,
  ArrowLeft,
  ArrowRight,
  Layers,
  Settings,
  Style,
  Crop,
  Filter,
  Opacity,
  BlurOn,
  BrightnessHigh,
  Contrast,
  Colorize,
  Transform,
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import {
  G_START,
  GRAD,
  buttonStyles,
  linkTypes,
  imageStyles,
  getComponentName,
} from './DesignStudioUtils';

export const PropertyEditor = ({
  selectedComponent,
  selectedTextElement,
  selectedImageElement,
  setSelectedComponent,
  setSelectedTextElement,
  setSelectedImageElement,
  globalStyles,
  handleStyleChange,
  handleUpdateComponentContent,
  handleAddComponentItem,
  handleDeleteComponentItem,
  handleDeleteComponent,
  handleTextStyleChange,
  handleDeleteTextElement,
  handleColorPickerOpen,
  colorPickerAnchor,
  handleColorPickerClose,
  selectedColorTarget,
  handleColorChange,
  handleUpdateImageElement,
  handleApplyImageStyle,
  replaceImageInputRef,
  handleReplaceImage,
  handleApplyImageFilter,
  handleRotateImage,
  handleFlipImage,
  handleDeleteImageElement,
  // Add missing props
  handleResizeImage = () => {},
  setImageUploadTarget = () => {},
  setImageUploadDialogOpen = () => {},
  imageStyles: propImageStyles = imageStyles,
  // Additional props for enhanced editing
  components = [],
  setComponents = () => {},
  pages = [],
  activePageId = null,
  handleSwitchPage = () => {},
  handleDeletePage = () => {},
  handleAddPage = () => {},
  setAddPageDialogOpen = () => {},
}) => {
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    appearance: true,
    layout: true,
    typography: true,
    advanced: false,
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLocalColorPick = (target, currentColor) => {
    setColorPickerTarget(target);
    setColorPickerOpen(true);
  };

  const handleLocalColorChange = (color) => {
    if (colorPickerTarget) {
      const { type, key, id } = colorPickerTarget;
      if (type === 'component' && selectedComponent) {
        handleUpdateComponentContent(selectedComponent.id, key, color.hex);
      } else if (type === 'text' && selectedTextElement) {
        handleTextStyleChange(selectedTextElement.id, key, color.hex);
      } else if (type === 'global') {
        handleStyleChange(key, color.hex);
      }
    }
  };

  // Render component properties
  const renderComponentProperties = () => {
    if (!selectedComponent) return null;

    const comp = selectedComponent;
    const styles = comp.styles || {};
    const content = comp.content || {};

    return (
      <Box>
        {/* Component Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {getComponentName(comp.type)}
            </Typography>
            <Chip
              label={comp.type}
              size="small"
              sx={{
                bgcolor: alpha(G_START, 0.2),
                color: G_START,
                fontSize: '0.6rem',
              }}
            />
          </Box>
          <Box>
            <Tooltip title="Duplicate Component">
              <IconButton
                size="small"
                onClick={() => {
                  const newComp = { ...comp, id: Date.now() + Math.random() };
                  setComponents([...components, newComp]);
                }}
                sx={{ color: alpha('#FFFFFF', 0.5) }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Component">
              <IconButton
                size="small"
                onClick={() => handleDeleteComponent(comp.id)}
                sx={{ color: '#ff4444' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />

        {/* Content Section */}
        <Accordion
          expanded={expandedSections.content}
          onChange={() => toggleSection('content')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon fontSize="small" /> Content
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Text content */}
              <TextField
                fullWidth
                label="Heading Text"
                multiline
                rows={2}
                value={content.heading || ''}
                onChange={(e) => handleUpdateComponentContent(comp.id, 'heading', e.target.value)}
                sx={{
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              />
              <TextField
                fullWidth
                label="Subheading / Description"
                multiline
                rows={3}
                value={content.subheading || content.text || ''}
                onChange={(e) =>
                  handleUpdateComponentContent(comp.id, 'subheading', e.target.value)
                }
                sx={{
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              />

              {/* Button text if component has button */}
              {comp.type !== 'footer' && comp.type !== 'logo' && (
                <TextField
                  fullWidth
                  label="Button Text"
                  value={content.buttonText || 'Learn More'}
                  onChange={(e) =>
                    handleUpdateComponentContent(comp.id, 'buttonText', e.target.value)
                  }
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                  }}
                />
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Appearance Section */}
        <Accordion
          expanded={expandedSections.appearance}
          onChange={() => toggleSection('appearance')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette fontSize="small" /> Appearance
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Colors */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Colors
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        handleLocalColorPick(
                          { type: 'component', key: 'backgroundColor', id: comp.id },
                          styles.backgroundColor
                        )
                      }
                      sx={{ color: 'white', borderColor: alpha('#FFFFFF', 0.2) }}
                    >
                      Background
                      <Box
                        sx={{
                          ml: 1,
                          width: 20,
                          height: 20,
                          bgcolor: styles.backgroundColor || 'transparent',
                          borderRadius: '4px',
                          border: `1px solid ${alpha('#FFFFFF', 0.3)}`,
                        }}
                      />
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        handleLocalColorPick(
                          { type: 'component', key: 'color', id: comp.id },
                          styles.color
                        )
                      }
                      sx={{ color: 'white', borderColor: alpha('#FFFFFF', 0.2) }}
                    >
                      Text
                      <Box
                        sx={{
                          ml: 1,
                          width: 20,
                          height: 20,
                          bgcolor: styles.color || globalStyles.textColor,
                          borderRadius: '4px',
                          border: `1px solid ${alpha('#FFFFFF', 0.3)}`,
                        }}
                      />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Background Options */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Background Options
                </Typography>
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Background Image URL"
                    value={styles.backgroundImage || ''}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'backgroundImage', e.target.value)
                    }
                    placeholder="https://example.com/bg.jpg"
                    sx={{
                      '& .MuiInputBase-root': { color: 'white', fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7), fontSize: '0.8rem' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                    }}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: alpha('#FFFFFF', 0.7), fontSize: '0.8rem' }}>
                      Background Size
                    </InputLabel>
                    <Select
                      value={styles.backgroundSize || 'cover'}
                      onChange={(e) =>
                        handleUpdateComponentContent(comp.id, 'backgroundSize', e.target.value)
                      }
                      label="Background Size"
                      sx={{
                        color: 'white',
                        fontSize: '0.8rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha('#FFFFFF', 0.2),
                        },
                      }}
                    >
                      <MenuItem value="cover">Cover</MenuItem>
                      <MenuItem value="contain">Contain</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                      <MenuItem value="100% 100%">Stretch</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Layout Section */}
        <Accordion
          expanded={expandedSections.layout}
          onChange={() => toggleSection('layout')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Layers fontSize="small" /> Layout & Positioning
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Position */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Position
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="X"
                    type="number"
                    size="small"
                    value={comp.position?.x || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'position', {
                        ...comp.position,
                        x: parseInt(e.target.value) || 0,
                      })
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                  <TextField
                    label="Y"
                    type="number"
                    size="small"
                    value={comp.position?.y || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'position', {
                        ...comp.position,
                        y: parseInt(e.target.value) || 0,
                      })
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                  <Tooltip title="Move Up">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newY = (comp.position?.y || 0) - 10;
                        handleUpdateComponentContent(comp.id, 'position', {
                          ...comp.position,
                          y: newY,
                        });
                      }}
                      sx={{ color: 'white' }}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move Down">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newY = (comp.position?.y || 0) + 10;
                        handleUpdateComponentContent(comp.id, 'position', {
                          ...comp.position,
                          y: newY,
                        });
                      }}
                      sx={{ color: 'white' }}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move Left">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newX = (comp.position?.x || 0) - 10;
                        handleUpdateComponentContent(comp.id, 'position', {
                          ...comp.position,
                          x: newX,
                        });
                      }}
                      sx={{ color: 'white' }}
                    >
                      <ArrowLeft fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move Right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newX = (comp.position?.x || 0) + 10;
                        handleUpdateComponentContent(comp.id, 'position', {
                          ...comp.position,
                          x: newX,
                        });
                      }}
                      sx={{ color: 'white' }}
                    >
                      <ArrowRight fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Size */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Size
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Width"
                    type="number"
                    size="small"
                    value={comp.size?.width || ''}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'size', {
                        ...comp.size,
                        width: e.target.value,
                      })
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                  <TextField
                    label="Height"
                    type="number"
                    size="small"
                    value={comp.size?.height || ''}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'size', {
                        ...comp.size,
                        height: e.target.value,
                      })
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={comp.size?.autoWidth !== false}
                      onChange={(e) =>
                        handleUpdateComponentContent(comp.id, 'size', {
                          ...comp.size,
                          autoWidth: e.target.checked,
                        })
                      }
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: G_START } }}
                    />
                  }
                  label="Auto Width"
                  sx={{ color: alpha('#FFFFFF', 0.7), fontSize: '0.8rem' }}
                />
              </Box>

              {/* Spacing */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Spacing
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Padding"
                    type="number"
                    size="small"
                    value={parseInt(styles.padding) || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'padding', `${e.target.value}px`)
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                  <TextField
                    label="Margin"
                    type="number"
                    size="small"
                    value={parseInt(styles.margin) || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'margin', `${e.target.value}px`)
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                </Box>
              </Box>

              {/* Border */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Border
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Radius"
                    type="number"
                    size="small"
                    value={parseInt(styles.borderRadius) || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'borderRadius', `${e.target.value}px`)
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                  <TextField
                    label="Width"
                    type="number"
                    size="small"
                    value={parseInt(styles.borderWidth) || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'borderWidth', `${e.target.value}px`)
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      handleLocalColorPick(
                        { type: 'component', key: 'borderColor', id: comp.id },
                        styles.borderColor
                      )
                    }
                    sx={{ color: 'white', borderColor: alpha('#FFFFFF', 0.2), flex: 1 }}
                  >
                    Border Color
                    <Box
                      sx={{
                        ml: 1,
                        width: 16,
                        height: 16,
                        bgcolor: styles.borderColor || 'transparent',
                        borderRadius: '4px',
                        border: `1px solid ${alpha('#FFFFFF', 0.3)}`,
                      }}
                    />
                  </Button>
                </Box>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Advanced Section */}
        <Accordion
          expanded={expandedSections.advanced}
          onChange={() => toggleSection('advanced')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings fontSize="small" /> Advanced
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Animations */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Animations
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>Animation Type</InputLabel>
                  <Select
                    value={styles.animation || 'none'}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'animation', e.target.value)
                    }
                    label="Animation Type"
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                    }}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="fadeIn">Fade In</MenuItem>
                    <MenuItem value="slideUp">Slide Up</MenuItem>
                    <MenuItem value="slideDown">Slide Down</MenuItem>
                    <MenuItem value="slideLeft">Slide Left</MenuItem>
                    <MenuItem value="slideRight">Slide Right</MenuItem>
                    <MenuItem value="zoomIn">Zoom In</MenuItem>
                    <MenuItem value="bounce">Bounce</MenuItem>
                    <MenuItem value="pulse">Pulse</MenuItem>
                    <MenuItem value="shake">Shake</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    label="Duration (ms)"
                    type="number"
                    size="small"
                    value={parseInt(styles.animationDuration) || 300}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'animationDuration', e.target.value)
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                  <TextField
                    label="Delay (ms)"
                    type="number"
                    size="small"
                    value={parseInt(styles.animationDelay) || 0}
                    onChange={(e) =>
                      handleUpdateComponentContent(comp.id, 'animationDelay', e.target.value)
                    }
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                    }}
                  />
                </Box>
              </Box>

              {/* Visibility */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={styles.visible !== false}
                      onChange={(e) =>
                        handleUpdateComponentContent(comp.id, 'visible', e.target.checked)
                      }
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: G_START } }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {styles.visible !== false ? (
                        <Visibility fontSize="small" />
                      ) : (
                        <VisibilityOff fontSize="small" />
                      )}
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        Visible
                      </Typography>
                    </Box>
                  }
                  sx={{ color: 'white' }}
                />
              </Box>

              {/* Z-Index */}
              <TextField
                label="Z-Index"
                type="number"
                size="small"
                value={styles.zIndex || 0}
                onChange={(e) =>
                  handleUpdateComponentContent(comp.id, 'zIndex', parseInt(e.target.value) || 0)
                }
                sx={{
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              />

              {/* Custom CSS */}
              <TextField
                fullWidth
                label="Custom CSS Class"
                value={styles.customClass || ''}
                onChange={(e) =>
                  handleUpdateComponentContent(comp.id, 'customClass', e.target.value)
                }
                placeholder="my-custom-class"
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
    );
  };

  // Render text element properties
  const renderTextProperties = () => {
    if (!selectedTextElement) return null;

    const el = selectedTextElement;
    const styles = el.styles || {};

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Text Properties
          </Typography>
          <IconButton
            size="small"
            onClick={() => setSelectedTextElement(null)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />

        {/* Content */}
        <TextField
          fullWidth
          label="Text Content"
          multiline
          rows={3}
          value={el.content || el.text || ''}
          onChange={(e) => handleTextStyleChange(el.id, 'text', e.target.value)}
          sx={{
            mb: 2,
            '& .MuiInputBase-root': { color: 'white' },
            '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
          }}
        />

        {/* Tag Type */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>HTML Tag</InputLabel>
          <Select
            value={el.tag || 'p'}
            onChange={(e) => handleTextStyleChange(el.id, 'tag', e.target.value)}
            label="HTML Tag"
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
            }}
          >
            <MenuItem value="h1">Heading 1</MenuItem>
            <MenuItem value="h2">Heading 2</MenuItem>
            <MenuItem value="h3">Heading 3</MenuItem>
            <MenuItem value="h4">Heading 4</MenuItem>
            <MenuItem value="h5">Heading 5</MenuItem>
            <MenuItem value="h6">Heading 6</MenuItem>
            <MenuItem value="p">Paragraph</MenuItem>
            <MenuItem value="span">Span</MenuItem>
            <MenuItem value="div">Div</MenuItem>
            <MenuItem value="a">Link</MenuItem>
          </Select>
        </FormControl>

        {/* Link options */}
        {(el.tag === 'a' || el.isLink) && (
          <>
            <TextField
              fullWidth
              label="Link URL"
              value={el.href || ''}
              onChange={(e) => handleTextStyleChange(el.id, 'href', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              }}
            />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>Link Target</InputLabel>
              <Select
                value={el.target || '_self'}
                onChange={(e) => handleTextStyleChange(el.id, 'target', e.target.value)}
                label="Link Target"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                }}
              >
                <MenuItem value="_self">Same Window</MenuItem>
                <MenuItem value="_blank">New Window</MenuItem>
                <MenuItem value="_parent">Parent Frame</MenuItem>
                <MenuItem value="_top">Top Frame</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {/* Typography */}
        <Accordion
          expanded={expandedSections.typography}
          onChange={() => toggleSection('typography')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextFields fontSize="small" /> Typography
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Font Size */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Font Size: {styles.fontSize || '16px'}
                </Typography>
                <Slider
                  value={parseInt(styles.fontSize) || 16}
                  onChange={(_, val) => handleTextStyleChange(el.id, 'fontSize', `${val}px`)}
                  min={8}
                  max={72}
                  size="small"
                  sx={{ color: G_START }}
                />
              </Box>

              {/* Font Family */}
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>Font Family</InputLabel>
                <Select
                  value={styles.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => handleTextStyleChange(el.id, 'fontFamily', e.target.value)}
                  label="Font Family"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                  }}
                >
                  <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                  <MenuItem value="Poppins, sans-serif">Poppins</MenuItem>
                  <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                  <MenuItem value="Montserrat, sans-serif">Montserrat</MenuItem>
                  <MenuItem value="Space Grotesk, sans-serif">Space Grotesk</MenuItem>
                  <MenuItem value="Playfair Display, serif">Playfair Display</MenuItem>
                  <MenuItem value="Georgia, serif">Georgia</MenuItem>
                  <MenuItem value="Courier New, monospace">Courier New</MenuItem>
                </Select>
              </FormControl>

              {/* Font Weight */}
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: alpha('#FFFFFF', 0.7) }}>Font Weight</InputLabel>
                <Select
                  value={styles.fontWeight || '400'}
                  onChange={(e) => handleTextStyleChange(el.id, 'fontWeight', e.target.value)}
                  label="Font Weight"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
                  }}
                >
                  <MenuItem value="100">Thin (100)</MenuItem>
                  <MenuItem value="200">Extra Light (200)</MenuItem>
                  <MenuItem value="300">Light (300)</MenuItem>
                  <MenuItem value="400">Regular (400)</MenuItem>
                  <MenuItem value="500">Medium (500)</MenuItem>
                  <MenuItem value="600">Semi Bold (600)</MenuItem>
                  <MenuItem value="700">Bold (700)</MenuItem>
                  <MenuItem value="800">Extra Bold (800)</MenuItem>
                  <MenuItem value="900">Black (900)</MenuItem>
                </Select>
              </FormControl>

              {/* Text Decoration */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Bold">
                  <ToggleButton
                    value="bold"
                    selected={styles.fontWeight === 'bold' || styles.fontWeight === '700'}
                    onChange={() => {
                      const isBold = styles.fontWeight === 'bold' || styles.fontWeight === '700';
                      handleTextStyleChange(el.id, 'fontWeight', isBold ? '400' : 'bold');
                    }}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      '&.Mui-selected': {
                        color: G_START,
                        borderColor: G_START,
                        bgcolor: alpha(G_START, 0.1),
                      },
                    }}
                  >
                    <FormatBold fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Italic">
                  <ToggleButton
                    value="italic"
                    selected={styles.fontStyle === 'italic'}
                    onChange={() => {
                      handleTextStyleChange(
                        el.id,
                        'fontStyle',
                        styles.fontStyle === 'italic' ? 'normal' : 'italic'
                      );
                    }}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      '&.Mui-selected': {
                        color: G_START,
                        borderColor: G_START,
                        bgcolor: alpha(G_START, 0.1),
                      },
                    }}
                  >
                    <FormatItalic fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Underline">
                  <ToggleButton
                    value="underline"
                    selected={styles.textDecoration === 'underline'}
                    onChange={() => {
                      handleTextStyleChange(
                        el.id,
                        'textDecoration',
                        styles.textDecoration === 'underline' ? 'none' : 'underline'
                      );
                    }}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      '&.Mui-selected': {
                        color: G_START,
                        borderColor: G_START,
                        bgcolor: alpha(G_START, 0.1),
                      },
                    }}
                  >
                    <FormatUnderlined fontSize="small" />
                  </ToggleButton>
                </Tooltip>
              </Box>

              {/* Text Align */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Align Left">
                  <ToggleButton
                    value="left"
                    selected={styles.textAlign === 'left' || !styles.textAlign}
                    onChange={() => handleTextStyleChange(el.id, 'textAlign', 'left')}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      '&.Mui-selected': {
                        color: G_START,
                        borderColor: G_START,
                        bgcolor: alpha(G_START, 0.1),
                      },
                      flex: 1,
                    }}
                  >
                    <FormatAlignLeft fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Align Center">
                  <ToggleButton
                    value="center"
                    selected={styles.textAlign === 'center'}
                    onChange={() => handleTextStyleChange(el.id, 'textAlign', 'center')}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      '&.Mui-selected': {
                        color: G_START,
                        borderColor: G_START,
                        bgcolor: alpha(G_START, 0.1),
                      },
                      flex: 1,
                    }}
                  >
                    <FormatAlignCenter fontSize="small" />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Align Right">
                  <ToggleButton
                    value="right"
                    selected={styles.textAlign === 'right'}
                    onChange={() => handleTextStyleChange(el.id, 'textAlign', 'right')}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#FFFFFF', 0.2),
                      '&.Mui-selected': {
                        color: G_START,
                        borderColor: G_START,
                        bgcolor: alpha(G_START, 0.1),
                      },
                      flex: 1,
                    }}
                  >
                    <FormatAlignRight fontSize="small" />
                  </ToggleButton>
                </Tooltip>
              </Box>

              {/* Line Height */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Line Height: {styles.lineHeight || 1.5}
                </Typography>
                <Slider
                  value={styles.lineHeight || 1.5}
                  onChange={(_, val) => handleTextStyleChange(el.id, 'lineHeight', val)}
                  min={1}
                  max={3}
                  step={0.1}
                  size="small"
                  sx={{ color: G_START }}
                />
              </Box>

              {/* Letter Spacing */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Letter Spacing: {styles.letterSpacing || 0}px
                </Typography>
                <Slider
                  value={styles.letterSpacing || 0}
                  onChange={(_, val) => handleTextStyleChange(el.id, 'letterSpacing', val)}
                  min={-2}
                  max={10}
                  step={0.5}
                  size="small"
                  sx={{ color: G_START }}
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Colors */}
        <Accordion
          expanded={expandedSections.appearance}
          onChange={() => toggleSection('appearance')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none', mt: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette fontSize="small" /> Colors
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FormatColorFill />}
                onClick={() =>
                  handleLocalColorPick({ type: 'text', key: 'color', id: el.id }, styles.color)
                }
                sx={{
                  color: 'white',
                  borderColor: alpha('#FFFFFF', 0.2),
                  justifyContent: 'space-between',
                }}
              >
                Text Color
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: styles.color || '#FFFFFF',
                    borderRadius: '4px',
                    border: `1px solid ${alpha('#FFFFFF', 0.3)}`,
                  }}
                />
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FormatColorFill />}
                onClick={() =>
                  handleLocalColorPick(
                    { type: 'text', key: 'backgroundColor', id: el.id },
                    styles.backgroundColor
                  )
                }
                sx={{
                  color: 'white',
                  borderColor: alpha('#FFFFFF', 0.2),
                  justifyContent: 'space-between',
                }}
              >
                Background Color
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: styles.backgroundColor || 'transparent',
                    borderRadius: '4px',
                    border: `1px solid ${alpha('#FFFFFF', 0.3)}`,
                  }}
                />
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Transform options */}
        <Accordion
          expanded={expandedSections.advanced}
          onChange={() => toggleSection('advanced')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none', mt: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Transform fontSize="small" /> Transform
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={styles.textTransform === 'uppercase'}
                    onChange={(e) =>
                      handleTextStyleChange(
                        el.id,
                        'textTransform',
                        e.target.checked ? 'uppercase' : 'none'
                      )
                    }
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: G_START } }}
                  />
                }
                label="Uppercase"
                sx={{ color: 'white' }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Rotate (deg)"
                  type="number"
                  size="small"
                  value={styles.rotate || 0}
                  onChange={(e) =>
                    handleTextStyleChange(el.id, 'rotate', parseInt(e.target.value) || 0)
                  }
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  }}
                />
                <TextField
                  label="Opacity"
                  type="number"
                  size="small"
                  value={styles.opacity !== undefined ? styles.opacity * 100 : 100}
                  onChange={(e) =>
                    handleTextStyleChange(el.id, 'opacity', (parseInt(e.target.value) || 100) / 100)
                  }
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  }}
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Delete */}
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => handleDeleteTextElement(el.id)}
          sx={{ mt: 2, color: '#ff4444', borderColor: '#ff4444' }}
        >
          Delete Text Element
        </Button>
      </Box>
    );
  };

  // Render image element properties
  const renderImageProperties = () => {
    if (!selectedImageElement) return null;

    const el = selectedImageElement;
    const filters = el.filters || {};

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Image Properties
          </Typography>
          <IconButton
            size="small"
            onClick={() => setSelectedImageElement(null)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2, borderColor: alpha('#FFFFFF', 0.1) }} />

        {/* Image Preview */}
        <Box
          component="img"
          src={el.imageUrl}
          alt={el.alt}
          sx={{
            width: '100%',
            borderRadius: globalStyles.borderRadius || '12px',
            mb: 2,
            maxHeight: 200,
            objectFit: 'contain',
          }}
        />

        {/* Replace Image */}
        <input
          type="file"
          ref={replaceImageInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleReplaceImage(el.id, file);
            e.target.value = '';
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Upload />}
          onClick={() => replaceImageInputRef?.current?.click()}
          sx={{ mb: 2, color: 'white', borderColor: alpha(G_START, 0.5) }}
        >
          Replace Image
        </Button>

        {/* Alt Text */}
        <TextField
          fullWidth
          label="Alt Text (SEO)"
          value={el.alt || ''}
          onChange={(e) => handleUpdateImageElement(el.id, { alt: e.target.value })}
          sx={{
            mb: 2,
            '& .MuiInputBase-root': { color: 'white' },
            '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
          }}
        />

        {/* Size */}
        <Accordion
          expanded={expandedSections.layout}
          onChange={() => toggleSection('layout')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Crop fontSize="small" /> Size & Position
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Width"
                  type="number"
                  size="small"
                  value={el.width || ''}
                  onChange={(e) => handleResizeImage(el.id, parseInt(e.target.value), el.height)}
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  }}
                />
                <TextField
                  label="Height"
                  type="number"
                  size="small"
                  value={el.height || ''}
                  onChange={(e) => handleResizeImage(el.id, el.width, parseInt(e.target.value))}
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={el.maintainAspectRatio !== false}
                    onChange={(e) =>
                      handleUpdateImageElement(el.id, { maintainAspectRatio: e.target.checked })
                    }
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: G_START } }}
                  />
                }
                label="Maintain Aspect Ratio"
                sx={{ color: alpha('#FFFFFF', 0.7), fontSize: '0.8rem' }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="X Position"
                  type="number"
                  size="small"
                  value={el.position?.x || 0}
                  onChange={(e) =>
                    handleUpdateImageElement(el.id, {
                      position: { ...el.position, x: parseInt(e.target.value) || 0 },
                    })
                  }
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  }}
                />
                <TextField
                  label="Y Position"
                  type="number"
                  size="small"
                  value={el.position?.y || 0}
                  onChange={(e) =>
                    handleUpdateImageElement(el.id, {
                      position: { ...el.position, y: parseInt(e.target.value) || 0 },
                    })
                  }
                  sx={{
                    flex: 1,
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.7) },
                  }}
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Image Styles */}
        <Accordion
          expanded={expandedSections.appearance}
          onChange={() => toggleSection('appearance')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Style fontSize="small" /> Image Styles
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                Apply a style preset to your image
              </Typography>
              <Grid container spacing={1}>
                {(propImageStyles || imageStyles).slice(0, 4).map((style) => (
                  <Grid item xs={6} key={style.id}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() => handleApplyImageStyle(el.id, style)}
                      sx={{ color: 'white', borderColor: alpha('#FFFFFF', 0.2) }}
                    >
                      {style.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Border Radius */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Border Radius: {el.borderRadius || 0}px
                </Typography>
                <Slider
                  value={el.borderRadius || 0}
                  onChange={(_, val) => handleUpdateImageElement(el.id, { borderRadius: val })}
                  min={0}
                  max={50}
                  size="small"
                  sx={{ color: G_START }}
                />
              </Box>

              {/* Shadow */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Shadow Intensity
                </Typography>
                <Slider
                  value={el.shadowIntensity || 0}
                  onChange={(_, val) => handleUpdateImageElement(el.id, { shadowIntensity: val })}
                  min={0}
                  max={20}
                  size="small"
                  sx={{ color: G_START }}
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Transform */}
        <Accordion
          expanded={expandedSections.advanced}
          onChange={() => toggleSection('advanced')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Transform fontSize="small" /> Transform
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Rotate */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Rotate Left">
                  <IconButton
                    onClick={() => handleRotateImage(el.id, -90)}
                    sx={{ color: 'white', bgcolor: alpha('#FFFFFF', 0.05) }}
                  >
                    <RotateLeft />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rotate Right">
                  <IconButton
                    onClick={() => handleRotateImage(el.id, 90)}
                    sx={{ color: 'white', bgcolor: alpha('#FFFFFF', 0.05) }}
                  >
                    <RotateRight />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Flip Horizontal">
                  <IconButton
                    onClick={() => handleFlipImage(el.id, 'horizontal')}
                    sx={{ color: 'white', bgcolor: alpha('#FFFFFF', 0.05) }}
                  >
                    <Flip />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Flip Vertical">
                  <IconButton
                    onClick={() => handleFlipImage(el.id, 'vertical')}
                    sx={{ color: 'white', bgcolor: alpha('#FFFFFF', 0.05) }}
                  >
                    <Flip sx={{ transform: 'rotate(90deg)' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Opacity */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: alpha('#FFFFFF', 0.7), mb: 1, display: 'block' }}
                >
                  Opacity: {el.opacity !== undefined ? el.opacity * 100 : 100}%
                </Typography>
                <Slider
                  value={el.opacity !== undefined ? el.opacity : 1}
                  onChange={(_, val) => handleUpdateImageElement(el.id, { opacity: val })}
                  min={0}
                  max={1}
                  step={0.05}
                  size="small"
                  sx={{ color: G_START }}
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Filters */}
        <Accordion
          expanded={expandedSections.typography}
          onChange={() => toggleSection('typography')}
          sx={{ bgcolor: 'transparent', color: 'white', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Filter fontSize="small" /> Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {['brightness', 'contrast', 'saturate', 'blur', 'grayscale'].map((filter) => (
                <Box key={filter}>
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.5) }}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Typography>
                  <Slider
                    value={
                      filters[filter] ||
                      (filter === 'brightness'
                        ? 100
                        : filter === 'contrast'
                          ? 100
                          : filter === 'saturate'
                            ? 100
                            : 0)
                    }
                    onChange={(_, val) => handleApplyImageFilter(el.id, filter, val)}
                    min={filter === 'blur' ? 0 : 0}
                    max={filter === 'blur' ? 20 : filter === 'grayscale' ? 100 : 200}
                    size="small"
                    sx={{ color: G_START }}
                  />
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Delete */}
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => handleDeleteImageElement(el.id)}
          sx={{ mt: 2, color: '#ff4444', borderColor: '#ff4444' }}
        >
          Remove Image from Canvas
        </Button>
      </Box>
    );
  };

  // Color Picker Dialog
  const renderColorPickerDialog = () => (
    <Dialog
      open={colorPickerOpen}
      onClose={() => setColorPickerOpen(false)}
      PaperProps={{
        sx: {
          bgcolor: '#1A1F2E',
          borderRadius: '12px',
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
        }}
      >
        <Typography>Choose Color</Typography>
        <IconButton onClick={() => setColorPickerOpen(false)} sx={{ color: alpha('#FFFFFF', 0.5) }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <ChromePicker
          color={colorPickerTarget?.currentColor || '#FFFFFF'}
          onChange={handleLocalColorChange}
          disableAlpha
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setColorPickerOpen(false)} sx={{ color: alpha('#FFFFFF', 0.6) }}>
          Cancel
        </Button>
        <Button onClick={() => setColorPickerOpen(false)} sx={{ color: G_START }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: selectedComponent || selectedTextElement || selectedImageElement ? 380 : 0,
          flexShrink: 0,
          transition: 'width 0.3s',
          zIndex: 1,
          '& .MuiDrawer-paper': {
            width: 380,
            boxSizing: 'border-box',
            position: 'relative',
            borderLeft: `1px solid ${alpha('#FFFFFF', 0.1)}`,
            bgcolor: '#0A0F1A',
            transition: 'transform 0.3s',
            transform:
              selectedComponent || selectedTextElement || selectedImageElement
                ? 'translateX(0)'
                : 'translateX(100%)',
            zIndex: 1,
          },
        }}
      >
        <Toolbar />
        {(selectedComponent || selectedTextElement || selectedImageElement) && (
          <Box sx={{ height: 4, background: GRAD }} />
        )}
        {(selectedComponent || selectedTextElement || selectedImageElement) && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: alpha(G_START, 0.07),
              borderBottom: `1px solid ${alpha('#FFFFFF', 0.08)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <EditIcon sx={{ color: G_START, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ color: G_START, fontWeight: 700, flex: 1 }}>
              {selectedComponent
                ? `Edit ${getComponentName(selectedComponent.type)}`
                : selectedTextElement
                  ? 'Edit Text Element'
                  : 'Edit Image'}
            </Typography>
            <Tooltip title="Deselect (Esc)">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedComponent(null);
                  setSelectedTextElement(null);
                  setSelectedImageElement(null);
                }}
                sx={{ color: alpha('#FFFFFF', 0.5), '&:hover': { color: '#ff4444' } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <Box sx={{ p: 2, overflow: 'auto', height: 'calc(100% - 64px)' }}>
          {selectedComponent && renderComponentProperties()}
          {selectedTextElement && !selectedComponent && renderTextProperties()}
          {selectedImageElement && !selectedComponent && renderImageProperties()}
        </Box>
      </Drawer>

      {renderColorPickerDialog()}
    </>
  );
};

export default PropertyEditor;
