import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface DetectionBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface Detection {
  label: string;
  box: DetectionBox;
  score: number;
}

interface DetectionFile {
  filename: string;
  detections: Detection[];
}

interface CarAnalysis {
  filename: string;
  imageWidth: number;
  imageHeight: number;
  totalImageArea: number;
  carDetections: Detection[];
  biggestCar: Detection | null;
  biggestCarArea: number;
  biggestCarPercentage: number;
  personDetections: Detection[];
  biggestPerson: Detection | null;
  biggestPersonArea: number;
  biggestPersonPercentage: number;
  hasSignificantPerson: boolean;
  isMobileScreenshot: boolean;
  mobileDeviceType: string | null;
  isSmallSize: boolean;
  error?: string;
}

async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imagePath).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image dimensions');
    }
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    throw new Error(`Failed to read image dimensions: ${error}`);
  }
}

function calculateBoxArea(box: DetectionBox): number {
  return (box.xmax - box.xmin) * (box.ymax - box.ymin);
}

function findBiggestCar(detections: Detection[]): Detection | null {
  const vehicleDetections = detections.filter(detection => 
    detection.label === 'car' || detection.label === 'truck' || detection.label === 'bus' || detection.label === 'motorcycle'
  );
  
  if (vehicleDetections.length === 0) {
    return null;
  }

  return vehicleDetections.reduce((biggest, current) => {
    const biggestArea = calculateBoxArea(biggest.box);
    const currentArea = calculateBoxArea(current.box);
    return currentArea > biggestArea ? current : biggest;
  });
}

function findBiggestPerson(detections: Detection[]): Detection | null {
  const personDetections = detections.filter(detection => detection.label === 'person');
  
  if (personDetections.length === 0) {
    return null;
  }

  return personDetections.reduce((biggest, current) => {
    const biggestArea = calculateBoxArea(biggest.box);
    const currentArea = calculateBoxArea(current.box);
    return currentArea > biggestArea ? current : biggest;
  });
}

function detectMobileScreenshot(width: number, height: number): { isMobile: boolean; deviceType: string | null } {
  // Common mobile device screen dimensions (width x height)
  const mobileDimensions = [
    // iPhone models
    { width: 1170, height: 2532, device: 'iPhone 14 Pro Max' },
    { width: 1179, height: 2556, device: 'iPhone 15 Pro Max' },
    { width: 1125, height: 2436, device: 'iPhone X/XS/11 Pro' },
    { width: 1242, height: 2688, device: 'iPhone XS Max/11 Pro Max' },
    { width: 828, height: 1792, device: 'iPhone XR/11' },
    { width: 750, height: 1334, device: 'iPhone 6/7/8' },
    { width: 1080, height: 1920, device: 'iPhone 6/7/8 Plus' },
    { width: 1170, height: 2532, device: 'iPhone 12/13/14' },
    { width: 1284, height: 2778, device: 'iPhone 12/13/14 Pro Max' },
    { width: 1179, height: 2556, device: 'iPhone 15/15 Plus' },
    { width: 1290, height: 2796, device: 'iPhone 15 Pro Max' },
    
    // Android models (common resolutions)
    { width: 1080, height: 1920, device: 'Android 1080p' },
    { width: 1440, height: 2560, device: 'Android 1440p' },
    { width: 720, height: 1280, device: 'Android 720p' },
    { width: 1080, height: 2340, device: 'Android 19.5:9' },
    { width: 1080, height: 2400, device: 'Android 20:9' },
    { width: 1440, height: 3200, device: 'Android 20:9 1440p' },
    { width: 1080, height: 2408, device: 'Samsung Galaxy S21' },
    { width: 1440, height: 3200, device: 'Samsung Galaxy S21 Ultra' },
    { width: 1080, height: 2400, device: 'Google Pixel 6' },
    { width: 1080, height: 2400, device: 'OnePlus 9' },
    
    // Check both orientations
    { width: 2532, height: 1170, device: 'iPhone 14 Pro Max (landscape)' },
    { width: 2556, height: 1179, device: 'iPhone 15 Pro Max (landscape)' },
    { width: 2436, height: 1125, device: 'iPhone X/XS/11 Pro (landscape)' },
    { width: 2688, height: 1242, device: 'iPhone XS Max/11 Pro Max (landscape)' },
    { width: 1792, height: 828, device: 'iPhone XR/11 (landscape)' },
    { width: 1334, height: 750, device: 'iPhone 6/7/8 (landscape)' },
    { width: 1920, height: 1080, device: 'iPhone 6/7/8 Plus (landscape)' },
    { width: 2532, height: 1170, device: 'iPhone 12/13/14 (landscape)' },
    { width: 2778, height: 1284, device: 'iPhone 12/13/14 Pro Max (landscape)' },
    { width: 2556, height: 1179, device: 'iPhone 15/15 Plus (landscape)' },
    { width: 2796, height: 1290, device: 'iPhone 15 Pro Max (landscape)' },
    { width: 1920, height: 1080, device: 'Android 1080p (landscape)' },
    { width: 2560, height: 1440, device: 'Android 1440p (landscape)' },
    { width: 1280, height: 720, device: 'Android 720p (landscape)' },
    { width: 2340, height: 1080, device: 'Android 19.5:9 (landscape)' },
    { width: 2400, height: 1080, device: 'Android 20:9 (landscape)' },
    { width: 3200, height: 1440, device: 'Android 20:9 1440p (landscape)' },
    { width: 2408, height: 1080, device: 'Samsung Galaxy S21 (landscape)' },
    { width: 3200, height: 1440, device: 'Samsung Galaxy S21 Ultra (landscape)' },
    { width: 2400, height: 1080, device: 'Google Pixel 6 (landscape)' },
    { width: 2400, height: 1080, device: 'OnePlus 9 (landscape)' }
  ];
  
  // Check for exact match
  const exactMatch = mobileDimensions.find(dim => dim.width === width && dim.height === height);
  if (exactMatch) {
    return { isMobile: true, deviceType: exactMatch.device };
  }
  
  // Check for close match (within 10 pixels tolerance)
  const closeMatch = mobileDimensions.find(dim => 
    Math.abs(dim.width - width) <= 10 && Math.abs(dim.height - height) <= 10
  );
  if (closeMatch) {
    return { isMobile: true, deviceType: `${closeMatch.device} (approximate)` };
  }
  
  return { isMobile: false, deviceType: null };
}

