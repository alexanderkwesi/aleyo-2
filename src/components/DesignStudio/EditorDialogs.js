import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  alpha,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Popover,
  Snackbar,
  Alert,
  IconButton,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  PhotoLibrary,
  Save,
  Check,
  Link as LinkIcon,
  Preview,
  FolderOpen,
  Close,
  Public,
  Lock,
  Language,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { G_START, G_MID, G_END, GRAD } from './DesignStudioUtils';

export const EditorDialogs = ({
  // Image Upload Dialog
  imageUploadDialogOpen,
  setImageUploadDialogOpen,
  imageUploadTarget,
  setImageUploadTarget,
  setActiveTab,
  uploadedImages = [],
  selectedComponent,
  handleAddImageToComponent,

  // Publish Modal
  publishModalOpen,
  setPublishModalOpen,
  websiteName,
  setWebsiteName,
  isSavingToDB,
  saveWebsiteToDatabase,
  generatedSlug,
  slugError,
  isCheckingSlug,
  publishUrl,
  setPublishDialogOpen,

  // Save Modal
  saveModalOpen,
  setSaveModalOpen,
  projectNameInput,
  setProjectNameInput,
  handleSaveConfirm,
  saving = false,
  components = [],

  // Add Page Dialog
  addPageDialogOpen,
  setAddPageDialogOpen,
  newPageName,
  setNewPageName,
  handleAddPage,

  // Color Picker
  colorPickerAnchor,
  handleColorPickerClose,
  selectedColorTarget,
  selectedTextElement,
  globalStyles,
  handleColorChange,

  // Publish Dialog
  publishDialogOpen,
  // setPublishDialogOpen
  copyToClipboard,

  // Projects Gallery
  showProjectsGallery,
  setShowProjectsGallery,
  ProjectsGallery,
  loadProjectFromSavedPages,
  saveProjectToLocalStorage,
  navigate,
  handleDeleteProject,
  generateId,
  showSnackbar,
  token,
  loadProjectsFromDatabase,
  handleDownloadWebsite,

  // Snackbar
  snackbar,
  setSnackbar,

  // Additional props for publish modal
  websiteDescription = '',
  setWebsiteDescription = () => {},
  isPublished = false,
  publishError = null,
}) => {
  // Helper function to check if URL is valid
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <>
      {/* Image Upload Dialog */}
      <Dialog
        open={imageUploadDialogOpen}
        onClose={() => {
          setImageUploadDialogOpen(false);
          setImageUploadTarget(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            borderRadius: '16px',
            border: `1px solid ${alpha(G_START, 0.3)}`,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Select an Image</DialogTitle>
        <DialogContent>
          {uploadedImages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PhotoLibrary sx={{ fontSize: 64, color: alpha('#FFFFFF', 0.3), mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                No images uploaded yet
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5), mb: 2 }}>
                Please upload images in the Images tab first
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setImageUploadDialogOpen(false);
                  setActiveTab(2);
                }}
                sx={{ background: GRAD }}
              >
                Go to Images Tab
              </Button>
            </Box>
          ) : (
            <ImageList cols={2} gap={8}>
              {uploadedImages.map((image) => (
                <ImageListItem
                  key={image.id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (imageUploadTarget) {
                      handleAddImageToComponent(
                        image,
                        imageUploadTarget.componentId,
                        imageUploadTarget.itemIndex
                      );
                    } else if (selectedComponent) {
                      handleAddImageToComponent(image, selectedComponent.id);
                    }
                    setImageUploadTarget(null);
                    setImageUploadDialogOpen(false);
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      borderRadius: '8px',
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                    }}
                  />
                  <ImageListItemBar
                    title={image.name.substring(0, 20)}
                    sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setImageUploadDialogOpen(false);
              setImageUploadTarget(null);
            }}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={{ p: 2, bgcolor: '#1A1F2E' }}>
          <ChromePicker
            color={
              selectedColorTarget?.target === 'global'
                ? globalStyles?.[selectedColorTarget.property] || '#FFFFFF'
                : selectedColorTarget?.target === 'text'
                  ? selectedTextElement?.styles?.[selectedColorTarget.property] || '#FFFFFF'
                  : selectedColorTarget?.target === 'component'
                    ? selectedComponent?.styles?.[selectedColorTarget.property] || '#FFFFFF'
                    : '#FFFFFF'
            }
            onChange={handleColorChange}
          />
        </Box>
      </Popover>

      {/* Publish Modal */}
      <Dialog
        open={publishModalOpen}
        onClose={() => !isSavingToDB && setPublishModalOpen(false)}
        maxWidth="sm"
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
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: GRAD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Public sx={{ fontSize: 18, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              Publish Website
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.45) }}>
              Make your website live on the web
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {publishError && (
            <Alert
              severity="error"
              sx={{ mb: 2, bgcolor: 'rgba(244,67,54,0.1)', color: '#f44336' }}
            >
              {publishError}
            </Alert>
          )}

          {isPublished && (
            <Alert
              severity="success"
              sx={{ mb: 2, bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50' }}
              icon={<CheckCircle />}
            >
              Website published successfully!
            </Alert>
          )}

          <TextField
            fullWidth
            label="Website Name"
            placeholder="e.g. My Awesome Site"
            value={websiteName}
            onChange={(e) => setWebsiteName(e.target.value)}
            disabled={isSavingToDB}
            sx={{
              mt: 1,
              mb: 2,
              '& .MuiInputBase-input': { color: 'white' },
              '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.6) },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(G_START, 0.6),
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: G_START,
              },
            }}
          />

          <TextField
            fullWidth
            label="Website Description"
            placeholder="Brief description of your website"
            value={websiteDescription}
            onChange={(e) => setWebsiteDescription(e.target.value)}
            disabled={isSavingToDB}
            multiline
            rows={2}
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: 'white' },
              '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.6) },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(G_START, 0.6),
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: G_START,
              },
            }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: alpha('#FFFFFF', 0.6), display: 'block', mb: 1 }}
            >
              Website URL Preview
            </Typography>
            <Paper
              sx={{
                p: 1.5,
                bgcolor: alpha(G_START, 0.05),
                border: `1px solid ${alpha(G_START, 0.2)}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Language sx={{ color: G_START, fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: G_START, wordBreak: 'break-all' }}>
                {websiteName
                  ? `https://${websiteName.toLowerCase().replace(/\s+/g, '-')}.web.app`
                  : 'Enter a website name'}
              </Typography>
            </Paper>
          </Box>

          {isSavingToDB && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress
                sx={{
                  bgcolor: alpha('#FFFFFF', 0.1),
                  '& .MuiLinearProgress-bar': { background: GRAD },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: alpha('#FFFFFF', 0.5), mt: 0.5, display: 'block' }}
              >
                Publishing your website...
              </Typography>
            </Box>
          )}

          {isPublished && publishUrl && isValidUrl(publishUrl) && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: alpha('#FFFFFF', 0.6), display: 'block', mb: 1 }}
              >
                Your website is live at:
              </Typography>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: alpha(G_END, 0.05),
                  border: `1px solid ${alpha(G_END, 0.3)}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: G_END, wordBreak: 'break-all', flex: 1 }}>
                  {publishUrl}
                </Typography>
                <Button
                  size="small"
                  onClick={() => window.open(publishUrl, '_blank')}
                  sx={{
                    color: G_END,
                    borderColor: alpha(G_END, 0.3),
                    '&:hover': { borderColor: G_END },
                  }}
                  variant="outlined"
                >
                  Visit
                </Button>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setPublishModalOpen(false)}
            disabled={isSavingToDB}
            sx={{ color: alpha('#FFFFFF', 0.6), '&:hover': { color: 'white' } }}
          >
            Cancel
          </Button>
          {!isPublished ? (
            <Button
              onClick={saveWebsiteToDatabase}
              variant="contained"
              disabled={isSavingToDB || !websiteName.trim() || components.length === 0}
              startIcon={
                isSavingToDB ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Public />
              }
              sx={{
                background: GRAD,
                borderRadius: '10px',
                fontWeight: 700,
                px: 3,
                '&:hover': { opacity: 0.9 },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              {isSavingToDB ? 'Publishing...' : 'Publish Now'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setPublishModalOpen(false);
                setPublishDialogOpen(true);
              }}
              variant="contained"
              startIcon={<CheckCircle />}
              sx={{
                background: GRAD,
                borderRadius: '10px',
                fontWeight: 700,
                px: 3,
                '&:hover': { opacity: 0.9 },
              }}
            >
              View Published Site
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Save Modal */}
      <Dialog
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        maxWidth="sm"
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
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: GRAD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Save sx={{ fontSize: 18, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              Save Project
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.45) }}>
              Enter a name and save your design
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Project Name"
            placeholder="e.g. My Portfolio Site"
            value={projectNameInput}
            onChange={(e) => setProjectNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveConfirm()}
            sx={{
              mt: 1,
              '& .MuiInputBase-input': { color: 'white' },
              '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.6) },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(G_START, 0.6),
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: G_START,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setSaveModalOpen(false)}
            sx={{ color: alpha('#FFFFFF', 0.6), '&:hover': { color: 'white' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveConfirm}
            variant="contained"
            disabled={saving || !projectNameInput.trim() || components.length === 0}
            startIcon={saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Save />}
            sx={{
              background: GRAD,
              borderRadius: '10px',
              fontWeight: 700,
              px: 3,
              '&:hover': { opacity: 0.9 },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {saving ? 'Saving…' : 'Save Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Publish Success Dialog */}
      <Dialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1A1F2E',
            backgroundImage: 'none',
            borderRadius: '16px',
            color: 'white',
            zIndex: 1300,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Check sx={{ color: G_END }} />
          Website Published Successfully!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
            Your website has been published and saved to your Documents folder.
          </Typography>
          <Paper
            sx={{ p: 2, bgcolor: alpha(G_START, 0.1), borderRadius: '8px', wordBreak: 'break-all' }}
          >
            <Typography variant="body2" sx={{ color: G_START }}>
              {publishUrl}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)} sx={{ color: 'white' }}>
            Close
          </Button>
          <Button
            onClick={copyToClipboard}
            variant="contained"
            startIcon={<LinkIcon />}
            sx={{ background: GRAD }}
          >
            Copy Path
          </Button>
          <Button
            onClick={() => window.open(publishUrl, '_blank')}
            variant="outlined"
            startIcon={<Preview />}
            sx={{ color: 'white', borderColor: alpha('#FFFFFF', 0.2) }}
          >
            View Live
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Page Dialog */}
      <Dialog
        open={addPageDialogOpen}
        onClose={() => setAddPageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            backgroundImage: 'none',
            borderRadius: '16px',
            border: `1px solid ${alpha(G_START, 0.25)}`,
            color: 'white',
          },
        }}
      >
        <Box sx={{ height: 3, background: GRAD }} />
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>Add New Page</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Page Name"
            placeholder="e.g. About, Services, Contact"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
            sx={{
              mt: 1,
              '& .MuiInputBase-input': { color: 'white' },
              '& .MuiInputLabel-root': { color: alpha('#FFFFFF', 0.6) },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#FFFFFF', 0.2) },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: G_START,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddPageDialogOpen(false)} sx={{ color: alpha('#FFFFFF', 0.6) }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPage}
            variant="contained"
            sx={{ background: GRAD, borderRadius: '10px', fontWeight: 700, px: 3 }}
          >
            Add Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Projects Gallery Dialog */}
      <Dialog
        open={showProjectsGallery}
        onClose={() => setShowProjectsGallery(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            backgroundImage: 'none',
            borderRadius: '20px',
            border: `1px solid ${alpha(G_START, 0.2)}`,
            color: 'white',
            overflow: 'hidden',
            maxHeight: '92vh',
          },
        }}
      >
        <Box sx={{ height: 4, background: GRAD }} />
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 2,
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              <FolderOpen sx={{ fontSize: 18, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              My Projects
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowProjectsGallery(false)}
            sx={{ color: alpha('#FFFFFF', 0.6) }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {ProjectsGallery && (
            <ProjectsGallery
              showHeader={false}
              onOpenProject={(project) => {
                loadProjectFromSavedPages(project);
                setShowProjectsGallery(false);
              }}
              onPreviewProject={(project) => {
                const projectId = project.id;
                const projectData = { ...project, id: projectId };
                saveProjectToLocalStorage(projectData);
                navigate(`/preview?id=${projectId}&t=${Date.now()}`);
              }}
              onPublishProject={(project) => {
                loadProjectFromSavedPages(project);
                setShowProjectsGallery(false);
                setTimeout(() => setPublishModalOpen(true), 300);
              }}
              onDeleteProject={(projectId) => {
                handleDeleteProject(projectId);
              }}
              onDuplicateProject={(project) => {
                const dupeId = generateId();
                const dupeData = {
                  ...project,
                  id: dupeId,
                  name: `${project.name} (Copy)`,
                  status: 'draft',
                  lastEdited: new Date().toISOString(),
                };
                saveProjectToLocalStorage(dupeData);
                showSnackbar(`"${dupeData.name}" duplicated`, 'success');
                if (token) loadProjectsFromDatabase();
              }}
              onDownloadProject={(project) => {
                handleDownloadWebsite(project);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar?.open || false}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.severity || 'info'}
          sx={{ width: '100%', bgcolor: '#1A1F2E', color: 'white' }}
        >
          {snackbar?.message || ''}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditorDialogs;



