import axios from 'axios';
import {
  API_BASE,
  getDocumentsPath,
  convertToFilePath,
  getLinkType,
  slugify,
  generateId,
} from './DesignStudioUtils';

export const downloadWebsiteAsZip = async (project) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const docsPath = getDocumentsPath();

    const generatePageHTML = (pageData, pageName) => {
      const { components = [], textElements = [], imageElements = [], styles = {} } = pageData;

      const globalStyles = {
        // fallback default colors
        primaryColor: styles.primaryColor || '#0EA5E9',
        secondaryColor: styles.secondaryColor || '#34D399',
        accentColor: styles.accentColor || '#F97316',
        backgroundColor: styles.backgroundColor || '#080C14',
        textColor: styles.textColor || '#FFFFFF',
        headingColor: styles.headingColor || '#FFFFFF',
        fontFamily: styles.fontFamily || 'Inter, sans-serif',
        borderRadius: styles.borderRadius || '12px',
        buttonStyle: styles.buttonStyle || 'rounded',
      };

      const isExternalLink = (url) => {
        if (!url || typeof url !== 'string') return false;
        return /^(https?:\/\/|\/\/|www\.)/i.test(url);
      };

      // Utility to apply alpha to hex or rgb colors
      const alpha = (color, a = 1) => {
        if (!color || a === undefined) return color;
        try {
          const c = color.trim();
          if (c.startsWith('#')) {
            const hex = c.slice(1);
            const full = hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
            const r = parseInt(full.slice(0, 2), 16);
            const g = parseInt(full.slice(2, 4), 16);
            const b = parseInt(full.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${a})`;
          }
          const rgbMatch = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
          if (rgbMatch) {
            return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${a})`;
          }
          // if already rgba or other, return as-is
          return c;
        } catch (e) {
          return color;
        }
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
        const styles = `color: ${globalStyles.textColor}; ${Object.entries(component.styles || {})
          .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
          .join(' ')}`;

        switch (component.type) {
          case 'hero':
            return `<div style="text-align: center; padding: 80px 20px; ${styles}">
              ${component.content.image ? `<img src="${component.content.image}" alt="Hero" style="max-width: 100%; height: auto; margin-bottom: 32px; border-radius: ${globalStyles.borderRadius};" />` : ''}
              <h1 style="font-size: 3rem; margin-bottom: 16px; color: ${globalStyles.headingColor};">${component.content.title}</h1>
              <p style="font-size: 1.5rem; margin-bottom: 32px; color: ${alpha(globalStyles.textColor, 0.8)}; max-width: 800px; margin-left: auto; margin-right: auto;">${component.content.subtitle}</p>
              ${
                component.content.buttonText
                  ? renderLinkHTML(
                      component.content.buttonLink || '#',
                      component.content.buttonLinkType || 'internal',
                      `<button style="background: ${globalStyles.primaryColor}; border: none; padding: 12px 32px; border-radius: ${globalStyles.buttonStyle === 'rounded' ? '999px' : globalStyles.borderRadius}; color: white; font-size: 1.1rem; cursor: pointer;">${component.content.buttonText}</button>`
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
                    `<span style="color: ${globalStyles.textColor}; text-decoration: none; padding: 8px 16px; border-radius: ${globalStyles.borderRadius}; transition: all 0.3s ease;">${item.label}</span>`
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
                      `<span style="font-size: ${component.content.size === 'small' ? '1.2rem' : component.content.size === 'large' ? '2rem' : '1.5rem'}; font-weight: 700; background: linear-gradient(135deg, ${globalStyles.primaryColor}, ${globalStyles.secondaryColor}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${component.content.text || 'Your Logo'}</span>`
                    )
              }
              ${component.content.tagline ? `<span style="color: ${alpha(globalStyles.textColor, 0.6)}; margin-left: 8px;">${component.content.tagline}</span>` : ''}
            </div>`;

          case 'footer': {
            const footerLinks = component.content.links || [];
            const socialLinks = component.content.socialLinks || [];
            return `<div style="padding: 48px 20px; margin-top: 32px; background: ${alpha(globalStyles.primaryColor, 0.05)}; border-top: 1px solid ${alpha(globalStyles.primaryColor, 0.1)}; ${styles}">
              <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px;">
                <div>
                  ${
                    component.content.logo
                      ? renderLinkHTML(
                          component.content.logoLink || '/',
                          'internal',
                          `<img src="${component.content.logo}" alt="Footer Logo" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 8px;" />`
                        )
                      : `<h3 style="color: ${globalStyles.headingColor}; margin-bottom: 16px;">${component.content.companyName || 'Your Company'}</h3>`
                  }
                  ${component.content.tagline ? `<p style="color: ${alpha(globalStyles.textColor, 0.7)}; margin-bottom: 16px;">${component.content.tagline}</p>` : ''}
                </div>
                <div>
                  <h4 style="color: ${globalStyles.headingColor}; margin-bottom: 12px;">Quick Links</h4>
                  ${footerLinks
                    .map((link) =>
                      renderLinkHTML(
                        link.url || '#',
                        link.linkType || 'internal',
                        `<div style="color: ${alpha(globalStyles.textColor, 0.7)}; text-decoration: none; margin-bottom: 8px;">${link.label}</div>`
                      )
                    )
                    .join('')}
                </div>
                <div>
                  <h4 style="color: ${globalStyles.headingColor}; margin-bottom: 12px;">Connect</h4>
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
              <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid ${alpha(globalStyles.textColor, 0.1)}; color: ${alpha(globalStyles.textColor, 0.5)};">
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
                  `<span style="color: ${globalStyles.textColor}; text-decoration: none; padding: 8px 16px; border-radius: ${globalStyles.borderRadius}; font-size: ${element.styles?.fontSize || '16px'}; font-weight: ${element.styles?.fontWeight || 'normal'};">${label}</span>`
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
  <title>${pageName || project?.name || 'My Website'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background-color: ${globalStyles.backgroundColor}; 
      color: ${globalStyles.textColor}; 
      font-family: ${globalStyles.fontFamily}; 
      line-height: 1.6; 
    }
    h1, h2, h3, h4, h5, h6 { color: ${globalStyles.headingColor}; }
    a { color: ${globalStyles.primaryColor}; text-decoration: none; }
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
    ${textElements.map((el) => renderTextElementHTML(el)).join('')}
    ${imageElements
      .map(
        (el) =>
          `<img src="${el.imageUrl}" alt="${el.alt || ''}" style="width: ${el.width}; height: ${el.height}; object-fit: ${el.objectFit}; border-radius: ${el.borderRadius}; ${Object.entries(
            el.styles || {}
          )
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
            .join(' ')}" />`
      )
      .join('')}
    ${components.map((c) => renderComponentHTML(c)).join('')}
  </div>
</body>
</html>`;
    };

    const pages = project.pages || [
      {
        id: 'page-1',
        name: 'Home',
        components: project.components || [],
        textElements: project.textElements || [],
        imageElements: project.imageElements || [],
      },
    ];

    const globalStyles = {
      primaryColor: project.styles?.primaryColor || '#0EA5E9',
      secondaryColor: project.styles?.secondaryColor || '#34D399',
      accentColor: project.styles?.accentColor || '#F97316',
      backgroundColor: project.styles?.backgroundColor || '#080C14',
      textColor: project.styles?.textColor || '#FFFFFF',
      headingColor: project.styles?.headingColor || '#FFFFFF',
      fontFamily: project.styles?.fontFamily || 'Inter, sans-serif',
      borderRadius: project.styles?.borderRadius || '12px',
      buttonStyle: project.styles?.buttonStyle || 'rounded',
    };

    const siteFolder = project.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'website';
    const folder = zip.folder(siteFolder);

    pages.forEach((page, index) => {
      const pageName = page.name || `Page ${index + 1}`;
      const fileName = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'index';
      const htmlContent = generatePageHTML(page, pageName);
      folder.file(`${fileName}.html`, htmlContent);
    });

    if (pages.length > 0) {
      const firstPage = pages[0];
      const htmlContent = generatePageHTML(firstPage, firstPage.name || 'Home');
      folder.file('index.html', htmlContent);
    }

    const metadata = {
      name: project.name,
      id: project.id,
      slug: project.slug,
      status: project.status,
      lastEdited: project.lastEdited || new Date().toISOString(),
      exportDate: new Date().toISOString(),
      totalComponents: project.components?.length || 0,
      totalTextElements: project.textElements?.length || 0,
      totalImageElements: project.imageElements?.length || 0,
      totalPages: pages.length,
      documentsPath: docsPath,
    };
    folder.file('project.json', JSON.stringify(metadata, null, 2));

    const componentData = {
      components: project.components || [],
      textElements: project.textElements || [],
      imageElements: project.imageElements || [],
      uploadedImages: project.uploadedImages || [],
      styles: project.styles || {},
      pages: pages,
    };
    folder.file('components.json', JSON.stringify(componentData, null, 2));

    const cssContent = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  background-color: ${globalStyles.backgroundColor}; 
  color: ${globalStyles.textColor}; 
  font-family: ${globalStyles.fontFamily}; 
  line-height: 1.6; 
}
h1, h2, h3, h4, h5, h6 { color: ${globalStyles.headingColor}; }
a { color: ${globalStyles.primaryColor}; text-decoration: none; }
a:hover { text-decoration: underline; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.published-site { min-height: 100vh; }
a.external-link::after {
  content: " ↗";
  font-size: 0.8em;
}
`;
    folder.file('styles.css', cssContent);

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name || 'website'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading website:', error);
    throw error;
  }
};

