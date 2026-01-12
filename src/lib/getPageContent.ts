export interface PageContent {
  [key: string]: any;
}

export async function getPageContent(page: string, type?: string, slug?: string): Promise<PageContent> {
  try {
    // Build query parameters
    const params = new URLSearchParams({ page });
    if (type) params.append('type', type);
    if (slug) params.append('slug', slug);
    
    // Use API route instead of direct database access
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/components/page?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page content: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch page content');
    }
    
    const content: PageContent = {};
    
    // Filter components based on type and slug if provided
    let filteredComponents = data.components;
    if (type) {
      filteredComponents = filteredComponents.filter((comp: any) => comp.type === type);
    }
    if (slug) {
      filteredComponents = filteredComponents.filter((comp: any) => comp.slug === slug);
    }
    
    filteredComponents.forEach((component: any) => {
      if (component.slug) {
        content[component.slug] = component.content;
      } else {
        // Fallback to type-based key
        const key = `${component.type}-${component.order}`;
        content[key] = component.content;
      }
    });
    
    return content;
  } catch (error) {
    console.error('Error fetching page content:', error);
    return {};
  }
}

export async function getAuthContent(language: 'en' | 'ta' = 'en') {
  try {
    const loginContent = await getPageContent('login', 'text', 'login-form-content');
    const signupContent = await getPageContent('sign', 'text', 'signup-form-content');
    const authMessages = await getPageContent('auth', 'text', 'auth-messages');
    
    // Parse JSON content and return language-specific text
    const parseContent = (content: any, lang: 'en' | 'ta') => {
      if (content && content.content && content.content[lang]) {
        try {
          return JSON.parse(content.content[lang]);
        } catch (e) {
          console.error('Error parsing content:', e);
          return {};
        }
      }
      return {};
    };
    
    return {
      login: parseContent(loginContent['login-form-content'], language),
      signup: parseContent(signupContent['signup-form-content'], language),
      messages: parseContent(authMessages['auth-messages'], language)
    };
  } catch (error) {
    console.error('Error fetching auth content:', error);
    return {
      login: {},
      signup: {},
      messages: {}
    };
  }
}

export async function getPageSEO(page: string, language: 'en' | 'ta' = 'en') {
  try {
    const seoContent = await getPageContent(page, 'seo');
    const seoKey = Object.keys(seoContent)[0];
    
    if (seoContent[seoKey] && seoContent[seoKey].title && seoContent[seoKey].description) {
      return {
        title: seoContent[seoKey].title[language] || seoContent[seoKey].title.en,
        description: seoContent[seoKey].description[language] || seoContent[seoKey].description.en,
        keywords: seoContent[seoKey].keywords || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching page SEO:', error);
    return null;
  }
}