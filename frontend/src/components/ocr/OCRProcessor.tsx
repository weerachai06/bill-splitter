"use client";

import { useCallback, useRef } from "react";
import {
  createWorker,
  PSM,
  OEM,
  LoggerMessage,
  RecognizeResult,
} from "tesseract.js";
import type {
  OCRCompleteEvent,
  OCRProgressEvent,
  OCRErrorEvent,
} from "@bill-splitter/shared";

// Image preprocessing function for better OCR results
async function preprocessImageForOCR(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale with gentler preprocessing for OCR
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale using luminance formula
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Apply gentle contrast enhancement only
        const contrast = 1.2; // Reduced from 2.0
        const brightness = 10; // Reduced from 30

        // Simple contrast adjustment without gamma correction
        let enhanced = (gray - 128) * contrast + 128 + brightness;

        // Gentle threshold - preserve more detail
        enhanced = Math.max(0, Math.min(255, enhanced));

        // Only apply threshold if image is very dark or very bright
        const threshold = enhanced < 50 ? 0 : enhanced > 200 ? 255 : enhanced;

        data[i] = threshold; // red
        data[i + 1] = threshold; // green
        data[i + 2] = threshold; // blue
        // alpha channel remains unchanged
      }

      // Put the processed image data back
      ctx.putImageData(imageData, 0, 0);

      // Return processed image as data URL
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      console.log("OCR Debug: Image preprocessing failed, using original");
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

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

        // Convert file to image data
        const imageData = URL.createObjectURL(file);

        // Preprocess image for better OCR results
        onOCRProgress({
          progress: 5,
          status: "Preprocessing image...",
          workerId: "",
        });

        const preprocessedImageData = await preprocessImageForOCR(imageData);

        console.log("OCR Debug: Initializing Tesseract worker...");
        onOCRProgress({
          progress: 0,
          status: "Initializing Thai/English OCR...",
          workerId: "",
        });

        // Create worker with Thai and English language support
        const worker = await createWorker(["tha", "eng"], 1, {
          logger: (m: LoggerMessage) => {
            if (m.status) {
              console.log(
                `OCR Debug: ${m.status}`,
                m.progress ? `${Math.round(m.progress * 100)}%` : ""
              );

              // Handle initialization progress
              if (
                m.status === "loading tesseract core" ||
                m.status === "initializing tesseract" ||
                m.status === "loading language traineddata"
              ) {
                onOCRProgress({
                  progress: Math.round((m.progress || 0) * 15), // Use first 15% for initialization
                  status: m.status,
                  workerId: "",
                });
              }

              // Handle recognition progress
              if (m.status === "recognizing text") {
                const baseProgress = 15; // After initialization
                const recognitionProgress = Math.round((m.progress || 0) * 70); // Use 70% for recognition
                onOCRProgress({
                  progress: baseProgress + recognitionProgress,
                  status: m.status,
                  workerId: "",
                });
              }
            }
          },
        });

        // Optimized OCR configuration for receipt text
        console.log("OCR Debug: Configuring OCR for receipt recognition");

        // Set optimal parameters for receipt OCR
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
          // Add character whitelist for receipts (numbers, letters, common symbols)
          tessedit_char_whitelist:
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,฿$()-:/ ก-๙",
          // Improve recognition of small text
          textord_min_linesize: "2.5",
        });

        let bestResult: RecognizeResult | null = null;
        let attempts = 0;
        const maxAttempts = 2;

        try {
          // Try with original image first
          console.log("OCR Debug: Attempting OCR with original image");

          try {
            bestResult = await worker.recognize(
              imageData, // Use original image first
              {},
              {
                text: true,
                blocks: true,
                hocr: false,
                tsv: false,
              }
            );
            attempts++;

            console.log(
              `OCR Debug: Original image - Confidence: ${bestResult.data.confidence}%`
            );
            console.log(
              `OCR Debug: Original image - Text length: ${
                bestResult.data.text.trim().length
              }`
            );

            // If confidence is very low, try with preprocessed image
            if (bestResult.data.confidence < 60) {
              console.log(
                "OCR Debug: Low confidence, trying with preprocessed image"
              );

              const preprocessedResult = await worker.recognize(
                preprocessedImageData,
                {},
                {
                  text: true,
                  blocks: true,
                  hocr: false,
                  tsv: false,
                }
              );
              attempts++;

              console.log(
                `OCR Debug: Preprocessed image - Confidence: ${preprocessedResult.data.confidence}%`
              );

              // Use preprocessed result if it's significantly better
              if (
                preprocessedResult.data.confidence >
                  bestResult.data.confidence + 10 ||
                (preprocessedResult.data.text.trim().length >
                  bestResult.data.text.trim().length &&
                  preprocessedResult.data.confidence >=
                    bestResult.data.confidence - 5)
              ) {
                bestResult = preprocessedResult;
                console.log("OCR Debug: Using preprocessed image result");
              }
            }
          } catch (error) {
            console.log("OCR Debug: OCR recognition failed:", error);
            // Try with a different PSM mode as fallback
            if (attempts < maxAttempts) {
              console.log("OCR Debug: Trying AUTO PSM mode as fallback");
              await worker.setParameters({
                tessedit_pageseg_mode: PSM.AUTO,
              });

              try {
                bestResult = await worker.recognize(
                  preprocessedImageData,
                  {},
                  {
                    text: true,
                    blocks: true,
                    hocr: false,
                    tsv: false,
                  }
                );
                attempts++;
                console.log(
                  `OCR Debug: Fallback AUTO mode - Confidence: ${bestResult.data.confidence}%`
                );
              } catch (fallbackError) {
                console.log("OCR Debug: Fallback also failed:", fallbackError);
              }
            }
          }
        } finally {
          // Always terminate the worker to free memory
          await worker.terminate();
          console.log("OCR Debug: Worker terminated");
        }

        const result = bestResult;

        if (!result) {
          throw new Error(
            "Unable to extract readable text from the image. Please try a clearer image with better lighting and less blur."
          );
        }

        // Even if confidence is low or text is short, proceed if we have any text
        const extractedText = result.data.text || "";
        if (extractedText.trim().length === 0) {
          throw new Error(
            "No text was detected in the image. Please ensure the image contains readable text."
          );
        }

        console.log("OCR Debug: Best OCR result selected");
        console.log("OCR Debug: Extracted text:", result.data.text);
        console.log("OCR Debug: Final confidence:", result.data.confidence);
        console.log("OCR Debug: Language used: Thai + English");
        console.log("OCR Debug: Text length:", result.data.text.length);

        // Post-process text for better line item detection
        const cleanedText = postProcessThaiText(result.data.text);
        console.log("OCR Debug: Cleaned text:", cleanedText);

        // Clean up object URLs
        URL.revokeObjectURL(imageData);
        if (preprocessedImageData !== imageData) {
          // If preprocessed image is a data URL, no need to revoke
          console.log(
            "OCR Debug: Image was preprocessed for better recognition"
          );
        }

        // Send completion event with cleaned text
        const words =
          result.data.blocks?.flatMap(
            (block) =>
              block.paragraphs?.flatMap(
                (paragraph) =>
                  paragraph.lines?.flatMap(
                    (line) =>
                      line.words?.map(
                        (word: {
                          text?: string;
                          confidence?: number;
                          bbox?: {
                            x0?: number;
                            y0?: number;
                            x1?: number;
                            y1?: number;
                          };
                        }) => ({
                          text: word.text || "",
                          confidence: word.confidence || 0,
                          bbox: {
                            x0: word.bbox?.x0 || 0,
                            y0: word.bbox?.y0 || 0,
                            x1: word.bbox?.x1 || 0,
                            y1: word.bbox?.y1 || 0,
                          },
                        })
                      ) || []
                  ) || []
              ) || []
          ) || [];

        onOCRComplete({
          text: cleanedText,
          confidence: result.data.confidence,
          words: words,
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
