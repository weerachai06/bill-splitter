"use client";

import { useMemo } from "react";
import type { BillSummary, LineItem } from "@bill-splitter/shared";
import { Decimal } from "decimal.js";

interface BillSummaryProps {
  lineItems: LineItem[];
  taxAmount?: string;
  tipAmount?: string;
  onTaxChange?: (amount: string) => void;
  onTipChange?: (amount: string) => void;
  isEditable?: boolean;
}

export function BillSummary({
  lineItems = [],
  taxAmount = "0.00",
  tipAmount = "0.00",
  onTaxChange,
  onTipChange,
  isEditable = true,
}: BillSummaryProps) {
  const summary = useMemo(() => {
    // Calculate subtotal from line items
    const subtotal = lineItems.reduce((total, item) => {
      try {
        return total.add(new Decimal(item.totalPrice));
      } catch {
        return total;
      }
    }, new Decimal(0));

    // Parse tax and tip amounts
    let tax = new Decimal(0);
    let tip = new Decimal(0);

    try {
      tax = new Decimal(taxAmount);
    } catch {
      tax = new Decimal(0);
    }

    try {
      tip = new Decimal(tipAmount);
    } catch {
      tip = new Decimal(0);
    }

    // Calculate total
    const total = subtotal.add(tax).add(tip);

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: tax.toFixed(2),
      tipAmount: tip.toFixed(2),
      totalAmount: total.toFixed(2),
      itemCount: lineItems.length,
    };
  }, [lineItems, taxAmount, tipAmount]);

  const handleTaxChange = (value: string) => {
    // Allow empty string for clearing
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      onTaxChange?.(value);
    }
  };

  const handleTipChange = (value: string) => {
    // Allow empty string for clearing
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      onTipChange?.(value);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Summary</h3>

      {summary.itemCount === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No line items yet. Add items to see the bill summary.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Items breakdown */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
            </span>
            <span>Subtotal</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-900">Items Subtotal</span>
            <span className="font-mono text-lg">${summary.subtotal}</span>
          </div>

          <hr className="border-gray-200" />

          {/* Tax input */}
          <div className="flex justify-between items-center">
            <label htmlFor="tax-input" className="text-gray-900">
              Tax
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">$</span>
              {isEditable ? (
                <input
                  id="tax-input"
                  type="text"
                  value={taxAmount}
                  onChange={(e) => handleTaxChange(e.target.value)}
                  className="w-20 px-2 py-1 text-right font-mono text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              ) : (
                <span className="font-mono text-sm">{summary.taxAmount}</span>
              )}
            </div>
          </div>

          {/* Tip input */}
          <div className="flex justify-between items-center">
            <label htmlFor="tip-input" className="text-gray-900">
              Tip
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">$</span>
              {isEditable ? (
                <input
                  id="tip-input"
                  type="text"
                  value={tipAmount}
                  onChange={(e) => handleTipChange(e.target.value)}
                  className="w-20 px-2 py-1 text-right font-mono text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              ) : (
                <span className="font-mono text-sm">{summary.tipAmount}</span>
              )}
            </div>
          </div>

          <hr className="border-gray-300" />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="font-mono text-xl text-blue-600">
              ${summary.totalAmount}
            </span>
          </div>

          {/* Quick tip buttons */}
          {isEditable && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">Quick tip amounts:</p>
              <div className="flex gap-2 flex-wrap">
                {[15, 18, 20, 25].map((percent) => {
                  const tipValue = new Decimal(summary.subtotal)
                    .mul(percent)
                    .div(100)
                    .toFixed(2);
                  return (
                    <button
                      key={percent}
                      onClick={() => onTipChange?.(tipValue)}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      {percent}% (${tipValue})
                    </button>
                  );
                })}
                <button
                  onClick={() => onTipChange?.("0.00")}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-500"
                >
                  No tip
                </button>
              </div>
            </div>
          )}

          {/* Validation messages */}
          {summary.itemCount > 0 && parseFloat(summary.totalAmount) <= 0 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Total amount is zero or negative. Please check your inputs.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
