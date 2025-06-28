// Regional Risk Heatmap Generator
import regionHeatmap from '../data/regionHeatmap.json';

export class LocalHeatmap {
  constructor() {
    this.heatmapData = regionHeatmap;
    this.userRegion = this.loadUserRegion();
    this.canvas = null;
    this.chart = null;
  }

  loadUserRegion() {
    const saved = localStorage.getItem('paysavvy_user_region');
    return saved ? JSON.parse(saved) : {
      country: 'Malaysia',
      state: 'Selangor',
      coordinates: [3.0738, 101.5183]
    };
  }

  setUserRegion(country, state = null, coordinates = null) {
    this.userRegion = {
      country: country,
      state: state,
      coordinates: coordinates || this.getRegionCoordinates(country, state)
    };
    localStorage.setItem('paysavvy_user_region', JSON.stringify(this.userRegion));
  }

  getRegionCoordinates(country, state = null) {
    if (country === 'Malaysia' && state && this.heatmapData.malaysia.states[state]) {
      return this.heatmapData.malaysia.states[state].coordinates;
    }
    
    if (this.heatmapData.asean.countries[country]) {
      return this.heatmapData.asean.countries[country].coordinates;
    }

    return [0, 0]; // Default coordinates
  }

  async generateHeatmap(containerId, options = {}) {
    const {
      type = 'chart', // 'chart' or 'map'
      showASEAN = true,
      highlightUserRegion = true,
      width = 800,
      height = 400
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    if (type === 'chart') {
      return this.generateChartHeatmap(container, { showASEAN, highlightUserRegion });
    } else {
      return this.generateMapHeatmap(container, { showASEAN, highlightUserRegion, width, height });
    }
  }

  async generateChartHeatmap(container, options) {
    const { showASEAN, highlightUserRegion } = options;

    // Prepare data for Chart.js
    const datasets = [];
    const labels = [];

    // Malaysia states data
    const malaysiaData = [];
    const malaysiaLabels = [];
    const malaysiaColors = [];

    Object.entries(this.heatmapData.malaysia.states).forEach(([state, data]) => {
      malaysiaLabels.push(state);
      malaysiaData.push(data.scamCount);
      
      const isUserRegion = highlightUserRegion && this.userRegion.state === state;
      malaysiaColors.push(isUserRegion ? '#ff6384' : this.getRiskColor(data.riskLevel));
    });

    datasets.push({
      label: 'Malaysia States',
      data: malaysiaData,
      backgroundColor: malaysiaColors,
      borderWidth: 1
    });

    labels.push(...malaysiaLabels);

    // ASEAN countries data
    if (showASEAN) {
      const aseanData = [];
      const aseanLabels = [];
      const aseanColors = [];

      Object.entries(this.heatmapData.asean.countries).forEach(([country, data]) => {
        aseanLabels.push(country);
        aseanData.push(data.scamCount);
        
        const isUserRegion = highlightUserRegion && this.userRegion.country === country;
        aseanColors.push(isUserRegion ? '#ff6384' : this.getRiskColor(data.riskLevel));
      });

      datasets.push({
        label: 'ASEAN Countries',
        data: aseanData,
        backgroundColor: aseanColors,
        borderWidth: 1
      });
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    container.innerHTML = '';
    container.appendChild(canvas);

    // Import Chart.js dynamically
    const Chart = await this.loadChartJS();
    
    this.chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: showASEAN ? [...malaysiaLabels, ...aseanLabels] : malaysiaLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Regional Scam Risk Heatmap'
          },
          legend: {
            display: showASEAN
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const regionName = context.label;
                const regionData = this.getRegionData(regionName);
                return regionData ? [
                  `Risk Level: ${regionData.riskLevel}`,
                  `Coordinates: ${regionData.coordinates.join(', ')}`
                ] : [];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Scam Reports'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Region'
            }
          }
        }
      }
    });

    return this.chart;
  }

  async loadChartJS() {
    if (window.Chart) {
      return window.Chart;
    }

    // Dynamically import Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
      script.onload = () => resolve(window.Chart);
      script.onerror = reject;
    });
  }

  generateMapHeatmap(container, options) {
    // Simple HTML-based map visualization
    const { showASEAN, highlightUserRegion, width, height } = options;

    let html = `
      <div class="heatmap-container" style="width: ${width}px; height: ${height}px; position: relative;">
        <div class="heatmap-legend">
          <h6>Regional Scam Risk</h6>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-color" style="background: #ef4444;"></span>
              <span>High Risk</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #f59e0b;"></span>
              <span>Medium Risk</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #10b981;"></span>
              <span>Low Risk</span>
            </div>
          </div>
        </div>
        
        <div class="heatmap-regions">
    `;

    // Malaysia states
    html += '<div class="region-group"><h6>Malaysia</h6>';
    Object.entries(this.heatmapData.malaysia.states).forEach(([state, data]) => {
      const isUserRegion = highlightUserRegion && this.userRegion.state === state;
      const classes = `region-item ${isUserRegion ? 'user-region' : ''}`;
      
      html += `
        <div class="${classes}" data-region="${state}" data-count="${data.scamCount}">
          <span class="region-name">${state}</span>
          <span class="region-count badge" style="background: ${this.getRiskColor(data.riskLevel)};">
            ${data.scamCount}
          </span>
        </div>
      `;
    });
    html += '</div>';

    // ASEAN countries
    if (showASEAN) {
      html += '<div class="region-group"><h6>ASEAN</h6>';
      Object.entries(this.heatmapData.asean.countries).forEach(([country, data]) => {
        const isUserRegion = highlightUserRegion && this.userRegion.country === country;
        const classes = `region-item ${isUserRegion ? 'user-region' : ''}`;
        
        html += `
          <div class="${classes}" data-region="${country}" data-count="${data.scamCount}">
            <span class="region-name">${country}</span>
            <span class="region-count badge" style="background: ${this.getRiskColor(data.riskLevel)};">
              ${data.scamCount}
            </span>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div></div>';

    container.innerHTML = html;

    // Add interactivity
    this.addHeatmapInteractivity(container);

    return { type: 'html', element: container };
  }

  addHeatmapInteractivity(container) {
    const regionItems = container.querySelectorAll('.region-item');
    
    regionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const regionName = e.currentTarget.dataset.region;
        const regionData = this.getRegionData(regionName);
        
        if (regionData) {
          this.showRegionDetails(regionName, regionData);
        }
      });

      item.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });

      item.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      });
    });
  }

  getRegionData(regionName) {
    // Check Malaysia states
    if (this.heatmapData.malaysia.states[regionName]) {
      return this.heatmapData.malaysia.states[regionName];
    }
    
    // Check ASEAN countries
    if (this.heatmapData.asean.countries[regionName]) {
      return this.heatmapData.asean.countries[regionName];
    }

    return null;
  }

  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  showRegionDetails(regionName, regionData) {
    const modal = document.createElement('div');
    modal.className = 'region-details-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h5>${regionName}</h5>
          <button type="button" class="btn-close" onclick="this.closest('.region-details-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Scam Reports:</strong> ${regionData.scamCount}</p>
          <p><strong>Risk Level:</strong> <span class="badge" style="background: ${this.getRiskColor(regionData.riskLevel)};">${regionData.riskLevel.toUpperCase()}</span></p>
          <p><strong>Coordinates:</strong> ${regionData.coordinates.join(', ')}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="window.PaySavvy.heatmap.setUserRegion('${regionName}')">Set as My Region</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  addScamReport(region, country = 'Malaysia') {
    let regionData;
    
    if (country === 'Malaysia' && this.heatmapData.malaysia.states[region]) {
      regionData = this.heatmapData.malaysia.states[region];
    } else if (this.heatmapData.asean.countries[region]) {
      regionData = this.heatmapData.asean.countries[region];
    }

    if (regionData) {
      regionData.scamCount += 1;
      
      // Update risk level if necessary
      if (regionData.scamCount > 30 && regionData.riskLevel !== 'high') {
        regionData.riskLevel = 'high';
      } else if (regionData.scamCount > 15 && regionData.riskLevel === 'low') {
        regionData.riskLevel = 'medium';
      }

      // Save to localStorage
      localStorage.setItem('paysavvy_heatmap_data', JSON.stringify(this.heatmapData));
      
      return true;
    }

    return false;
  }

  getRegionalStats() {
    const stats = {
      malaysia: {
        totalReports: 0,
        highRiskStates: 0,
        mediumRiskStates: 0,
        lowRiskStates: 0
      },
      asean: {
        totalReports: 0,
        highRiskCountries: 0,
        mediumRiskCountries: 0,
        lowRiskCountries: 0
      }
    };

    // Calculate Malaysia stats
    Object.values(this.heatmapData.malaysia.states).forEach(state => {
      stats.malaysia.totalReports += state.scamCount;
      stats.malaysia[`${state.riskLevel}RiskStates`] += 1;
    });

    // Calculate ASEAN stats
    Object.values(this.heatmapData.asean.countries).forEach(country => {
      stats.asean.totalReports += country.scamCount;
      stats.asean[`${country.riskLevel}RiskCountries`] += 1;
    });

    return stats;
  }

  getUserRegionRisk() {
    const regionData = this.getRegionData(this.userRegion.state || this.userRegion.country);
    
    if (regionData) {
      return {
        region: this.userRegion.state || this.userRegion.country,
        riskLevel: regionData.riskLevel,
        scamCount: regionData.scamCount,
        recommendation: this.getRegionRecommendation(regionData.riskLevel)
      };
    }

    return {
      region: 'Unknown',
      riskLevel: 'medium',
      scamCount: 0,
      recommendation: 'Stay vigilant when scanning links'
    };
  }

  getRegionRecommendation(riskLevel) {
    switch (riskLevel) {
      case 'high':
        return 'Your region has high scam activity. Be extra cautious with all links and verify through official channels.';
      case 'medium':
        return 'Moderate scam activity in your region. Always scan suspicious links before clicking.';
      case 'low':
        return 'Your region has relatively low scam activity, but remain vigilant.';
      default:
        return 'Stay alert for suspicious links and verify with official sources.';
    }
  }
}