"use client";

import { useState } from "react";
import type { LineItem } from "@bill-splitter/shared";
import { Decimal } from "decimal.js";

interface LineItemEditorProps {
  lineItem: LineItem;
  onUpdate: (updatedItem: LineItem) => void;
  onDelete: (itemId: string) => void;
}

export function LineItemEditor({
  lineItem,
  onUpdate,
  onDelete,
}: LineItemEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(lineItem);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateItem = (item: LineItem): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!item.name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (item.quantity <= 0) {
      newErrors.quantity = "Quantity must be positive";
    }

    try {
      const unitPrice = new Decimal(item.unitPrice);
      if (unitPrice.isNegative()) {
        newErrors.unitPrice = "Unit price must be non-negative";
      }
    } catch {
      newErrors.unitPrice = "Invalid price format";
    }

    return newErrors;
  };

  const calculateTotalPrice = (quantity: number, unitPrice: string): string => {
    try {
      const unit = new Decimal(unitPrice);
      const total = unit.mul(quantity);
      return total.toFixed(2);
    } catch {
      return "0.00";
    }
  };

  const handleSave = () => {
    const newErrors = validateItem(editedItem);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const updatedItem: LineItem = {
        ...editedItem,
        totalPrice: calculateTotalPrice(
          editedItem.quantity,
          editedItem.unitPrice
        ),
        manuallyEdited: true,
      };
      onUpdate(updatedItem);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedItem(lineItem);
    setErrors({});
    setIsEditing(false);
  };

  const handleQuantityChange = (quantity: number) => {
    const updated = { ...editedItem, quantity };
    updated.totalPrice = calculateTotalPrice(quantity, updated.unitPrice);
    setEditedItem(updated);
  };

  const handleUnitPriceChange = (unitPrice: string) => {
    const updated = { ...editedItem, unitPrice };
    updated.totalPrice = calculateTotalPrice(updated.quantity, unitPrice);
    setEditedItem(updated);
  };

  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={editedItem.name}
              onChange={(e) =>
                setEditedItem({ ...editedItem, name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
              placeholder="Enter item name"
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={editedItem.quantity}
              onChange={(e) =>
                handleQuantityChange(parseFloat(e.target.value) || 0)
              }
              min="0.01"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.quantity ? "border-red-300 bg-red-50" : "border-gray-800"
              }`}
            />
            {errors.quantity && (
              <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Unit Price ($)
            </label>
            <input
              type="number"
              value={editedItem.unitPrice}
              onChange={(e) => handleUnitPriceChange(e.target.value)}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.unitPrice
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.unitPrice && (
              <p className="text-red-600 text-xs mt-1">{errors.unitPrice}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-800">
              Total:{" "}
              <span className="font-semibold">${editedItem.totalPrice}</span>
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={editedItem.isShared}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, isShared: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Shared item
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {editedItem.extractedText && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-800 border border-gray-200">
            <strong className="text-gray-900">Original OCR:</strong>{" "}
            {editedItem.extractedText}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-gray-900">{lineItem.name}</h4>
            {lineItem.isShared && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                Shared
              </span>
            )}
            {lineItem.manuallyEdited && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                Edited
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-4 text-sm text-gray-700">
            <span>Qty: {lineItem.quantity}</span>
            <span>@ ${lineItem.unitPrice}</span>
            <span className="font-semibold">Total: ${lineItem.totalPrice}</span>
            {lineItem.category && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {lineItem.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(lineItem.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
