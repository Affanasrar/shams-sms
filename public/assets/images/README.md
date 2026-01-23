# Logo Setup for PDF Reports

To add your institution's logo to the PDF reports, place your logo file in this directory with one of the following names:

- `logo.png` (recommended)
- `logo.jpg`
- `logo.jpeg`
- `logo.svg`

## Requirements:
- **Format**: PNG, JPG, JPEG, or SVG
- **Size**: Recommended 100x100 pixels or larger (will be scaled to 25x25mm in PDF)
- **Background**: Preferably transparent or with appropriate background
- **File name**: Must be exactly `logo.png`, `logo.jpg`, `logo.jpeg`, or `logo.svg`

## How it works:
- The PDF generation system automatically detects and loads the logo from this folder
- If no logo is found, it uses a default "S" logo design
- The logo is embedded directly into the PDF file

## Example:
Place your logo file here: `public/assets/images/logo.png`

The logo will automatically appear in all generated PDF reports.