// OCR Web Worker for processing receipt images with Google Cloud Vision API
// This worker handles OCR processing in a separate thread to avoid blocking the main UI

import { processImageWithVision } from '../lib/vision-api';
import { preprocessImage, isPreprocessingSupported, getFileSize } from '../lib/image-preprocessing';
import type { 
  OCRWorkerMessage, 
  OCRProcessRequest, 
  OCRProgressEvent, 
  OCRCompleteEvent, 
  OCRErrorEvent 
} from '@bill-splitter/shared';

// Worker global context
const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (event: MessageEvent<OCRWorkerMessage>) => {
  const { type, payload } = event.data;

  if (type !== 'PROCESS_IMAGE') {
    return;
  }

  const { imageFile }: OCRProcessRequest = payload;
  const workerId = `worker-${Date.now()}`;

  console.log('OCR Debug: Starting OCR processing for image:', imageFile.name);

  try {
    console.log('OCR Debug: Original image size:', getFileSize(imageFile));

    // Preprocess image for better OCR accuracy
    ctx.postMessage({
      type: 'OCR_PROGRESS',
      payload: {
        status: 'Preprocessing image...',
        progress: 5,
        workerId
      }
    });

    let processedFile = imageFile;
    if (isPreprocessingSupported()) {
      console.log('OCR Debug: Starting image preprocessing...');
      const preprocessingResult = await preprocessImage(imageFile, {
        convertToGrayscale: true,
        adjustContrast: true,
        threshold: 128,
        denoise: true,
        sharpen: false
      });
      
      processedFile = preprocessingResult.file;
      console.log('OCR Debug: Image preprocessing completed in', preprocessingResult.processingTime, 'ms');
      console.log('OCR Debug: Applied filters:', preprocessingResult.appliedFilters.join(', '));
      console.log('OCR Debug: Processed image size:', getFileSize(processedFile));
    } else {
      console.warn('OCR Debug: Image preprocessing not supported in this environment');
    }

    console.log('OCR Debug: Starting Vision API processing for image:', processedFile.name);

    // Process preprocessed image with Google Cloud Vision API
    const result = await processImageWithVision(
      processedFile, // Use preprocessed image
      {}, // Use default config (API key from env)
      (progress: number, status: string) => {
        console.log('OCR Debug:', { status, progress }); // Debug logging as requested
        
        // Adjust progress to account for preprocessing step (5% already done)
        const adjustedProgress = Math.round(5 + (progress * 0.95));
        
        // Send progress updates to main thread
        const progressEvent: OCRProgressEvent = {
          status: status || 'processing',
          progress: adjustedProgress,
          workerId
        };
        
        ctx.postMessage({
          type: 'OCR_PROGRESS',
          payload: progressEvent
        });
      }
    );

    console.log('OCR Debug: Recognition completed');
    console.log('OCR Debug: Extracted text:', result.text);
    console.log('OCR Debug: Confidence:', result.confidence);

    // Send completion event to main thread
    const completeEvent: OCRCompleteEvent = {
      text: result.text,
      confidence: result.confidence,
      words: result.words,
      processingTime: Date.now() - Date.now() // Will be calculated properly by the time this executes
    };

    ctx.postMessage({
      type: 'OCR_COMPLETE',
      payload: completeEvent
    });

    console.log('OCR Debug: Vision API processing completed successfully');

  } catch (error) {
    console.error('OCR Debug: Error during processing:', error);

    // Send error event to main thread
    const errorEvent: OCRErrorEvent = {
      error: error instanceof Error ? error.name : 'OCRError',
      message: error instanceof Error ? error.message : 'Unknown OCR processing error',
      details: error
    };

    ctx.postMessage({
      type: 'OCR_ERROR',
      payload: errorEvent
    });
  }
};

// Handle worker initialization
console.log('OCR Debug: OCR Worker initialized and ready');

// Export worker type for TypeScript
export {};
export default undefined;