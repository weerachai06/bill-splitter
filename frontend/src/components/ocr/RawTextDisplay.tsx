"use client";

import { useState } from "react";
import type { Receipt } from "@bill-splitter/shared";

interface RawTextDisplayProps {
  receipt: Receipt | null;
  onTextEdit?: (newText: string) => void;
  isEditable?: boolean;
}

export function RawTextDisplay({
  receipt,
  onTextEdit,
  isEditable = false,
}: RawTextDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(receipt?.ocrText || "");

  const handleSaveEdit = () => {
    if (onTextEdit) {
      onTextEdit(editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(receipt?.ocrText || "");
    setIsEditing(false);
  };

  if (!receipt) {
    return (
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        <p>No receipt processed yet. Upload an image to see extracted text.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${
              receipt.status === "completed"
                ? "bg-green-100 text-green-800"
                : receipt.status === "error"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {receipt.status === "completed"
              ? "Complete"
              : receipt.status === "error"
              ? "Error"
              : "Processing"}
          </span>
          {isEditable && receipt.status === "completed" && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {receipt.status === "error" ? (
        <div className="text-red-600 text-center py-4">
          <p>
            Failed to extract text from the image. Please try with a clearer
            image.
          </p>
        </div>
      ) : receipt.status === "processing" ? (
        <div className="text-gray-500 text-center py-4">
          <p>Processing image... This may take a few seconds.</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      ) : isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Edit the extracted text..."
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {receipt.ocrText || "No text extracted from image."}
            </pre>
          </div>

          {receipt.processedAt && (
            <p className="text-xs text-gray-500">
              Processed: {new Date(receipt.processedAt).toLocaleString()}
            </p>
          )}

          {receipt.ocrText && (
            <p className="text-xs text-gray-600">
              Character count: {receipt.ocrText.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
