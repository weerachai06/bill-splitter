"use client";

import { useCallback, useRef } from "react";
import Tesseract from "tesseract.js";
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

      // Convert to grayscale and apply advanced preprocessing
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Apply gamma correction and contrast enhancement
        const gamma = 0.8;
        const contrast = 2.0;
        const brightness = 30;

        // Gamma correction
        const gammaCorrect = Math.pow(gray / 255, gamma) * 255;

        // Contrast and brightness
        const enhanced = (gammaCorrect - 128) * contrast + 128 + brightness;

        // Adaptive threshold based on local contrast
        const clampedValue = Math.max(0, Math.min(255, enhanced));
        const threshold =
          clampedValue > 160 ? 255 : clampedValue < 80 ? 0 : clampedValue;

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

  // Remove excessive whitespace and normalize line breaks
  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\n+/g, "\n");

  // Fix common OCR errors for Thai characters
  const thaiFixMap: { [key: string]: string } = {
    // Common OCR misreads for Thai numbers and symbols
    oN: "๑", // Thai number 1
    ET: "๒", // Thai number 2
    Er: "๓", // Thai number 3
    Ee: "๔", // Thai number 4
    LE: "๕", // Thai number 5
    EE: "๖", // Thai number 6
    airs: "฿", // Thai baht symbol
    "&gt;": ">",
    "=-": "=",
    // Fix spacing around numbers and prices
  };

  // Apply character fixes
  for (const [wrong, correct] of Object.entries(thaiFixMap)) {
    cleaned = cleaned.replace(new RegExp(wrong, "g"), correct);
  }

  // Try to reconstruct price patterns
  // Look for number patterns that might be prices
  cleaned = cleaned.replace(/(\d+)[\s]*[.,][\s]*(\d{2})/g, "$1.$2");

  // Fix Thai baht symbol positioning
  cleaned = cleaned.replace(/([฿])\s*(\d)/g, "$1$2");
  cleaned = cleaned.replace(/(\d)\s*([฿])/g, "$1 $2");

  // Clean up line breaks for better item detection
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return cleaned;
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
            workerId: "",
          });
        };

        console.log("OCR Debug: Initializing Tesseract worker...");
        onOCRProgress({
          progress: 0,
          status: "Initializing Thai/English OCR...",
          workerId: "",
        });

        // Try multiple OCR configurations for best results
        const ocrConfigurations = [
          {
            lang: "tha+eng",
            psm: Tesseract.PSM.AUTO,
            name: "Auto segmentation",
          },
          {
            lang: "tha+eng",
            psm: Tesseract.PSM.SINGLE_BLOCK,
            name: "Single block",
          },
          {
            lang: "tha+eng",
            psm: Tesseract.PSM.SINGLE_COLUMN,
            name: "Single column",
          },
        ];

        let bestResult: any = null;
        let highestConfidence = 0;

        for (let i = 0; i < ocrConfigurations.length; i++) {
          const config = ocrConfigurations[i];

          onOCRProgress({
            progress: 20 + i * 25,
            status: `Trying ${config.name} OCR...`,
            workerId: "",
          });

          try {
            const result = await Tesseract.recognize(
              preprocessedImageData,
              config.lang,
              {
                logger: (m: any) => {
                  if (m.status === "recognizing text") {
                    const progress = 20 + i * 25 + m.progress * 25;
                    progressCallback({
                      progress: progress / 100,
                      status: `${config.name}: ${m.status}`,
                    });
                  }
                },
                tessedit_pageseg_mode: config.psm,
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
                preserve_interword_spaces: "1",
                user_defined_dpi: "300",
              }
            );

            console.log(
              `OCR Debug: ${config.name} - Confidence: ${result.data.confidence}%`
            );
            console.log(
              `OCR Debug: ${config.name} - Text length: ${
                result.data.text.trim().length
              }`
            );

            // Accept any result with text, prioritizing by confidence
            if (
              result.data.text.trim().length > 0 &&
              result.data.confidence > highestConfidence
            ) {
              bestResult = result;
              highestConfidence = result.data.confidence;
              console.log(
                `OCR Debug: New best result with ${config.name}: ${highestConfidence}%`
              );
            } else if (!bestResult && result.data.text.trim().length > 0) {
              // Take any result if we have none yet
              bestResult = result;
              highestConfidence = result.data.confidence;
              console.log(
                `OCR Debug: First valid result with ${config.name}: ${highestConfidence}%`
              );
            } else if (!bestResult) {
              // Store even empty results as potential fallback
              bestResult = result;
              highestConfidence = result.data.confidence;
              console.log(
                `OCR Debug: Storing fallback result with ${config.name}: ${highestConfidence}%`
              );
            }
          } catch (error) {
            console.log(`OCR Debug: ${config.name} failed:`, error);
          }
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
        onOCRComplete({
          text: cleanedText,
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
