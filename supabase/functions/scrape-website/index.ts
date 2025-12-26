import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scrapeWebsite(url: string): Promise<string> {
  try {
    // Fetch the webpage with comprehensive browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      // Provide more helpful error messages
      if (response.status === 404) {
        throw new Error(`Page not found (404). The URL may be incorrect or the page may not exist. For single-page apps (React/Next.js), try using the base URL instead of specific routes.`);
      } else if (response.status === 403) {
        throw new Error(`Access forbidden (403). The website may be blocking automated requests.`);
      } else if (response.status === 401) {
        throw new Error(`Authentication required (401). This page requires login.`);
      } else {
        throw new Error(`Failed to fetch (${response.status} ${response.statusText})`);
      }
    }

    const html = await response.text();

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract title
    const titleEl = doc.querySelector('title');
    const title = titleEl?.textContent || 'Untitled Page';

    // Extract meta description
    const metaDesc = doc.querySelector('meta[name="description"]');
    const description = metaDesc?.getAttribute('content') || '';

    // Extract JSON-LD structured data (common in e-commerce sites)
    let structuredData = '';
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const extractedData: any[] = [];
    
    jsonLdScripts.forEach((script) => {
      try {
        const jsonData = JSON.parse(script.textContent || '{}');
        extractedData.push(jsonData);
        
        // Extract product information from JSON-LD
        if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'ItemList') {
          structuredData += `\n[PRODUCT DATA]\n`;
          if (jsonData.name) structuredData += `Name: ${jsonData.name}\n`;
          if (jsonData.description) structuredData += `Description: ${jsonData.description}\n`;
          if (jsonData.offers?.price) structuredData += `Price: ${jsonData.offers.price} ${jsonData.offers.priceCurrency || ''}\n`;
          if (jsonData.sku) structuredData += `SKU: ${jsonData.sku}\n`;
          if (jsonData.brand) structuredData += `Brand: ${jsonData.brand.name || jsonData.brand}\n`;
          if (jsonData.image) {
            const images = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image];
            structuredData += `Images: ${images.map((img: any) => typeof img === 'string' ? img : img.url).join(', ')}\n`;
          }
          structuredData += '\n';
        }
        
        // Extract ItemList (product listings)
        if (jsonData['@type'] === 'ItemList' && jsonData.itemListElement) {
          structuredData += `\n[PRODUCT LIST - ${jsonData.itemListElement.length} items]\n`;
          jsonData.itemListElement.forEach((item: any, index: number) => {
            if (item.item) {
              const product = item.item;
              structuredData += `\nProduct ${index + 1}:\n`;
              if (product.name) structuredData += `  Name: ${product.name}\n`;
              if (product.description) structuredData += `  Description: ${product.description}\n`;
              if (product.offers?.price) structuredData += `  Price: ${product.offers.price} ${product.offers.priceCurrency || ''}\n`;
              if (product.image) {
                const img = typeof product.image === 'string' ? product.image : product.image.url;
                structuredData += `  Image: ${img}\n`;
              }
            }
          });
          structuredData += '\n';
        }
      } catch (e) {
        // Skip invalid JSON
        console.log('Failed to parse JSON-LD:', e);
      }
    });

    // Try to extract data from common React/Next.js data structures
    let reactData = '';
    const allScripts = doc.querySelectorAll('script');
    for (const script of allScripts) {
      const scriptContent = script.textContent || '';
      
      // Check for Next.js data
      if (scriptContent.includes('__NEXT_DATA__')) {
        try {
          const match = scriptContent.match(/__NEXT_DATA__\s*=\s*({.+?});/s);
          if (match) {
            const nextData = JSON.parse(match[1]);
            if (nextData.props?.pageProps) {
              reactData += '\n[PAGE DATA]\n';
              reactData += JSON.stringify(nextData.props.pageProps, null, 2);
              reactData += '\n';
            }
          }
        } catch (e) {
          console.log('Failed to parse __NEXT_DATA__:', e);
        }
      }
      
      // Check for window.__INITIAL_STATE__ or similar
      if (scriptContent.includes('window.') && scriptContent.includes('=')) {
        try {
          // Look for common data structures
          const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*({.+?});/s,
            /window\.__PRELOADED_STATE__\s*=\s*({.+?});/s,
            /window\.products\s*=\s*(\[.+?\]);/s,
          ];
          
          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match) {
              const data = JSON.parse(match[1]);
              reactData += '\n[APPLICATION DATA]\n';
              reactData += JSON.stringify(data, null, 2);
              reactData += '\n';
              break;
            }
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
    }

    // Extract Open Graph and meta tags
    let metaInfo = '';
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogDescription = doc.querySelector('meta[property="og:description"]');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    const ogPrice = doc.querySelector('meta[property="product:price:amount"]');
    const ogPriceCurrency = doc.querySelector('meta[property="product:price:currency"]');
    
    if (ogTitle) metaInfo += `Open Graph Title: ${ogTitle.getAttribute('content')}\n`;
    if (ogDescription) metaInfo += `Open Graph Description: ${ogDescription.getAttribute('content')}\n`;
    if (ogImage) metaInfo += `Open Graph Image: ${ogImage.getAttribute('content')}\n`;
    if (ogPrice) {
      metaInfo += `Price: ${ogPrice.getAttribute('content')}`;
      if (ogPriceCurrency) metaInfo += ` ${ogPriceCurrency.getAttribute('content')}`;
      metaInfo += '\n';
    }

    // Extract visible text content (but preserve structure for better readability)
    const body = doc.querySelector('body');
    if (!body) {
      throw new Error('No body element found');
    }

    // Remove script, style, and noscript elements for text extraction
    const scriptsToRemove = body.querySelectorAll('script, style, noscript, iframe, svg');
    scriptsToRemove.forEach((el) => el.remove());

    // Extract text from main content areas first
    let text = '';
    const mainContent = body.querySelector('main, article, [role="main"], .content, #content, #main');
    if (mainContent) {
      text = mainContent.textContent || '';
    } else {
      // Fallback to body text
      text = body.textContent || '';
    }

    // Clean up the text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
      .trim();

    // Detect if this is likely a client-side rendered app
    const hasReactRoot = body.querySelector('#root, #__next, [data-reactroot]');
    const hasMinimalContent = text.length < 500;
    const hasReactData = reactData.length > 0 || extractedData.length > 0;
    
    let warning = '';
    if (hasReactRoot && hasMinimalContent && !hasReactData) {
      warning = '\n\n⚠️ WARNING: This appears to be a client-side rendered application (React/Next.js/Vue). The product information may not be fully captured because it loads via JavaScript after the page loads. Consider:\n1. Using the "Write Business Information" section to manually add product details\n2. Exporting product data as a PDF and uploading it\n3. Adding product information directly in text format\n';
    }

    // Combine all extracted information
    let fullContent = `Title: ${title}\n\n`;
    if (description) {
      fullContent += `Description: ${description}\n\n`;
    }
    if (metaInfo) {
      fullContent += `[META INFORMATION]\n${metaInfo}\n`;
    }
    if (structuredData) {
      fullContent += structuredData;
    }
    if (reactData) {
      fullContent += reactData;
    }
    if (text && text.length > 50) {
      fullContent += `[PAGE CONTENT]\n${text}\n`;
    }
    if (warning) {
      fullContent += warning;
    }

    // If we got structured data but minimal text, that's still useful
    if ((structuredData || reactData) && text.length < 100) {
      // This is okay, we got structured data
      return fullContent;
    }

    // If we have very little content, throw an error
    if (!structuredData && !reactData && text.length < 50) {
      throw new Error('Could not extract meaningful content. This website may be fully client-side rendered. Please use the manual text input option instead.');
    }

    return fullContent;
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, url } = await req.json();

    if (!userId || !url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Scrape the website
    const scrapedContent = await scrapeWebsite(url);

    if (!scrapedContent || scrapedContent.length < 50) {
      throw new Error('Could not extract meaningful content from the website');
    }

    // Save to knowledge base
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: userId,
        type: 'link',
        title: validUrl.hostname,
        content: scrapedContent,
        file_url: url,
      })
      .select()
      .single();

    if (knowledgeError) {
      console.error('Knowledge base error:', knowledgeError);
      throw new Error('Failed to save to knowledge base');
    }

    // Create a preview showing what was extracted
    const preview = scrapedContent.length > 1000 
      ? scrapedContent.substring(0, 1000) + '...' 
      : scrapedContent;
    
    // Detect what type of content was extracted
    const hasStructuredData = scrapedContent.includes('[PRODUCT DATA]') || scrapedContent.includes('PRODUCT LIST');
    const hasReactData = scrapedContent.includes('[PAGE DATA]') || scrapedContent.includes('[APPLICATION DATA]');
    const hasMetaData = scrapedContent.includes('[META INFORMATION]');
    
    return new Response(
      JSON.stringify({
        success: true,
        id: knowledgeData.id,
        extractedLength: scrapedContent.length,
        preview: preview,
        hasStructuredData,
        hasReactData,
        hasMetaData,
        message: hasStructuredData 
          ? 'Website content extracted successfully with product data found!' 
          : 'Website content extracted successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in scrape-website function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

