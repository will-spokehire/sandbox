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

async function listImagesWithoutCars() {
  const analysisFilePath = path.join(process.cwd(), 'data', 'car-detection-analysis.json');
  
  if (!fs.existsSync(analysisFilePath)) {
    console.error('Car detection analysis file not found. Please run the analysis script first.');
    console.log('Run: npm run analyze-car-detections');
    process.exit(1);
  }
  
  console.log('Loading car detection analysis data...');
  const analysisData: AnalysisResults = JSON.parse(fs.readFileSync(analysisFilePath, 'utf-8'));
  
  // Filter images without vehicles OR with significant person coverage (>10%) OR mobile screenshots OR small size
  // These should be considered as "no-coverage" for vehicle analysis
  const imagesWithoutCars = analysisData.analyses.filter(analysis => 
    !analysis.error && (analysis.carDetections.length === 0 || analysis.hasSignificantPerson || analysis.isMobileScreenshot || analysis.isSmallSize)
  );
  
  console.log(`\n=== Images Without Vehicles (Cars/Trucks/Buses/Motorcycles) ===`);
  console.log(`Total images analyzed: ${analysisData.analyses.length}`);
  console.log(`Images without vehicles: ${imagesWithoutCars.length}`);
  console.log(`Percentage without vehicles: ${((imagesWithoutCars.length / analysisData.analyses.length) * 100).toFixed(2)}%`);
  
  // Show breakdown of why images are in no-coverage group
  const imagesWithoutVehicles = analysisData.analyses.filter(analysis => 
    !analysis.error && analysis.carDetections.length === 0 && !analysis.isMobileScreenshot && !analysis.isSmallSize
  );
  const imagesWithSignificantPerson = analysisData.analyses.filter(analysis => 
    !analysis.error && analysis.carDetections.length > 0 && analysis.hasSignificantPerson && !analysis.isMobileScreenshot && !analysis.isSmallSize
  );
  const mobileScreenshots = analysisData.analyses.filter(analysis => 
    !analysis.error && analysis.isMobileScreenshot
  );
  const smallSizeImages = analysisData.analyses.filter(analysis => 
    !analysis.error && analysis.isSmallSize
  );
  
  console.log(`\n=== Breakdown ===`);
  console.log(`Images with no vehicle detections: ${imagesWithoutVehicles.length}`);
  console.log(`Images with vehicles but significant person coverage (>10%): ${imagesWithSignificantPerson.length}`);
  console.log(`Mobile screenshots: ${mobileScreenshots.length}`);
  console.log(`Small size images (<800x800): ${smallSizeImages.length}`);
  
  // Create output files
  const outputDir = path.join(process.cwd(), 'data');
  const jsonOutputPath = path.join(outputDir, 'images-without-cars.json');
  const txtOutputPath = path.join(outputDir, 'images-without-cars.txt');
  const csvOutputPath = path.join(outputDir, 'images-without-cars.csv');
  
  // JSON output with full details
  const jsonOutput = {
    summary: {
      totalImages: analysisData.analyses.length,
      imagesWithoutCars: imagesWithoutCars.length,
      percentageWithoutCars: (imagesWithoutCars.length / analysisData.analyses.length) * 100,
      generatedAt: new Date().toISOString()
    },
    images: imagesWithoutCars.map(img => ({
      filename: img.filename,
      imageWidth: img.imageWidth,
      imageHeight: img.imageHeight,
      totalImageArea: img.totalImageArea
    }))
  };
  
  fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonOutput, null, 2));
  
  // Simple text list
  const txtOutput = imagesWithoutCars.map(img => img.filename).join('\n');
  fs.writeFileSync(txtOutputPath, txtOutput);
  
  // CSV output
  const csvHeader = 'filename,imageWidth,imageHeight,totalImageArea\n';
  const csvRows = imagesWithoutCars.map(img => 
    `${img.filename},${img.imageWidth},${img.imageHeight},${img.totalImageArea}`
  ).join('\n');
  const csvOutput = csvHeader + csvRows;
  fs.writeFileSync(csvOutputPath, csvOutput);
  
  console.log(`\n=== Output Files Created ===`);
  console.log(`JSON (with details): ${jsonOutputPath}`);
  console.log(`Text list: ${txtOutputPath}`);
  console.log(`CSV: ${csvOutputPath}`);
  
  // Show first 20 images as preview
  console.log(`\n=== Preview (First 20 Images Without Vehicles) ===`);
  imagesWithoutCars.slice(0, 20).forEach((img, index) => {
    console.log(`${index + 1}. ${img.filename} (${img.imageWidth}x${img.imageHeight})`);
  });
  
  if (imagesWithoutCars.length > 20) {
    console.log(`... and ${imagesWithoutCars.length - 20} more images`);
  }
  
  // Group by image dimensions for analysis
  const dimensionGroups: { [key: string]: number } = {};
  imagesWithoutCars.forEach(img => {
    const key = `${img.imageWidth}x${img.imageHeight}`;
    dimensionGroups[key] = (dimensionGroups[key] || 0) + 1;
  });
  
  console.log(`\n=== Images Without Vehicles by Dimensions ===`);
  Object.entries(dimensionGroups)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([dimensions, count]) => {
      console.log(`${dimensions}: ${count} images`);
    });
}

async function main() {
  try {
    await listImagesWithoutCars();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { listImagesWithoutCars };
