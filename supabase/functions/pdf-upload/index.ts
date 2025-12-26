import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PDF text extraction - Note: PDF.js is not compatible with Deno Edge Functions
// This function validates the PDF and provides clear guidance to users
async function extractTextFromPDF(pdfBuffer: Uint8Array): Promise<string> {
  // PDF.js requires browser APIs and web workers that are not available in Deno Edge Functions
  // This is a known limitation. We'll validate the PDF and provide clear messaging.
  
  console.log('PDF text extraction requested, buffer size:', pdfBuffer.length);
  console.log('Note: PDF text extraction is not supported in Deno Edge Functions environment.');
  console.log('PDF.js library requires browser APIs that are not available in this runtime.');
  
  // Validate PDF file header
  if (pdfBuffer.length < 4) {
    throw new Error('Invalid PDF file: file is too small');
  }
  
  const header = String.fromCharCode(pdfBuffer[0], pdfBuffer[1], pdfBuffer[2], pdfBuffer[3]);
  if (header !== '%PDF') {
    throw new Error('Invalid PDF file: file does not appear to be a valid PDF document');
  }
  
  // Since PDF extraction isn't available, provide helpful guidance
  throw new Error(
    'PDF text extraction is not available in Deno Edge Functions due to technical limitations. ' +
    'PDF.js requires browser APIs that are not supported in this environment. ' +
    'Your PDF file will be uploaded and saved, but you will need to manually add the content using the "Write Business Information" section.'
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, fileName, fileData } = await req.json();

    if (!userId || !fileName || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, fileName, fileData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Decode base64 file data
    let base64Data = fileData;
    if (fileData.includes(',')) {
      base64Data = fileData.split(',')[1];
    }
    
    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Invalid file data: empty or invalid base64 encoding');
    }

    // Decode base64 file data and validate PDF
    let bytes: Uint8Array;
    
    try {
      const binaryString = atob(base64Data);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Validate PDF file header
      if (bytes.length < 4 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== '%PDF') {
        throw new Error('Invalid PDF file: file does not appear to be a valid PDF document');
      }
    } catch (decodeError: any) {
      console.error('Base64 decoding error:', decodeError);
      throw new Error('Failed to decode file data. Please ensure the file is properly formatted.');
    }

    // At this point, bytes is guaranteed to be defined
    if (!bytes || bytes.length === 0) {
      throw new Error('Failed to process file data');
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-documents')
      .upload(uniqueFileName, bytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload PDF file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('business-documents')
      .getPublicUrl(uniqueFileName);

    const fileUrl = urlData.publicUrl;

    // Extract text from PDF
    // Note: PDF extraction is not available in Deno Edge Functions due to library compatibility
    let extractedText: string;
    let extractionFailed = true; // Always true since extraction isn't supported
    let extractionErrorMsg = 'PDF text extraction is not available in this environment. This is a technical limitation.';
    
    try {
      console.log('Attempting to extract text from PDF...');
      extractedText = await extractTextFromPDF(bytes);
      extractionFailed = false;
      console.log('Text extraction successful, length:', extractedText.length);
    } catch (extractionError: any) {
      extractionErrorMsg = extractionError.message || 'PDF text extraction is not available';
      console.log('PDF extraction not available (expected):', extractionErrorMsg);
      
      // Create a helpful placeholder content that explains the situation
      extractedText = `[PDF File: ${fileName}]\n\n` +
        `[IMPORTANT: Automatic PDF text extraction is currently not available in this environment due to technical limitations.\n\n` +
        `Your PDF file has been successfully uploaded and saved to storage.\n\n` +
        `To add your business information to the AI knowledge base:\n` +
        `1. Open your PDF file\n` +
        `2. Copy the text content from your PDF\n` +
        `3. Go to the "Write Business Information" section below\n` +
        `4. Paste the content there and save\n\n` +
        `Alternatively:\n` +
        `- Use an online OCR service (like Adobe Acrobat, Google Drive, or online OCR tools) to extract text from your PDF\n` +
        `- Then paste the extracted text into the "Write Business Information" section\n\n` +
        `Your uploaded PDF file is safely stored and can be accessed later if needed.]`;
    }

    // Save to knowledge base
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: userId,
        type: 'pdf',
        title: fileName,
        content: extractedText,
        file_url: fileUrl,
      })
      .select()
      .single();

    if (knowledgeError) {
      console.error('Knowledge base error:', knowledgeError);
      throw new Error('Failed to save to knowledge base');
    }

    // Check if extraction was successful or if it's a fallback message
    const extractionSuccess = !extractionFailed && 
                              !extractedText.includes('[Note: Text extraction failed') && 
                              !extractedText.includes('[Unable to extract text') &&
                              extractedText.length > 100;
    
    return new Response(
      JSON.stringify({
        success: true,
        id: knowledgeData.id,
        fileUrl: fileUrl,
        extractedLength: extractedText.length,
        extractionSuccess: extractionSuccess,
        extractionFailed: extractionFailed,
        extractionError: extractionFailed ? extractionErrorMsg : undefined,
        message: extractionSuccess 
          ? 'PDF uploaded and text extracted successfully'
          : `PDF uploaded successfully. Automatic text extraction is not available in this environment. Please use "Write Business Information" to manually add your content.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in pdf-upload function:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Provide user-friendly error messages
    let errorMessage = error.message || 'Internal server error';
    
    // Make error messages more helpful
    if (errorMessage.includes('Invalid PDF')) {
      errorMessage = 'Invalid PDF file. Please ensure you\'re uploading a valid PDF document.';
    } else if (errorMessage.includes('password')) {
      errorMessage = 'PDF is password protected. Please remove the password and try again.';
    } else if (errorMessage.includes('image-based')) {
      errorMessage = 'This PDF appears to be image-based (scanned). Please use OCR software or manually type the content.';
    } else if (errorMessage.includes('timeout')) {
      errorMessage = 'PDF processing took too long. The file might be too large. Please try a smaller file or split it into multiple files.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

