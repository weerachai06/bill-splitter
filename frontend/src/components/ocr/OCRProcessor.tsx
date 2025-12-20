"use client";

import { useCallback, useRef } from "react";
import Tesseract from "tesseract.js";
import type {
  OCRCompleteEvent,
  OCRProgressEvent,
  OCRErrorEvent,
} from "@bill-splitter/shared";

interface OCRProcessorProps {
  onOCRComplete: (result: OCRCompleteEvent) => void;
  onOCRProgress: (event: OCRProgressEvent) => void;
  onOCRError: (error: OCRErrorEvent) => void;
}

interface UseOCRProcessorReturn {
  processImage: (file: File) => Promise<void>;
  isProcessing: boolean;
}

export function useOCRProcessor({
  onOCRComplete,
  onOCRProgress,
  onOCRError,
}: OCRProcessorProps): UseOCRProcessorReturn {
  const processingRef = useRef(false);

  const processImage = useCallback(
    async (file: File) => {
      if (processingRef.current) {
        console.log("OCR Debug: Already processing, skipping new request");
        return;
      }

      try {
        processingRef.current = true;
        console.log("OCR Debug: Starting OCR processing for file:", file.name);

        // Convert file to image data
        const imageData = URL.createObjectURL(file);

        // Progress callback for Tesseract
        const progressCallback = ({
          progress,
          status,
        }: {
          progress: number;
          status: string;
        }) => {
          const progressPercent = Math.round(progress * 100);
          console.log(`OCR Debug: ${status} - ${progressPercent}%`);

          onOCRProgress({
            progress: progressPercent,
            status: status,
          });
        };

        console.log("OCR Debug: Initializing Tesseract worker...");
        onOCRProgress({ progress: 0, status: "Initializing OCR..." });

        // Process with Tesseract
        const result = await Tesseract.recognize(
          imageData,
          "eng", // Language
          {
            logger: progressCallback,
          }
        );

        console.log("OCR Debug: OCR processing completed successfully");
        console.log("OCR Debug: Extracted text:", result.data.text);
        console.log("OCR Debug: Confidence:", result.data.confidence);

        // Clean up object URL
        URL.revokeObjectURL(imageData);

        // Send completion event
        onOCRComplete({
          text: result.data.text,
          confidence: result.data.confidence,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("OCR Debug: OCR processing failed:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        onOCRError({
          message: errorMessage,
          timestamp: new Date(),
        });
      } finally {
        processingRef.current = false;
      }
    },
    [onOCRComplete, onOCRProgress, onOCRError]
  );

  return {
    processImage,
    isProcessing: processingRef.current,
  };
}

// Export a simple wrapper component if needed
export function OCRProcessor({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
