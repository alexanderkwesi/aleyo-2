import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  alpha,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Link as MuiLink,
  Paper,
  TextField,
  Divider,
} from '@mui/material';
import {
  YouTube,
  Instagram,
  Facebook,
  LinkedIn,
  Twitter,
  ArrowForward,
  CheckCircle,
  OpenInNew,
  WhatsApp,
  PhotoLibrary,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  API_BASE,
  G_START,
  G_MID,
  G_END,
  GRAD,
  convertToFilePath,
  getLinkType,
  isExternalLink,
} from './DesignStudioUtils';

export const PublishedWebsiteViewer = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const loadPublishedWebsite = async () => {
      if (!slug) {
        setError('No website slug provided');
        setLoading(false);
        return;
      }

      try {
        if (token) {
          try {
            const response = await axios.get(`${API_BASE}/api/websites/${slug}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data) {
              setProject(response.data);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.log('Not found in database, checking localStorage...');
          }
        }

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('project_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '');
              if (data && data.slug === slug && data.status === 'published') {
                setProject(data);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error('Error parsing project:', e);
            }
          }
        }

        setError('Website not found');
        setLoading(false);
      } catch (e) {
        console.error('Error loading published website:', e);
        setError('Failed to load website');
        setLoading(false);
      }
    };

    loadPublishedWebsite();
  }, [slug, token]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#080C14',
        }}
      >
        <CircularProgress sx={{ color: G_START }} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#080C14',
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          404 - Website Not Found
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          The website you're looking for doesn't exist or has been removed.
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 3, background: GRAD }}
          onClick={() => (window.location.href = '/')}
        >
          Go Home
        </Button>
      </Box>
    );
  }

  return <WebsitePreview project={project} />;
};

// ── WEBSITE PREVIEW COMPONENT ───────────────────────────────────────
export const WebsitePreview = ({ project, isDownload = false }) => {
  const {
    components = [],
    textElements = [],
    imageElements = [],
    styles = {},
    pages = [],
  } = project;

  const globalStyles = {
    primaryColor: styles.primaryColor || G_START,
    secondaryColor: styles.secondaryColor || G_MID,
    accentColor: styles.accentColor || G_END,
    backgroundColor: styles.backgroundColor || '#080C14',
    textColor: styles.textColor || '#FFFFFF',
    headingColor: styles.headingColor || '#FFFFFF',
    fontFamily: styles.fontFamily || 'Inter, sans-serif',
    borderRadius: styles.borderRadius || '12px',
    buttonStyle: styles.buttonStyle || 'rounded',
  };

  const renderLink = (url, linkType, children, props = {}) => {
    if (!url || url === '#') {
      return <span {...props}>{children}</span>;
    }

    const detectedType = linkType || getLinkType(url);

    if (detectedType === 'internal' || detectedType === 'anchor') {
      const filePath = convertToFilePath(url, detectedType);
      return (
        <a href={filePath} {...props}>
          {children}
        </a>
      );
    }

    if (detectedType === 'email') {
      return (
        <a href={`mailto:${url.replace(/^mailto:/, '')}`} {...props}>
          {children}
        </a>
      );
    }

    if (detectedType === 'phone') {
      return (
        <a href={`tel:${url.replace(/^tel:/, '')}`} {...props}>
          {children}
        </a>
      );
    }

    if (detectedType === 'external' || isExternalLink(url)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
          {!isDownload && <OpenInNew sx={{ fontSize: '0.7em', ml: 0.5 }} />}
        </a>
      );
    }

    const filePath = convertToFilePath(url, 'internal');
    return (
      <a href={filePath} {...props}>
        {children}
      </a>
    );
  };

  const renderComponent = (component) => {
    const styles = { color: globalStyles.textColor, ...component.styles };

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
                      globalStyles.buttonStyle === 'rounded' ? '999px' : globalStyles.borderRadius,
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
              <Typography variant="body2" sx={{ color: alpha(globalStyles.textColor, 0.6), ml: 1 }}>
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
  };

  const renderTextElement = (element) => {
    if (element.isNav) {
      return (
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
            return renderLink(
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
                  fontSize: element.styles?.fontSize,
                  fontWeight: element.styles?.fontWeight,
                  '&:hover': {
                    color: globalStyles.primaryColor,
                    backgroundColor: alpha(globalStyles.primaryColor, 0.1),
                  },
                  cursor: 'pointer',
                }}
              >
                {label}
              </Typography>
            );
          })}
        </Box>
      );
    }

    if (element.tag === 'a' && element.href) {
      return renderLink(
        element.href,
        element.linkType || 'internal',
        <Typography component="span" sx={{ ...element.styles, cursor: 'pointer' }}>
          {element.content}
        </Typography>
      );
    }

    return React.createElement(element.tag || 'p', { style: element.styles }, element.content);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: globalStyles.backgroundColor,
        color: globalStyles.textColor,
        fontFamily: globalStyles.fontFamily,
      }}
    >
      {textElements.map((element) => (
        <Box key={element.id} sx={{ position: 'relative' }}>
          {renderTextElement(element)}
        </Box>
      ))}

      {imageElements.map((element) => (
        <Box key={element.id} sx={{ position: 'relative', display: 'inline-block' }}>
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
              display: 'block',
            }}
          />
        </Box>
      ))}

      {components.map((component) => (
        <Box key={component.id}>{renderComponent(component)}</Box>
      ))}
    </Box>
  );
};

export default WebsitePreview;
