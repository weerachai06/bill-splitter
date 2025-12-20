// Processing Status Component
// Shows OCR processing progress and status updates

"use client";

import React from "react";

interface ProcessingStatusProps {
  progress: number; // 0-100
  status: string;
  isProcessing: boolean;
}

export function ProcessingStatus({
  progress,
  status,
  isProcessing,
}: ProcessingStatusProps) {
  if (!isProcessing && progress === 0) {
    return null;
  }

  const isComplete = progress >= 100;
  const hasError =
    status.toLowerCase().includes("error") ||
    status.toLowerCase().includes("failed");

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Container */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">
            {isComplete ? "Processing Complete!" : "Processing Receipt..."}
          </h3>

          {/* Status Icon */}
          <div className="shrink-0">
            {hasError ? (
              <div className="w-6 h-6 text-red-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            ) : isComplete ? (
              <div className="w-6 h-6 text-green-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 text-blue-500">
                <svg
                  className="animate-spin w-full h-full"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                hasError
                  ? "bg-red-500"
                  : isComplete
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${Math.max(progress, 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{Math.round(progress)}%</span>
            <span>{isComplete ? "Done" : "Processing..."}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="space-y-2">
          <p
            className={`text-sm font-medium ${
              hasError
                ? "text-red-700"
                : isComplete
                ? "text-green-700"
                : "text-blue-700"
            }`}
          >
            {status}
          </p>

          {/* Processing Steps */}
          {isProcessing && !hasError && (
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress > 0 ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span>Loading OCR engine</span>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress > 20
                      ? "bg-green-500"
                      : progress > 0
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                />
                <span>Processing image</span>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress > 80
                      ? "bg-green-500"
                      : progress > 20
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                />
                <span>Recognizing text</span>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 100
                      ? "bg-green-500"
                      : progress > 80
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                />
                <span>Parsing receipt data</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <p className="text-red-800">
                <strong>Processing failed:</strong> The image could not be
                processed. Please try again with a clearer image or upload a
                different receipt.
              </p>
            </div>
          )}

          {/* Success Message */}
          {isComplete && !hasError && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p className="text-green-800">
                <strong>Success!</strong> Text has been extracted from your
                receipt. Please review the results below and make any necessary
                corrections.
              </p>
            </div>
          )}
        </div>

        {/* Performance Info (Debug) */}
        {isComplete && !hasError && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                Processing Details
              </summary>
              <div className="mt-2 space-y-1">
                <p>• OCR Engine: Tesseract.js</p>
                <p>• Processing Time: ~{Math.round(progress / 10)} seconds</p>
                <p>• Language: English (eng)</p>
                <p>• Mode: Receipt optimized</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
