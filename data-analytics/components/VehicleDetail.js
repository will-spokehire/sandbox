/**
 * VehicleDetail Component
 * Reusable component for displaying detailed vehicle information
 */

class VehicleDetail {
    constructor(vehicle, viewer) {
        this.vehicle = vehicle;
        this.viewer = viewer;
    }

    render() {
        const name = this.viewer.getVehicleName(this.vehicle);
        const status = this.viewer.getStatus(this.vehicle);
        const sources = this.vehicle.sources || [];

        return `
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
                            <span class="detail-value">${this.vehicle.primarySource || 'Unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Data Sources:</span>
                            <div class="sources-badges">
                                ${sources.map(source => `<span class="source-badge source-${source}">${source}</span>`).join('')}
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Record ID:</span>
                            <span class="detail-value" style="font-family: monospace;">${this.vehicle.id}</span>
                        </div>
                    </div>
                </div>

                ${this.createSourcesDetailSection()}

                <div class="detail-section">
                    <h3>🚗 Vehicle Information</h3>
                    <div class="detail-grid">
                        ${this.createDetailItem('Make', this.viewer.getMake(this.vehicle))}
                        ${this.createDetailItem('Model', this.viewer.getModel(this.vehicle))}
                        ${this.createDetailItem('Year', this.viewer.getYear(this.vehicle))}
                        ${this.createDetailItem('Registration', this.viewer.getRegistration(this.vehicle))}
                        ${this.createDetailItem('Engine Capacity', this.viewer.getEngineCapacity(this.vehicle))}
                        ${this.createDetailItem('Number of Seats', this.viewer.getSeats(this.vehicle))}
                        ${this.createDetailItem('Steering', this.viewer.getSteering(this.vehicle))}
                        ${this.createDetailItem('Gearbox', this.viewer.getGearbox(this.vehicle))}
                        ${this.createDetailItem('Exterior Color', this.viewer.getExteriorColor(this.vehicle))}
                        ${this.createInteriorColor(this.viewer.getInteriorColor(this.vehicle))}
                        ${this.createDetailItem('Condition', this.viewer.getCondition(this.vehicle))}
                        ${this.createDetailItem('Road Legal', this.viewer.getRoadLegal(this.vehicle))}
                    </div>
                </div>

                <div class="detail-section">
                    <h3>👤 Owner Information</h3>
                    <div class="detail-grid">
                        ${this.createDetailItem('Name', this.viewer.getOwnerName(this.vehicle))}
                        ${this.createDetailItem('Email', this.viewer.getOwnerEmail(this.vehicle))}
                        ${this.createDetailItem('Phone', this.viewer.getOwnerPhone(this.vehicle))}
                        ${this.createAddressSection()}
                    </div>
                </div>

                ${this.createImagesSection()}
            </div>
        `;
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

    createAddressSection() {
        const owner = this.viewer.getOwner(this.vehicle);
        if (!owner.address) return '';

        const address = owner.address;
        const addressString = [address.street, address.city, address.county, address.postcode, address.country]
            .filter(Boolean).join(', ');

        if (!addressString) return '';

        return this.createDetailItem('Address', addressString);
    }

    createSourcesDetailSection() {
        const sources = this.vehicle.sources || [];
        if (sources.length === 0) return '';

        const sourceDetails = sources.map(source => this.viewer.getSourceDetails(this.vehicle, source)).filter(Boolean);

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

    createImagesSection() {
        const images = this.viewer.getImages(this.vehicle);
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
}

export default VehicleDetail;
