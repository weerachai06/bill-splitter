# Phase 0 Research: Smart Bill Summary Technical Decisions

**Feature**: Smart Bill Summary with Field Filtering  
**Research Phase**: Resolving technical unknowns and establishing patterns  
**Date**: December 20, 2025

## Research Tasks Completed

### 1. Field Classification Algorithms for Receipt Content

**Decision**: Rule-based classification with machine learning enhancement  
**Rationale**: Provides immediate functionality with improvement over time  

**Essential Field Patterns:**
- Items: Lines with price patterns ($X.XX, €X,XX, ฿X.XX) preceded by descriptive text
- Quantities: Numeric values followed by unit indicators (x, qty, ea)
- Totals: Keywords like "total", "sum", "amount", "subtotal" with associated prices
- Tax: Keywords like "tax", "VAT", "GST" with percentage or amount values

**Non-Essential Field Patterns:**
- Contact info: Email patterns (@domain.com), phone patterns, websites (http/www)
- Promotional: "Thank you", "visit again", promotional codes, discount offers
- Legal: Terms like "no returns", "receipt required", legal disclaimers
- Store operations: Hours (Mon-Fri, 9AM-5PM patterns), location info beyond basic address

**Alternatives considered**: Pure ML approach rejected due to training data requirements and deployment complexity

### 2. CSV Generation Best Practices for Financial Data

**Decision**: RFC 4180 compliant with decimal precision preservation  
**Rationale**: Ensures compatibility with accounting software and maintains financial accuracy  

**Standard Columns:**
```csv
Item_Name,Quantity,Unit_Price,Line_Total,Category,Merchant,Date,Tax_Rate
```

**Data Handling:**
- Decimal precision: Use string formatting to avoid floating-point errors
- Text escaping: RFC 4180 rules for commas, quotes, newlines in item descriptions
- Currency: Store as decimal strings with currency code metadata
- Encoding: UTF-8 BOM for international character support

**Alternatives considered**: JSON export rejected for primary use case due to accounting software compatibility

### 3. Multi-language OCR Processing Patterns

**Decision**: Language detection with fallback processing  
**Rationale**: Supports user's example images (English, German, Thai) without manual configuration  

**Processing Pipeline:**
1. Google Cloud Vision API with multi-language detection enabled
2. Language-specific postprocessing for currency formats and number systems
3. Text normalization for consistent parsing across languages
4. Fallback to English processing if language detection fails

**Language-Specific Considerations:**
- German: Decimal comma (1,50 €) vs period separator (1.050,00 €)
- Thai: Mixed script detection, Buddhist calendar dates, baht symbol (฿)
- English: Standard USD formatting, imperial measurements

**Alternatives considered**: Single-language approach rejected due to user requirements for multi-language support

### 4. Receipt Layout Detection for Item Parsing

**Decision**: Template-free parsing with geometric analysis  
**Rationale**: Handles diverse receipt formats without training specific templates  

**Detection Strategy:**
- Line grouping: Identify horizontal text groups within receipts
- Price alignment: Detect right-aligned price columns through text positioning
- Item boundaries: Use whitespace and price patterns to separate line items
- Table structure: Recognize column-based layouts vs single-column formats

**Parsing Rules:**
- Item line: Contains descriptive text + price + optional quantity
- Separator detection: Totals sections often preceded by lines/spacing
- Continuation lines: Handle item names split across multiple lines

**Alternatives considered**: Template-based parsing rejected due to receipt format diversity shown in user examples

### 5. User Customization Storage for Filtering Preferences

**Decision**: Local Storage with JSON schema validation  
**Rationale**: Provides persistence without backend complexity, enables offline operation  

**Storage Schema:**
```typescript
interface FilteringProfile {
  name: string;
  essentialFields: string[];
  excludePatterns: RegExp[];
  csvColumns: string[];
  dateFormat: string;
  currencyFormat: string;
}
```

**Default Profiles:**
- "Business Expenses": Include merchant, date, tax details
- "Personal Tracking": Focus on items and totals only
- "Accounting Export": Full structured data for bookkeeping

**Alternatives considered**: Backend storage rejected to maintain simplicity and user privacy

## Technology Stack Decisions

### Frontend Libraries
- **CSV Generation**: `csv-parse` and `csv-stringify` for RFC 4180 compliance
- **File Handling**: Native File API with drag-and-drop support
- **Image Processing**: Canvas API for client-side image optimization
- **Pattern Matching**: Native RegExp with internationalization support

### Integration Points
- **OCR Service**: Extend existing Google Cloud Vision API integration
- **Type Safety**: Leverage existing shared types, add smart-summary-specific interfaces
- **Error Handling**: Use existing error boundary patterns with filtering-specific states

### Performance Considerations
- **Client-side processing**: Reduces server load, enables real-time preview
- **Lazy loading**: Progressive enhancement for batch processing features
- **Memory management**: Efficient handling of multiple image uploads
- **Caching**: Store OCR results temporarily to avoid reprocessing

## Risk Mitigation

### OCR Accuracy Issues
- **Mitigation**: User review and correction interface for filtered results
- **Fallback**: Manual item entry option when OCR fails completely

### Format Diversity
- **Mitigation**: Flexible parsing rules with user feedback loop for improvements
- **Fallback**: Rule customization for handling unique receipt formats

### Data Loss During Filtering
- **Mitigation**: Always preserve original OCR data, show before/after comparison
- **Safeguard**: User confirmation before finalizing filtered results

## Next Phase Dependencies

All research questions resolved. Ready for Phase 1:
- Data model design for filtering rules and CSV structure
- API contracts for enhanced OCR data types
- User experience design for smart filtering workflow