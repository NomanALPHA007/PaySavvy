// QR Code Scanner Component with html5-qrcode integration
import { QRDecoder } from '../utils/qrDecode.js';

export class QRScanner {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.qrDecoder = new QRDecoder();
    this.isActive = false;
    this.currentMode = 'camera'; // 'camera' or 'file'
    
    this.options = {
      enableCamera: true,
      enableFileUpload: true,
      autoScan: true,
      showPreview: true,
      ...options
    };

    this.init();
  }

  init() {
    if (!this.container) {
      console.error(`QR Scanner container ${this.containerId} not found`);
      return;
    }

    this.createUI();
    this.setupEventListeners();
  }

  createUI() {
    const html = `
      <div class="qr-scanner-component">
        <div class="qr-scanner-header">
          <h6>
            <i data-feather="camera"></i>
            QR Code Scanner
          </h6>
          <div class="qr-mode-toggle">
            ${this.options.enableCamera ? `
              <button type="button" class="btn btn-sm btn-outline-primary mode-btn active" data-mode="camera">
                <i data-feather="camera"></i> Camera
              </button>
            ` : ''}
            ${this.options.enableFileUpload ? `
              <button type="button" class="btn btn-sm btn-outline-primary mode-btn" data-mode="file">
                <i data-feather="upload"></i> Upload
              </button>
            ` : ''}
          </div>
        </div>

        <div class="qr-scanner-content">
          <!-- Camera Scanner -->
          <div id="qr-camera-section" class="scanner-section active">
            <div class="camera-controls mb-3">
              <button type="button" class="btn btn-success" id="start-camera">
                <i data-feather="play"></i> Start Camera
              </button>
              <button type="button" class="btn btn-danger d-none" id="stop-camera">
                <i data-feather="stop"></i> Stop Camera
              </button>
              <select class="form-select d-none" id="camera-select" style="width: auto; display: inline-block;">
                <option value="">Select Camera</option>
              </select>
            </div>
            
            <div id="qr-camera-reader" class="qr-reader-container"></div>
            <div class="camera-status mt-2">
              <small class="text-muted">Point your camera at a QR code to scan</small>
            </div>
          </div>

          <!-- File Upload Scanner -->
          <div id="qr-file-section" class="scanner-section d-none">
            <div class="qr-file-upload">
              <div class="upload-area" id="qr-upload-area">
                <div class="upload-content text-center p-4">
                  <i data-feather="upload" class="upload-icon mb-3"></i>
                  <p class="mb-3">Drop QR code image here or click to select</p>
                  <input type="file" id="qr-file-input" accept="image/*" style="display: none;">
                  <button type="button" class="btn btn-primary" onclick="document.getElementById('qr-file-input').click()">
                    <i data-feather="folder"></i> Select Image
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Scan Results -->
          <div id="qr-scan-results" class="scan-results mt-3 d-none">
            <div class="alert alert-success">
              <h6 class="alert-heading">
                <i data-feather="check-circle"></i>
                QR Code Detected!
              </h6>
              <div id="qr-result-content"></div>
              <div class="mt-3" id="qr-result-actions"></div>
            </div>
          </div>

          <!-- Scan History -->
          <div class="qr-scan-history mt-3">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#qr-history-content">
              <i data-feather="clock"></i> Recent QR Scans
            </button>
            <div class="collapse" id="qr-history-content">
              <div class="card card-body mt-2">
                <div id="qr-history-items">
                  <p class="text-muted small">No recent QR scans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.addStyles();

    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }

  addStyles() {
    if (document.getElementById('qr-scanner-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'qr-scanner-styles';
    styles.textContent = `
      .qr-scanner-component {
        border: 1px solid #e9ecef;
        border-radius: 0.5rem;
        padding: 1rem;
        background: white;
      }

      .qr-scanner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e9ecef;
      }

      .qr-mode-toggle .mode-btn.active {
        background-color: var(--bs-primary);
        color: white;
        border-color: var(--bs-primary);
      }

      .qr-reader-container {
        border: 2px dashed #dee2e6;
        border-radius: 0.5rem;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
      }

      .qr-reader-container.active {
        border-color: var(--bs-primary);
        background: white;
      }

      .upload-area {
        border: 2px dashed #dee2e6;
        border-radius: 0.5rem;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .upload-area:hover,
      .upload-area.drag-over {
        border-color: var(--bs-primary);
        background-color: rgba(13, 110, 253, 0.1);
      }

      .upload-icon {
        font-size: 3rem;
        color: #6c757d;
      }

      .scanner-section.d-none {
        display: none !important;
      }

      .scanner-section.active {
        display: block;
      }

      .camera-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .qr-history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 1px solid #e9ecef;
      }

      .qr-history-item:last-child {
        border-bottom: none;
      }

      .qr-result-url {
        font-family: monospace;
        background: #f8f9fa;
        padding: 0.5rem;
        border-radius: 0.25rem;
        word-break: break-all;
        margin: 0.5rem 0;
      }
    `;

    document.head.appendChild(styles);
  }

  setupEventListeners() {
    // Mode toggle buttons
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.closest('button').dataset.mode;
        this.switchMode(mode);
      });
    });

    // Camera controls
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const cameraSelect = document.getElementById('camera-select');

    if (startCameraBtn) {
      startCameraBtn.addEventListener('click', () => this.startCamera());
    }

    if (stopCameraBtn) {
      stopCameraBtn.addEventListener('click', () => this.stopCamera());
    }

    if (cameraSelect) {
      cameraSelect.addEventListener('change', (e) => {
        if (e.target.value && this.isActive) {
          this.switchCamera(e.target.value);
        }
      });
    }

    // File upload
    const fileInput = document.getElementById('qr-file-input');
    const uploadArea = document.getElementById('qr-upload-area');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    if (uploadArea) {
      // Drag and drop functionality
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileUpload(files[0]);
        }
      });

      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });
    }

    // QR scan success event
    document.addEventListener('qr-scan-success', (e) => {
      this.handleScanResult(e.detail);
    });

    // QR URL extracted event (for auto-scanning)
    document.addEventListener('qr-url-extracted', (e) => {
      if (this.options.autoScan && e.detail.url) {
        this.triggerAutoScan(e.detail.url);
      }
    });
  }

  switchMode(mode) {
    // Update active mode button
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide sections
    const cameraSection = document.getElementById('qr-camera-section');
    const fileSection = document.getElementById('qr-file-section');

    if (mode === 'camera') {
      cameraSection.classList.remove('d-none');
      cameraSection.classList.add('active');
      fileSection.classList.add('d-none');
      fileSection.classList.remove('active');
    } else {
      fileSection.classList.remove('d-none');
      fileSection.classList.add('active');
      cameraSection.classList.add('d-none');
      cameraSection.classList.remove('active');
      
      // Stop camera if it's running
      if (this.isActive) {
        this.stopCamera();
      }
    }

    this.currentMode = mode;
  }

  async startCamera() {
    try {
      // Initialize scanner if not done
      const initResult = await this.qrDecoder.initializeScanner('qr-camera-reader');
      
      if (!initResult.success) {
        this.showError('Failed to initialize camera: ' + initResult.error);
        return;
      }

      // Load available cameras
      await this.loadCameraList();

      // Start camera
      const startResult = await this.qrDecoder.startCamera();
      
      if (startResult.success) {
        this.isActive = true;
        this.updateCameraUI(true);
        this.showStatus('Camera started successfully');
        
        // Mark reader container as active
        const readerContainer = document.getElementById('qr-camera-reader');
        if (readerContainer) {
          readerContainer.classList.add('active');
        }
      } else {
        this.showError('Failed to start camera: ' + startResult.error);
      }
    } catch (error) {
      this.showError('Camera error: ' + error.message);
    }
  }

  async stopCamera() {
    try {
      const result = await this.qrDecoder.stopCamera();
      
      if (result.success) {
        this.isActive = false;
        this.updateCameraUI(false);
        this.showStatus('Camera stopped');
        
        // Remove active class from reader container
        const readerContainer = document.getElementById('qr-camera-reader');
        if (readerContainer) {
          readerContainer.classList.remove('active');
        }
      }
    } catch (error) {
      this.showError('Failed to stop camera: ' + error.message);
    }
  }

  async loadCameraList() {
    const cameraResult = await this.qrDecoder.getCameraList();
    const cameraSelect = document.getElementById('camera-select');
    
    if (cameraResult.success && cameraResult.cameras.length > 1 && cameraSelect) {
      cameraSelect.innerHTML = '<option value="">Select Camera</option>';
      cameraResult.cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera.id;
        option.textContent = camera.label;
        cameraSelect.appendChild(option);
      });
      cameraSelect.classList.remove('d-none');
    }
  }

  async switchCamera(cameraId) {
    try {
      const result = await this.qrDecoder.switchCamera(cameraId);
      if (result.success) {
        this.showStatus('Camera switched successfully');
      } else {
        this.showError('Failed to switch camera: ' + result.error);
      }
    } catch (error) {
      this.showError('Camera switch error: ' + error.message);
    }
  }

  async handleFileUpload(file) {
    this.showStatus('Scanning QR code from image...');
    
    try {
      const result = await this.qrDecoder.scanFile(file);
      
      if (result.success) {
        const extractedData = this.qrDecoder.extractUrlFromQR(result.decodedText);
        this.handleScanResult({
          decodedText: result.decodedText,
          extractedUrl: extractedData.url,
          qrType: extractedData.type,
          source: 'file_upload',
          timestamp: Date.now()
        });
      } else {
        this.showError('No QR code found in image');
      }
    } catch (error) {
      this.showError('File scan error: ' + error.message);
    }
  }

  handleScanResult(scanData) {
    const { decodedText, extractedUrl, qrType, source, timestamp } = scanData;
    
    // Save to scan history
    this.saveScanHistory(scanData);
    
    // Show results
    this.showScanResults(scanData);
    
    // Update history display
    this.updateHistoryDisplay();
    
    // Auto-fill URL if available and auto-scan is enabled
    if (extractedUrl && this.options.autoScan) {
      this.triggerAutoScan(extractedUrl);
    }
  }

  showScanResults(scanData) {
    const resultsDiv = document.getElementById('qr-scan-results');
    const contentDiv = document.getElementById('qr-result-content');
    const actionsDiv = document.getElementById('qr-result-actions');
    
    if (!resultsDiv || !contentDiv || !actionsDiv) return;

    const { decodedText, extractedUrl, qrType, source } = scanData;
    
    let contentHtml = `
      <p><strong>QR Type:</strong> ${qrType}</p>
      <p><strong>Source:</strong> ${source}</p>
      <div class="qr-result-url">
        <strong>Content:</strong><br>
        ${this.escapeHtml(decodedText)}
      </div>
    `;

    let actionsHtml = '';
    
    if (extractedUrl) {
      contentHtml += `
        <div class="qr-result-url">
          <strong>Extracted URL:</strong><br>
          <a href="${extractedUrl}" target="_blank" rel="noopener">${this.escapeHtml(extractedUrl)}</a>
        </div>
      `;
      
      actionsHtml = `
        <button class="btn btn-primary" onclick="window.PaySavvy.scanUrl('${this.escapeHtml(extractedUrl)}')">
          <i data-feather="shield"></i> Scan URL for Threats
        </button>
        <button class="btn btn-outline-secondary ms-2" onclick="navigator.clipboard.writeText('${this.escapeHtml(extractedUrl)}')">
          <i data-feather="copy"></i> Copy URL
        </button>
      `;
    } else {
      actionsHtml = `
        <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${this.escapeHtml(decodedText)}')">
          <i data-feather="copy"></i> Copy Content
        </button>
      `;
    }

    contentDiv.innerHTML = contentHtml;
    actionsDiv.innerHTML = actionsHtml;
    resultsDiv.classList.remove('d-none');

    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }

  triggerAutoScan(url) {
    // Fill the main URL input and trigger scan
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = url;
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Show notification
      this.showStatus(`URL auto-filled: ${url.substring(0, 50)}...`);
      
      // Optionally trigger automatic scan
      const scanForm = document.getElementById('scanForm');
      if (scanForm) {
        const event = new Event('submit', { cancelable: true });
        scanForm.dispatchEvent(event);
      }
    }
  }

  saveScanHistory(scanData) {
    const history = this.getScanHistory();
    history.unshift({
      ...scanData,
      id: Date.now() + Math.random()
    });
    
    // Keep only last 20 scans
    if (history.length > 20) {
      history.splice(20);
    }
    
    localStorage.setItem('paysavvy_qr_history', JSON.stringify(history));
  }

  getScanHistory() {
    try {
      return JSON.parse(localStorage.getItem('paysavvy_qr_history') || '[]');
    } catch {
      return [];
    }
  }

  updateHistoryDisplay() {
    const historyDiv = document.getElementById('qr-history-items');
    if (!historyDiv) return;

    const history = this.getScanHistory();
    
    if (history.length === 0) {
      historyDiv.innerHTML = '<p class="text-muted small">No recent QR scans</p>';
      return;
    }

    const historyHtml = history.slice(0, 10).map(scan => `
      <div class="qr-history-item">
        <div>
          <div class="small"><strong>${scan.qrType}</strong></div>
          <div class="text-muted small">${this.formatTimeAgo(scan.timestamp)}</div>
        </div>
        <div>
          ${scan.extractedUrl ? `
            <button class="btn btn-sm btn-outline-primary" onclick="window.PaySavvy.scanUrl('${this.escapeHtml(scan.extractedUrl)}')">
              Scan
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline-secondary ms-1" onclick="navigator.clipboard.writeText('${this.escapeHtml(scan.decodedText)}')">
            Copy
          </button>
        </div>
      </div>
    `).join('');

    historyDiv.innerHTML = historyHtml;
  }

  updateCameraUI(isActive) {
    const startBtn = document.getElementById('start-camera');
    const stopBtn = document.getElementById('stop-camera');
    
    if (startBtn && stopBtn) {
      if (isActive) {
        startBtn.classList.add('d-none');
        stopBtn.classList.remove('d-none');
      } else {
        startBtn.classList.remove('d-none');
        stopBtn.classList.add('d-none');
      }
    }
  }

  showStatus(message) {
    const statusElement = this.container.querySelector('.camera-status small');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'text-info';
    }
  }

  showError(message) {
    const statusElement = this.container.querySelector('.camera-status small');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'text-danger';
    }
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearHistory() {
    localStorage.removeItem('paysavvy_qr_history');
    this.updateHistoryDisplay();
  }

  destroy() {
    if (this.isActive) {
      this.stopCamera();
    }
    this.qrDecoder.destroy();
  }
}