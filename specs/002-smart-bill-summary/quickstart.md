# Quick Start Guide: Smart Bill Summary

**Feature**: Intelligent receipt processing with automatic field filtering  
**Purpose**: Convert messy receipts into clean, structured CSV data  
**Target Users**: Anyone needing clean expense data from receipt photos

## Overview

Smart Bill Summary transforms cluttered receipt images into clean, structured data by automatically filtering out unnecessary content (promotions, store hours, legal text) while preserving essential billing information (items, prices, totals). Perfect for expense tracking, accounting, and financial record-keeping.

## Getting Started

### 1. Upload Receipt Images
- **Supported Formats**: JPEG, PNG, WebP
- **Size Limit**: 10MB per image
- **Languages**: English, German, Thai (auto-detected)
- **Quality Tips**: Clear, well-lit photos work best

### 2. Choose Processing Mode

#### Basic Mode (Recommended for New Users)
- Uses default filtering profile
- Automatically removes promotional content, contact info, legal disclaimers
- Preserves items, quantities, prices, totals, merchant name, date

#### Custom Mode (Advanced Users)
- Create personalized filtering profiles
- Define which fields to include/exclude
- Set up custom CSV column layouts
- Save profiles for different use cases (business vs personal)

### 3. Review and Correct
- Preview filtered results before export
- Manually correct any misclassified content
- System learns from your corrections for improved accuracy

### 4. Export to CSV
- **Standard Format**: Item_Name, Quantity, Unit_Price, Line_Total, Merchant, Date
- **Custom Columns**: Configure based on your needs
- **Accounting Ready**: Properly formatted for QuickBooks, Excel, etc.

## User Requirements Implementation

### ✅ Rule 1: Convert Text to CSV
**What it does**: Transforms OCR extracted text into structured CSV format
**Example Output**:
```csv
Item_Name,Quantity,Unit_Price,Line_Total,Category,Merchant,Date
"Coffee, Large",1,4.50,4.50,Beverage,"Local Cafe","2025-12-20"
"Sandwich, Turkey",1,12.99,12.99,Food,"Local Cafe","2025-12-20"
```

### ✅ Rule 2: Remove Unnecessary Fields
**What gets filtered out**:
- Email addresses and phone numbers
- Thank you messages and marketing text
- Store hours and location details
- Legal disclaimers and return policies
- Promotional codes and loyalty program info

**What gets preserved**:
- Item names and descriptions
- Quantities and unit prices
- Subtotals, tax, and final totals
- Merchant name (configurable)
- Transaction date and time

### ✅ Rule 3: Separate Items by Rows
**How it works**:
- Each purchased item becomes a separate CSV row
- Quantities automatically parsed from item descriptions
- Multi-line item descriptions properly combined
- Price calculations validated for accuracy

## Common Use Cases

### Personal Expense Tracking
```
Default Profile: "Personal Expenses"
- Focus on items and totals only
- Exclude store information
- Simple 4-column CSV: Item, Quantity, Price, Total
```

### Business Expense Reports
```
Profile: "Business Expenses"  
- Include merchant name for record-keeping
- Add transaction date for reporting
- Include tax amounts for deduction tracking
- Export format compatible with expense management software
```

### Accounting Integration
```
Profile: "Full Accounting"
- Complete structured data export
- All financial fields preserved
- Tax breakdowns included
- Ready for QuickBooks/Xero import
```

## Tips for Best Results

### Photography Best Practices
- **Lighting**: Good lighting improves OCR accuracy
- **Angle**: Straight-on shots work better than angled photos  
- **Focus**: Ensure text is sharp and readable
- **Background**: Plain backgrounds help with text detection

### Receipt Types That Work Well
- **Standard Retail**: Grocery stores, restaurants, retail shops
- **Multi-language**: Automatic language detection handles mixed scripts
- **Various Layouts**: System adapts to different receipt formats

### Handling Difficult Receipts
- **Faded Text**: May require manual review of extracted items
- **Handwritten Notes**: OCR works best with printed text
- **Damaged Receipts**: Clean up tears/stains before photographing

## Batch Processing (50+ Receipts)

### Upload Multiple Files
- Select up to 50 receipt images at once
- Processing happens sequentially with progress tracking
- Failed receipts can be reprocessed individually

### Bulk Export Options
- **Single CSV**: All receipts combined into one file
- **Separate Files**: Individual CSV per receipt
- **Summary Report**: Processing statistics and error details

## Customization Options

### Filtering Profiles
Create custom rules for different scenarios:
- **Include Categories**: Choose which content types to preserve
- **Exclude Patterns**: Add regex patterns for specific content removal
- **CSV Layout**: Define column names and order

### Export Settings
- **Date Formats**: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- **Currency Display**: Symbol placement and decimal precision  
- **File Encoding**: UTF-8 or UTF-8 with BOM for international compatibility
- **Delimiter Options**: Comma, semicolon, or tab separation

## Troubleshooting

### Low OCR Accuracy
- **Cause**: Poor image quality, lighting, or resolution
- **Solution**: Retake photo with better lighting and focus

### Missing Items
- **Cause**: Unusual receipt layout or formatting
- **Solution**: Use manual review mode to add missed items

### Incorrect Filtering
- **Cause**: System misclassified essential content as non-essential
- **Solution**: Apply manual corrections; system learns from feedback

### Export Issues
- **Cause**: Special characters in item names or formatting conflicts
- **Solution**: Check CSV encoding settings; try different delimiter

## Performance Expectations

- **Processing Speed**: <10 seconds per receipt
- **Accuracy**: 95%+ for essential data preservation
- **Filtering**: 90%+ automatic removal of non-essential content
- **Languages**: 90%+ accuracy for English, German, Thai

## Data Privacy

- **Local Processing**: Filtering and CSV generation happen in your browser
- **No Data Storage**: Receipt images and extracted data not stored on servers
- **User Control**: All data stays on your device unless you choose to export

## Getting Help

### Common Questions
- **Q**: Can I process receipts in languages other than English?
- **A**: Yes, automatic language detection supports German, Thai, and others

- **Q**: How do I handle receipts with unusual layouts?
- **A**: Use the manual review mode to correct any misclassified content

- **Q**: Can I integrate with my accounting software?
- **A**: Yes, CSV export is compatible with QuickBooks, Xero, and Excel

### Support Resources
- **Example Images**: Use the provided sample receipts to test functionality
- **Best Practices**: Follow photography tips for optimal results
- **Profile Templates**: Start with built-in profiles before creating custom ones

This quick start guide helps you efficiently transform messy receipts into clean, structured data that meets your specific needs for expense tracking, accounting, and financial record-keeping.