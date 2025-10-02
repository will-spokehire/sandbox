const {
  FileUtils,
  DataTransformer,
  Logger
} = require('../lib');

class CsvToJsonConverter {
  constructor() {
    this.fileUtils = new FileUtils();
    this.dataTransformer = new DataTransformer();
    this.logger = new Logger('CSV-to-JSON Converter');

    this.inputFile = 'cleansed_database.csv';
    this.outputFile = 'cleansed_database.json';
  }

  async convertRecordToJson(csvRecord) {
    // Process the image URLs using the library
    const imageUrls = this.dataTransformer.processImageUrls(csvRecord['Upload vehicle images']);
    const imageTitles = this.dataTransformer.processImageTitles(csvRecord['Image Titles']);

    // Create a clean JSON object with proper field names
    const jsonRecord = {
      wixId: csvRecord['Wix ID'],
      submissionTime: csvRecord['Submission time'],
      owner: {
        firstName: csvRecord['First name'],
        lastName: csvRecord['Last name'],
        email: csvRecord['Email'],
        phone: csvRecord['Phone'],
        address: {
          street: csvRecord['Street address'],
          city: csvRecord['City'],
          county: csvRecord['County'],
          postcode: csvRecord['Postcode'],
          country: csvRecord['Country']
        }
      },
      vehicle: {
        registration: csvRecord['Registration'],
        yearOfManufacture: csvRecord['Year of manufacture'],
        make: csvRecord['Make'],
        model: csvRecord['Model'],
        engineCapacity: csvRecord['Engine capacity'],
        numberOfSeats: csvRecord['Number of seats'],
        steering: csvRecord['Steering'],
        gearbox: csvRecord['Gearbox'],
        exteriorColour: csvRecord['Exterior Colour'],
        interiorColour: csvRecord['Interior Colour'],
        condition: csvRecord['Describe the condition'],
        isRoadLegal: csvRecord['Is this vehicle road legal?'],
        ownerConfirmation: csvRecord['I confirm I am the legal owner of this vehicle.']
      },
      images: {
        urls: imageUrls,
        titles: imageTitles,
        count: imageUrls.length
      }
    };

    return jsonRecord;
  }

  async convert() {
    try {
      this.logger.section('Starting CSV to JSON conversion');

      // Read and parse CSV file using the library
      this.logger.step('Reading CSV file');
      const csvRecords = await this.fileUtils.readCsvFile(this.inputFile);

      this.logger.step(`Converting ${csvRecords.length} records to JSON format`);

      const jsonRecords = [];
      for (let i = 0; i < csvRecords.length; i++) {
        if (i % 100 === 0) {
          this.logger.progress(i + 1, csvRecords.length, 'records');
        }
        const convertedRecord = await this.convertRecordToJson(csvRecords[i]);
        jsonRecords.push(convertedRecord);
      }

      // Save JSON file using the library
      this.logger.step('Writing JSON file');
      await this.fileUtils.writeJsonFile(this.outputFile, jsonRecords);

      // Generate summary statistics
      const totalImages = jsonRecords.reduce((sum, record) => sum + record.images.count, 0);
      const recordsWithImages = jsonRecords.filter(record => record.images.count > 0).length;
      const recordsWithoutImages = jsonRecords.length - recordsWithImages;

      this.logger.section('Conversion Summary');
      this.logger.info(`Total records converted: ${jsonRecords.length}`);
      this.logger.info(`Records with images: ${recordsWithImages}`);
      this.logger.info(`Records without images: ${recordsWithoutImages}`);
      this.logger.info(`Total images: ${totalImages}`);

      this.logger.success('CSV to JSON conversion completed successfully!');

    } catch (error) {
      this.logger.error('Conversion failed:', error);
      process.exit(1);
    }
  }
}

// Run the converter
if (require.main === module) {
  const converter = new CsvToJsonConverter();
  converter.convert();
}

module.exports = CsvToJsonConverter;
