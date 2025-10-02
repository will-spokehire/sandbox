const path = require('path');

/**
 * Data transformation utilities for converting between different data formats
 */
class DataTransformer {
  constructor() {
    this.baseDir = path.join(__dirname, '../../data');
  }

  /**
   * Process Wix image URLs from various formats
   * @param {string} imageUrlString - Raw image URL string
   * @returns {Array} Array of processed image URLs
   */
  processImageUrls(imageUrlString) {
    if (!imageUrlString || imageUrlString.trim() === '') {
      return [];
    }

    // Check if this is a JSON string containing Wix image objects
    if (imageUrlString.trim().startsWith('[') && imageUrlString.includes('wix:image://')) {
      try {
        const imageObjects = JSON.parse(imageUrlString);

        // Extract URLs from the image objects
        const urls = imageObjects
          .filter(obj => obj.src && obj.src.startsWith('wix:image://'))
          .map(obj => {
            const wixUrl = obj.src;
            const match = wixUrl.match(/wix:image:\/\/v1\/([^\/]+)/);
            if (match) {
              return `https://static.wixstatic.com/media/${match[1]}`;
            }
            return wixUrl;
          });

        return urls;
      } catch (error) {
        console.warn('Failed to parse JSON image string:', error.message);
      }
    }

    // Handle regular semicolon-separated URLs
    const urls = imageUrlString
      .split(';')
      .map(url => url.trim())
      .filter(url => url && url !== '')
      .map(url => url.replace(/\s+/g, ''));

    return urls;
  }

  /**
   * Process image titles from various formats
   * @param {string} imageTitleString - Raw image title string
   * @returns {Array} Array of image titles
   */
  processImageTitles(imageTitleString) {
    if (!imageTitleString || imageTitleString.trim() === '') {
      return [];
    }

    // Check if this is a JSON string containing Wix image objects
    if (imageTitleString.trim().startsWith('[') && imageTitleString.includes('wix:image://')) {
      try {
        const imageObjects = JSON.parse(imageTitleString);
        const titles = imageObjects
          .filter(obj => obj.title)
          .map(obj => obj.title);
        return titles;
      } catch (error) {
        console.warn('Failed to parse JSON image titles:', error.message);
      }
    }

    // Handle regular semicolon-separated titles
    const titles = imageTitleString
      .split(';')
      .map(title => title.trim())
      .filter(title => title && title !== '');

    return titles;
  }

  /**
   * Normalize vehicle data structure
   * @param {Object} record - Raw record data
   * @param {string} source - Source of the data ('catalog', 'cleansed', 'submission')
   * @returns {Object} Normalized vehicle data
   */
  normalizeVehicleData(record, source) {
    const normalized = {
      id: null,
      source: source,
      status: 'unknown',
      vehicle: {},
      owner: {},
      images: {},
      metadata: {},
      rawData: {}
    };

    if (source === 'catalog') {
      return this._normalizeCatalogData(record, normalized);
    } else if (source === 'cleansed') {
      return this._normalizeCleansedData(record, normalized);
    } else if (source === 'submission') {
      return this._normalizeSubmissionData(record, normalized);
    }

    return normalized;
  }

  _normalizeCatalogData(record, normalized) {
    normalized.id = record.handleId;
    normalized.status = record.visible ? 'published' : 'unpublished';

    normalized.vehicle = {
      name: record.name,
      make: record.productOptionDescription1 || '',
      model: record.name,
      year: this._extractYearFromDescription(record.additionalInfoDescription1),
      registration: this._extractRegistrationFromDescription(record.additionalInfoDescription1),
      engineCapacity: this._extractEngineFromDescription(record.additionalInfoDescription1),
      numberOfSeats: record.productOptionDescription6 || '',
      steering: record.productOptionDescription3 || '',
      gearbox: record.productOptionDescription4 || '',
      exteriorColour: this._extractColorFromDescription(record.productOptionDescription5),
      interiorColour: this._extractInteriorFromDescription(record.additionalInfoDescription1),
      condition: '',
      isRoadLegal: 'Yes',
      price: record.price,
      collection: record.collection,
      visible: record.visible,
      inventory: record.inventory
    };

    normalized.images = {
      urls: record.productImageUrl ? record.productImageUrl.split(';') : [],
      count: record.productImageUrl ? record.productImageUrl.split(';').length : 0
    };

    normalized.metadata = {
      fieldType: record.fieldType,
      sku: record.sku,
      brand: record.brand,
      ribbon: record.ribbon,
      surcharge: record.surcharge,
      cost: record.cost,
      weight: record.weight,
      discountMode: record.discountMode,
      discountValue: record.discountValue
    };

    normalized.rawData = record;
    return normalized;
  }