// ── SAVE TO DATABASE WITH UPDATE ──────────────────────────────────
export const saveProjectToDatabase = async (projectData, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    let response;
    try {
      const getResponse = await axios.get(`${API_BASE}/api/projects/${projectData.id}`, {
        headers,
      });
      if (getResponse.data) {
        response = await axios.put(
          `${API_BASE}/api/projects/${projectData.id}`,
          {
            name: projectData.name,
            customizations: {
              components: projectData.components || [],
              textElements: projectData.textElements || [],
              imageElements: projectData.imageElements || [],
              uploadedImages: projectData.uploadedImages || [],
              styles: projectData.styles || {},
              pages: projectData.pages || [],
            },
            html_code: projectData.html_code || '',
            slug: projectData.slug || null,
            status: projectData.status || 'draft',
            lastEdited: new Date().toISOString(),
          },
          { headers }
        );
        console.log('✅ Project updated successfully:', projectData.id);
      }
    } catch (error) {
      response = await axios.post(
        `${API_BASE}/api/projects`,
        {
          name: projectData.name,
          designs: [],
          customizations: {
            components: projectData.components || [],
            textElements: projectData.textElements || [],
            imageElements: projectData.imageElements || [],
            uploadedImages: projectData.uploadedImages || [],
            styles: projectData.styles || {},
            pages: projectData.pages || [],
          },
          slug: projectData.slug || null,
          status: projectData.status || 'draft',
        },
        { headers }
      );
      console.log('✅ Project created successfully:', response.data.id);
    }
    return response.data;
  } catch (error) {
    console.error('❌ Error saving to database:', error);
    throw error;
  }
};

