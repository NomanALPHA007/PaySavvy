// QR Code Scanner and Decoder
export class QRDecoder {
  constructor() {
    this.scanner = null;
    this.isScanning = false;
    this.scannerElement = null;
  }

  async initializeScanner(elementId, options = {}) {
    const {
      qrbox = { width: 250, height: 250 },
      fps = 10,
      aspectRatio = 1.0,
      supportedScanTypes = ['qr_code']
    } = options;

    try {
      // Dynamically import html5-qrcode
      const { Html5Qrcode, Html5QrcodeScanType } = await this.loadQRCodeLibrary();
      
      this.scannerElement = document.getElementById(elementId);
      if (!this.scannerElement) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      this.scanner = new Html5Qrcode(elementId);

      const config = {
        fps: fps,
        qrbox: qrbox,
        aspectRatio: aspectRatio,
        supportedScanTypes: supportedScanTypes.map(type => {
          switch(type) {
            case 'qr_code': return Html5QrcodeScanType.SCAN_TYPE_QR_CODE;
            case 'code_128': return Html5QrcodeScanType.SCAN_TYPE_CODE_128;
            default: return Html5QrcodeScanType.SCAN_TYPE_QR_CODE;
          }
        })
      };

      return { success: true, scanner: this.scanner, config };
    } catch (error) {
      console.error('QR Scanner initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async loadQRCodeLibrary() {
    if (window.Html5Qrcode) {
      return window.Html5Qrcode;
    }

    // Load the library dynamically
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode/minified/html5-qrcode.min.js';
      script.onload = () => {
        resolve({
          Html5Qrcode: window.Html5Qrcode,
          Html5QrcodeScanType: window.Html5QrcodeScanType
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async startCamera(config = {}) {
    if (!this.scanner) {
      throw new Error('Scanner not initialized');
    }

    const defaultConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    };

    const finalConfig = { ...defaultConfig, ...config };

    try {
      await this.scanner.start(
        { facingMode: "environment" }, // Use rear camera
        finalConfig,
        (decodedText, decodedResult) => {
          this.onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          this.onScanError(errorMessage);
        }
      );

      this.isScanning = true;
      return { success: true };
    } catch (error) {
      console.error('Camera start failed:', error);
      return { success: false, error: error.message };
    }
  }

  async stopCamera() {
    if (this.scanner && this.isScanning) {
      try {
        await this.scanner.stop();
        this.isScanning = false;
        return { success: true };
      } catch (error) {
        console.error('Camera stop failed:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  }

  async scanFile(file) {
    if (!this.scanner) {
      throw new Error('Scanner not initialized');
    }

    try {
      const result = await this.scanner.scanFile(file, true);
      return {
        success: true,
        decodedText: result,
        source: 'file'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        source: 'file'
      };
    }
  }

  onScanSuccess(decodedText, decodedResult) {
    // Extract URL if the QR contains one
    const extractedData = this.extractUrlFromQR(decodedText);
    
    // Dispatch custom event with scan result
    const event = new CustomEvent('qr-scan-success', {
      detail: {
        decodedText: decodedText,
        extractedUrl: extractedData.url,
        qrType: extractedData.type,
        decodedResult: decodedResult,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }

  onScanError(errorMessage) {
    // Only log significant errors, not routine scanning messages
    if (!errorMessage.includes('No QR code found')) {
      console.warn('QR Scan Error:', errorMessage);
    }
  }

  extractUrlFromQR(qrText) {
    const result = {
      url: null,
      type: 'unknown',
      data: qrText
    };

    // Check if it's a direct URL
    try {
      new URL(qrText);
      result.url = qrText;
      result.type = 'url';
      return result;
    } catch {}

    // Check for common QR patterns
    if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
      result.url = qrText;
      result.type = 'url';
    } else if (qrText.startsWith('mailto:')) {
      result.type = 'email';
    } else if (qrText.startsWith('tel:')) {
      result.type = 'phone';
    } else if (qrText.startsWith('wifi:')) {
      result.type = 'wifi';
    } else if (this.isPaymentQR(qrText)) {
      const paymentData = this.parsePaymentQR(qrText);
      result.url = paymentData.url;
      result.type = 'payment';
      result.paymentData = paymentData;
    } else {
      // Try to find URLs within the text
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = qrText.match(urlRegex);
      if (urls && urls.length > 0) {
        result.url = urls[0];
        result.type = 'embedded_url';
      }
    }

    return result;
  }

  isPaymentQR(qrText) {
    // Common payment QR patterns for Malaysian systems
    const paymentPatterns = [
      /^https:\/\/.*paypal\.com/i,
      /^https:\/\/.*pay\.grab\.com/i,
      /^https:\/\/.*boost\.com/i,
      /^https:\/\/.*tngdigital\.com/i,
      /^https:\/\/.*bigpay\.my/i,
      /DuitNow/i,
      /^00020101021/,  // EMVCo QR standard
      /^000201010212/   // DuitNow QR
    ];

    return paymentPatterns.some(pattern => pattern.test(qrText));
  }

  parsePaymentQR(qrText) {
    const paymentData = {
      type: 'unknown',
      amount: null,
      merchant: null,
      url: null,
      reference: null
    };

    // Parse DuitNow QR (EMVCo format)
    if (qrText.startsWith('00020101')) {
      paymentData.type = 'duitnow';
      // Extract merchant and amount from EMVCo format
      // This is a simplified parser - full implementation would be more complex
      const merchantMatch = qrText.match(/26\d{2}(\d{2})(.+?)27/);
      if (merchantMatch) {
        paymentData.merchant = merchantMatch[2];
      }
    }

    // Parse URL-based payment QRs
    if (qrText.includes('http')) {
      try {
        const url = new URL(qrText);
        paymentData.url = qrText;
        paymentData.type = 'url_payment';
        
        // Extract amount from URL parameters
        const amount = url.searchParams.get('amount') || url.searchParams.get('amt');
        if (amount) {
          paymentData.amount = parseFloat(amount);
        }

        // Identify service provider
        if (url.hostname.includes('grab')) {
          paymentData.type = 'grabpay';
        } else if (url.hostname.includes('boost')) {
          paymentData.type = 'boost';
        } else if (url.hostname.includes('tng')) {
          paymentData.type = 'touchngo';
        }
      } catch (error) {
        console.warn('Failed to parse payment URL:', error);
      }
    }

    return paymentData;
  }

  async getCameraList() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substr(0, 8)}`
        }));
      
      return { success: true, cameras };
    } catch (error) {
      return { success: false, error: error.message, cameras: [] };
    }
  }

  async switchCamera(cameraId) {
    if (!this.scanner) {
      throw new Error('Scanner not initialized');
    }

    try {
      if (this.isScanning) {
        await this.stopCamera();
      }

      await this.scanner.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
          this.onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          this.onScanError(errorMessage);
        }
      );

      this.isScanning = true;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  createFileUploadInterface(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    const fileUploadHtml = `
      <div class="qr-file-upload">
        <div class="upload-area" id="qr-upload-area">
          <div class="upload-content">
            <i data-feather="upload" class="upload-icon"></i>
            <p>Drop QR code image here or click to select</p>
            <input type="file" id="qr-file-input" accept="image/*" style="display: none;">
            <button type="button" class="btn btn-outline-primary" onclick="document.getElementById('qr-file-input').click()">
              Select Image
            </button>
          </div>
        </div>
        <div id="qr-upload-result" class="upload-result d-none"></div>
      </div>
    `;

    container.innerHTML = fileUploadHtml;

    // Add drag and drop functionality
    const uploadArea = document.getElementById('qr-upload-area');
    const fileInput = document.getElementById('qr-file-input');
    const resultDiv = document.getElementById('qr-upload-result');

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
        this.handleFileUpload(files[0], resultDiv);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0], resultDiv);
      }
    });

    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }

  async handleFileUpload(file, resultDiv) {
    try {
      resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Scanning QR code...</p></div>';
      resultDiv.classList.remove('d-none');

      const result = await this.scanFile(file);
      
      if (result.success) {
        const extractedData = this.extractUrlFromQR(result.decodedText);
        
        resultDiv.innerHTML = `
          <div class="alert alert-success">
            <h6>QR Code Detected!</h6>
            <p><strong>Type:</strong> ${extractedData.type}</p>
            <p><strong>Content:</strong> ${result.decodedText}</p>
            ${extractedData.url ? `<button class="btn btn-primary btn-sm" onclick="window.PaySavvy.scanUrl('${extractedData.url}')">Scan URL</button>` : ''}
          </div>
        `;

        // Dispatch event for auto-scanning
        if (extractedData.url) {
          const event = new CustomEvent('qr-url-extracted', {
            detail: {
              url: extractedData.url,
              type: extractedData.type,
              source: 'file_upload'
            }
          });
          document.dispatchEvent(event);
        }
      } else {
        resultDiv.innerHTML = `
          <div class="alert alert-warning">
            <h6>No QR Code Found</h6>
            <p>Please try a different image or ensure the QR code is clearly visible.</p>
          </div>
        `;
      }
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="alert alert-danger">
          <h6>Scan Failed</h6>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  destroy() {
    if (this.scanner && this.isScanning) {
      this.stopCamera();
    }
    this.scanner = null;
    this.scannerElement = null;
    this.isScanning = false;
  }
}