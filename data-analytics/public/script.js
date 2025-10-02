class VehicleCatalogViewer {
    constructor() {
        this.data = null;
        this.filteredData = [];
        this.selectedVehicle = null;
        this.searchTimeout = null;

        this.initialize();
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();

        // Debug: Log source statistics
        this.logSourceStatistics();
    }

    logSourceStatistics() {
        if (!this.data) return;

        const sourceStats = {};
        this.data.forEach(vehicle => {
            const sources = vehicle.sources || [];
            const key = sources.sort().join('_');
            sourceStats[key] = (sourceStats[key] || 0) + 1;
        });

        console.log('Source Statistics:');
        console.log(sourceStats);

        const submissionOnly = this.data.filter(r => r.sources && r.sources.length === 1 && r.sources.includes('submission'));
        console.log('Submission-only records:', submissionOnly.length);
        console.log('Sample IDs:', submissionOnly.slice(0, 3).map(r => r.id));

        // Update filter counts
        this.updateFilterCounts();
    }

    updateFilterCounts() {
        if (!this.data) return;

        const stats = {
            all: this.data.length,
            catalog: this.data.filter(r => r.sources && r.sources.includes('catalog') && !r.sources.includes('cleansed') && !r.sources.includes('submission')).length,
            cleansed: this.data.filter(r => r.sources && r.sources.length === 1 && r.sources.includes('cleansed')).length,
            submission: this.data.filter(r => r.sources && r.sources.length === 1 && r.sources.includes('submission')).length,
            'has-submission': this.data.filter(r => r.sources && r.sources.includes('submission')).length,
            'has-cleansed': this.data.filter(r => r.sources && r.sources.includes('cleansed')).length,
            multi: this.data.filter(r => r.sources && r.sources.length > 1).length,
            published: this.data.filter(r => r.vehicle?.published === true).length
        };

        console.log('Filter counts:', stats);

        // Update the select options
        const sourceFilter = document.getElementById('source-filter');
        sourceFilter.innerHTML = `
            <option value="all">All Sources (${stats.all})</option>
            <option value="catalog">Catalog Only (${stats.catalog})</option>
            <option value="cleansed">Cleansed Only (${stats.cleansed})</option>
            <option value="submission">Submission Only (${stats.submission})</option>
            <option value="has-submission">Contains Submission (${stats['has-submission']})</option>
            <option value="has-cleansed">Contains Cleansed (${stats['has-cleansed']})</option>
            <option value="multi">Multi-Source (${stats.multi})</option>
            <option value="published">Published (${stats.published})</option>
        `;
    }

    async loadData() {
        try {
            const response = await fetch('./data/improved_vehicle_catalog.json');
            const result = await response.json();
            this.data = result.records;
            console.log(`Loaded ${this.data.length} vehicle records`);

            // Show all data initially (before any filtering)
            this.filteredData = this.data;
            this.renderVehicleList();
            this.updateStats();

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load vehicle data');
        }
    }

    setupEventListeners() {
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.filterData();
            }, 300);
        });

                document.getElementById('source-filter').addEventListener('change', () => {
                    this.filterData();
                });
    }

    filterData() {
        if (!this.data) return;

        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const sourceFilter = document.getElementById('source-filter').value;

        console.log('Filtering with:', { searchTerm, sourceFilter });

        this.filteredData = this.data.filter(vehicle => {
            // Search filter - show all if no search term
            const matchesSearch = !searchTerm ||
                this.getVehicleName(vehicle).toLowerCase().includes(searchTerm) ||
                this.getOwnerName(vehicle).toLowerCase().includes(searchTerm) ||
                this.getRegistration(vehicle).toLowerCase().includes(searchTerm);

            // Source filter - debug the sources array
            const sources = vehicle.sources || [];
            let matchesSource = false;

            if (sourceFilter === 'all') {
                matchesSource = true;
            } else if (sourceFilter === 'multi') {
                matchesSource = sources.length > 1;
            } else if (sourceFilter === 'catalog') {
                matchesSource = sources.includes('catalog') && !sources.includes('cleansed') && !sources.includes('submission');
            } else if (sourceFilter === 'cleansed') {
                // For "Cleansed Only", show only records that have ONLY cleansed as their source
                matchesSource = sources.length === 1 && sources.includes('cleansed');
            } else if (sourceFilter === 'submission') {
                // For "Submission Only", show only records that have ONLY submission as their source
                matchesSource = sources.length === 1 && sources.includes('submission');
                if (matchesSource) {
                    console.log('Found submission-only record:', vehicle.id, sources);
                }
            } else if (sourceFilter === 'has-submission') {
                // For "Contains Submission", show records that have submission in their sources
                matchesSource = sources.includes('submission');
                if (matchesSource) {
                    console.log('Found record with submission:', vehicle.id, sources);
                }
            } else if (sourceFilter === 'has-cleansed') {
                // For "Contains Cleansed", show records that have cleansed in their sources
                matchesSource = sources.includes('cleansed');
                if (matchesSource) {
                    console.log('Found record with cleansed:', vehicle.id, sources);
                }
            } else if (sourceFilter === 'published') {
                // For "Published", show records that have published: true
                const vehicleData = vehicle.vehicle || {};
                matchesSource = vehicleData.published === true;
                if (matchesSource) {
                    console.log('Found published record:', vehicle.id, vehicleData.published);
                }
            }

            const result = matchesSearch && matchesSource;
            if (!result) {
                console.log('Filtered out:', {
                    vehicle: vehicle.id,
                    name: this.getVehicleName(vehicle),
                    sources: sources,
                    sourceFilter: sourceFilter,
                    matchesSource: matchesSource
                });
            }

            return result;
        });

        console.log(`Filter results: ${this.filteredData.length} out of ${this.data.length} vehicles`);
        this.renderVehicleList();
    }

    renderVehicleList() {
        const container = document.getElementById('vehicle-list');
        const loading = document.getElementById('loading');

        if (!this.data) {
            loading.style.display = 'block';
            return;
        }

        loading.style.display = 'none';

        if (this.filteredData.length === 0) {
            // Check if this is initial load (no search term) or actual no results
            const searchTerm = document.getElementById('search-input').value;
            const sourceFilter = document.getElementById('source-filter').value;

            console.log('No filtered results with:', { searchTerm, sourceFilter });

            if (!searchTerm && sourceFilter === 'all') {
                // Initial load - show all data
                this.filteredData = this.data;
                console.log('Resetting to all data:', this.filteredData.length);
            } else {
                container.innerHTML = '<div class="no-data">No vehicles match your criteria</div>';
                console.log('Showing no data message');
                return;
            }
        }

        // Add status indicator
        const searchTerm = document.getElementById('search-input').value;
        const sourceFilter = document.getElementById('source-filter').value;
        const isDefaultView = !searchTerm && sourceFilter === 'all';

        let statusIndicator = '';
        if (isDefaultView) {
            statusIndicator = `<div class="showing-all">📋 Showing all ${this.filteredData.length} vehicles</div>`;
        } else {
            const activeFilters = [];
            if (searchTerm) activeFilters.push(`search: "${searchTerm}"`);
            if (sourceFilter !== 'all') {
                const sourceNames = {
                    'has-submission': 'Contains Submission',
                    'has-cleansed': 'Contains Cleansed',
                    'submission': 'Submission Only',
                    'cleansed': 'Cleansed Only',
                    'catalog': 'Catalog Only',
                    'multi': 'Multi-Source',
                    'published': 'Published'
                };
                activeFilters.push(`source: ${sourceNames[sourceFilter] || sourceFilter}`);
            }

            statusIndicator = `<div class="showing-filtered">🔍 Filtered: ${activeFilters.join(', ')} (${this.filteredData.length} results)</div>`;
        }

        container.innerHTML = statusIndicator + this.filteredData.map(vehicle => this.createVehicleItem(vehicle)).join('');
    }

    createVehicleItem(vehicle) {
        const name = this.getVehicleName(vehicle);
        const make = this.getMake(vehicle);
        const model = this.getModel(vehicle);
        const year = this.getYear(vehicle);
        const registration = this.getRegistration(vehicle);
        const owner = this.getOwnerName(vehicle);
        const sources = vehicle.sources || [];
        const status = this.getStatus(vehicle);

        return `
            <div class="vehicle-item ${this.selectedVehicle && this.selectedVehicle.id === vehicle.id ? 'selected' : ''}"
                 onclick="viewer.showVehicleDetail('${vehicle.id}')">
                <div class="vehicle-name">${name}</div>
                <div class="vehicle-details">
                    ${make} ${model} ${year ? `(${year})` : ''}
                </div>
                <div class="vehicle-details">
                    ${registration ? `Reg: ${registration}` : 'No registration'} |
                    ${owner || 'No owner'}
                </div>
                <div class="sources-badges">
                    ${sources.map(source => `<span class="source-badge source-${source}">${source}</span>`).join('')}
                </div>
                <div class="vehicle-id">ID: ${vehicle.id}</div>
            </div>
        `;
    }

    showVehicleDetail(vehicleId) {
        const vehicle = this.data.find(v => v.id === vehicleId);
        if (!vehicle) return;

        this.selectedVehicle = vehicle;
        this.renderVehicleDetail(vehicle);
    }

    renderVehicleDetail(vehicle) {
        const container = document.getElementById('vehicle-detail');
        const noSelection = document.getElementById('no-selection');

        noSelection.style.display = 'none';
        container.style.display = 'block';

        const name = this.getVehicleName(vehicle);
        const status = this.getStatus(vehicle);
        const sources = vehicle.sources || [];

        container.innerHTML = `
            <div class="vehicle-detail">
                <h2>${name}</h2>

                <div class="detail-section">
                    <h3>📋 Status & Sources</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="status-badge status-${status}">${status}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Primary Source:</span>
                            <span class="detail-value">${vehicle.primarySource || 'Unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Data Sources:</span>
                            <div class="sources-badges">
                                ${sources.map(source => `<span class="source-badge source-${source}">${source}</span>`).join('')}
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Record ID:</span>
                            <span class="detail-value" style="font-family: monospace;">${vehicle.id}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>🚗 Vehicle Information</h3>
                    <div class="detail-grid">
                        ${this.createDetailItem('Make', this.getMake(vehicle))}
                        ${this.createDetailItem('Model', this.getModel(vehicle))}
                        ${this.createDetailItem('Year', this.getYear(vehicle))}
                        ${this.createDetailItem('Registration', this.getRegistration(vehicle))}
                        ${this.createDetailItem('Engine Capacity', this.getEngineCapacity(vehicle))}
                        ${this.createDetailItem('Number of Seats', this.getSeats(vehicle))}
                        ${this.createDetailItem('Steering', this.getSteering(vehicle))}
                        ${this.createDetailItem('Gearbox', this.getGearbox(vehicle))}
                        ${this.createDetailItem('Exterior Color', this.getExteriorColor(vehicle))}
                        ${this.createInteriorColor(this.getInteriorColor(vehicle))}
                        ${this.createDetailItem('Condition', this.getCondition(vehicle))}
                        ${this.createDetailItem('Road Legal', this.getRoadLegal(vehicle))}
                    </div>
                </div>

                <div class="detail-section">
                    <h3>👤 Owner Information</h3>
                    <div class="detail-grid">
                        ${this.createDetailItem('Name', this.getOwnerName(vehicle))}
                        ${this.createDetailItem('Email', this.getOwnerEmail(vehicle))}
                        ${this.createDetailItem('Phone', this.getOwnerPhone(vehicle))}
                        ${this.createAddressSection(vehicle)}
                    </div>
                </div>

                ${this.createImagesSection(vehicle)}

                ${this.createSourcesDetailSection(vehicle)}
            </div>
        `;

        // Update selected state in sidebar
        this.renderVehicleList();
    }

    createDetailItem(label, value) {
        if (!value || value.trim() === '') {
            return '';
        }
        return `
            <div class="detail-item">
                <span class="detail-label">${label}:</span>
                <span class="detail-value">${value}</span>
            </div>
        `;
    }

    createInteriorColor(value) {
        if (!value || value.trim() === '' || value === '&nbsp;') {
            return '';
        }
        return this.createDetailItem('Interior Color', value);
    }

    createAddressSection(vehicle) {
        const owner = this.getOwner(vehicle);
        if (!owner.address) return '';

        const address = owner.address;
        const addressString = [address.street, address.city, address.county, address.postcode, address.country]
            .filter(Boolean).join(', ');

        if (!addressString) return '';

        return this.createDetailItem('Address', addressString);
    }

    createSourcesDetailSection(vehicle) {
        const sources = vehicle.sources || [];
        if (sources.length === 0) return '';

        const sourceDetails = sources.map(source => this.getSourceDetails(vehicle, source)).filter(Boolean);

        if (sourceDetails.length === 0) return '';

        return `
            <div class="detail-section">
                <h3>🔍 Data Sources Detail</h3>
                <div class="sources-detail">
                    <h4>📊 Data Source Breakdown</h4>
                    ${sourceDetails.map(sourceDetail => this.createSourceDetail(sourceDetail)).join('')}
                </div>
            </div>
        `;
    }

    getSourceDetails(vehicle, sourceType) {
        const sourceData = this.getSourceData(vehicle, sourceType);
        if (!sourceData) return null;

        const fields = this.analyzeSourceFields(vehicle, sourceType);

        return {
            type: sourceType,
            data: sourceData,
            fields: fields,
            timestamp: this.getSourceTimestamp(sourceData),
            hasData: fields.some(f => f.hasValue)
        };
    }

    getSourceData(vehicle, sourceType) {
        switch (sourceType) {
            case 'catalog': return vehicle.catalogData;
            case 'cleansed': return vehicle.cleansedData;
            case 'submission': return vehicle.submissionData;
            default: return null;
        }
    }

    analyzeSourceFields(vehicle, sourceType) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        const ownerData = vehicle.vehicle?.owner || vehicle.owner || {};
        const images = vehicle.vehicle?.images || vehicle.images || {};

        const fields = [
            { name: 'Make', value: this.getFieldFromSource(vehicle, sourceType, 'make') },
            { name: 'Model', value: this.getFieldFromSource(vehicle, sourceType, 'model') },
            { name: 'Year', value: this.getFieldFromSource(vehicle, sourceType, 'year') },
            { name: 'Registration', value: this.getFieldFromSource(vehicle, sourceType, 'registration') },
            { name: 'Engine Capacity', value: this.getFieldFromSource(vehicle, sourceType, 'engineCapacity') },
            { name: 'Number of Seats', value: this.getFieldFromSource(vehicle, sourceType, 'seats') },
            { name: 'Steering', value: this.getFieldFromSource(vehicle, sourceType, 'steering') },
            { name: 'Gearbox', value: this.getFieldFromSource(vehicle, sourceType, 'gearbox') },
            { name: 'Exterior Color', value: this.getFieldFromSource(vehicle, sourceType, 'exteriorColour') },
            { name: 'Interior Color', value: this.getFieldFromSource(vehicle, sourceType, 'interiorColour') },
            { name: 'Condition', value: this.getFieldFromSource(vehicle, sourceType, 'condition') },
            { name: 'Owner Name', value: this.getOwnerFieldFromSource(vehicle, sourceType, 'name') },
            { name: 'Owner Email', value: this.getOwnerFieldFromSource(vehicle, sourceType, 'email') },
            { name: 'Owner Phone', value: this.getOwnerFieldFromSource(vehicle, sourceType, 'phone') },
            { name: 'Images', value: this.getImagesFieldFromSource(vehicle, sourceType, 'count') }
        ];

        return fields.map(field => ({
            ...field,
            hasValue: field.value !== null && field.value !== undefined && field.value !== ''
        }));
    }

    getFieldFromSource(vehicle, sourceType, fieldName) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        const sourceData = this.getSourceData(vehicle, sourceType);

        if (!sourceData) return null;

        switch (sourceType) {
            case 'catalog':
                switch (fieldName) {
                    case 'make': return sourceData.productOptionDescription1 || null;
                    case 'model': return sourceData.name || null;
                    case 'year': return this.extractYearFromCatalog(sourceData);
                    case 'registration': return this.extractRegistrationFromCatalog(sourceData);
                    case 'engineCapacity': return this.extractEngineFromCatalog(sourceData);
                    case 'seats': return sourceData.productOptionDescription6 || null;
                    case 'steering': return sourceData.productOptionDescription3 || null;
                    case 'gearbox': return sourceData.productOptionDescription4 || null;
                    case 'exteriorColour': return this.extractColorFromCatalog(sourceData);
                    case 'interiorColour': return this.extractInteriorFromCatalog(sourceData);
                    case 'condition': return null;
                    default: return null;
                }
            case 'cleansed':
                if (sourceData.vehicle) {
                    return sourceData.vehicle[fieldName] || null;
                }
                return null;
            case 'submission':
                switch (fieldName) {
                    case 'make': return sourceData.make_1 || null;
                    case 'model': return sourceData.location_1 || null;
                    case 'year': return sourceData.year_of_manufacture_1 || null;
                    case 'registration': return sourceData.call_time || null;
                    case 'engineCapacity': return sourceData.engine_capacity || null;
                    case 'seats': return sourceData.number_of_seats_1 || null;
                    case 'steering': return sourceData.steering_1 || null;
                    case 'gearbox': return sourceData.gearbox_1 || null;
                    case 'exteriorColour': return sourceData.exterior_colour_1 || null;
                    case 'interiorColour': return sourceData.interior_colour_1 || null;
                    case 'condition': return sourceData.project_brief_1 || null;
                    default: return null;
                }
            default: return null;
        }
    }

    getOwnerFieldFromSource(vehicle, sourceType, fieldName) {
        const ownerData = vehicle.vehicle?.owner || vehicle.owner || {};
        const sourceData = this.getSourceData(vehicle, sourceType);

        if (!sourceData) return null;

        switch (sourceType) {
            case 'catalog':
                return null; // Catalog doesn't have owner data
            case 'cleansed':
                if (sourceData.owner) {
                    switch (fieldName) {
                        case 'name': return `${sourceData.owner.firstName || ''} ${sourceData.owner.lastName || ''}`.trim();
                        case 'email': return sourceData.owner.email || null;
                        case 'phone': return sourceData.owner.phone || null;
                    }
                }
                return null;
            case 'submission':
                switch (fieldName) {
                    case 'name': return `${sourceData.first_name_1 || ''} ${sourceData.last_name_de76 || ''}`.trim();
                    case 'email': return sourceData.email_4bec || null;
                    case 'phone': return sourceData.phone_bc17 || null;
                }
                return null;
            default: return null;
        }
    }

    getImagesFieldFromSource(vehicle, sourceType, fieldName) {
        const images = vehicle.vehicle?.images || vehicle.images || {};
        const sourceData = this.getSourceData(vehicle, sourceType);

        if (!sourceData) return null;

        switch (sourceType) {
            case 'catalog':
                return sourceData.productImageUrl ? sourceData.productImageUrl.split(';').length : 0;
            case 'cleansed':
                return sourceData.images ? sourceData.images.count || 0 : 0;
            case 'submission':
                return sourceData.upload_vehicle_images ? sourceData.upload_vehicle_images.length : 0;
            default: return null;
        }
    }

    getSourceTimestamp(sourceData) {
        if (sourceData.submissionTime) {
            return new Date(sourceData.submissionTime).toLocaleString();
        }
        return 'Unknown';
    }

    extractYearFromCatalog(sourceData) {
        if (!sourceData.additionalInfoDescription1) return null;
        const yearMatch = sourceData.additionalInfoDescription1.match(/Year\s*[:\s]*(\d{4})/i);
        return yearMatch ? yearMatch[1] : null;
    }

    extractRegistrationFromCatalog(sourceData) {
        if (!sourceData.additionalInfoDescription1) return null;
        const regMatch = sourceData.additionalInfoDescription1.match(/Registration\s*[:\s]*([A-Z0-9\s]+)/i);
        return regMatch ? regMatch[1].trim() : null;
    }

    extractEngineFromCatalog(sourceData) {
        if (!sourceData.additionalInfoDescription1) return null;
        const engineMatch = sourceData.additionalInfoDescription1.match(/Engine\s*[:\s]*([0-9.]+L?)/i);
        return engineMatch ? engineMatch[1] : null;
    }

    extractColorFromCatalog(sourceData) {
        if (!sourceData.productOptionDescription5) return null;
        const colorMatch = sourceData.productOptionDescription5.match(/#[0-9a-fA-F]{6}:([^,]+)/);
        return colorMatch ? colorMatch[1] : sourceData.productOptionDescription5;
    }

    extractInteriorFromCatalog(sourceData) {
        if (!sourceData.additionalInfoDescription1) return null;
        const interiorMatch = sourceData.additionalInfoDescription1.match(/Interior\s*[:\s]*([^<\n]+)/i);
        return interiorMatch ? interiorMatch[1].trim() : null;
    }

    createSourceDetail(sourceDetail) {
        const hasData = sourceDetail.fields.some(f => f.hasValue);

        return `
            <div class="source-item source-${sourceDetail.type}">
                <div class="source-header">
                    <div class="source-title">
                        ${this.getSourceIcon(sourceDetail.type)}
                        ${this.getSourceDisplayName(sourceDetail.type)}
                    </div>
                    <div class="source-timestamp">${sourceDetail.timestamp}</div>
                </div>

                ${hasData ? `
                    <div class="source-fields">
                        ${sourceDetail.fields.map(field => this.createFieldItem(field)).join('')}
                    </div>
                ` : '<p style="color: #adb5bd; font-style: italic;">No data available from this source</p>'}

                <div class="source-actions">
                    <button onclick="viewer.toggleSourceRawData('${sourceDetail.type}')">
                        Show Raw Data
                    </button>
                </div>

                <div class="source-expanded" id="raw-${sourceDetail.type}">
                    <div class="raw-data-title">Raw Data from ${this.getSourceDisplayName(sourceDetail.type)}</div>
                    <div class="raw-data">${this.formatRawData(sourceDetail.data)}</div>
                </div>
            </div>
        `;
    }

    getSourceIcon(sourceType) {
        switch (sourceType) {
            case 'catalog': return '🏪';
            case 'cleansed': return '🔧';
            case 'submission': return '📝';
            default: return '📄';
        }
    }

    getSourceDisplayName(sourceType) {
        switch (sourceType) {
            case 'catalog': return 'Website Catalog';
            case 'cleansed': return 'Processed Data';
            case 'submission': return 'User Submission';
            default: return sourceType;
        }
    }

    createFieldItem(field) {
        if (!field.hasValue) {
            return `
                <div class="field-item">
                    <div class="field-name">${field.name}</div>
                    <div class="field-value field-empty">Not provided</div>
                </div>
            `;
        }

        return `
            <div class="field-item">
                <div class="field-name">${field.name}</div>
                <div class="field-value">${field.value}</div>
            </div>
        `;
    }

    formatRawData(data) {
        if (!data) return 'No raw data available';

        try {
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return 'Error formatting raw data';
        }
    }

    toggleSourceRawData(sourceType) {
        const element = document.getElementById(`raw-${sourceType}`);
        if (element) {
            element.classList.toggle('show');
        }
    }

    createImagesSection(vehicle) {
        const images = this.getImages(vehicle);
        if (!images || images.count === 0) {
            return `
                <div class="detail-section">
                    <h3>📸 Images</h3>
                    <p>No images available for this vehicle.</p>
                </div>
            `;
        }

        return `
            <div class="detail-section">
                <h3>📸 Images (${images.count})</h3>
                <div class="image-gallery">
                    ${images.urls.map((url, index) => `
                        <div class="image-item">
                            <img src="${url}" alt="Vehicle image ${index + 1}"
                                 onclick="window.open('${url}', '_blank')">
                            <div class="image-count">${index + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateStats() {
        if (!this.data) return;

        const stats = this.calculateStats();
        document.getElementById('total-records').textContent = this.data.length;
        document.getElementById('published-records').textContent = stats.published;
        document.getElementById('multi-source-records').textContent = stats.multiSource;
        document.getElementById('with-images').textContent = stats.withImages;
        document.getElementById('with-contact').textContent = stats.withContact;
        document.getElementById('with-address').textContent = stats.withAddress;
        document.getElementById('with-registration').textContent = stats.withRegistration;
    }

    calculateStats() {
        return this.data.reduce((stats, vehicle) => {
            const sources = vehicle.sources || [];
            const images = this.getImages(vehicle);
            const vehicleData = vehicle.vehicle || {};

            // Count as published using the new published field if available
            if (vehicleData.published !== undefined && vehicleData.published !== null) {
                if (vehicleData.published) {
                    stats.published++;
                }
            } else {
                // Fallback to legacy logic if published field doesn't exist
                // Count as published if it's in catalog and either:
                // 1. explicitly marked as visible=true, OR
                // 2. not explicitly marked as visible=false (visible is null/undefined)
                if (sources.includes('catalog') && vehicleData.visible !== false) {
                    stats.published++;
                }
            }

            if (sources.length > 1) stats.multiSource++;
            if (images && images.count > 0) stats.withImages++;

            // Count vehicles with contact information (email or phone)
            const owner = this.getOwner(vehicle);
            if (owner.email || owner.phone) stats.withContact++;

            // Count vehicles with address information
            if (owner.address && (owner.address.street || owner.address.city || owner.address.county || owner.address.postcode)) stats.withAddress++;

            // Count vehicles with registration number
            if (vehicleData.registration && vehicleData.registration.trim() !== '') stats.withRegistration++;

            return stats;
        }, { published: 0, multiSource: 0, withImages: 0, withContact: 0, withAddress: 0, withRegistration: 0 });
    }

    showError(message) {
        alert(message);
    }

    // Data extraction methods
    getVehicleName(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.name || 'Unknown Vehicle';
    }

    getMake(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.make || '';
    }

    getModel(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.model || '';
    }

    getYear(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.year || '';
    }

    getRegistration(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.registration || '';
    }

    getEngineCapacity(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.engineCapacity || '';
    }

    getSeats(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.numberOfSeats || '';
    }

    getSteering(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.steering || '';
    }

    getGearbox(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.gearbox || '';
    }

    getExteriorColor(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.exteriorColour || '';
    }

    getInteriorColor(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.interiorColour || '';
    }

    getCondition(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.condition || '';
    }

    getRoadLegal(vehicle) {
        const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};
        return vehicleData.isRoadLegal || '';
    }

    getOwner(vehicle) {
        return vehicle.vehicle?.owner || vehicle.owner || {};
    }

    getOwnerName(vehicle) {
        const owner = this.getOwner(vehicle);
        return owner.firstName && owner.lastName
            ? `${owner.firstName} ${owner.lastName}`
            : owner.firstName || owner.lastName || 'Unknown';
    }

    getOwnerEmail(vehicle) {
        const owner = this.getOwner(vehicle);
        return owner.email || '';
    }

    getOwnerPhone(vehicle) {
        const owner = this.getOwner(vehicle);
        return owner.phone || '';
    }

    getImages(vehicle) {
        return vehicle.vehicle?.images || vehicle.images || null;
    }

    getStatus(vehicle) {
        const vehicleData = vehicle.vehicle || {};
        const sources = vehicle.sources || [];

        // Check if the new published field exists
        if (vehicleData.published !== undefined && vehicleData.published !== null) {
            return vehicleData.published ? 'published' : 'unpublished';
        }

        // Fallback to legacy logic if published field doesn't exist
        // If it's in catalog, consider it published unless explicitly unpublished
        if (sources.includes('catalog')) {
            if (vehicleData.visible === false) return 'unpublished';
            return 'published'; // All catalog records are published unless explicitly unpublished
        }

        // If not in catalog, check visible status
        if (vehicleData.visible === true) return 'published';
        if (vehicleData.visible === false) return 'unpublished';
        return 'submitted';
    }
}

// Initialize the viewer when the page loads
const viewer = new VehicleCatalogViewer();

// Global function to toggle source raw data
window.toggleSourceRawData = function(sourceType) {
    viewer.toggleSourceRawData(sourceType);
};
