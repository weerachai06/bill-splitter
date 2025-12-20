"use client";

import { useState } from "react";
import type { LineItem } from "@bill-splitter/shared";
import { Decimal } from "decimal.js";

interface AddLineItemProps {
  receiptId: string;
  onAdd: (newItem: LineItem) => void;
}

export function AddLineItem({ receiptId, onAdd }: AddLineItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unitPrice: "0.00",
    category: "",
    isShared: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateNewItem = () => {
    const newErrors: Record<string, string> = {};

    if (!newItem.name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (newItem.quantity <= 0) {
      newErrors.quantity = "Quantity must be positive";
    }

    try {
      const unitPrice = new Decimal(newItem.unitPrice);
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

  const handleAdd = () => {
    const newErrors = validateNewItem();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const lineItem: LineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        receiptId,
        name: newItem.name.trim(),
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        totalPrice: calculateTotalPrice(newItem.quantity, newItem.unitPrice),
        category: newItem.category.trim() || null,
        isShared: newItem.isShared,
        extractedText: "[Manually Added]",
        manuallyEdited: true,
      };

      onAdd(lineItem);

      // Reset form
      setNewItem({
        name: "",
        quantity: 1,
        unitPrice: "0.00",
        category: "",
        isShared: false,
      });
      setErrors({});
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setNewItem({
      name: "",
      quantity: 1,
      unitPrice: "0.00",
      category: "",
      isShared: false,
    });
    setErrors({});
    setIsOpen(false);
  };

  const handleQuantityChange = (quantity: number) => {
    setNewItem((prev) => ({ ...prev, quantity }));
  };

  const handleUnitPriceChange = (unitPrice: string) => {
    setNewItem((prev) => ({ ...prev, unitPrice }));
  };

  const totalPrice = calculateTotalPrice(newItem.quantity, newItem.unitPrice);

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-3 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Manual Item
        </button>
      ) : (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Add New Line Item</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, name: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="Enter item name"
                autoFocus
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (Optional)
              </label>
              <input
                type="text"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Food, Drinks, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  handleQuantityChange(parseFloat(e.target.value) || 0)
                }
                min="0.01"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantity
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              {errors.quantity && (
                <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price ($) *
              </label>
              <input
                type="number"
                value={newItem.unitPrice}
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                Total: <span className="font-semibold">${totalPrice}</span>
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={newItem.isShared}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      isShared: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Shared item
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">* Required fields</p>
        </div>
      )}
    </div>
  );
}