  _normalizeCleansedData(record, normalized) {
    normalized.id = record.wixId;
    normalized.status = 'processed';

    normalized.vehicle = {
      name: `${record.vehicle.make} ${record.vehicle.model}`,
      make: record.vehicle.make,
      model: record.vehicle.model,
      year: record.vehicle.yearOfManufacture,
      registration: record.vehicle.registration,
      engineCapacity: record.vehicle.engineCapacity,
      numberOfSeats: record.vehicle.numberOfSeats,
      steering: record.vehicle.steering,
      gearbox: record.vehicle.gearbox,
      exteriorColour: record.vehicle.exteriorColour,
      interiorColour: record.vehicle.interiorColour,
      condition: record.vehicle.condition,
      isRoadLegal: record.vehicle.isRoadLegal,
      price: null,
      collection: null,
      visible: null,
      inventory: null
    };

    normalized.owner = {
      firstName: record.owner.firstName,
      lastName: record.owner.lastName,
      email: record.owner.email,
      phone: record.owner.phone,
      address: record.owner.address
    };

    normalized.images = {
      urls: record.images.urls || [],
      titles: record.images.titles || [],
      count: record.images.count || 0
    };

    normalized.metadata = {
      submissionTime: record.submissionTime
    };

    normalized.rawData = record;
    return normalized;
  }

  _normalizeSubmissionData(record, normalized) {
    normalized.id = record.call_time;
    normalized.status = 'submitted';

    normalized.vehicle = {
      name: `${record.make_1} ${record.location_1}`,
      make: record.make_1,
      model: record.location_1,
      year: record.year_of_manufacture_1,
      registration: record.call_time,
      engineCapacity: record.engine_capacity,
      numberOfSeats: record.number_of_seats_1,
      steering: record.steering_1,
      gearbox: record.gearbox_1,
      exteriorColour: record.exterior_colour_1,
      interiorColour: record.interior_colour_1,
      condition: record.project_brief_1,
      isRoadLegal: record.is_this_vehicle_road_legal,
      price: null,
      collection: null,
      visible: null,
      inventory: null
    };

    normalized.owner = {
      firstName: record.first_name_1,
      lastName: record.last_name_de76,
      email: record.email_4bec,
      phone: record.phone_bc17,
      address: {
        street: record.your_address,
        city: record.city_1,
        county: record.county_1,
        postcode: record.postcode,
        country: record.country
      }
    };

    normalized.images = {
      urls: record.upload_vehicle_images || [],
      count: record.upload_vehicle_images ? record.upload_vehicle_images.length : 0
    };

    normalized.metadata = {
      convertible: record.convertible,
      formField: record.form_field_a664
    };

    normalized.rawData = record;
    return normalized;
  }

  // Helper methods for extracting data from descriptions
  _extractYearFromDescription(description) {
    if (!description) return '';
    const yearMatch = description.match(/Year\s*[:\s]*(\d{4})/i);
    return yearMatch ? yearMatch[1] : '';
  }

  _extractRegistrationFromDescription(description) {
    if (!description) return '';
    const regMatch = description.match(/Registration\s*[:\s]*([A-Z0-9\s]+)/i);
    return regMatch ? regMatch[1].trim() : '';
  }

  _extractEngineFromDescription(description) {
    if (!description) return '';
    const engineMatch = description.match(/Engine\s*[:\s]*([0-9.]+L?)/i);
    return engineMatch ? engineMatch[1] : '';
  }

  _extractColorFromDescription(colorDescription) {
    if (!colorDescription) return '';
    const colorMatch = colorDescription.match(/#[0-9a-fA-F]{6}:([^,]+)/);
    return colorMatch ? colorMatch[1] : colorDescription;
  }

  _extractInteriorFromDescription(description) {
    if (!description) return '';
    const interiorMatch = description.match(/Interior\s*[:\s]*([^<\n]+)/i);
    return interiorMatch ? interiorMatch[1].trim() : '';
  }
}

module.exports = DataTransformer;