function detectSmallSize(width: number, height: number): boolean {
  // Consider images smaller than 800x800 as too small for vehicle analysis
  return width < 800 || height < 800;
}

async function analyzeDetectionFile(detectionPath: string, imagePath: string): Promise<CarAnalysis> {
  try {
    // Read detection data
    const detectionData: DetectionFile = JSON.parse(fs.readFileSync(detectionPath, 'utf-8'));
    
    // Get image dimensions
    const { width, height } = await getImageDimensions(imagePath);
    
    // Filter vehicle detections (cars, trucks, buses, and motorcycles)
    const carDetections = detectionData.detections.filter(detection => 
      detection.label === 'car' || detection.label === 'truck' || detection.label === 'bus' || detection.label === 'motorcycle'
    );
    
    // Filter person detections
    const personDetections = detectionData.detections.filter(detection => 
      detection.label === 'person'
    );
    
    // Find biggest car and person
    const biggestCar = findBiggestCar(detectionData.detections);
    const biggestPerson = findBiggestPerson(detectionData.detections);
    
    // Calculate areas and percentages
    const totalImageArea = width * height;
    const biggestCarArea = biggestCar ? calculateBoxArea(biggestCar.box) : 0;
    const biggestCarPercentage = biggestCar ? (biggestCarArea / totalImageArea) * 100 : 0;
    
    const biggestPersonArea = biggestPerson ? calculateBoxArea(biggestPerson.box) : 0;
    const biggestPersonPercentage = biggestPerson ? (biggestPersonArea / totalImageArea) * 100 : 0;
    
    // Check if person takes up significant space (>10%)
    const hasSignificantPerson = biggestPersonPercentage > 10;
    
    // Check if this is a mobile screenshot
    const { isMobile, deviceType } = detectMobileScreenshot(width, height);
    
    // Check if image is too small for vehicle analysis
    const isSmallSize = detectSmallSize(width, height);
    
    return {
      filename: detectionData.filename,
      imageWidth: width,
      imageHeight: height,
      totalImageArea,
      carDetections,
      biggestCar,
      biggestCarArea,
      biggestCarPercentage,
      personDetections,
      biggestPerson,
      biggestPersonArea,
      biggestPersonPercentage,
      hasSignificantPerson,
      isMobileScreenshot: isMobile,
      mobileDeviceType: deviceType,
      isSmallSize
    };
  } catch (error) {
    return {
      filename: path.basename(detectionPath),
      imageWidth: 0,
      imageHeight: 0,
      totalImageArea: 0,
      carDetections: [],
      biggestCar: null,
      biggestCarArea: 0,
      biggestCarPercentage: 0,
      personDetections: [],
      biggestPerson: null,
      biggestPersonArea: 0,
      biggestPersonPercentage: 0,
      hasSignificantPerson: false,
      isMobileScreenshot: false,
      mobileDeviceType: null,
      isSmallSize: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  const detectionsDir = path.join(process.cwd(), 'public', 'detections');
  const imagesDir = path.join(process.cwd(), 'public', 'car-images');
  const outputPath = path.join(process.cwd(), 'data', 'car-detection-analysis.json');
  
  console.log('Starting car detection analysis...');
  console.log(`Detections directory: ${detectionsDir}`);
  console.log(`Images directory: ${imagesDir}`);
  console.log(`Output path: ${outputPath}`);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all detection files
  const detectionFiles = fs.readdirSync(detectionsDir).filter(file => file.endsWith('.json'));
  console.log(`Found ${detectionFiles.length} detection files`);
  
  const analyses: CarAnalysis[] = [];
  let processed = 0;
  let errors = 0;
  
  for (const detectionFile of detectionFiles) {
    const detectionPath = path.join(detectionsDir, detectionFile);
    
    // Find corresponding image file
    const baseName = path.basename(detectionFile, '.json');
    const imageExtensions = ['.jpeg', '.jpg', '.png'];
    let imagePath: string | null = null;
    
    for (const ext of imageExtensions) {
      const potentialImagePath = path.join(imagesDir, baseName + ext);
      if (fs.existsSync(potentialImagePath)) {
        imagePath = potentialImagePath;
        break;
      }
    }
    
    if (!imagePath) {
      console.warn(`No corresponding image found for ${detectionFile}`);
      analyses.push({
        filename: baseName,
        imageWidth: 0,
        imageHeight: 0,
        totalImageArea: 0,
        carDetections: [],
        biggestCar: null,
        biggestCarArea: 0,
        biggestCarPercentage: 0,
        error: 'No corresponding image found'
      });
      errors++;
      continue;
    }
    
    try {
      const analysis = await analyzeDetectionFile(detectionPath, imagePath);
      analyses.push(analysis);
      
      if (analysis.error) {
        errors++;
        console.warn(`Error processing ${detectionFile}: ${analysis.error}`);
      } else {
        console.log(`Processed ${detectionFile}: ${analysis.carDetections.length} cars, biggest: ${analysis.biggestCarPercentage.toFixed(2)}%`);
      }
    } catch (error) {
      console.error(`Failed to process ${detectionFile}:`, error);
      errors++;
    }
    
    processed++;
    if (processed % 100 === 0) {
      console.log(`Processed ${processed}/${detectionFiles.length} files...`);
    }
  }
  
  // Save results
  const results = {
    summary: {
      totalFiles: detectionFiles.length,
      processedFiles: processed,
      errorFiles: errors,
      successfulFiles: processed - errors,
      timestamp: new Date().toISOString()
    },
    analyses
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Analysis Complete ===');
  console.log(`Total files: ${results.summary.totalFiles}`);
  console.log(`Successfully processed: ${results.summary.successfulFiles}`);
  console.log(`Errors: ${results.summary.errorFiles}`);
  console.log(`Results saved to: ${outputPath}`);
  
  // Print some statistics
  const successfulAnalyses = analyses.filter(a => !a.error);
  if (successfulAnalyses.length > 0) {
    const percentages = successfulAnalyses.map(a => a.biggestCarPercentage);
    const avgPercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const maxPercentage = Math.max(...percentages);
    const minPercentage = Math.min(...percentages);
    
    console.log('\n=== Statistics ===');
    console.log(`Average biggest car percentage: ${avgPercentage.toFixed(2)}%`);
    console.log(`Maximum biggest car percentage: ${maxPercentage.toFixed(2)}%`);
    console.log(`Minimum biggest car percentage: ${minPercentage.toFixed(2)}%`);
    
    const imagesWithCars = successfulAnalyses.filter(a => a.carDetections.length > 0);
    console.log(`Images with car detections: ${imagesWithCars.length}/${successfulAnalyses.length}`);
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { analyzeDetectionFile, CarAnalysis };
