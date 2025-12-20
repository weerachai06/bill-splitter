// OCR Web Worker for processing receipt images with Tesseract.js
// This worker handles OCR processing in a separate thread to avoid blocking the main UI

import { createWorker, PSM, LoggerMessage } from 'tesseract.js';
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

  const { imageFile, options }: OCRProcessRequest = payload;
  const workerId = `worker-${Date.now()}`;

  console.log('OCR Debug: Starting OCR processing for image:', imageFile.name);

  try {
    // Create Tesseract worker with proper language configuration and debug logging
    const worker = await createWorker([options.lang || 'eng'], 1, {
      logger: (m: LoggerMessage) => {
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

    console.log('OCR Debug: Worker initialized');

    // Configure for receipt recognition
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$ -()&',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Uniform block of text
    });

    console.log('OCR Debug: Starting text recognition');
    const startTime = performance.now();

    // Perform OCR recognition with blocks output for word information
    const result = await worker.recognize(imageFile, {}, {
      text: true,
      blocks: true,
      hocr: false,
      tsv: false,
    });
    const processingTime = performance.now() - startTime;

    console.log('OCR Debug: Recognition completed in', processingTime, 'ms');
    console.log('OCR Debug: Extracted text:', result.data.text);
    console.log('OCR Debug: Confidence:', result.data.confidence);

    // Extract words from blocks data structure
    const words = result.data.blocks?.flatMap(block => 
      block.paragraphs?.flatMap(paragraph =>
        paragraph.lines?.flatMap(line =>
          line.words?.map((word: { text?: string; confidence?: number; bbox?: { x0?: number; y0?: number; x1?: number; y1?: number } }) => ({
            text: word.text || '',
            confidence: word.confidence || 0,
            bbox: {
              x0: word.bbox?.x0 || 0,
              y0: word.bbox?.y0 || 0,
              x1: word.bbox?.x1 || 0,
              y1: word.bbox?.y1 || 0,
            },
          })) || []
        ) || []
      ) || []
    ) || [];

    // Send completion event to main thread
    const completeEvent: OCRCompleteEvent = {
      text: result.data.text,
      confidence: result.data.confidence,
      words: words,
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
export default undefined;