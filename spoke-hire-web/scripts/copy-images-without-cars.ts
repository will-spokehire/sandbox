import fs from 'fs';
import path from 'path';

interface CarAnalysis {
  filename: string;
  imageWidth: number;
  imageHeight: number;
  totalImageArea: number;
  carDetections: any[];
  biggestCar: any | null;
  biggestCarArea: number;
  biggestCarPercentage: number;
  personDetections: any[];
  biggestPerson: any | null;
  biggestPersonArea: number;
  biggestPersonPercentage: number;
  hasSignificantPerson: boolean;
  isMobileScreenshot: boolean;
  mobileDeviceType: string | null;
  isSmallSize: boolean;
  error?: string;
}

interface AnalysisResults {
  summary: {
    totalFiles: number;
    processedFiles: number;
    errorFiles: number;
    successfulFiles: number;
    timestamp: string;
  };
  analyses: CarAnalysis[];
}

async function copyImagesWithoutCars() {
  const analysisFilePath = path.join(process.cwd(), 'data', 'car-detection-analysis.json');
  const sourceImagesDir = path.join(process.cwd(), 'public', 'car-images');
  const outputDir = path.join(process.cwd(), 'public', 'images-without-cars');
  
  if (!fs.existsSync(analysisFilePath)) {
    console.error('Car detection analysis file not found. Please run the analysis script first.');
    console.log('Run: npm run analyze-car-detections');
    process.exit(1);
  }
  
  if (!fs.existsSync(sourceImagesDir)) {
    console.error('Source images directory not found:', sourceImagesDir);
    process.exit(1);
  }
  
  console.log('Loading car detection analysis data...');
  const analysisData: AnalysisResults = JSON.parse(fs.readFileSync(analysisFilePath, 'utf-8'));
  
  // Filter images without vehicles OR with significant person coverage (>10%) OR mobile screenshots OR small size
  const imagesWithoutCars = analysisData.analyses.filter(analysis => 
    !analysis.error && (analysis.carDetections.length === 0 || analysis.hasSignificantPerson || analysis.isMobileScreenshot || analysis.isSmallSize)
  );
  
  console.log(`Found ${imagesWithoutCars.length} images without vehicles (cars/trucks/buses/motorcycles)`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }
  
  let copied = 0;
  let errors = 0;
  const errorLog: string[] = [];
  
  console.log('\nStarting to copy images...');
  
  for (const imageInfo of imagesWithoutCars) {
    const sourcePath = path.join(sourceImagesDir, imageInfo.filename);
    const destPath = path.join(outputDir, imageInfo.filename);
    
    try {
      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        const errorMsg = `Source file not found: ${imageInfo.filename}`;
        console.warn(`⚠️  ${errorMsg}`);
        errorLog.push(errorMsg);
        errors++;
        continue;
      }
      
      // Check if destination already exists
      if (fs.existsSync(destPath)) {
        console.log(`⏭️  Skipping ${imageInfo.filename} (already exists)`);
        continue;
      }
      
      // Copy the file
      fs.copyFileSync(sourcePath, destPath);
      copied++;
      
      if (copied % 50 === 0) {
        console.log(`📁 Copied ${copied}/${imagesWithoutCars.length} images...`);
      }
      
    } catch (error) {
      const errorMsg = `Failed to copy ${imageInfo.filename}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      errorLog.push(errorMsg);
      errors++;
    }
  }
  
  // Create a summary file in the output directory
  const summaryPath = path.join(outputDir, 'copy-summary.txt');
  const summary = [
    `Images Without Vehicles (Cars/Trucks/Buses/Motorcycles) - Copy Summary`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Total images without vehicles: ${imagesWithoutCars.length}`,
    `Successfully copied: ${copied}`,
    `Errors: ${errors}`,
    `Skipped (already exists): ${imagesWithoutCars.length - copied - errors}`,
    ``,
    `Source directory: ${sourceImagesDir}`,
    `Destination directory: ${outputDir}`,
    ``,
    `Image dimensions distribution:`,
    ...getDimensionDistribution(imagesWithoutCars).map(([dim, count]) => 
      `  ${dim}: ${count} images`
    ),
    ``,
    `Errors:`,
    ...errorLog.map(error => `  ${error}`)
  ].join('\n');
  
  fs.writeFileSync(summaryPath, summary);
  
  console.log('\n=== Copy Complete ===');
  console.log(`✅ Successfully copied: ${copied} images`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⏭️  Skipped (already exists): ${imagesWithoutCars.length - copied - errors}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`📄 Summary file: ${summaryPath}`);
  
  if (errors > 0) {
    console.log(`\n⚠️  ${errors} errors occurred. Check the summary file for details.`);
  }
  
  // Show some statistics
  const dimensionStats = getDimensionDistribution(imagesWithoutCars);
  console.log('\n=== Copied Images Without Vehicles by Dimensions ===');
  dimensionStats.slice(0, 10).forEach(([dimensions, count]) => {
    console.log(`${dimensions}: ${count} images`);
  });
}

function getDimensionDistribution(images: CarAnalysis[]): [string, number][] {
  const dimensionGroups: { [key: string]: number } = {};
  images.forEach(img => {
    const key = `${img.imageWidth}x${img.imageHeight}`;
    dimensionGroups[key] = (dimensionGroups[key] || 0) + 1;
  });
  
  return Object.entries(dimensionGroups)
    .sort(([,a], [,b]) => b - a);
}

async function main() {
  try {
    await copyImagesWithoutCars();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { copyImagesWithoutCars };
