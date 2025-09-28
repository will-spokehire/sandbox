/**
 * Stats Component
 * Reusable component for displaying statistics
 */

class Stats {
    constructor(data) {
        this.data = data;
    }

    render() {
        if (!this.data) {
            return `
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Total Records</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Published</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">0</div>
                        <div class="stat-label">Multi-Source</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">0</div>
                        <div class="stat-label">With Images</div>
                    </div>
                </div>
            `;
        }

        const stats = this.calculateStats();

        return `
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${this.data.length}</div>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.published}</div>
                    <div class="stat-label">Published</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.multiSource}</div>
                    <div class="stat-label">Multi-Source</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.withImages}</div>
                    <div class="stat-label">With Images</div>
                </div>
            </div>
        `;
    }

    calculateStats() {
        if (!this.data) return { published: 0, multiSource: 0, withImages: 0 };

        return this.data.reduce((stats, vehicle) => {
            const sources = vehicle.sources || [];
            const images = this.getImages(vehicle);
            const vehicleData = vehicle.vehicle?.vehicle || vehicle.vehicle || {};

            // Count as published if it's in catalog and either:
            // 1. explicitly marked as visible=true, OR
            // 2. not explicitly marked as visible=false (visible is null/undefined)
            if (sources.includes('catalog') && vehicleData.visible !== false) {
                stats.published++;
            }

            if (sources.length > 1) stats.multiSource++;
            if (images && images.count > 0) stats.withImages++;

            return stats;
        }, { published: 0, multiSource: 0, withImages: 0 });
    }

    getImages(vehicle) {
        return vehicle.vehicle?.images || vehicle.images || null;
    }

    updateStats() {
        const statsContainer = document.querySelector('.stats');
        if (statsContainer) {
            statsContainer.innerHTML = this.render();
        }
    }
}

export default Stats;
