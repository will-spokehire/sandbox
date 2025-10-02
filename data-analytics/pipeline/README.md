# Vehicle Catalog Processing Pipeline

This pipeline processes vehicle catalog data with sophisticated duplicate handling capabilities.

## Overview

The pipeline handles duplicate records by:
- **Keeping all records** but marking duplicates with `duplicate: true`
- **Creating unique IDs** for duplicates using format `originalId-index` (e.g., `729-1`)
- **Adding metadata** about duplicate relationships
- **Preserving original data** while enabling manual review

## Files

### Core Scripts
- `process-duplicates.js` - Main duplicate processing script
- `run-pipeline.js` - Pipeline runner with step management
- `pipeline-config.json` - Configuration for pipeline steps

### Generated Data
- `vehicle-catalog-with-duplicates.json` - Processed data with duplicate markers
- `logs/` - Pipeline execution logs
- `reports/` - Processing statistics and summaries

## Usage

### Process Duplicates Only
```bash
# Process duplicates in a specific file
node process-duplicates.js input.json output.json

# Example
node process-duplicates.js ../../spoke-hire-web/public/data/vehicle-catalog.json ../../spoke-hire-web/public/data/vehicle-catalog-with-duplicates.json
```

### Run Full Pipeline
```bash
# Run all enabled steps
node run-pipeline.js

# Run specific step
node run-pipeline.js --step process-duplicates

# Use custom config
node run-pipeline.js --config custom-config.json
```

## Duplicate Handling Strategy

### Record Structure
Each processed record includes:

```json
{
  "id": "729-1",                    // Unique ID for duplicates
  "originalId": "729",              // Original ID reference
  "duplicate": true,                // Marked as duplicate
  "duplicateIndex": 1,              // Index within duplicate group
  "hasDuplicates": false,           // Whether this ID has duplicates
  "duplicateCount": 2,              // Total count in duplicate group
  // ... rest of vehicle data
}
```

### Visual Indicators
- **Orange border + "Dup" badge**: Duplicate records
- **Blue badge with count**: Original records that have duplicates
- **Normal appearance**: Unique records

### Benefits
1. **No data loss** - All records preserved
2. **Manual review** - Easy to identify and manage duplicates
3. **Unique IDs** - Solves React key conflicts
4. **Relationship tracking** - Know which records are related
5. **Flexible processing** - Can filter, merge, or remove as needed

## Configuration

### Pipeline Steps
```json
{
  "steps": [
    {
      "id": "process-duplicates",
      "name": "Process Duplicates",
      "script": "process-duplicates.js",
      "enabled": true,
      "input": "data/input.json",
      "output": "data/output.json"
    }
  ]
}
```

### Duplicate Settings
```json
{
  "duplicateHandling": {
    "strategy": "mark-and-unique-id",
    "keepAllRecords": true,
    "markDuplicates": true,
    "createUniqueIds": true,
    "preserveOriginalId": true
  }
}
```

## Integration with T3 App

The processed data can be used directly in the T3 application:

1. **Copy processed file** to `spoke-hire-web/public/data/vehicle-catalog.json`
2. **Update types** in `src/types/vehicle.ts` (already done)
3. **Visual indicators** in `VehicleCard` component (already implemented)

## Statistics

After processing, you'll see:
- **Total records**: 1,038
- **Unique IDs**: 981
- **Duplicate groups**: 51
- **Duplicate records**: 57

## Logs and Reports

- **Execution logs**: `logs/pipeline-[timestamp].json`
- **Summary reports**: `reports/pipeline-summary-[timestamp].json`
- **Processing statistics**: Included in output metadata

## Examples

### Sample Duplicate Processing
```
Original: ID 729 (Maserati Grancab)
Processed:
  - ID 729 (original, hasDuplicates: true, duplicateCount: 2)
  - ID 729-1 (duplicate: true, duplicateIndex: 1)
```

### Pipeline Output
```
🔄 Processing duplicates in vehicle catalog...
📊 Loaded 1038 records
📈 Processing Statistics:
   Total records: 1038
   Unique IDs: 981
   IDs with duplicates: 51
   Duplicate records: 57
✅ Successfully processed duplicates!
```

## Troubleshooting

### Common Issues
1. **Input file not found**: Check file path and permissions
2. **Script not found**: Ensure `process-duplicates.js` exists
3. **Permission errors**: Check write permissions for output directory

### Debug Mode
Add `--verbose` flag to see detailed processing information.

## Future Enhancements

- [ ] Automatic duplicate merging based on rules
- [ ] Confidence scoring for duplicate detection
- [ ] Integration with database for persistent storage
- [ ] Web interface for duplicate management
- [ ] Automated cleanup workflows