// Google Cloud Vision API wrapper for OCR processing
// This module provides text detection functionality using Google Cloud Vision

interface VisionAPIConfig {
  apiKey?: string;
  endpoint?: string;
}

interface VisionTextAnnotation {
  description?: string;
  boundingPoly?: {
    vertices: Array<{ x?: number; y?: number }>;
  };
}

interface VisionAPIResponse {
  responses: Array<{
    textAnnotations?: VisionTextAnnotation[];
    fullTextAnnotation?: {
      text?: string;
      pages?: Array<{
        confidence?: number;
        blocks?: Array<{
          boundingBox?: {
            vertices: Array<{ x?: number; y?: number }>;
          };
          paragraphs?: Array<{
            boundingBox?: {
              vertices: Array<{ x?: number; y?: number }>;
            };
            words?: Array<{
              boundingBox?: {
                vertices: Array<{ x?: number; y?: number }>;
              };
              symbols?: Array<{
                text?: string;
                confidence?: number;
              }>;
            }>;
          }>;
        }>;
      }>;
    };
  }>;
}

interface ProcessedOCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

const VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Convert image file to base64 for Vision API
 */
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix to get just the base64 content
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate average confidence from Vision API response
 */
function calculateConfidence(response: VisionAPIResponse): number {
  const firstResponse = response.responses?.[0];
  if (!firstResponse) return 0;

  // Try to get confidence from full text annotation
  const pages = firstResponse.fullTextAnnotation?.pages;
  if (pages && pages.length > 0) {
    const confidences = pages
      .map(page => page.confidence)
      .filter(conf => conf !== undefined && conf !== null);
    
    if (confidences.length > 0) {
      return Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length * 100);
    }
  }

  // Fallback: assume good confidence if text was detected
  const hasText = firstResponse.textAnnotations && firstResponse.textAnnotations.length > 0;
  return hasText ? 85 : 0;
}

/**
 * Extract word-level information from Vision API response
 */
function extractWords(response: VisionAPIResponse): ProcessedOCRResult['words'] {
  const words: ProcessedOCRResult['words'] = [];
  const firstResponse = response.responses?.[0];
  
  if (!firstResponse?.fullTextAnnotation?.pages) {
    return words;
  }

  for (const page of firstResponse.fullTextAnnotation.pages) {
    if (!page.blocks) continue;
    
    for (const block of page.blocks) {
      if (!block.paragraphs) continue;
      
      for (const paragraph of block.paragraphs) {
        if (!paragraph.words) continue;
        
        for (const word of paragraph.words) {
          if (!word.symbols || !word.boundingBox?.vertices) continue;
          
          const text = word.symbols.map(symbol => symbol.text).join('');
          const vertices = word.boundingBox.vertices;
          
          if (vertices.length >= 4 && text.trim()) {
            const x_coords = vertices.map(v => v.x || 0);
            const y_coords = vertices.map(v => v.y || 0);
            
            words.push({
              text: text,
              confidence: 85, // Vision API doesn't provide word-level confidence, use default
              bbox: {
                x0: Math.min(...x_coords),
                y0: Math.min(...y_coords),
                x1: Math.max(...x_coords),
                y1: Math.max(...y_coords),
              }
            });
          }
        }
      }
    }
  }

  return words;
}

/**
 * Process image using Google Cloud Vision API
 */
export async function processImageWithVision(
  file: File,
  config: VisionAPIConfig = {},
  onProgress?: (progress: number, status: string) => void
): Promise<ProcessedOCRResult> {
  
  // Get API key from environment or config
  const apiKey = config.apiKey || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Cloud Vision API key not found. Please set NEXT_PUBLIC_GOOGLE_VISION_API_KEY environment variable.');
  }

  onProgress?.(10, 'Converting image...');
  
  // Convert image to base64
  const imageBase64 = await imageToBase64(file);
  
  onProgress?.(30, 'Sending to Google Vision API...');
  
  // Prepare Vision API request
  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1
          },
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }
        ],
        imageContext: {
          languageHints: ['en', 'th'] // Support English and Thai
        }
      }
    ]
  };

  onProgress?.(50, 'Processing with Vision API...');

  // Call Vision API
  const response = await fetch(`${VISION_API_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Vision API error: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const apiResponse: VisionAPIResponse = await response.json();
  
  onProgress?.(80, 'Processing results...');

  // Check for API errors
  if (!apiResponse.responses || apiResponse.responses.length === 0) {
    throw new Error('No response from Vision API');
  }

  const firstResponse = apiResponse.responses[0];
  if (firstResponse && 'error' in firstResponse) {
    const errorResponse = firstResponse as { error: { message: string } };
    throw new Error(`Vision API error: ${errorResponse.error.message}`);
  }

  // Extract text from response
  let extractedText = '';
  
  // Try to get text from fullTextAnnotation first (preserves formatting)
  if (firstResponse?.fullTextAnnotation?.text) {
    extractedText = firstResponse.fullTextAnnotation.text;
  } else if (firstResponse?.textAnnotations && firstResponse.textAnnotations.length > 0) {
    // Fallback to first text annotation (usually contains all text)
    extractedText = firstResponse.textAnnotations[0].description || '';
  }

  if (!extractedText.trim()) {
    throw new Error('No text detected in the image');
  }

  // Calculate confidence and extract words
  const confidence = calculateConfidence(apiResponse);
  const words = extractWords(apiResponse);

  onProgress?.(100, 'OCR completed');

  return {
    text: extractedText,
    confidence,
    words
  };
}

/**
 * Check if Google Vision API is available and configured
 */
export function isVisionAPIAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY);
}