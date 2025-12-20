// Bill Splitter State Reducer
// Manages all state updates for the OCR bill splitter application

import type { 
  BillSplitterState, 
  Receipt, 
  LineItem, 
  Person, 
  ItemAssignment, 
  BillSummary,
  AppStep,
  UUID 
} from '@bill-splitter/shared';

// Action types for state management
export type BillSplitterAction =
  | { type: 'SET_RECEIPT'; payload: Receipt }
  | { type: 'SET_LINE_ITEMS'; payload: LineItem[] }
  | { type: 'UPDATE_LINE_ITEM'; payload: { id: UUID; updates: Partial<LineItem> } }
  | { type: 'ADD_LINE_ITEM'; payload: LineItem }
  | { type: 'REMOVE_LINE_ITEM'; payload: UUID }
  | { type: 'SET_PEOPLE'; payload: Person[] }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: { id: UUID; updates: Partial<Person> } }
  | { type: 'REMOVE_PERSON'; payload: UUID }
  | { type: 'SET_ASSIGNMENTS'; payload: ItemAssignment[] }
  | { type: 'UPDATE_ASSIGNMENT'; payload: ItemAssignment }
  | { type: 'REMOVE_ASSIGNMENTS'; payload: { lineItemId?: UUID; personId?: UUID } }
  | { type: 'SET_SUMMARY'; payload: BillSummary }
  | { type: 'SET_STEP'; payload: AppStep }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_OCR_PROGRESS'; payload: { progress: number; status: string } }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// Initial state for the bill splitter
export const initialState: BillSplitterState = {
  // Current session data
  receipt: null,
  lineItems: [],
  people: [],
  assignments: [],
  summary: null,
  
  // UI state
  currentStep: 'upload',
  processing: false,
  errors: [],
  
  // OCR specific
  ocrProgress: 0,
  ocrStatus: 'Ready'
};

// State reducer function
export function billReducer(
  state: BillSplitterState, 
  action: BillSplitterAction
): BillSplitterState {
  switch (action.type) {
    case 'SET_RECEIPT':
      return {
        ...state,
        receipt: action.payload
      };

    case 'SET_LINE_ITEMS':
      return {
        ...state,
        lineItems: action.payload
      };

    case 'UPDATE_LINE_ITEM':
      return {
        ...state,
        lineItems: state.lineItems.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        )
      };

    case 'ADD_LINE_ITEM':
      return {
        ...state,
        lineItems: [...state.lineItems, action.payload]
      };

    case 'REMOVE_LINE_ITEM':
      return {
        ...state,
        lineItems: state.lineItems.filter(item => item.id !== action.payload),
        // Remove related assignments
        assignments: state.assignments.filter(
          assignment => assignment.lineItemId !== action.payload
        )
      };

    case 'SET_PEOPLE':
      return {
        ...state,
        people: action.payload
      };

    case 'ADD_PERSON':
      return {
        ...state,
        people: [...state.people, action.payload]
      };

    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map(person =>
          person.id === action.payload.id
            ? { ...person, ...action.payload.updates }
            : person
        )
      };

    case 'REMOVE_PERSON':
      return {
        ...state,
        people: state.people.filter(person => person.id !== action.payload),
        // Remove related assignments
        assignments: state.assignments.filter(
          assignment => assignment.personId !== action.payload
        )
      };

    case 'SET_ASSIGNMENTS':
      return {
        ...state,
        assignments: action.payload
      };

    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.lineItemId === action.payload.lineItemId &&
          assignment.personId === action.payload.personId
            ? action.payload
            : assignment
        ).concat(
          // Add if not exists
          state.assignments.find(
            assignment =>
              assignment.lineItemId === action.payload.lineItemId &&
              assignment.personId === action.payload.personId
          ) ? [] : [action.payload]
        )
      };

    case 'REMOVE_ASSIGNMENTS':
      return {
        ...state,
        assignments: state.assignments.filter(assignment => {
          if (action.payload.lineItemId && assignment.lineItemId === action.payload.lineItemId) {
            return false;
          }
          if (action.payload.personId && assignment.personId === action.payload.personId) {
            return false;
          }
          return true;
        })
      };

    case 'SET_SUMMARY':
      return {
        ...state,
        summary: action.payload
      };

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        processing: action.payload
      };

    case 'SET_OCR_PROGRESS':
      return {
        ...state,
        ocrProgress: action.payload.progress,
        ocrStatus: action.payload.status
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}