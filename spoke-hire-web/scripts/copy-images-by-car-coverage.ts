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

interface CoverageGrade {
  name: string;
  minPercentage: number;
  maxPercentage: number;
  description: string;
  images: CarAnalysis[];
}

async function copyImagesByCarCoverage() {
  const analysisFilePath = path.join(process.cwd(), 'data', 'car-detection-analysis.json');
  const sourceImagesDir = path.join(process.cwd(), 'public', 'car-images');
  const outputBaseDir = path.join(process.cwd(), 'public', 'images-by-coverage');
  
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
  
  // Filter images with vehicles (cars, trucks, buses, or motorcycles) AND no significant person coverage AND not mobile screenshots AND not small size
  const imagesWithVehicles = analysisData.analyses.filter(analysis => 
    !analysis.error && analysis.carDetections.length > 0 && !analysis.hasSignificantPerson && !analysis.isMobileScreenshot && !analysis.isSmallSize
  );
  
  // Filter images without vehicles OR with significant person coverage (>10%) OR mobile screenshots OR small size
  const imagesWithoutVehicles = analysisData.analyses.filter(analysis => 
    !analysis.error && (analysis.carDetections.length === 0 || analysis.hasSignificantPerson || analysis.isMobileScreenshot || analysis.isSmallSize)
  );
  
  console.log(`Found ${imagesWithVehicles.length} images with vehicles`);
  console.log(`Found ${imagesWithoutVehicles.length} images without vehicles`);
  
  // Define coverage grades
  const grades: CoverageGrade[] = [
    {
      name: 'no-coverage',
      minPercentage: 0,
      maxPercentage: 0,
      description: 'No vehicle detections (0%)',
      images: imagesWithoutVehicles
    },
    {
      name: 'low-coverage',
      minPercentage: 0,
      maxPercentage: 15,
      description: 'Low coverage (0%-15% of space by biggest vehicle)',
      images: []
    },
    {
      name: 'medium-coverage',
      minPercentage: 15,
      maxPercentage: 50,
      description: 'Medium coverage (15%-50% of space by biggest vehicle)',
      images: []
    },
    {
      name: 'high-coverage',
      minPercentage: 50,
      maxPercentage: 100,
      description: 'High coverage (50%+ of space by biggest vehicle)',
      images: []
    }
  ];
  
  // Categorize images by coverage percentage (skip no-coverage as it's already populated)
  imagesWithVehicles.forEach(image => {
    const percentage = image.biggestCarPercentage;
    
    for (const grade of grades) {
      if (grade.name === 'no-coverage') continue; // Skip no-coverage
      
      if (percentage > grade.minPercentage && percentage <= grade.maxPercentage) {
        grade.images.push(image);
        break;
      }
    }
  });
  
  // Sort images within each grade by percentage (ascending for low/medium, descending for high, filename for no-coverage)
  grades.forEach(grade => {
    if (grade.name === 'high-coverage') {
      grade.images.sort((a, b) => b.biggestCarPercentage - a.biggestCarPercentage);
    } else if (grade.name === 'no-coverage') {
      grade.images.sort((a, b) => a.filename.localeCompare(b.filename));
    } else {
      grade.images.sort((a, b) => a.biggestCarPercentage - b.biggestCarPercentage);
    }
  });
  
  // Create output directories
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
    console.log(`Created output directory: ${outputBaseDir}`);
  }
  
  // Process each grade
  for (const grade of grades) {
    const gradeDir = path.join(outputBaseDir, grade.name);
    if (!fs.existsSync(gradeDir)) {
      fs.mkdirSync(gradeDir, { recursive: true });
    }
    
    console.log(`\n=== Processing ${grade.description} ===`);
    console.log(`Total images in this grade: ${grade.images.length}`);
    
    // Copy ALL images in this grade
    const imagesToCopy = grade.images;
    console.log(`Copying ALL ${imagesToCopy.length} images in this grade...`);
    
    let copied = 0;
    let errors = 0;
    const errorLog: string[] = [];
    
    for (const imageInfo of imagesToCopy) {
      const sourcePath = path.join(sourceImagesDir, imageInfo.filename);
      const destPath = path.join(gradeDir, imageInfo.filename);
      
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
        
        if (grade.name === 'no-coverage') {
          console.log(`📁 Copied ${imageInfo.filename} (no vehicles)`);
        } else {
          console.log(`📁 Copied ${imageInfo.filename} (${imageInfo.biggestCarPercentage.toFixed(2)}%)`);
        }
        
      } catch (error) {
        const errorMsg = `Failed to copy ${imageInfo.filename}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errorLog.push(errorMsg);
        errors++;
      }
    }
    
    // Create a summary file for this grade
    const summaryPath = path.join(gradeDir, 'grade-summary.txt');
    const summary = [
      `${grade.description} - Grade Summary`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `Grade: ${grade.name}`,
      `Coverage range: ${grade.minPercentage}% - ${grade.maxPercentage}%`,
      `Total images in grade: ${grade.images.length}`,
      `Images copied: ${copied}`,
      `Errors: ${errors}`,
      ``,
      `All images (${imagesToCopy.length}):`,
      ...imagesToCopy.map((img, index) => 
        grade.name === 'no-coverage' 
          ? `${index + 1}. ${img.filename} - no vehicles (${img.imageWidth}x${img.imageHeight})`
          : `${index + 1}. ${img.filename} - ${img.biggestCarPercentage.toFixed(2)}% (${img.imageWidth}x${img.imageHeight})`
      ),
      ``,
      `Statistics for this grade:`,
      ...(grade.name === 'no-coverage' 
        ? [`  No vehicle detections: ${grade.images.length} images`]
        : [
            `  Average coverage: ${(grade.images.reduce((sum, img) => sum + img.biggestCarPercentage, 0) / grade.images.length).toFixed(2)}%`,
            `  Min coverage: ${Math.min(...grade.images.map(img => img.biggestCarPercentage)).toFixed(2)}%`,
            `  Max coverage: ${Math.max(...grade.images.map(img => img.biggestCarPercentage)).toFixed(2)}%`
          ]
      ),
      ``,
      `Errors:`,
      ...errorLog.map(error => `  ${error}`)
    ].join('\n');
    
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`✅ Successfully copied: ${copied} images`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📄 Summary saved to: ${summaryPath}`);
  }
  
  // Create overall summary
  const overallSummaryPath = path.join(outputBaseDir, 'overall-summary.txt');
  const overallSummary = [
    `Car Coverage Analysis - Overall Summary`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Total images analyzed: ${analysisData.analyses.length}`,
    `Images with vehicles: ${imagesWithVehicles.length}`,
    `Images without vehicles: ${imagesWithoutVehicles.length}`,
    ``,
    `Coverage Grades:`,
    ...grades.map(grade => {
      const totalImages = analysisData.analyses.length;
      const percentage = (grade.images.length / totalImages * 100).toFixed(1);
      return `  ${grade.description}: ${grade.images.length} images (${percentage}%)`;
    }),
    ``,
    `All images copied:`,
    ...grades.map(grade => 
      `  ${grade.name}/: ${grade.images.length} images`
    ),
    ``,
    `Directory structure:`,
    `  ${outputBaseDir}/`,
    ...grades.map(grade => 
      `    ${grade.name}/ - ${grade.description}`
    )
  ].join('\n');
  
  fs.writeFileSync(overallSummaryPath, overallSummary);
  
  console.log('\n=== Overall Summary ===');
  console.log(`📁 Output directory: ${outputBaseDir}`);
  console.log(`📄 Overall summary: ${overallSummaryPath}`);
  
  grades.forEach(grade => {
    const totalImages = analysisData.analyses.length;
    const percentage = (grade.images.length / totalImages * 100).toFixed(1);
    console.log(`${grade.description}: ${grade.images.length} images (${percentage}%)`);
  });
  
  console.log('\n=== Directory Structure ===');
  console.log(`${outputBaseDir}/`);
  grades.forEach(grade => {
    console.log(`  ${grade.name}/ - ${grade.description}`);
    console.log(`    - ${grade.images.length} images`);
    console.log(`    - grade-summary.txt`);
  });
  console.log(`  overall-summary.txt`);
}

async function main() {
  try {
    await copyImagesByCarCoverage();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { copyImagesByCarCoverage };
