// Image Upload Component
// Handles file selection and image preview for receipt uploads

"use client";

import React, { useRef, useState } from "react";
import { SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@bill-splitter/shared";

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  currentImage: File | null;
  disabled: boolean;
}

export function ImageUpload({
  onImageSelected,
  onImageRemoved,
  currentImage,
  disabled,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL when image changes
  React.useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentImage]);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
      return "Please select a JPEG, PNG, or HEIC image file.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Image file must be less than 10MB.";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    onImageSelected(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageRemoved();
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_IMAGE_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone */}
      {!currentImage ? (
        <div
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }
            ${
              disabled
                ? "opacity-50 cursor-not-allowed bg-gray-100"
                : "hover:bg-gray-50"
            }
          `}
        >
          {/* Upload Icon */}
          <div className="mx-auto mb-4 w-12 h-12 text-gray-400">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {dragActive ? "Drop your receipt here" : "Upload Receipt Image"}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop or click to select
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports JPEG, PNG, HEIC • Max 10MB
            </p>
          </div>
        </div>
      ) : (
        /* Image Preview */
        <div className="space-y-4">
          {/* Preview Container */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100 border">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full h-64 object-contain"
              />
            )}
          </div>

          {/* File Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{currentImage.name}</p>
              <p className="text-sm text-gray-500">
                {(currentImage.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>

            <div className="flex space-x-2">
              {/* Change Image Button */}
              <button
                onClick={openFileDialog}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Change
              </button>

              {/* Remove Button */}
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>
          💡 <strong>Tips for better OCR results:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Ensure good lighting and clear text</li>
          <li>Avoid shadows and reflections</li>
          <li>Keep the receipt flat and straight</li>
          <li>Make sure all text is visible in the frame</li>
        </ul>
      </div>
    </div>
  );
}
