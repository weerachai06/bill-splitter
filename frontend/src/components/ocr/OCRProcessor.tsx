"use client";

import { useCallback, useRef } from "react";
import { processImageWithVision, isVisionAPIAvailable } from "@/lib/vision-api";
import {
  preprocessImage,
  isPreprocessingSupported,
  getFileSize,
} from "@/lib/image-preprocessing";
import type {
  OCRCompleteEvent,
  OCRProgressEvent,
  OCRErrorEvent,
} from "@bill-splitter/shared";

// Post-process Thai text to improve line item detection
function postProcessThaiText(rawText: string): string {
  let cleaned = rawText;

  // Preserve more whitespace for better line detection
  cleaned = cleaned.replace(/[ \t]+/g, " "); // Only normalize spaces/tabs
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Preserve double line breaks

  // Fix common OCR errors for Thai characters (more conservative)
  const thaiFixMap: { [key: string]: string } = {
    // Common OCR misreads for Thai numbers and symbols
    "0N": "๑", // Thai number 1 (more specific pattern)
    ET: "๒", // Thai number 2
    Er: "๓", // Thai number 3
    Ee: "๔", // Thai number 4
    LE: "๕", // Thai number 5
    EE: "๖", // Thai number 6
    airs: "฿", // Thai baht symbol
    "&gt;": ">",
    "&lt;": "<",
    "&amp;": "&",
  };

  // Apply character fixes more carefully
  for (const [wrong, correct] of Object.entries(thaiFixMap)) {
    cleaned = cleaned.replace(new RegExp(wrong, "g"), correct);
  }

  // Fix price patterns more conservatively
  // Match prices with decimal points or commas
  cleaned = cleaned.replace(/(\d+)\s*[,]\s*(\d{2})\b/g, "$1.$2");

  // Fix Thai baht symbol positioning (more specific)
  cleaned = cleaned.replace(/฿\s*(\d)/g, "฿$1");
  cleaned = cleaned.replace(/(\d)\s*฿/g, "$1฿");

  // Convert Thai numbers to Arabic for better parsing
  const thaiToArabic: { [key: string]: string } = {
    "๐": "0",
    "๑": "1",
    "๒": "2",
    "๓": "3",
    "๔": "4",
    "๕": "5",
    "๖": "6",
    "๗": "7",
    "๘": "8",
    "๙": "9",
  };

  cleaned = cleaned.replace(/[๐-๙]/g, (match) => thaiToArabic[match] || match);

  // Clean up line breaks but preserve structure
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 1); // Keep lines with at least 2 characters

  return lines.join("\n");
}

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
        const processingStartTime = Date.now();
        console.log("OCR Debug: Starting OCR processing for file:", file.name);

        // Check if Vision API is available
        if (!isVisionAPIAvailable()) {
          throw new Error(
            "Google Cloud Vision API not configured. Please set NEXT_PUBLIC_GOOGLE_VISION_API_KEY environment variable."
          );
        }

        // Check if image preprocessing is supported
        if (!isPreprocessingSupported()) {
          console.warn(
            "OCR Debug: Image preprocessing not supported in this browser"
          );
        }

        console.log("OCR Debug: Original image size:", getFileSize(file));

        // Preprocess image for better OCR accuracy
        onOCRProgress({
          progress: 5,
          status: "Preprocessing image...",
          workerId: "",
        });

        let processedFile = file;
        if (isPreprocessingSupported()) {
          console.log("OCR Debug: Starting image preprocessing...");
          const preprocessingResult = await preprocessImage(file, {
            convertToGrayscale: true,
            adjustContrast: true,
            threshold: 128,
            denoise: true,
            sharpen: false,
          });

          processedFile = preprocessingResult.file;
          console.log(
            "OCR Debug: Image preprocessing completed in",
            preprocessingResult.processingTime,
            "ms"
          );
          console.log(
            "OCR Debug: Applied filters:",
            preprocessingResult.appliedFilters.join(", ")
          );
          console.log(
            "OCR Debug: Processed image size:",
            getFileSize(processedFile)
          );
        }

        // Initialize OCR with Vision API
        onOCRProgress({
          progress: 10,
          status: "Initializing Google Vision API...",
          workerId: "",
        });

        console.log("OCR Debug: Processing with Google Cloud Vision API...");

        // Process preprocessed image with Google Vision API
        const result = await processImageWithVision(
          processedFile, // Use preprocessed image
          {}, // Use default config (API key from env)
          (progress: number, status: string) => {
            console.log(`OCR Debug: ${status} - ${Math.round(progress)}%`);
            // Adjust progress to account for preprocessing step (10% already done)
            const adjustedProgress = Math.round(10 + progress * 0.9);
            onOCRProgress({
              progress: adjustedProgress,
              status,
              workerId: "",
            });
          }
        );

        console.log("OCR Debug: Vision API OCR completed");
        console.log("OCR Debug: Extracted text:", result.text);
        console.log("OCR Debug: Confidence:", result.confidence);
        console.log("OCR Debug: Words detected:", result.words.length);

        // Post-process text for better line item detection
        const cleanedText = postProcessThaiText(result.text);
        console.log("OCR Debug: Cleaned text:", cleanedText);

        // Send completion event with cleaned text
        onOCRComplete({
          text: cleanedText,
          confidence: result.confidence,
          words: result.words,
          processingTime: Date.now() - processingStartTime,
        });
      } catch (error) {
        console.error("OCR Debug: OCR processing failed:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        onOCRError({
          error: "OCR_PROCESSING_FAILED",
          message: errorMessage,
          details: error,
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
