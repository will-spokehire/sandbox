/**
 * VehicleCard Component
 * Reusable component for displaying a vehicle in a list
 */

class VehicleCard {
    constructor(vehicle, viewer) {
        this.vehicle = vehicle;
        this.viewer = viewer;
    }

    render() {
        const name = this.viewer.getVehicleName(this.vehicle);
        const make = this.viewer.getMake(this.vehicle);
        const model = this.viewer.getModel(this.vehicle);
        const year = this.viewer.getYear(this.vehicle);
        const registration = this.viewer.getRegistration(this.vehicle);
        const owner = this.viewer.getOwnerName(this.vehicle);
        const sources = this.vehicle.sources || [];
        const status = this.viewer.getStatus(this.vehicle);

        return `
            <div class="vehicle-item ${this.viewer.selectedVehicle && this.viewer.selectedVehicle.id === this.vehicle.id ? 'selected' : ''}"
                 onclick="viewer.showVehicleDetail('${this.vehicle.id}')">
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
                <div class="vehicle-id">ID: ${this.vehicle.id}</div>
            </div>
        `;
    }
}

export default VehicleCard;
