# SpokeHire Image Processor

This project contains scripts to process vehicle data from JSON files and catalog data from CSV files, download images, and create organized output files.

## Features

### Vehicle Image Processor (`processImages.js`)
- Downloads all vehicle images from URLs in the JSON data
- Updates image paths to local references (`images/[filename]`)
- Creates separate JSON files for vehicles with and without images
- Handles errors gracefully and provides detailed logging
- Generates safe filenames from image URLs
- Skips already downloaded images for efficiency

### Catalog Image Processor (`processCatalogImages.js`)
- Processes CSV catalog data with semicolon-separated image filenames
- Constructs full Wix URLs from image filenames
- Downloads catalog images to separate directory (`catalog_images/`)
- Updates image paths to local references (`catalog_images/[filename]`)
- Creates separate JSON files for products with and without images
- Handles CSV parsing and error recovery

### CSV to JSON Converter (`convertCsvToJson.js`)
- Converts cleansed database CSV to structured JSON format
- Processes full Wix URLs from "Upload vehicle images" column
- Creates organized JSON structure with owner, vehicle, and images sections
- Handles semicolon-separated image URLs and titles
- Provides detailed conversion statistics

### Catalog CSV to JSON Converter (`convertCatalogCsvToJson.js`)
- Converts catalog products CSV to structured JSON format
- Processes product options, additional info, and custom fields
- Creates organized JSON structure with product, pricing, inventory, and display sections
- Handles semicolon-separated image URLs and collections
- Provides detailed conversion statistics

## Setup

1. Install dependencies:
```bash
npm install
```

## Usage

### Process Vehicle Images (JSON)
```bash
npm start
# or
npm run process
# or
node scripts/processImages.js
```

### Process Catalog Images (CSV)
```bash
npm run process-catalog
# or
node scripts/processCatalogImages.js
```

### Convert CSV to JSON
```bash
npm run convert-csv
# or
node scripts/convertCsvToJson.js
```

### Convert Catalog CSV to JSON
```bash
npm run convert-catalog
# or
node scripts/convertCatalogCsvToJson.js
```

## Input Files

### Vehicle Processor
- **Input**: `data/test.json` or `data/submission.from.1march.2025.json`
- **Format**: JSON array of vehicle objects with `upload_vehicle_images` field

### Catalog Processor  
- **Input**: `data/web_site_catalog_products.csv`
- **Format**: CSV with `productImageUrl` field containing semicolon-separated image filenames

### CSV to JSON Converter
- **Input**: `data/cleansed_database.csv`
- **Format**: CSV with vehicle data and full Wix URLs in "Upload vehicle images" column

### Catalog CSV to JSON Converter
- **Input**: `data/web_site_catalog_products.csv`
- **Format**: CSV with product data, options, and image filenames

## Output

### Vehicle Processor Output
1. **`images/`** - Directory containing all downloaded vehicle images
2. **`data/processed_vehicles.json`** - All vehicle data with updated local image paths
3. **`data/vehicles_without_images.json`** - Vehicles that don't have any images

### Catalog Processor Output
1. **`catalog_images/`** - Directory containing all downloaded catalog images
2. **`data/processed_catalog_products.json`** - All catalog products with updated local image paths
3. **`data/catalog_products_without_images.json`** - Products that don't have any images

### CSV to JSON Converter Output
1. **`data/cleansed_database.json`** - Structured JSON with organized vehicle data

### Catalog CSV to JSON Converter Output
1. **`data/catalog_products.json`** - Structured JSON with organized product data

## File Structure

```
SpokeHire/
├── data/
│   ├── test.json                           # Vehicle input file
│   ├── submission.from.1march.2025.json    # Large vehicle input file
│   ├── web_site_catalog_products.csv       # Catalog input file
│   ├── cleansed_database.csv               # Cleansed database input file
│   ├── cleansed_database.json              # Output: converted JSON
│   ├── catalog_products.json               # Output: catalog products JSON
│   ├── processed_vehicles.json             # Output: vehicles with images
│   ├── vehicles_without_images.json        # Output: vehicles without images
│   ├── processed_catalog_products.json     # Output: catalog products with images
│   └── catalog_products_without_images.json # Output: catalog products without images
├── images/                                 # Downloaded vehicle images
├── catalog_images/                         # Downloaded catalog images
├── scripts/
│   ├── processImages.js                    # Vehicle processing script
│   ├── processCatalogImages.js             # Catalog processing script
│   ├── convertCsvToJson.js                 # CSV to JSON converter
│   ├── convertCatalogCsvToJson.js          # Catalog CSV to JSON converter
│   └── testNoImages.js                     # Test script for vehicles
├── package.json
└── README.md
```

## Script Features

- **Error Handling**: Continues processing even if some images fail to download
- **Duplicate Prevention**: Avoids downloading the same image multiple times
- **Progress Logging**: Shows detailed progress for each vehicle and image
- **Safe Filenames**: Creates safe filenames from URLs
- **Timeout Protection**: 30-second timeout for image downloads
- **Summary Report**: Shows statistics at the end

## Dependencies

- `axios` - HTTP client for downloading images
- `csv-parser` - CSV file parsing
- `fs-extra` - Enhanced file system operations
- `path` - Node.js path utilities

## Key Features

### Both Scripts Include:
- **Error Handling**: Continues processing even if some images fail to download
- **Duplicate Prevention**: Avoids downloading the same image multiple times
- **File Existence Check**: Skips images that already exist locally
- **Progress Logging**: Shows detailed progress for each item and image
- **Safe Filenames**: Creates safe filenames from URLs
- **Timeout Protection**: 30-second timeout for image downloads
- **Summary Report**: Shows statistics at the end

### Catalog-Specific Features:
- **CSV Parsing**: Handles large CSV files efficiently
- **Wix URL Construction**: Builds full URLs from image filenames
- **Semicolon Separation**: Handles multiple images per product
- **Separate Output Directory**: Keeps catalog images separate from vehicle images
