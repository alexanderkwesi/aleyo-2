// DesignStudio.js - Complete rewrite with PublishManager as Top Popup

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog, DialogContent, alpha } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useDesignStudioState } from '../hooks/useDesignStudioState';
import LeftSidebar from '../components/DesignStudio/LeftSidebar';
import EditorToolbar from '../components/DesignStudio/EditorToolbar';
import EditorCanvas from '../components/DesignStudio/EditorCanvas';
import PropertyEditor from '../components/DesignStudio/PropertyEditor';
import EditorDialogs from '../components/DesignStudio/EditorDialogs';
import PublishManager from '../components/DesignStudio/PublishManager';
import { G_START, generateId } from '../components/DesignStudio/DesignStudioUtils';

// Re-export everything for backward compatibility
export * from '../components/DesignStudio/DesignStudioUtils';
export { default as ProjectsGallery } from '../components/DesignStudio/ProjectsGallery';
export { default as IntegrationsPanel } from '../components/DesignStudio/IntegrationsPanel';
export { PublishedWebsiteViewer, WebsitePreview } from '../components/DesignStudio/WebsitePreview';
export {
  downloadWebsiteAsZip,
  saveProjectToDatabase,
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
} from '../components/DesignStudio/DesignStudioService';

export const DesignStudio = ({
  currentProject: externalProject = null,
  setCurrentProject,
  mergedDesign,
  setMergedDesign,
  wsConnection,
}) => {
  const location = useLocation();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publishManagerOpen, setPublishManagerOpen] = useState(false);

  // State for multi-website publishing
  const [websites, setWebsites] = useState([]);

  // Retrieve all state from the custom hook
  const state = useDesignStudioState({
    externalProject,
    setCurrentProject,
    mergedDesign,
    setMergedDesign,
    wsConnection,
  });

  // Load template from navigation state or localStorage
  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      state.loadDesignFromTemplates(template);
      return;
    }

    const savedTemplate = localStorage.getItem('selectedTemplate');
    if (savedTemplate && !state.initialized) {
      try {
        const template = JSON.parse(savedTemplate);
        state.loadDesignFromTemplates(template);
        localStorage.removeItem('selectedTemplate');
        return;
      } catch (e) {
        console.error('Error loading saved template:', e);
      }
    }

    if (location.state?.project) {
      const projectData = location.state.project;
      if (setCurrentProject && typeof setCurrentProject === 'function') {
        setCurrentProject(projectData);
      }
    }
  }, [location, state]);

  // Publish Manager Handlers
  const handleAddWebsite = (website) => {
    const newWebsite = {
      ...website,
      id: generateId(),
      status: 'draft',
      projectId: state.savedProjectCard?.id || 'default',
      publishHistory: [],
      createdAt: new Date().toISOString(),
    };
    setWebsites([...websites, newWebsite]);
    state.showSnackbar(`Website "${website.name}" created successfully`, 'success');
  };

  const handleUpdateWebsite = (website) => {
    setWebsites(websites.map((w) => (w.id === website.id ? website : w)));
    state.showSnackbar(`Website "${website.name}" updated successfully`, 'success');
  };

  const handleDeleteWebsite = (websiteId) => {
    const website = websites.find((w) => w.id === websiteId);
    setWebsites(websites.filter((w) => w.id !== websiteId));
    state.showSnackbar(`Website "${website?.name || 'Unknown'}" deleted`, 'info');
  };

  const handlePublishWebsite = async (websiteId) => {
    const website = websites.find((w) => w.id === websiteId);
    if (!website) {
      state.showSnackbar('Website not found', 'error');
      return;
    }

    // Check if there are components to publish
    if (state.components.length === 0) {
      state.showSnackbar('No components to publish. Add some content first.', 'warning');
      return;
    }

    try {
      // Update status to publishing
      setWebsites(websites.map((w) => (w.id === websiteId ? { ...w, status: 'publishing' } : w)));

      // Simulate publish process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate a publish URL
      const publishUrl =
        website.customDomain ||
        website.domain ||
        `${website.name.toLowerCase().replace(/\s+/g, '-')}.example.com`;

      // Update to published
      setWebsites(
        websites.map((w) =>
          w.id === websiteId
            ? {
                ...w,
                status: 'published',
                lastPublish: new Date().toISOString(),
                publishUrl: publishUrl,
                publishHistory: [
                  ...(w.publishHistory || []),
                  {
                    date: new Date().toISOString(),
                    status: 'success',
                    message: 'Published successfully',
                  },
                ],
              }
            : w
        )
      );

      state.showSnackbar(`Website "${website.name}" published successfully!`, 'success');
    } catch (error) {
      console.error('Publish error:', error);
      setWebsites(
        websites.map((w) =>
          w.id === websiteId
            ? {
                ...w,
                status: 'error',
                publishHistory: [
                  ...(w.publishHistory || []),
                  {
                    date: new Date().toISOString(),
                    status: 'error',
                    message: error.message || 'Publish failed',
                  },
                ],
              }
            : w
        )
      );
      state.showSnackbar(`Failed to publish "${website.name}": ${error.message}`, 'error');
    }
  };

  const handlePreviewWebsite = (websiteId) => {
    const website = websites.find((w) => w.id === websiteId);
    if (website) {
      const url = website.publishUrl || website.customDomain || website.domain;
      if (url) {
        window.open(`https://${url}`, '_blank');
      } else {
        state.showSnackbar('No URL configured for this website', 'warning');
      }
    }
  };

  // Initial loading spinner
  if (state.loading && state.isInitialLoad) {
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

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: '#080C14',
        position: 'relative',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Publish Manager Popup Dialog */}
      <Dialog
        open={publishManagerOpen}
        onClose={() => setPublishManagerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0A0F1A',
            borderRadius: '16px',
            border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
            maxHeight: '90vh',
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <PublishManager
            websites={websites}
            onAddWebsite={handleAddWebsite}
            onUpdateWebsite={handleUpdateWebsite}
            onDeleteWebsite={handleDeleteWebsite}
            onPublishWebsite={handlePublishWebsite}
            onPreviewWebsite={handlePreviewWebsite}
            currentProjectId={state.savedProjectCard?.id}
            onClose={() => setPublishManagerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Left Sidebar - Popup Drawer */}
      <LeftSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
        handleAddComponent={state.handleAddComponent}
        handleAddTextElement={state.handleAddTextElement}
        fileInputRef={state.fileInputRef}
        handleImageUpload={state.handleImageUpload}
        uploadedImages={state.uploadedImages}
        handleDeleteUploadedImage={state.handleDeleteUploadedImage}
        handleAddMockImage={state.handleAddMockImage}
        imageUploadMode={state.imageUploadMode}
        setImageUploadMode={state.setImageUploadMode}
        mockImageUrl={state.mockImageUrl}
        setMockImageUrl={state.setMockImageUrl}
        handleAddImageToCanvas={state.handleAddImageToCanvas}
        applyColorTheme={state.applyColorTheme}
        applyColorPalette={state.applyColorPalette}
        globalStyles={state.globalStyles}
        handleStyleChange={state.handleStyleChange}
        showSnackbar={state.showSnackbar}
        projectNameInput={state.projectNameInput}
        projectId={state.savedProjectCard?.id}
        onAddIntegration={state.onAddIntegration}
        onRemoveIntegration={state.onRemoveIntegration}
        pages={state.pages}
        activePageId={state.activePageId}
        handleSwitchPage={state.handleSwitchPage}
        handleDeletePage={state.handleDeletePage}
        setAddPageDialogOpen={state.setAddPageDialogOpen}
        dragDropMode={state.dragDropMode}
        setDragDropMode={state.setDragDropMode}
        canvasScale={state.canvasScale}
        setCanvasScale={state.setCanvasScale}
        setSelectedComponent={state.setSelectedComponent}
        setSelectedTextElement={state.setSelectedTextElement}
        setSelectedImageElement={state.setSelectedImageElement}
      />

      {/* Main Workspace Area - Full width */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 0,
          width: '100%',
        }}
      >
        {/* Editor Top Toolbar */}
        <EditorToolbar
          setPublishManagerOpen={setPublishManagerOpen}
          publishManagerOpen={publishManagerOpen}
          currentProject={state.currentProject}
          isEditingMode={state.isEditingMode}
          setIsEditingMode={state.setIsEditingMode}
          showSnackbar={state.showSnackbar}
          handleSave={state.handleSave}
          showCode={state.showCode}
          setShowCode={state.setShowCode}
          handleUndo={state.handleUndo}
          handleRedo={state.handleRedo}
          canvasScale={state.canvasScale}
          setCanvasScale={state.setCanvasScale}
          previewMode={state.previewMode}
          setPreviewMode={state.setPreviewMode}
          handlePreview={state.handlePreview}
          handlePublish={state.handlePublish}
          setShowProjectsGallery={state.setShowProjectsGallery}
          showProjectsGallery={state.showProjectsGallery}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          saveStatus={state.saveStatus}
          autoSaveStatus={state.autoSaveStatus}
          autoSaveEnabled={state.autoSaveEnabled}
          setAutoSaveEnabled={state.setAutoSaveEnabled}
          historyIndex={state.historyIndex}
          history={state.history}
          dragDropMode={state.dragDropMode}
          setDragDropMode={state.setDragDropMode}
          components={state.components}
          downloading={state.downloading}
          handleDownloadWebsite={state.handleDownloadWebsite}
          saving={state.saving}
          publishing={state.publishing}
          pages={state.pages}
          activePageId={state.activePageId}
          handleSwitchPage={state.handleSwitchPage}
          handleDeletePage={state.handleDeletePage}
          setAddPageDialogOpen={state.setAddPageDialogOpen}
          setSelectedComponent={state.setSelectedComponent}
          setSelectedTextElement={state.setSelectedTextElement}
          setSelectedImageElement={state.setSelectedImageElement}
          setPublishManagerOpen={setPublishManagerOpen}
          publishManagerOpen={publishManagerOpen}
        />

        {/* Live Canvas Zone - Full remaining height */}
        <EditorCanvas
          showCode={state.showCode}
          generatedCode={state.generatedCode}
          copyCodeToClipboard={state.copyCodeToClipboard}
          canvasScale={state.canvasScale}
          renderPreview={state.renderPreview}
          globalStyles={state.globalStyles}
          components={state.components}
          setComponents={state.setComponents}
          selectedComponent={state.selectedComponent}
          setSelectedComponent={state.setSelectedComponent}
          selectedTextElement={state.selectedTextElement}
          setSelectedTextElement={state.setSelectedTextElement}
          selectedImageElement={state.selectedImageElement}
          setSelectedImageElement={state.setSelectedImageElement}
          handleUpdateComponentContent={state.handleUpdateComponentContent}
          handleTextStyleChange={state.handleTextStyleChange}
          handleDeleteTextElement={state.handleDeleteTextElement}
        />
      </Box>

      {/* Right Properties Panel Inspector */}
      <PropertyEditor
        selectedComponent={state.selectedComponent}
        selectedTextElement={state.selectedTextElement}
        selectedImageElement={state.selectedImageElement}
        setSelectedComponent={state.setSelectedComponent}
        setSelectedTextElement={state.setSelectedTextElement}
        setSelectedImageElement={state.setSelectedImageElement}
        globalStyles={state.globalStyles}
        handleStyleChange={state.handleStyleChange}
        handleUpdateComponentContent={state.handleUpdateComponentContent}
        handleAddComponentItem={state.handleAddComponentItem}
        handleDeleteComponentItem={state.handleDeleteComponentItem}
        handleDeleteComponent={state.handleDeleteComponent}
        handleTextStyleChange={state.handleTextStyleChange}
        handleDeleteTextElement={state.handleDeleteTextElement}
        handleColorPickerOpen={state.handleColorPickerOpen}
        colorPickerAnchor={state.colorPickerAnchor}
        handleColorPickerClose={state.handleColorPickerClose}
        selectedColorTarget={state.selectedColorTarget}
        handleColorChange={state.handleColorChange}
        handleUpdateImageElement={state.handleUpdateImageElement}
        handleApplyImageStyle={state.handleApplyImageStyle}
        replaceImageInputRef={state.replaceImageInputRef}
        handleReplaceImage={state.handleReplaceImage}
        handleApplyImageFilter={state.handleApplyImageFilter}
        handleRotateImage={state.handleRotateImage}
        handleFlipImage={state.handleFlipImage}
        handleDeleteImageElement={state.handleDeleteImageElement}
        handleResizeImage={state.handleResizeImage}
        setImageUploadTarget={state.setImageUploadTarget}
        setImageUploadDialogOpen={state.setImageUploadDialogOpen}
        components={state.components}
        setComponents={state.setComponents}
        pages={state.pages}
        activePageId={state.activePageId}
        handleSwitchPage={state.handleSwitchPage}
        handleDeletePage={state.handleDeletePage}
        handleAddPage={state.handleAddPage}
        setAddPageDialogOpen={state.setAddPageDialogOpen}
      />

      {/* Overlay Workspace Dialogs */}
      <EditorDialogs
        imageUploadDialogOpen={state.imageUploadDialogOpen}
        setImageUploadDialogOpen={state.setImageUploadDialogOpen}
        setImageUploadTarget={state.setImageUploadTarget}
        handleImageUpload={state.handleImageUpload}
        publishModalOpen={state.publishModalOpen}
        setPublishModalOpen={state.setPublishModalOpen}
        websiteName={state.websiteName}
        setWebsiteName={state.setWebsiteName}
        isSavingToDB={state.isSavingToDB}
        saveWebsiteToDatabase={state.saveWebsiteToDatabase}
        generatedSlug={state.generatedSlug}
        slugError={state.slugError}
        isCheckingSlug={state.isCheckingSlug}
        publishUrl={state.publishUrl}
        setPublishDialogOpen={state.setPublishDialogOpen}
        saveModalOpen={state.saveModalOpen}
        setSaveModalOpen={state.setSaveModalOpen}
        projectNameInput={state.projectNameInput}
        setProjectNameInput={state.setProjectNameInput}
        handleSaveConfirm={state.handleSaveConfirm}
        addPageDialogOpen={state.addPageDialogOpen}
        setAddPageDialogOpen={state.setAddPageDialogOpen}
        newPageName={state.newPageName}
        setNewPageName={state.setNewPageName}
        handleAddPage={state.handleAddPage}
        websiteDescription={state.websiteDescription}
        setWebsiteDescription={state.setWebsiteDescription}
        isPublished={state.isPublished}
        publishError={state.publishError}
        customDomainEnabled={state.customDomainEnabled}
        publishDomain={state.publishDomain}
        setPublishDomain={state.setPublishDomain}
        publishDomainError={state.publishDomainError}
        setPublishDomainError={state.setPublishDomainError}
        colorPickerAnchor={state.colorPickerAnchor}
        handleColorPickerClose={state.handleColorPickerClose}
        selectedColorTarget={state.selectedColorTarget}
        selectedTextElement={state.selectedTextElement}
        globalStyles={state.globalStyles}
        handleColorChange={state.handleColorChange}
        showProjectsGallery={state.showProjectsGallery}
        setShowProjectsGallery={state.setShowProjectsGallery}
        ProjectsGallery={state.ProjectsGallery}
        loadProjectFromSavedPages={state.loadProjectFromSavedPages}
        saveProjectToLocalStorage={state.saveProjectToLocalStorage}
        navigate={state.navigate}
        handleDeleteProject={state.handleDeleteProject}
        generateId={state.generateId}
        showSnackbar={state.showSnackbar}
        token={state.token}
        loadProjectsFromDatabase={state.loadProjectsFromDatabase}
        handleDownloadWebsite={state.handleDownloadWebsite}
        snackbar={state.snackbar}
        setSnackbar={state.setSnackbar}
      />
    </Box>
  );
};

export default DesignStudio;
