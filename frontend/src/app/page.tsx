/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { ImageUpload } from "../components/ocr/ImageUpload";
import { ProcessingStatus } from "../components/ocr/ProcessingStatus";
import { useOCRProcessor } from "../components/ocr/OCRProcessor";
import { useBillState, useActions } from "../context/BillContext";
import { parseReceiptText, createLineItemsFromParsed } from "../lib/ocr-parser";
import type {
  OCRCompleteEvent,
  OCRProgressEvent,
  OCRErrorEvent,
  Receipt,
} from "@bill-splitter/shared";

export default function Home() {
  const state = useBillState();
  const actions = useActions();
  const [currentImage, setCurrentImage] = useState<File | null>(null);

  // OCR processing hooks
  const { processImage } = useOCRProcessor({
    onOCRComplete: handleOCRComplete,
    onOCRProgress: handleOCRProgress,
    onOCRError: handleOCRError,
  });

  // Handle OCR completion
  function handleOCRComplete(result: OCRCompleteEvent) {
    console.log("OCR Debug: Processing completed with result:", result);

    try {
      // Parse the OCR text into structured data
      const parsedData = parseReceiptText(result.text);
      console.log("OCR Debug: Parsed receipt data:", parsedData);

      // Create receipt object
      const receipt: Receipt = {
        id: `receipt-${Date.now()}`,
        originalImageUrl: null, // We'll handle image URLs later if needed
        ocrText: result.text,
        processedAt: new Date(),
        status: "completed",
      };

      // Create line items from parsed data
      const lineItems = createLineItemsFromParsed(parsedData, receipt.id);
      console.log("OCR Debug: Created line items:", lineItems);

      // Update application state
      actions.setReceipt(receipt);
      actions.setLineItems(lineItems);
      actions.setProcessing(false);
      actions.setStep("edit"); // Move to editing step

      // Show any parsing warnings
      if (parsedData.confidence < 70) {
        actions.addError(
          "OCR confidence is low. Please review and correct the extracted data."
        );
      }

      if (lineItems.length === 0) {
        actions.addError(
          "No line items were found. You can add them manually in the next step."
        );
      }
    } catch (error) {
      console.error("OCR Debug: Error processing OCR result:", error);
      actions.addError("Failed to process OCR results. Please try again.");
      actions.setProcessing(false);
    }
  }

  // Handle OCR progress updates
  function handleOCRProgress(event: OCRProgressEvent) {
    console.log("OCR Debug: Progress update:", event);
    actions.setOCRProgress(event.progress, event.status);
  }

  // Handle OCR errors
  function handleOCRError(error: OCRErrorEvent) {
    console.error("OCR Debug: OCR processing failed:", error);
    actions.addError(`OCR processing failed: ${error.message}`);
    actions.setProcessing(false);
    actions.setOCRProgress(0, "Ready");
  }

  // Handle image selection
  async function handleImageSelected(file: File) {
    console.log("OCR Debug: Image selected:", file.name);
    setCurrentImage(file);

    // Clear previous errors and reset state
    actions.clearErrors();
    actions.setProcessing(true);
    actions.setOCRProgress(0, "Initializing OCR...");
    actions.setStep("ocr");

    try {
      // Start OCR processing
      await processImage(file);
    } catch (error) {
      console.error("OCR Debug: Failed to start processing:", error);
      actions.addError("Failed to start OCR processing. Please try again.");
      actions.setProcessing(false);
    }
  }

  // Handle image removal
  function handleImageRemoved() {
    console.log("OCR Debug: Image removed");
    setCurrentImage(null);
    actions.clearErrors();
    actions.setStep("upload");
    actions.setOCRProgress(0, "Ready");
  }

  // Reset to start over
  function handleReset() {
    actions.resetState();
    setCurrentImage(null);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OCR Bill Splitter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a receipt image and let our OCR technology extract the items
            automatically. Then split the bill among your friends with ease.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {["Upload", "Process", "Edit", "Split"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    index === 0 && state.currentStep === "upload"
                      ? "bg-blue-500 text-white"
                      : index === 1 && state.currentStep === "ocr"
                      ? "bg-blue-500 text-white"
                      : index === 2 && state.currentStep === "edit"
                      ? "bg-blue-500 text-white"
                      : index === 3 && state.currentStep === "split"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {step}
                </span>
                {index < 3 && (
                  <div className="w-12 h-1 bg-gray-200 mx-4 rounded" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Messages */}
        {state.errors.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following issues:
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {state.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {state.currentStep === "upload" && (
            <div className="space-y-6">
              <ImageUpload
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                currentImage={currentImage}
                disabled={state.processing}
              />
            </div>
          )}

          {(state.currentStep === "ocr" || state.processing) && (
            <div className="space-y-6">
              <ProcessingStatus
                progress={state.ocrProgress}
                status={state.ocrStatus}
                isProcessing={state.processing}
              />

              {/* Show image preview during processing */}
              {currentImage && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Processing: {currentImage.name}
                  </h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <img
                      src={URL.createObjectURL(currentImage)}
                      alt="Processing receipt"
                      className="max-w-full h-48 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {state.currentStep === "edit" && state.receipt && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  OCR Processing Complete!
                </h2>
                <p className="text-gray-600 mb-6">
                  {state.lineItems.length > 0
                    ? `Found ${state.lineItems.length} items. Review and edit as needed.`
                    : "No items were automatically detected. You can add them manually."}
                </p>
              </div>

              {/* OCR Results Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Extracted Text:
                </h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {state.receipt.ocrText}
                </pre>
              </div>

              {/* Line Items Preview */}
              {state.lineItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Found Items:
                  </h3>
                  <div className="space-y-2">
                    {state.lineItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-white p-3 rounded border"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-sm text-gray-500 ml-2">
                              (qty: {item.quantity})
                            </span>
                          )}
                        </div>
                        <span className="font-medium">${item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Start Over
                </button>
                <button
                  onClick={() => actions.setStep("split")}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  disabled={state.lineItems.length === 0}
                >
                  Continue to Split Bill
                </button>
              </div>
            </div>
          )}

          {state.currentStep === "split" && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bill Splitting
              </h2>
              <p className="text-gray-600 mb-6">
                Bill splitting functionality coming soon! For now, you can see
                the extracted items above.
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Process Another Receipt
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Powered by Tesseract.js • Supports JPEG, PNG, HEIC images up to 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
