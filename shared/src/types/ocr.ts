// OCR-specific types for web worker communication

export interface OCRWorkerMessage {
  type: 'PROCESS_IMAGE' | 'OCR_PROGRESS' | 'OCR_COMPLETE' | 'OCR_ERROR';
  payload: any;
}

export interface OCRProcessRequest {
  imageFile: File;
  options: {
    lang: string;
    debug: boolean;
  };
}

export interface OCRProgressEvent {
  status: string;
  progress: number; // 0-100
  workerId: string;
}

export interface OCRCompleteEvent {
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
  processingTime: number; // milliseconds
}

export interface OCRErrorEvent {
  error: string;
  message: string;
  details?: any;
}