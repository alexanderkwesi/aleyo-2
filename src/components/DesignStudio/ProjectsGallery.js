import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { G_START, G_END, GRAD } from './DesignStudioUtils';

export const ProjectsGallery = ({
  onOpenProject,
  onPreviewProject,
  onPublishProject,
  onDownloadProject,
}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = () => {
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
      projectList.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
      setProjects(projectList);
      setLoading(false);
    };
    loadProjects();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: G_START }} />
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          No Projects Found
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Create your first project in the Design Studio
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {projects.map((project) => (
        <Grid item xs={12} sm={6} md={4} key={project.id}>
          <Card
            sx={{
              bgcolor: alpha('#FFFFFF', 0.05),
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: alpha('#4F6EF7', 0.1), transform: 'translateY(-4px)' },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {project.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {project.components?.length || 0} components • {project.textElements?.length || 0}{' '}
                text elements
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={project.status || 'draft'}
                  sx={{
                    bgcolor:
                      project.status === 'published'
                        ? alpha('#4CAF50', 0.2)
                        : alpha('#FFA726', 0.2),
                    color: project.status === 'published' ? '#4CAF50' : '#FFA726',
                  }}
                />
                {project.slug && (
                  <Chip
                    size="small"
                    label={`/${project.slug}`}
                    sx={{ ml: 1, bgcolor: alpha(G_START, 0.2), color: G_START }}
                  />
                )}
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained"
                onClick={() => onOpenProject && onOpenProject(project)}
                sx={{ background: GRAD, '&:hover': { opacity: 0.9 } }}
              >
                Open
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onPreviewProject && onPreviewProject(project)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Preview
              </Button>
              {onPublishProject && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onPublishProject(project)}
                  sx={{ color: G_END, borderColor: G_END }}
                >
                  Publish
                </Button>
              )}
              {onDownloadProject && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onDownloadProject(project)}
                  sx={{ color: G_START, borderColor: G_START }}
                >
                  <Download sx={{ fontSize: 16, mr: 0.5 }} /> ZIP
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
export default ProjectsGallery;
