const fs = require('fs-extra');
const path = require('path');

// Create a test JSON with some vehicles that have no images
const testDataWithNoImages = [
  {
    "first_name_1": "John",
    "last_name_de76": "Doe",
    "email_4bec": "john@example.com",
    "phone_bc17": "+44 123 456789",
    "your_address": "123 Test Street",
    "city_1": "London",
    "county_1": "Greater London",
    "postcode": "SW1A 1AA",
    "country": "England",
    "call_time": "TEST123",
    "year_of_manufacture_1": "2020",
    "make_1": "Test Car",
    "location_1": "Test Model",
    "engine_capacity": "2000cc",
    "number_of_seats_1": "5",
    "steering_1": "Right-Hand Drive",
    "gearbox_1": "Manual",
    "exterior_colour_1": "Red",
    "interior_colour_1": "Black",
    "convertible": null,
    "project_brief_1": "Test vehicle with no images",
    "upload_vehicle_images": [], // No images
    "is_this_vehicle_road_legal": "Yes",
    "form_field_a664": true,
    "first_name_5449": null,
    "last_name_b545": null,
    "email_effd": null,
    "phone_f6b1": null,
    "phone": null,
    "exterior_colour": "Red",
    "interior_colour": "Black",
    "number_of_seats": "5"
  },
  {
    "first_name_1": "Jane",
    "last_name_de76": "Smith",
    "email_4bec": "jane@example.com",
    "phone_bc17": "+44 987 654321",
    "your_address": "456 Test Avenue",
    "city_1": "Manchester",
    "county_1": "Greater Manchester",
    "postcode": "M1 1AA",
    "country": "England",
    "call_time": "TEST456",
    "year_of_manufacture_1": "2019",
    "make_1": "Another Test Car",
    "location_1": "Another Test Model",
    "engine_capacity": "1500cc",
    "number_of_seats_1": "4",
    "steering_1": "Right-Hand Drive",
    "gearbox_1": "Automatic",
    "exterior_colour_1": "Blue",
    "interior_colour_1": "Grey",
    "convertible": null,
    "project_brief_1": "Another test vehicle with no images",
    "upload_vehicle_images": null, // No images (null)
    "is_this_vehicle_road_legal": "Yes",
    "form_field_a664": true,
    "first_name_5449": null,
    "last_name_b545": null,
    "email_effd": null,
    "phone_f6b1": null,
    "phone": null,
    "exterior_colour": "Blue",
    "interior_colour": "Grey",
    "number_of_seats": "4"
  }
];

async function createTestFile() {
  const testFile = path.join(__dirname, '../data/test_no_images.json');
  await fs.writeJson(testFile, testDataWithNoImages, { spaces: 2 });
  console.log('✅ Created test file with vehicles that have no images: data/test_no_images.json');
  console.log('You can modify the processImages.js script to use this file to test the "no images" functionality.');
}

createTestFile().catch(console.error);
