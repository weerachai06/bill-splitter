// Bill Splitter Context Provider
// Provides global state management for the OCR bill splitter application

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import type { BillSplitterState, Receipt } from "@bill-splitter/shared";
import {
  billReducer,
  initialState,
  type BillSplitterAction,
} from "./BillReducer";

// Context type definition
interface BillContextType {
  state: BillSplitterState;
  dispatch: React.Dispatch<BillSplitterAction>;
}

// Create the context
const BillContext = createContext<BillContextType | undefined>(undefined);

// Provider component props
interface BillProviderProps {
  children: ReactNode;
}

// Session storage key for persistence
const STORAGE_KEY = "bill-splitter-state";

// Provider component
export function BillProvider({ children }: BillProviderProps) {
  const [state, dispatch] = useReducer(billReducer, initialState, (initial) => {
    // Try to load from session storage on initialization
    if (typeof window !== "undefined") {
      try {
        const savedState = sessionStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Ensure dates are properly parsed
          if (parsedState.receipt?.processedAt) {
            parsedState.receipt.processedAt = new Date(
              parsedState.receipt.processedAt
            );
          }
          if (parsedState.summary?.calculatedAt) {
            parsedState.summary.calculatedAt = new Date(
              parsedState.summary.calculatedAt
            );
          }
          console.log("Loaded state from session storage:", parsedState);
          return parsedState;
        }
      } catch (error) {
        console.error("Error loading state from session storage:", error);
      }
    }
    return initial;
  });

  // Auto-save to session storage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log("State saved to session storage");
      } catch (error) {
        console.error("Error saving state to session storage:", error);
        // If session storage is full or unavailable, clear it
        try {
          sessionStorage.clear();
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          console.error("Unable to save state - session storage unavailable");
        }
      }
    }
  }, [state]);

  const contextValue: BillContextType = {
    state,
    dispatch,
  };

  return (
    <BillContext.Provider value={contextValue}>{children}</BillContext.Provider>
  );
}

// Custom hook to use the bill context
export function useBillContext(): BillContextType {
  const context = useContext(BillContext);

  if (context === undefined) {
    throw new Error("useBillContext must be used within a BillProvider");
  }

  return context;
}

// Utility hooks for specific state access
export function useBillState() {
  return useBillContext().state;
}

export function useBillDispatch() {
  return useBillContext().dispatch;
}

// Helper functions for common actions
export function useActions() {
  const dispatch = useBillDispatch();

  return {
    setReceipt: (receipt: Receipt) =>
      dispatch({ type: "SET_RECEIPT", payload: receipt }),

    setLineItems: (lineItems: BillSplitterState["lineItems"]) =>
      dispatch({ type: "SET_LINE_ITEMS", payload: lineItems }),

    addLineItem: (lineItem: BillSplitterState["lineItems"][0]) =>
      dispatch({ type: "ADD_LINE_ITEM", payload: lineItem }),

    updateLineItem: (
      id: string,
      updates: Partial<BillSplitterState["lineItems"][0]>
    ) => dispatch({ type: "UPDATE_LINE_ITEM", payload: { id, updates } }),

    removeLineItem: (id: string) =>
      dispatch({ type: "REMOVE_LINE_ITEM", payload: id }),

    addPerson: (person: BillSplitterState["people"][0]) =>
      dispatch({ type: "ADD_PERSON", payload: person }),

    updatePerson: (
      id: string,
      updates: Partial<BillSplitterState["people"][0]>
    ) => dispatch({ type: "UPDATE_PERSON", payload: { id, updates } }),

    removePerson: (id: string) =>
      dispatch({ type: "REMOVE_PERSON", payload: id }),

    setStep: (step: BillSplitterState["currentStep"]) =>
      dispatch({ type: "SET_STEP", payload: step }),

    setProcessing: (processing: boolean) =>
      dispatch({ type: "SET_PROCESSING", payload: processing }),

    setOCRProgress: (progress: number, status: string) =>
      dispatch({ type: "SET_OCR_PROGRESS", payload: { progress, status } }),

    addError: (error: string) =>
      dispatch({ type: "ADD_ERROR", payload: error }),

    clearErrors: () => dispatch({ type: "CLEAR_ERRORS" }),

    resetState: () => dispatch({ type: "RESET_STATE" }),
  };
}
