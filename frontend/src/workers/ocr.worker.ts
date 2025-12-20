// OCR Web Worker for processing receipt images with Tesseract.js
// This worker handles OCR processing in a separate thread to avoid blocking the main UI

import { createWorker } from 'tesseract.js';
import type { 
  OCRWorkerMessage, 
  OCRProcessRequest, 
  OCRProgressEvent, 
  OCRCompleteEvent, 
  OCRErrorEvent 
} from '@bill-splitter/shared';

// Worker global context
const ctx: Worker = self as any;

ctx.onmessage = async (event: MessageEvent<OCRWorkerMessage>) => {
  const { type, payload } = event.data;

  if (type !== 'PROCESS_IMAGE') {
    return;
  }

  const { imageFile, options }: OCRProcessRequest = payload;
  const workerId = `worker-${Date.now()}`;

  console.log('OCR Debug: Starting OCR processing for image:', imageFile.name);

  try {
    // Create Tesseract worker with debug logging
    const worker = await createWorker({
      logger: (m) => {
        console.log('OCR Debug:', m); // Debug logging as requested
        
        // Send progress updates to main thread
        const progressEvent: OCRProgressEvent = {
          status: m.status || 'processing',
          progress: (m.progress || 0) * 100,
          workerId
        };
        
        ctx.postMessage({
          type: 'OCR_PROGRESS',
          payload: progressEvent
        });
      }
    });

    console.log('OCR Debug: Worker created, loading language');

    // Initialize worker with specified language
    await worker.loadLanguage(options.lang || 'eng');
    await worker.initialize(options.lang || 'eng');
    
    // Configure for receipt recognition
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$ -()&',
      tessedit_pageseg_mode: '6', // Uniform block of text
    });

    console.log('OCR Debug: Starting text recognition');
    const startTime = performance.now();

    // Perform OCR recognition
    const result = await worker.recognize(imageFile);
    const processingTime = performance.now() - startTime;

    console.log('OCR Debug: Recognition completed in', processingTime, 'ms');
    console.log('OCR Debug: Extracted text:', result.data.text);
    console.log('OCR Debug: Confidence:', result.data.confidence);

    // Send completion event to main thread
    const completeEvent: OCRCompleteEvent = {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        }
      })) || [],
      processingTime
    };

    ctx.postMessage({
      type: 'OCR_COMPLETE',
      payload: completeEvent
    });

    // Clean up worker
    await worker.terminate();
    console.log('OCR Debug: Worker terminated successfully');

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
export default null as any;