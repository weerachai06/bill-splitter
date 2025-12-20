// Image preprocessing utilities for OCR enhancement
// This module provides image enhancement functions to improve OCR accuracy

export interface PreprocessingOptions {
  convertToGrayscale?: boolean;
  adjustContrast?: boolean;
  threshold?: number;
  denoise?: boolean;
  sharpen?: boolean;
}

export interface PreprocessingResult {
  file: File;
  processingTime: number;
  appliedFilters: string[];
}

/**
 * Convert image to grayscale and apply contrast enhancement
 */
export async function preprocessImage(
  file: File, 
  options: PreprocessingOptions = {}
): Promise<PreprocessingResult> {
  const startTime = Date.now();
  const appliedFilters: string[] = [];
  
  const {
    convertToGrayscale = true,
    adjustContrast = true,
    threshold = 128,
    denoise = true,
    sharpen = false
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Cannot get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply grayscale conversion
        if (convertToGrayscale) {
          applyGrayscale(data);
          appliedFilters.push('grayscale');
        }

        // Apply denoising
        if (denoise) {
          applyDenoise(imageData, canvas.width, canvas.height);
          appliedFilters.push('denoise');
        }

        // Apply contrast enhancement
        if (adjustContrast) {
          applyContrastEnhancement(data, threshold);
          appliedFilters.push('contrast');
        }

        // Apply sharpening
        if (sharpen) {
          applySharpen(imageData, canvas.width, canvas.height);
          appliedFilters.push('sharpen');
        }

        // Put processed data back
        ctx.putImageData(imageData, 0, 0);

        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { 
              type: file.type,
              lastModified: file.lastModified
            });
            
            const processingTime = Date.now() - startTime;
            resolve({ 
              file: processedFile, 
              processingTime,
              appliedFilters
            });
          } else {
            reject(new Error('Failed to create processed image blob'));
          }
        }, file.type, 0.95); // High quality

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert image to grayscale using luminance formula
 */
function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      0.299 * data[i] +     // Red
      0.587 * data[i + 1] + // Green
      0.114 * data[i + 2]   // Blue
    );
    
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green  
    data[i + 2] = gray; // Blue
    // Alpha channel (i + 3) remains unchanged
  }
}

/**
 * Apply contrast enhancement with adaptive thresholding
 */
function applyContrastEnhancement(data: Uint8ClampedArray, threshold: number): void {
  // Calculate histogram for adaptive thresholding
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  // Find optimal threshold using Otsu's method (simplified)
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let optimalThreshold = threshold;

  const total = data.length / 4;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      optimalThreshold = t;
    }
  }

  // Apply enhanced contrast with the optimal threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i];
    
    // Apply adaptive contrast enhancement
    let enhanced;
    if (gray > optimalThreshold) {
      // Brighten bright pixels
      enhanced = Math.min(255, gray + (255 - gray) * 0.3);
    } else {
      // Darken dark pixels
      enhanced = Math.max(0, gray - gray * 0.3);
    }
    
    data[i] = enhanced;     // Red
    data[i + 1] = enhanced; // Green
    data[i + 2] = enhanced; // Blue
  }
}

/**
 * Apply simple denoising using median filter
 */
function applyDenoise(imageData: ImageData, width: number, height: number): void {
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Get 3x3 neighborhood values for red channel (grayscale)
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          neighbors.push(original[nIdx]);
        }
      }
      
      // Apply median filter
      neighbors.sort((a, b) => a - b);
      const median = neighbors[4]; // Middle value
      
      data[idx] = median;     // Red
      data[idx + 1] = median; // Green
      data[idx + 2] = median; // Blue
    }
  }
}

/**
 * Apply sharpening filter to enhance edges
 */
function applySharpen(imageData: ImageData, width: number, height: number): void {
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  
  // Sharpening kernel
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let sum = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nIdx = ((y + ky) * width + (x + kx)) * 4;
          sum += original[nIdx] * kernel[ky + 1][kx + 1];
        }
      }
      
      const sharpened = Math.max(0, Math.min(255, sum));
      
      data[idx] = sharpened;     // Red
      data[idx + 1] = sharpened; // Green
      data[idx + 2] = sharpened; // Blue
    }
  }
}

/**
 * Get file size in a human-readable format
 */
export function getFileSize(file: File): string {
  const bytes = file.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if image preprocessing is supported by the browser
 */
export function isPreprocessingSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!(ctx && canvas.toBlob);
  } catch {
    return false;
  }
}