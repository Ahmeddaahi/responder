/**
 * SEO Utility for dynamic meta tag management
 * Updates meta tags, title, and canonical URLs for different routes
 */

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE = "https://resbonder.online/favicon.webp";
const BASE_URL = "https://resbonder.online";

/**
 * Updates the document title
 */
export const updateTitle = (title: string): void => {
  document.title = title;
};

/**
 * Updates or creates a meta tag
 */
const updateMetaTag = (name: string, content: string, attribute: string = "name"): void => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

/**
 * Updates or creates a link tag
 */
const updateLinkTag = (rel: string, href: string): void => {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
};

/**
 * Updates all SEO-related meta tags and title
 */
export const updateSEO = (config: SEOConfig): void => {
  const {
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    noindex = false,
  } = config;

  // Update title
  updateTitle(title);

  // Update description
  updateMetaTag("description", description);

  // Update keywords if provided
  if (keywords) {
    updateMetaTag("keywords", keywords);
  }

  // Update canonical URL
  const finalCanonicalUrl = canonicalUrl || window.location.href;
  updateLinkTag("canonical", finalCanonicalUrl);

  // Update Open Graph tags
  updateMetaTag("og:title", title, "property");
  updateMetaTag("og:description", description, "property");
  updateMetaTag("og:type", ogType, "property");
  updateMetaTag("og:image", ogImage, "property");
  updateMetaTag("og:url", finalCanonicalUrl, "property");

  // Update Twitter Card tags
  updateMetaTag("twitter:title", title);
  updateMetaTag("twitter:description", description);
  updateMetaTag("twitter:image", ogImage);

  // Handle noindex
  if (noindex) {
    updateMetaTag("robots", "noindex, nofollow");
  } else {
    // Remove noindex if it exists
    const robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (robotsTag && robotsTag.content.includes("noindex")) {
      robotsTag.remove();
    }
  }
};

/**
 * Predefined SEO configurations for common routes
 */
export const SEO_CONFIGS: Record<string, SEOConfig> = {
  "/": {
    title: "Resbonder - Automate Customer Support on WhatsApp",
    description: "Create an AI-powered chat agent that answers customer questions 24/7 on WhatsApp. Upload your business data and automate customer support instantly.",
    keywords: "AI chatbot, WhatsApp bot, customer support automation, AI agent, business chat",
    canonicalUrl: `${BASE_URL}/`,
  },
  "/pricing": {
    title: "Pricing - Resbonder | AI Customer Support Bot Plans",
    description: "Choose the perfect plan for your business. Free, Starter, and Enterprise plans available. Start with 50 free messages per month.",
    keywords: "AI chatbot pricing, WhatsApp bot cost, customer support automation pricing",
    canonicalUrl: `${BASE_URL}/pricing`,
  },
  "/auth": {
    title: "Sign In / Sign Up - Resbonder",
    description: "Create your account or sign in to start automating customer support with AI-powered WhatsApp bots.",
    canonicalUrl: `${BASE_URL}/auth`,
    noindex: true, // Auth pages typically shouldn't be indexed
  },
  "/privacy": {
    title: "Privacy Policy - Resbonder",
    description: "Read Resbonder's privacy policy to understand how we collect, use, and protect your data.",
    canonicalUrl: `${BASE_URL}/privacy`,
  },
  "/demo": {
    title: "Demo - Resbonder | Try Our AI Chatbot",
    description: "Try Resbonder's AI-powered customer support bot. See how it can automate your customer service on WhatsApp.",
    keywords: "AI chatbot demo, WhatsApp bot demo, customer support bot demo",
    canonicalUrl: `${BASE_URL}/demo`,
  },
  "/whatsapp-guide": {
    title: "WhatsApp Business Setup Guide - Resbonder",
    description: "Step-by-step guide to setting up your WhatsApp Business API with Resbonder. Learn how to connect your WhatsApp account and start automating customer support.",
    keywords: "WhatsApp Business setup, WhatsApp API guide, WhatsApp bot setup",
    canonicalUrl: `${BASE_URL}/whatsapp-guide`,
  },
};

/**
 * Applies SEO configuration based on current route
 */
export const applySEOForRoute = (pathname: string): void => {
  const config = SEO_CONFIGS[pathname];

  if (config) {
    updateSEO(config);
  } else {
    // Default SEO for unknown routes
    updateSEO({
      title: "Resbonder - Automate Customer Support on WhatsApp",
      description: "Create an AI-powered chat agent that answers customer questions 24/7 on WhatsApp.",
      canonicalUrl: `${BASE_URL}${pathname}`,
    });
  }
};

