/**
 * Heidelberg PDF Renamer - Helper Functions
 * Sammlung von Utility-Funktionen für die gesamte Anwendung
 */

import { SWISS_FORMAT, FILE_CONSTANTS, DEBUG } from '../config/constants.js';

/**
 * Schweizer Zahlenformatierung
 * @param {number} number - Zu formatierende Zahl
 * @returns {string} Formatierte Zahl
 */
export function formatSwissNumber(number) {
    return new Intl.NumberFormat(SWISS_FORMAT.LOCALE, {
        useGrouping: true
    }).format(number);
}

/**
 * Schweizer Zahlenformatierung rückgängig machen
 * @param {string} formattedNumber - Formatierte Zahl
 * @returns {number} Zahl
 */
export function parseSwissNumber(formattedNumber) {
    const cleaned = formattedNumber.replace(/[''\s]/g, '');
    return parseInt(cleaned, 10);
}

/**
 * Dateigrösse formatieren
 * @param {number} bytes - Anzahl Bytes
 * @param {number} decimals - Anzahl Dezimalstellen
 * @returns {string} Formatierte Dateigrösse
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Datum in Schweizer Format formatieren
 * @param {Date|string} date - Datum
 * @returns {string} Formatiertes Datum
 */
export function formatSwissDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString(SWISS_FORMAT.LOCALE);
}

/**
 * Zeit in Schweizer Format formatieren
 * @param {Date|string} date - Datum/Zeit
 * @returns {string} Formatierte Zeit
 */
export function formatSwissTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString(SWISS_FORMAT.LOCALE, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce-Funktion
 * @param {Function} func - Auszuführende Funktion
 * @param {number} wait - Wartezeit in ms
 * @param {boolean} immediate - Sofort ausführen
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle-Funktion
 * @param {Function} func - Auszuführende Funktion
 * @param {number} limit - Zeitlimit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Text für Dateinamen bereinigen
 * @param {string} text - Zu bereinigender Text
 * @param {number} maxLength - Maximale Länge
 * @returns {string} Bereinigter Text
 */
export function sanitizeForFilename(text, maxLength = FILE_CONSTANTS.MAX_FILENAME_LENGTH) {
    return text
        .trim()
        .replace(FILE_CONSTANTS.INVALID_FILENAME_CHARS, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
        .substring(0, maxLength);
}

/**
 * Eindeutige ID generieren
 * @param {string} prefix - Präfix für ID
 * @returns {string} Eindeutige ID
 */
export function generateUniqueId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Tief kopieren (Deep Clone)
 * @param {any} obj - Zu kopierendes Objekt
 * @returns {any} Kopiertes Objekt
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Objekte tief vergleichen
 * @param {any} a - Erstes Objekt
 * @param {any} b - Zweites Objekt
 * @returns {boolean} Sind gleich
 */
export function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (let key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        
        return true;
    }
    
    return false;
}

/**
 * Leere Werte prüfen
 * @param {any} value - Zu prüfender Wert
 * @returns {boolean} Ist leer
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Array-Duplikate entfernen
 * @param {Array} array - Array mit möglichen Duplikaten
 * @param {string} key - Schlüssel für Objekt-Arrays (optional)
 * @returns {Array} Array ohne Duplikate
 */
export function removeDuplicates(array, key = null) {
    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    return [...new Set(array)];
}

/**
 * Objekt in URL-Parameter umwandeln
 * @param {Object} obj - Objekt
 * @returns {string} URL-Parameter-String
 */
export function objectToUrlParams(obj) {
    return Object.keys(obj)
        .filter(key => obj[key] !== null && obj[key] !== undefined && obj[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
}

/**
 * URL-Parameter in Objekt umwandeln
 * @param {string} paramString - Parameter-String
 * @returns {Object} Objekt
 */
export function urlParamsToObject(paramString) {
    const params = new URLSearchParams(paramString);
    const obj = {};
    for (const [key, value] of params.entries()) {
        obj[key] = value;
    }
    return obj;
}

/**
 * Lokale Storage Wrapper mit Fehlerbehandlung
 */
export const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },
    
    has(key) {
        return localStorage.getItem(key) !== null;
    }
};

/**
 * Browser-Unterstützung prüfen
 * @param {Array} features - Liste der zu prüfenden Features
 * @returns {Object} Unterstützungs-Status
 */
export function checkBrowserSupport(features) {
    const support = {};
    
    features.forEach(feature => {
        switch (feature) {
            case 'FileReader':
                support[feature] = !!(window.File && window.FileReader && window.FileList && window.Blob);
                break;
            case 'showDirectoryPicker':
                support[feature] = 'showDirectoryPicker' in window;
                break;
            case 'indexedDB':
                support[feature] = 'indexedDB' in window;
                break;
            case 'crypto':
                support[feature] = 'crypto' in window && 'subtle' in window.crypto;
                break;
            case 'serviceWorker':
                support[feature] = 'serviceWorker' in navigator;
                break;
            default:
                support[feature] = feature in window;
        }
    });
    
    return support;
}

/**
 * Farbe heller/dunkler machen
 * @param {string} color - Hexadezimal-Farbe
 * @param {number} amount - Anzahl (-255 bis 255)
 * @returns {string} Neue Farbe
 */
export function adjustColorBrightness(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

/**
 * CSS-Klassen-Utilities
 */
export const cssUtils = {
    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    },
    
    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    },
    
    toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    },
    
    hasClass(element, className) {
        return element && className && element.classList.contains(className);
    }
};

/**
 * Animation-Utilities
 */
export const animationUtils = {
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(timestamp) {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    fadeOut(element, duration = 300, callback = null) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(timestamp) {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                if (callback) callback();
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    slideDown(element, duration = 300) {
        element.style.overflow = 'hidden';
        element.style.height = '0';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight;
        const start = performance.now();
        
        function animate(timestamp) {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = `${targetHeight * progress}px`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
            }
        }
        
        requestAnimationFrame(animate);
    }
};

/**
 * Performance-Utilities
 */
export const performanceUtils = {
    measureTime(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        if (DEBUG.ENABLED) {
            console.log(`${name} took ${end - start} milliseconds`);
        }
        
        return result;
    },
    
    measureTimeAsync(name, fn) {
        return async (...args) => {
            const start = performance.now();
            const result = await fn(...args);
            const end = performance.now();
            
            if (DEBUG.ENABLED) {
                console.log(`${name} took ${end - start} milliseconds`);
            }
            
            return result;
        };
    },
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
                total: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100,
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100
            };
        }
        return null;
    }
};

/**
 * Error-Handling-Utilities
 */
export const errorUtils = {
    createError(message, code = null, details = null) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.timestamp = new Date().toISOString();
        return error;
    },
    
    logError(error, context = null) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            code: error.code,
            details: error.details,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        console.error('Application Error:', errorInfo);
        
        // Hier könnte Error-Tracking (Sentry, LogRocket, etc.) implementiert werden
        return errorInfo;
    },
    
    handleAsyncError(promise, context = null) {
        return promise.catch(error => {
            this.logError(error, context);
            throw error;
        });
    }
};

// Export als Default für einfachen Import
export default {
    formatSwissNumber,
    parseSwissNumber,
    formatFileSize,
    formatSwissDate,
    formatSwissTime,
    debounce,
    throttle,
    sanitizeForFilename,
    generateUniqueId,
    deepClone,
    deepEqual,
    isEmpty,
    removeDuplicates,
    objectToUrlParams,
    urlParamsToObject,
    storage,
    checkBrowserSupport,
    adjustColorBrightness,
    cssUtils,
    animationUtils,
    performanceUtils,
    errorUtils
};