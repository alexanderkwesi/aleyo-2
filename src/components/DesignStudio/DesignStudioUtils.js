import React from 'react';
import {
  GridOn,
  PhotoLibrary,
  ContactMail,
  ShoppingCart,
  Image as ImageIcon,
  ViewQuilt,
  Menu as MenuIcon,
  TextFields,
} from '@mui/icons-material';

// ── CONSTANTS ──────────────────────────────────────────────────────────
export const G_START = '#4F6EF7';
export const G_MID = '#2DBCB6';
export const G_END = '#3ED67C';
export const GRAD = `linear-gradient(135deg, ${G_START} 0%, ${G_MID} 50%, ${G_END} 100%)`;
export const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// ── GENERATE UNIQUE ID ──────────────────────────────────────────────
export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

// ── PREDEFINED STYLES ─────────────────────────────────────────────────
export const textStyles = [
  {
    id: 'h1',
    name: 'Heading 1',
    tag: 'h1',
    defaultText: 'Your Main Heading Here',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  {
    id: 'h2',
    name: 'Heading 2',
    tag: 'h2',
    defaultText: 'Section Heading',
    fontSize: '36px',
    fontWeight: 'bold',
  },
  {
    id: 'h3',
    name: 'Heading 3',
    tag: 'h3',
    defaultText: 'Subheading',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  {
    id: 'h4',
    name: 'Heading 4',
    tag: 'h4',
    defaultText: 'Small Heading',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  {
    id: 'h5',
    name: 'Heading 5',
    tag: 'h5',
    defaultText: 'Mini Heading',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  {
    id: 'h6',
    name: 'Heading 6',
    tag: 'h6',
    defaultText: 'Tiny Heading',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  {
    id: 'p',
    name: 'Paragraph',
    tag: 'p',
    defaultText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    fontSize: '16px',
    fontWeight: 'normal',
  },
  {
    id: 'span',
    name: 'Inline Text',
    tag: 'span',
    defaultText: 'Inline text here',
    fontSize: '16px',
    fontWeight: 'normal',
  },
  {
    id: 'div',
    name: 'Div Block',
    tag: 'div',
    defaultText: 'Div content block',
    fontSize: '16px',
    fontWeight: 'normal',
  },
  {
    id: 'a',
    name: 'Link',
    tag: 'a',
    defaultText: 'Click here',
    fontSize: '16px',
    fontWeight: 'normal',
    href: '#',
    isLink: true,
  },
  {
    id: 'nav',
    name: 'Navigation Menu',
    tag: 'nav',
    defaultText: 'Home | About | Services | Contact',
    fontSize: '16px',
    fontWeight: '500',
    isNav: true,
  },
];

export const imageStyles = [
  {
    id: 'full-width',
    name: 'Full Width',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    borderRadius: '0px',
  },
  {
    id: 'hero',
    name: 'Hero Size',
    width: '100%',
    height: '500px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  {
    id: 'square',
    name: 'Square',
    width: '300px',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  {
    id: 'portrait',
    name: 'Portrait',
    width: '300px',
    height: '400px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  {
    id: 'landscape',
    name: 'Landscape',
    width: '400px',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail',
    width: '150px',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  {
    id: 'circle',
    name: 'Circle',
    width: '200px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  {
    id: 'wide',
    name: 'Wide Banner',
    width: '100%',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
];

// ── COLOR THEMES ──────────────────────────────────────────────────────
export const colorThemes = [
  {
    id: 'dark-magic',
    name: 'Dark Magic',
    description: 'Mysterious dark theme with purple accents',
    styles: {
      backgroundColor: '#0D0B1A',
      primaryColor: '#9D4EDD',
      secondaryColor: '#7B2CBF',
      accentColor: '#C77DFF',
      textColor: '#E0E0E0',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    description: 'Calming blue ocean tones',
    styles: {
      backgroundColor: '#0A192F',
      primaryColor: '#2C7DA0',
      secondaryColor: '#61A5C2',
      accentColor: '#89C2D9',
      textColor: '#E0F2FE',
      headingColor: '#F0F9FF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'forest-mist',
    name: 'Forest Mist',
    description: 'Natural green earthy tones',
    styles: {
      backgroundColor: '#0F1A14',
      primaryColor: '#2D6A4F',
      secondaryColor: '#40916C',
      accentColor: '#52B788',
      textColor: '#D8F3DC',
      headingColor: '#F0FFF4',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    description: 'Warm vibrant sunset colors',
    styles: {
      backgroundColor: '#1A0F0A',
      primaryColor: '#E85D04',
      secondaryColor: '#F48C06',
      accentColor: '#FAA307',
      textColor: '#FFF3E0',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'midnight-rose',
    name: 'Midnight Rose',
    description: 'Elegant dark pink theme',
    styles: {
      backgroundColor: '#1A0B14',
      primaryColor: '#D81B60',
      secondaryColor: '#E91E63',
      accentColor: '#F06292',
      textColor: '#FCE4EC',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights inspired theme',
    styles: {
      backgroundColor: '#0A1A1A',
      primaryColor: '#00B4D8',
      secondaryColor: '#48CAE4',
      accentColor: '#90E0EF',
      textColor: '#CAF0F8',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Luxurious gold and black theme',
    styles: {
      backgroundColor: '#0A0A0A',
      primaryColor: '#FFD700',
      secondaryColor: '#FFC107',
      accentColor: '#FFB300',
      textColor: '#FFF8E1',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Soft lavender and purple tones',
    styles: {
      backgroundColor: '#140F1A',
      primaryColor: '#B980EA',
      secondaryColor: '#9B5DE5',
      accentColor: '#C77DFF',
      textColor: '#F3E8FF',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'crimson-night',
    name: 'Crimson Night',
    description: 'Bold red dramatic theme',
    styles: {
      backgroundColor: '#1A0808',
      primaryColor: '#DC143C',
      secondaryColor: '#FF1744',
      accentColor: '#FF5252',
      textColor: '#FFEBEE',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Futuristic neon cyberpunk theme',
    styles: {
      backgroundColor: '#0A0A0F',
      primaryColor: '#00FF9D',
      secondaryColor: '#00E5FF',
      accentColor: '#FF00FF',
      textColor: '#E0E0E0',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'coffee-break',
    name: 'Coffee Break',
    description: 'Warm coffee and cream tones',
    styles: {
      backgroundColor: '#1C130F',
      primaryColor: '#A67C52',
      secondaryColor: '#C4A484',
      accentColor: '#D2B48C',
      textColor: '#F5E6D3',
      headingColor: '#FFF8F0',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'sakura-blossom',
    name: 'Sakura Blossom',
    description: 'Soft pink Japanese cherry blossom theme',
    styles: {
      backgroundColor: '#1A0F18',
      primaryColor: '#FFB7C5',
      secondaryColor: '#FF9EB5',
      accentColor: '#FFC0D0',
      textColor: '#FFF0F5',
      headingColor: '#FFFFFF',
      buttonStyle: 'rounded',
    },
  },
];

export const colorPalettes = [
  { name: 'Ocean Breeze', colors: ['#0066CC', '#0099FF', '#33CCFF', '#66FFFF', '#CCFFFF'] },
  { name: 'Sunset Glow', colors: ['#FF6B6B', '#FF8E53', '#FFB347', '#FFD966', '#FFF5CC'] },
  { name: 'Forest Greens', colors: ['#2C5F2D', '#4B8C3C', '#6BA35A', '#8CBA78', '#ADD6A6'] },
  { name: 'Royal Purple', colors: ['#4B0082', '#6A0DAD', '#8A2BE2', '#AA6FF9', '#CA9BFE'] },
  { name: 'Neon Vibes', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF6B6B', '#6BFF6B'] },
  { name: 'Pastel Dreams', colors: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'] },
  { name: 'Earth Tones', colors: ['#8B5A2B', '#A67B45', '#C69C6D', '#E8B88E', '#FFD4AF'] },
  { name: 'Monochrome', colors: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'] },
];

// ── NAVIGATION LINK TYPES ────────────────────────────────────────────
export const linkTypes = [
  { value: 'internal', label: 'Internal Page' },
  { value: 'external', label: 'External URL' },
  { value: 'anchor', label: 'Anchor Link' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'email', label: 'Email Address' },
];

// ── BUTTON STYLES ─────────────────────────────────────────────────────
export const buttonStyles = [
  { id: 'primary', name: 'Primary', variant: 'contained' },
  { id: 'secondary', name: 'Secondary', variant: 'outlined' },
  { id: 'text', name: 'Text Only', variant: 'text' },
  { id: 'gradient', name: 'Gradient', variant: 'contained' },
];

// ── HELPER FUNCTIONS ─────────────────────────────────────────────────
export const getInitialProject = () => {
  const savedProjectId = localStorage.getItem('latest_project_id');
  if (savedProjectId) {
    const savedData = localStorage.getItem(`project_${savedProjectId}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved project:', e);
      }
    }
  }
  return null;
};

export const getDefaultContent = (type) => {
  switch (type) {
    case 'hero':
      return {
        title: 'New Hero Section',
        subtitle: 'Add your compelling message here',
        buttonText: 'Learn More',
        buttonLink: '#',
        buttonLinkType: 'internal',
        image: null,
      };
    case 'features':
      return {
        title: 'Features',
        items: [
          {
            title: 'Feature 1',
            description: 'Description of feature 1',
            image: null,
            link: '#',
            linkType: 'internal',
          },
          {
            title: 'Feature 2',
            description: 'Description of feature 2',
            image: null,
            link: '#',
            linkType: 'internal',
          },
          {
            title: 'Feature 3',
            description: 'Description of feature 3',
            image: null,
            link: '#',
            linkType: 'internal',
          },
        ],
      };
    case 'gallery':
      return {
        title: 'Gallery',
        items: [
          {
            title: 'Project 1',
            description: 'Project description',
            image: null,
            link: '#',
            linkType: 'internal',
          },
          {
            title: 'Project 2',
            description: 'Project description',
            image: null,
            link: '#',
            linkType: 'internal',
          },
          {
            title: 'Project 3',
            description: 'Project description',
            image: null,
            link: '#',
            linkType: 'internal',
          },
        ],
      };
    case 'contact':
      return {
        title: 'Contact Us',
        formFields: ['name', 'email', 'message'],
        address: '123 Business St, City, Country',
        email: 'info@example.com',
        phone: '+1 234 567 890',
      };
    case 'pricing':
      return {
        title: 'Pricing Plans',
        plans: [
          {
            name: 'Basic',
            price: '$29',
            features: ['Feature 1', 'Feature 2'],
            buttonText: 'Choose Plan',
            buttonLink: '#',
            buttonLinkType: 'internal',
          },
          {
            name: 'Pro',
            price: '$79',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            buttonText: 'Choose Plan',
            buttonLink: '#',
            buttonLinkType: 'internal',
          },
          {
            name: 'Enterprise',
            price: '$199',
            features: ['All features', 'Priority support'],
            buttonText: 'Choose Plan',
            buttonLink: '#',
            buttonLinkType: 'internal',
          },
        ],
      };
    case 'logo':
      return {
        text: 'Your Logo',
        image: null,
        link: '/',
        alignment: 'left',
        size: 'medium',
        tagline: '',
      };
    case 'footer':
      return {
        companyName: 'Your Company',
        tagline: 'Building amazing websites',
        logo: null,
        logoLink: '/',
        links: [
          { label: 'Home', url: '/', linkType: 'internal' },
          { label: 'About', url: '/about', linkType: 'internal' },
          { label: 'Services', url: '/services', linkType: 'internal' },
          { label: 'Contact', url: '/contact', linkType: 'internal' },
        ],
        socialLinks: [
          { platform: 'Facebook', url: '#', linkType: 'external' },
          { platform: 'Twitter', url: '#', linkType: 'external' },
          { platform: 'Instagram', url: '#', linkType: 'external' },
          { platform: 'LinkedIn', url: '#', linkType: 'external' },
        ],
        copyright: '© 2024 Your Company. All rights reserved.',
        columns: 4,
        showNewsletter: true,
      };
    case 'nav':
      return {
        items: [
          { label: 'Home', url: '/', linkType: 'internal' },
          { label: 'About', url: '/about', linkType: 'internal' },
          { label: 'Services', url: '/services', linkType: 'internal' },
          { label: 'Contact', url: '/contact', linkType: 'internal' },
        ],
        alignment: 'center',
        style: 'horizontal',
      };
    default:
      return { text: 'New Section' };
  }
};

export const getComponentIcon = (type) => {
  switch (type) {
    case 'hero':
      return <ImageIcon />;
    case 'features':
      return <GridOn />;
    case 'gallery':
      return <PhotoLibrary />;
    case 'contact':
      return <ContactMail />;
    case 'pricing':
      return <ShoppingCart />;
    case 'logo':
      return <ImageIcon />;
    case 'footer':
      return <ViewQuilt />;
    case 'nav':
      return <MenuIcon />;
    default:
      return <TextFields />;
  }
};

export const getComponentName = (type) => {
  const names = {
    hero: 'Hero Section',
    features: 'Features',
    gallery: 'Gallery',
    contact: 'Contact',
    pricing: 'Pricing',
    logo: 'Logo',
    footer: 'Footer',
    nav: 'Navigation',
  };
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ── DETECT EXTERNAL WEBSITE ─────────────────────────────────────────
export const isExternalLink = (url) => {
  if (!url) return false;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const currentOrigin = window.location.origin;
      return urlObj.origin !== currentOrigin;
    } catch (e) {
      return true;
    }
  }
  return false;
};

export const getLinkType = (url) => {
  if (!url) return 'internal';
  if (url.startsWith('mailto:')) return 'email';
  if (url.startsWith('tel:')) return 'phone';
  if (url.startsWith('#')) return 'anchor';
  if (isExternalLink(url)) return 'external';
  return 'internal';
};

// ── GET DOCUMENTS PATH ──────────────────────────────────────────────
export const getDocumentsPath = () => {
  const platform = window.navigator.platform;
  let documentsPath = '';

  if (platform.includes('Win')) {
    documentsPath = 'C:/Users/' + (process.env.USERNAME || 'User') + '/Documents';
  } else if (platform.includes('Mac')) {
    documentsPath = '/Users/' + (process.env.USER || 'user') + '/Documents';
  } else {
    documentsPath = '/home/' + (process.env.USER || 'user') + '/Documents';
  }
  return documentsPath;
};

// ── CONVERT TO FILE PATH ────────────────────────────────────────────
export const convertToFilePath = (url, linkType) => {
  const docsPath = getDocumentsPath();

  if (linkType === 'external' || linkType === 'email' || linkType === 'phone') {
    return url;
  }

  if (linkType === 'anchor') {
    return url;
  }

  if (url.startsWith('/')) {
    return docsPath + url.replace(/\//g, '/');
  }
  if (url.startsWith('./') || url.startsWith('../')) {
    return docsPath + '/' + url;
  }
  if (!url.includes('://') && !url.includes('mailto:') && !url.includes('tel:')) {
    return docsPath + '/' + url.replace(/\//g, '/');
  }
  return url;
};

// ── HOSTING PLATFORM UTILITIES ─────────────────────────────────────────

// Status configurations for hosting platform
export const HOSTING_STATUS_CONFIG = {
  published: {
    label: 'Live',
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
  },
  publishing: {
    label: 'Publishing',
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
  },
  draft: {
    label: 'Draft',
    color: '#78909C',
    bgColor: 'rgba(120, 144, 156, 0.15)',
  },
  error: {
    label: 'Error',
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.15)',
  },
  offline: {
    label: 'Offline',
    color: '#9E9E9E',
    bgColor: 'rgba(158, 158, 158, 0.15)',
  },
};

// Target environment configurations
export const HOSTING_TARGET_CONFIGS = {
  development: { label: 'Dev', color: '#4FC3F7', icon: '🔧' },
  staging: { label: 'Staging', color: '#FFB74D', icon: '🧪' },
  production: { label: 'Production', color: '#4CAF50', icon: '🚀' },
  custom: { label: 'Custom', color: '#AB47BC', icon: '⚙️' },
};

// Generate mock analytics for a website
export const generateMockAnalytics = (websiteId) => ({
  visitors: Math.floor(Math.random() * 5000) + 100,
  pageViews: Math.floor(Math.random() * 15000) + 500,
  avgSessionTime: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 59)}s`,
  bounceRate: `${Math.floor(Math.random() * 40) + 20}%`,
  topCountries: ['United States', 'United Kingdom', 'Germany', 'France', 'Japan'].slice(0, 3),
  last24h: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
});

// Get hosting status config helper
export const getHostingStatusConfig = (status) => {
  return HOSTING_STATUS_CONFIG[status] || HOSTING_STATUS_CONFIG.draft;
};

// Get hosting target config helper
export const getHostingTargetConfig = (target) => {
  return HOSTING_TARGET_CONFIGS[target] || HOSTING_TARGET_CONFIGS.custom;
};

// Format domain URL for display
export const formatDomainUrl = (domain) => {
  if (!domain) return null;
  return domain.startsWith('http') ? domain : `https://${domain}`;
};

// Open website in new tab
export const openWebsite = (domain) => {
  if (!domain) return;
  const url = formatDomainUrl(domain);
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Copy URL to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Filter websites by search and target
export const filterWebsites = (websites, searchQuery, filterTarget) => {
  if (!Array.isArray(websites)) return [];
  return websites.filter((site) => {
    const matchesSearch =
      !searchQuery ||
      site.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTarget = filterTarget === 'all' || site.target === filterTarget;
    return matchesSearch && matchesTarget;
  });
};

// Group websites by status
export const groupWebsitesByStatus = (websites) => {
  if (!Array.isArray(websites)) {
    return { all: [], live: [], draft: [], publishing: [], error: [] };
  }
  return {
    all: websites,
    live: websites.filter((s) => s.status === 'published'),
    draft: websites.filter((s) => s.status === 'draft'),
    publishing: websites.filter((s) => s.status === 'publishing'),
    error: websites.filter((s) => s.status === 'error'),
  };
};

// Calculate hosting stats
export const calculateHostingStats = (websites, analytics = {}) => {
  const groups = groupWebsitesByStatus(websites);
  const totalVisitors = Object.values(analytics).reduce((sum, a) => sum + (a?.visitors || 0), 0);

  return {
    totalSites: websites.length,
    liveSites: groups.live.length,
    draftSites: groups.draft.length,
    publishingSites: groups.publishing.length,
    errorSites: groups.error.length,
    totalVisitors,
    storageUsed: `${(websites.length * 12.5).toFixed(1)} MB`,
  };
};

// Validate website data before publishing
export const validateWebsiteData = (data) => {
  const errors = [];
  if (!data.name?.trim()) errors.push('Website name is required');
  if (!data.domain?.trim()) errors.push('Domain is required');
  if (!data.target) errors.push('Deployment target is required');
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Create website payload for API
export const createWebsitePayload = (data, projectId, isEditing = false) => ({
  id: data.id || generateId(),
  name: data.name?.trim(),
  domain: data.domain?.trim(),
  target: data.target || 'production',
  description: data.description?.trim() || '',
  customDomain: data.customDomain?.trim() || '',
  password: data.password || '',
  isPrivate: !!data.isPrivate,
  projectId: projectId || data.projectId,
  status: data.status || 'draft',
  publishedAt: isEditing ? data.publishedAt : null,
  lastPublish: isEditing ? data.lastPublish : null,
  publishHistory: data.publishHistory || [],
});