// ── SAVE TO LOCAL STORAGE ──────────────────────────────────────────
export const saveProjectToLocalStorage = (projectData) => {
  localStorage.setItem(`project_${projectData.id}`, JSON.stringify(projectData));
  localStorage.setItem('latest_project_id', projectData.id);
  localStorage.setItem('latest_project_data', JSON.stringify(projectData));

  if (projectData.components) {
    localStorage.setItem(
      `project_${projectData.id}_components`,
      JSON.stringify(projectData.components)
    );
  }
  if (projectData.textElements) {
    localStorage.setItem(
      `project_${projectData.id}_text`,
      JSON.stringify(projectData.textElements)
    );
  }
  if (projectData.imageElements) {
    localStorage.setItem(
      `project_${projectData.id}_images`,
      JSON.stringify(projectData.imageElements)
    );
  }
  if (projectData.uploadedImages) {
    localStorage.setItem(
      `project_${projectData.id}_uploads`,
      JSON.stringify(projectData.uploadedImages)
    );
  }
  if (projectData.styles) {
    localStorage.setItem(`project_${projectData.id}_styles`, JSON.stringify(projectData.styles));
  }
  if (projectData.pages) {
    localStorage.setItem(`project_${projectData.id}_pages`, JSON.stringify(projectData.pages));
  }

  console.log('💾 Project saved to localStorage:', projectData.id);
};

// ── LOAD FROM LOCAL STORAGE ────────────────────────────────────────
export const loadProjectFromLocalStorage = (projectId) => {
  try {
    const data = localStorage.getItem(`project_${projectId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading project from localStorage:', error);
    return null;
  }
};

// ── EXPORT ALL FUNCTIONS ────────────────────────────────────────────
