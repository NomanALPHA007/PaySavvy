// Language utility for English/Bahasa Malaysia toggle
export const languages = {
  en: {
    title: "PaySavvy - AI Scam Link Detector",
    subtitle: "Protect yourself from fake payment links",
    urlPlaceholder: "Paste suspicious link here...",
    scanButton: "Scan Link",
    scanning: "Scanning...",
    riskLevels: {
      safe: "Safe",
      suspicious: "Suspicious", 
      dangerous: "Dangerous"
    },
    results: {
      safe: "This link appears to be safe",
      suspicious: "This link has suspicious characteristics",
      dangerous: "This link is likely a scam - DO NOT CLICK"
    },
    offline: "You're offline - using basic detection only",
    preferences: "Preferences",
    language: "Language",
    banks: "Preferred Banks",
    history: "Scan History",
    reportScam: "Report as Scam",
    clearHistory: "Clear History"
  },
  bm: {
    title: "PaySavvy - Pengesan Pautan Scam AI",
    subtitle: "Lindungi diri anda dari pautan pembayaran palsu",
    urlPlaceholder: "Tampal pautan yang mencurigakan di sini...",
    scanButton: "Imbas Pautan",
    scanning: "Mengimbas...",
    riskLevels: {
      safe: "Selamat",
      suspicious: "Mencurigakan",
      dangerous: "Berbahaya"
    },
    results: {
      safe: "Pautan ini kelihatan selamat",
      suspicious: "Pautan ini mempunyai ciri-ciri yang mencurigakan",
      dangerous: "Pautan ini berkemungkinan scam - JANGAN KLIK"
    },
    offline: "Anda di luar talian - menggunakan pengesanan asas sahaja",
    preferences: "Keutamaan",
    language: "Bahasa",
    banks: "Bank Pilihan",
    history: "Sejarah Imbasan",
    reportScam: "Laporkan sebagai Scam",
    clearHistory: "Padam Sejarah"
  }
};

export class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'en';
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.updateUI();
  }

  getText(key) {
    const keys = key.split('.');
    let value = languages[this.currentLang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.getText(key);
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = text;
      } else {
        element.textContent = text;
      }
    });

    // Update language toggle
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
      langToggle.textContent = this.currentLang === 'en' ? 'BM' : 'EN';
    }
  }

  init() {
    this.updateUI();
    
    // Add language toggle event listener
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        const newLang = this.currentLang === 'en' ? 'bm' : 'en';
        this.setLanguage(newLang);
      });
    }
  }
}