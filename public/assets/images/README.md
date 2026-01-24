# Logo Setup for PDF Reports

## Option 1: Manual Upload
Place your logo file in this directory with one of the following names:

- `logo.png` (recommended)
- `logo.jpg`
- `logo.jpeg`
- `logo.svg`

## Option 2: Admin Interface Upload
Use the admin settings page to upload logos:
1. Go to Admin → Settings
2. Find the "Report Format Configuration" section
3. Upload your logo file through the interface

## Requirements:
- **Format**: PNG, JPG, JPEG, or SVG
- **Size**: Recommended 100x100 pixels or larger (will be scaled to 25x25mm in PDF)
- **File Size**: Maximum 2MB
- **Background**: Preferably transparent or with appropriate background

## How it works:
- The PDF generation system automatically detects and loads the logo from this folder
- If no logo is found, it uses a default "S" logo design
- The logo is embedded directly into the PDF file
- Custom uploaded logos take precedence over manually placed files

## API Endpoint:
- **POST** `/api/admin/upload-logo` - Upload logo file
- Accepts multipart/form-data with `logo` field
- Returns success status and file path

## Example:
Upload through admin interface or place file here: `public/assets/images/logo.png`

The logo will automatically appear in all generated PDF reports.