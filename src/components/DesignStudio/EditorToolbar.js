import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Box,
  Chip,
  alpha,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
  Paper,
  TextField,
} from '@mui/material';
import {
  Edit,
  Preview,
  Save,
  Code,
  Undo,
  Redo,
  MobileFriendly,
  TabletMac,
  DesktopWindows,
  FolderOpen,
  OpenWith,
  DragIndicator,
  Download,
  Publish,
  Menu,
  Public,
} from '@mui/icons-material';
import { G_START, G_MID, G_END, GRAD } from './DesignStudioUtils';

export const EditorToolbar = ({
  currentProject,
  isEditingMode,
  setIsEditingMode,
  showSnackbar,
  handleSave,
  showCode,
  setShowCode,
  handleUndo,
  handleRedo,
  canvasScale,
  setCanvasScale,
  previewMode,
  setPreviewMode,
  handlePreview,
  handlePublish,
  saveStatus,
  autoSaveStatus,
  autoSaveEnabled,
  setAutoSaveEnabled,
  historyIndex,
  history = [],
  dragDropMode,
  setDragDropMode,
  components = [],
  downloading,
  handleDownloadWebsite,
  saving,
  publishing,
  pages = [],
  activePageId,
  handleSwitchPage,
  handleDeletePage,
  setAddPageDialogOpen,
  setShowProjectsGallery,
  showProjectsGallery,
  setSelectedComponent = () => {},
  setSelectedTextElement = () => {},
  setSelectedImageElement = () => {},
  // Sidebar props
  sidebarOpen = false,
  setSidebarOpen = () => {},
  // Publish Manager props
  setPublishManagerOpen = () => {},
  publishManagerOpen = false,
}) => {
  const setAutoSaveStatusSafe =
    typeof setAutoSaveStatus !== 'undefined' ? setAutoSaveStatus : () => {};

  const safePages = Array.isArray(pages) ? pages : [];

  const handleDeselectAll = () => {
    if (typeof setSelectedComponent === 'function') setSelectedComponent(null);
    if (typeof setSelectedTextElement === 'function') setSelectedTextElement(null);
    if (typeof setSelectedImageElement === 'function') setSelectedImageElement(null);
  };

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={1}
      sx={{
        bgcolor: '#0A0F1A',
        borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}`,
        zIndex: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        minHeight: 'auto',
        flexShrink: 0,
        marginTop: '100px',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 1,
          minHeight: '56px',
          px: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha('#FFFFFF', 0.05),
          },
          '&::-webkit-scrollbar-thumb': {
            background: G_START,
            borderRadius: '4px',
          },
        }}
      >
        {/* Sidebar Toggle Button */}
        <Tooltip title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{
              color: sidebarOpen ? G_START : 'white',
              flexShrink: 0,
              bgcolor: sidebarOpen ? alpha(G_START, 0.15) : 'transparent',
              '&:hover': {
                bgcolor: sidebarOpen ? alpha(G_START, 0.25) : alpha('#FFFFFF', 0.1),
              },
            }}
          >
            <Menu />
          </IconButton>
        </Tooltip>

        {/* Project Name */}
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            mr: 1,
            flexShrink: 0,
          }}
        >
          {currentProject?.name || 'Design Studio'}
        </Typography>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: alpha('#FFFFFF', 0.15), mr: 1, flexShrink: 0 }}
        />

        {/* ── EDIT MODE TOGGLE ── */}
        <Tooltip title={isEditingMode ? 'Switch to Preview Mode' : 'Switch to Edit Mode'}>
          <Button
            variant={isEditingMode ? 'contained' : 'outlined'}
            size="small"
            startIcon={isEditingMode ? <Edit /> : <Preview />}
            onClick={() => {
              setIsEditingMode(!isEditingMode);
              if (isEditingMode) {
                handleDeselectAll();
              }
              showSnackbar(
                isEditingMode
                  ? 'Preview mode: clicks are enabled'
                  : 'Edit mode: click to select and edit elements',
                'info'
              );
            }}
            sx={{
              flexShrink: 0,
              ...(isEditingMode
                ? {
                    background: GRAD,
                    '&:hover': { opacity: 0.9 },
                  }
                : {
                    color: 'white',
                    borderColor: alpha('#FFFFFF', 0.3),
                    '&:hover': { borderColor: G_START },
                  }),
            }}
          >
            {isEditingMode ? 'Edit' : 'Preview'}
          </Button>
        </Tooltip>

        {/* Save Status Chips */}
        {saveStatus !== 'idle' && (
          <Chip
            size="small"
            label={
              saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? '✓ Saved'
                  : '⚠️ Error'
            }
            sx={{
              flexShrink: 0,
              bgcolor:
                saveStatus === 'saved'
                  ? alpha(G_END, 0.2)
                  : saveStatus === 'error'
                    ? alpha('#ff4444', 0.2)
                    : alpha(G_START, 0.2),
              color: saveStatus === 'saved' ? G_END : saveStatus === 'error' ? '#ff4444' : G_START,
              fontSize: '0.65rem',
              height: 24,
            }}
          />
        )}

        {/* Auto-save Status */}
        {autoSaveStatus !== 'idle' && autoSaveEnabled && (
          <Chip
            size="small"
            label={autoSaveStatus === 'saving' ? 'Auto-saving…' : '✓ Auto-saved'}
            sx={{
              flexShrink: 0,
              bgcolor: autoSaveStatus === 'saved' ? alpha(G_END, 0.2) : alpha(G_START, 0.2),
              color: autoSaveStatus === 'saved' ? G_END : G_START,
              fontSize: '0.65rem',
              height: 24,
            }}
          />
        )}

        {/* Auto-save Toggle */}
        <Tooltip title={autoSaveEnabled ? 'Auto-save is on (every 10 min)' : 'Auto-save is off'}>
          <FormControlLabel
            sx={{ ml: 0, mr: 0.5, flexShrink: 0 }}
            control={
              <Switch
                size="small"
                checked={autoSaveEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAutoSaveEnabled(enabled);
                  if (!enabled) setAutoSaveStatusSafe('idle');
                  showSnackbar(
                    enabled ? 'Auto-save turned on' : 'Auto-save turned off',
                    enabled ? 'success' : 'info'
                  );
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
              <Typography
                variant="caption"
                sx={{ color: alpha('#FFFFFF', 0.6), fontSize: '0.7rem' }}
              >
                Auto
              </Typography>
            }
          />
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: alpha('#FFFFFF', 0.15), mx: 0.5, flexShrink: 0 }}
        />

        {/* Undo/Redo */}
        <Tooltip title="Undo (Ctrl+Z)">
          <IconButton
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            size="small"
            sx={{ color: 'white', flexShrink: 0 }}
          >
            <Undo fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <IconButton
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            size="small"
            sx={{ color: 'white', flexShrink: 0 }}
          >
            <Redo fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: alpha('#FFFFFF', 0.15), mx: 0.5, flexShrink: 0 }}
        />

        {/* Device Preview */}
        <Tooltip title="Mobile View">
          <IconButton
            onClick={() => setPreviewMode('mobile')}
            size="small"
            sx={{
              color: previewMode === 'mobile' ? G_START : 'white',
              flexShrink: 0,
            }}
          >
            <MobileFriendly fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tablet View">
          <IconButton
            onClick={() => setPreviewMode('tablet')}
            size="small"
            sx={{
              color: previewMode === 'tablet' ? G_START : 'white',
              flexShrink: 0,
            }}
          >
            <TabletMac fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Desktop View">
          <IconButton
            onClick={() => setPreviewMode('desktop')}
            size="small"
            sx={{
              color: previewMode === 'desktop' ? G_START : 'white',
              flexShrink: 0,
            }}
          >
            <DesktopWindows fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: alpha('#FFFFFF', 0.15), mx: 0.5, flexShrink: 0 }}
        />

        {/* Code View */}
        <Tooltip title="Code View">
          <IconButton
            onClick={() => setShowCode(!showCode)}
            size="small"
            sx={{
              color: showCode ? G_START : 'white',
              flexShrink: 0,
            }}
          >
            <Code fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Drag-Drop Mode */}
        <Tooltip title={dragDropMode ? 'Switch to Select Mode' : 'Switch to Drag-Drop Mode'}>
          <IconButton
            onClick={() => {
              setDragDropMode(!dragDropMode);
              showSnackbar(
                dragDropMode
                  ? 'Select mode: click elements to edit'
                  : 'Drag-drop mode: drag elements to reposition',
                'info'
              );
            }}
            size="small"
            sx={{
              color: dragDropMode ? G_MID : alpha('#FFFFFF', 0.5),
              flexShrink: 0,
              border: `1px solid ${dragDropMode ? G_MID : 'transparent'}`,
              borderRadius: '6px',
            }}
          >
            {dragDropMode ? <OpenWith fontSize="small" /> : <DragIndicator fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: alpha('#FFFFFF', 0.15), mx: 0.5, flexShrink: 0 }}
        />

        {/* Action Buttons */}
        <Tooltip title="My Projects">
          <Button
            variant="outlined"
            size="small"
            startIcon={<FolderOpen />}
            onClick={() => setShowProjectsGallery(true)}
            sx={{
              flexShrink: 0,
              color: 'white',
              borderColor: alpha('#FFFFFF', 0.2),
              '&:hover': { borderColor: G_START },
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            Projects
          </Button>
        </Tooltip>

        {/* ── PUBLISH MANAGER BUTTON ── */}
        <Tooltip title={publishManagerOpen ? 'Close Publish Manager' : 'Open Publish Manager'}>
          <Button
            variant={publishManagerOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Public />}
            onClick={() => setPublishManagerOpen(!publishManagerOpen)}
            sx={{
              flexShrink: 0,
              ...(publishManagerOpen
                ? {
                    background: GRAD,
                    '&:hover': { opacity: 0.9 },
                  }
                : {
                    color: 'white',
                    borderColor: alpha('#FFFFFF', 0.2),
                    '&:hover': { borderColor: G_START },
                  }),
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            {publishManagerOpen ? 'Close Manager' : 'Publish Manager'}
          </Button>
        </Tooltip>

        <Tooltip title="Preview Website">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Preview />}
            onClick={handlePreview}
            sx={{
              flexShrink: 0,
              color: 'white',
              borderColor: alpha('#FFFFFF', 0.2),
              '&:hover': { borderColor: G_START },
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            Preview
          </Button>
        </Tooltip>

        <Tooltip title="Download as ZIP">
          <Button
            variant="outlined"
            size="small"
            startIcon={downloading ? <CircularProgress size={14} /> : <Download />}
            onClick={() => handleDownloadWebsite(null)}
            disabled={downloading || components.length === 0}
            sx={{
              flexShrink: 0,
              color: G_START,
              borderColor: G_START,
              '&:hover': { bgcolor: alpha(G_START, 0.1) },
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
        </Tooltip>

        <Tooltip title="Save Project">
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={14} /> : <Save />}
            onClick={handleSave}
            disabled={saving || components.length === 0}
            sx={{
              flexShrink: 0,
              background: GRAD,
              '&:hover': { opacity: 0.9 },
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            Save
          </Button>
        </Tooltip>

        <Tooltip title="Publish Website">
          <Button
            variant="contained"
            size="small"
            startIcon={publishing ? <CircularProgress size={14} /> : <Publish />}
            onClick={handlePublish}
            disabled={publishing || components.length === 0}
            sx={{
              flexShrink: 0,
              bgcolor: G_END,
              '&:hover': { bgcolor: G_MID },
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            Publish
          </Button>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default EditorToolbar;
