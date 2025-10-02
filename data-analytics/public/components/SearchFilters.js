/**
 * SearchFilters Component
 * Reusable component for search and filter controls
 */

class SearchFilters {
    constructor(data) {
        this.data = data;
    }

    render() {
        const stats = this.getFilterStats();

        return `
            <div class="controls">
                <input type="text" class="search-box" id="search-input" placeholder="🔍 Search all ${this.data ? this.data.length : 0} vehicles... (leave empty to show all)">
                <select class="filter-select" id="source-filter">
                    <option value="all">All Sources (${stats.all})</option>
                    <option value="catalog">Catalog Only (${stats.catalog})</option>
                    <option value="cleansed">Cleansed Only (${stats.cleansed})</option>
                    <option value="submission">Submission Only (${stats.submission})</option>
                    <option value="has-submission">Contains Submission (${stats['has-submission']})</option>
                    <option value="has-cleansed">Contains Cleansed (${stats['has-cleansed']})</option>
                    <option value="multi">Multi-Source (${stats.multi})</option>
                </select>
                <select class="filter-select" id="status-filter">
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="submitted">Submitted</option>
                </select>
            </div>
        `;
    }

    getFilterStats() {
        if (!this.data) {
            return {
                all: 0,
                catalog: 0,
                cleansed: 0,
                submission: 0,
                'has-submission': 0,
                'has-cleansed': 0,
                multi: 0
            };
        }

        return {
            all: this.data.length,
            catalog: this.data.filter(r => r.sources && r.sources.includes('catalog') && !r.sources.includes('cleansed') && !r.sources.includes('submission')).length,
            cleansed: this.data.filter(r => r.sources && r.sources.length === 1 && r.sources.includes('cleansed')).length,
            submission: this.data.filter(r => r.sources && r.sources.length === 1 && r.sources.includes('submission')).length,
            'has-submission': this.data.filter(r => r.sources && r.sources.includes('submission')).length,
            'has-cleansed': this.data.filter(r => r.sources && r.sources.includes('cleansed')).length,
            multi: this.data.filter(r => r.sources && r.sources.length > 1).length
        };
    }

    setupEventListeners(viewer) {
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(viewer.searchTimeout);
            viewer.searchTimeout = setTimeout(() => {
                viewer.filterData();
            }, 300);
        });

        document.getElementById('source-filter').addEventListener('change', () => {
            viewer.filterData();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            viewer.filterData();
        });
    }
}

export default SearchFilters;
