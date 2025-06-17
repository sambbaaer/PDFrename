/**
 * Heidelberg PDF Renamer - Application Constants
 * Zentrale Sammlung aller Anwendungskonstanten
 */

// Anwendungsinfos
export const APP_INFO = {
    NAME: 'Heidelberg PDF Renamer',
    VERSION: '1.0.0',
    AUTHOR: 'Custom Development',
    DESCRIPTION: 'PDF-Umbenennung für Heidelberg Prinect Workflow',
    BUILD_DATE: new Date().toISOString().split('T')[0]
};

// Datei-Konstanten
export const FILE_CONSTANTS = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: ['application/pdf'],
    ALLOWED_EXTENSIONS: ['.pdf'],
    MAX_FILENAME_LENGTH: 255,
    INVALID_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1f]/,
    RESERVED_NAMES: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
};

// Produktcode-Konstanten
export const PRODUCT_CODE = {
    SEPARATOR: '#',
    MAX_PARTS: 5,
    PAPER_PREFIX: 'D-',
    
    // Valide Zeichen für verschiedene Teile
    AUFTRAG_PATTERN: /^A\d+$/,
    POSITION_PATTERN: /^\d+$/,
    KUNDE_PATTERN: /^[a-zA-Z0-9äöüÄÖÜß\s\-_&.]+$/,
    CODE_PATTERN: /^[A-Z0-9_-]+$/,
    
    // Längenbegrenzungen
    MAX_AUFTRAG_LENGTH: 20,
    MAX_KUNDE_LENGTH: 50,
    MAX_CODE_LENGTH: 20,
    MAX_POSITION: 999,
    MAX_AUFLAGE: 1000000
};

// Papierart-Codes
export const PAPER_TYPES = {
    GESTRICHEN: {
        value: 'gestrichen',
        code: 'g_s',
        display: 'Gestrichen'
    },
    UNGESTRICHEN: {
        value: 'ungestrichen', 
        code: 'u_s',
        display: 'Ungestrichen'
    }
};

// Schweizer Formatierung
export const SWISS_FORMAT = {
    NUMBER_SEPARATOR: '\'',
    DECIMAL_SEPARATOR: '.',
    LOCALE: 'de-CH',
    CURRENCY: 'CHF',
    DATE_FORMAT: 'dd.MM.yyyy',
    TIME_FORMAT: 'HH:mm'
};

// UI-Konstanten
export const UI_CONSTANTS = {
    NOTIFICATION_DURATION: 5000,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 250,
    MAX_NOTIFICATIONS: 5,
    MODAL_Z_INDEX: 1000,
    TOOLTIP_DELAY: 500,
    
    // CSS-Klassen
    CLASSES: {
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        VALID: 'valid',
        INVALID: 'invalid',
        DRAG_OVER: 'drag-over'
    }
};

// Storage-Schlüssel
export const STORAGE_KEYS = {
    CONFIG: 'heidelberg-pdf-renamer-config',
    HOTFOLDER: 'heidelberg-hotfolder-handle',
    SETTINGS: 'heidelberg-settings',
    BACKUP_PREFIX: 'heidelberg-backup-',
    USER_PREFERENCES: 'heidelberg-user-prefs'
};

// API-Konstanten
export const API_CONSTANTS = {
    INDEXEDDB_NAME: 'HeidelbergPDFRenamer',
    INDEXEDDB_VERSION: 1,
    STORE_NAMES: {
        HANDLES: 'handles',
        SETTINGS: 'settings',
        CACHE: 'cache'
    }
};

// Validierungs-Konstanten
export const VALIDATION = {
    // Fehlercodes
    ERROR_CODES: {
        REQUIRED: 'REQUIRED',
        PATTERN: 'PATTERN',
        MIN_LENGTH: 'MIN_LENGTH',
        MAX_LENGTH: 'MAX_LENGTH',
        MIN_VALUE: 'MIN_VALUE',
        MAX_VALUE: 'MAX_VALUE',
        NOT_NUMERIC: 'NOT_NUMERIC',
        INVALID_FORMAT: 'INVALID_FORMAT',
        DUPLICATE: 'DUPLICATE',
        FILE_TOO_LARGE: 'FILE_TOO_LARGE',
        INVALID_FILE_TYPE: 'INVALID_FILE_TYPE'
    },
    
    // Standard-Nachrichten
    MESSAGES: {
        REQUIRED: 'Dieses Feld ist erforderlich',
        INVALID_FORMAT: 'Ungültiges Format',
        TOO_SHORT: 'Zu kurz',
        TOO_LONG: 'Zu lang',
        INVALID_CHARACTERS: 'Ungültige Zeichen',
        FILE_TOO_LARGE: 'Datei zu gross',
        INVALID_FILE: 'Ungültige Datei'
    }
};

// Hotfolder-Konstanten
export const HOTFOLDER = {
    PERMISSION_MODE: 'readwrite',
    AUTO_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    MAX_FILES_DISPLAY: 10,
    
    // Browser-Unterstützung
    REQUIRED_APIS: [
        'showDirectoryPicker',
        'showSaveFilePicker'
    ],
    
    // Empfohlene Browser
    SUPPORTED_BROWSERS: [
        'Chrome 86+',
        'Edge 86+',
        'Opera 72+'
    ]
};

// Konfigurationskonstanten
export const CONFIG_CONSTANTS = {
    VERSION: '1.0.0',
    MIGRATION_NEEDED_VERSIONS: ['0.9.0', '0.9.1'],
    
    // Default-Anzahl Einträge
    DEFAULT_MACHINES_COUNT: 4,
    DEFAULT_PRODUCTS_COUNT: 6, 
    DEFAULT_PAPERS_COUNT: 5,
    
    // Maximale Anzahl Einträge
    MAX_MACHINES: 50,
    MAX_PRODUCTS: 100,
    MAX_PAPERS: 100,
    
    // ID-Generierung
    ID_PREFIX: {
        MACHINE: 'machine_',
        PRODUCT: 'product_',
        PAPER: 'paper_'
    }
};

// Theme-Konstanten
export const THEMES = {
    DEFAULT: 'heidelberg-blue',
    AVAILABLE: [
        'heidelberg-blue',
        'classic-blue',
        'dark-mode',
        'high-contrast'
    ],
    
    COLORS: {
        HEIDELBERG_BLUE: '#003f7f',
        HEIDELBERG_LIGHT_BLUE: '#4a90e2',
        HEIDELBERG_ACCENT: '#ff6b35',
        SUCCESS_GREEN: '#28a745',
        WARNING_ORANGE: '#ffc107',
        DANGER_RED: '#dc3545'
    }
};

// Browser-Kompatibilität
export const BROWSER_SUPPORT = {
    MINIMUM_VERSIONS: {
        Chrome: 86,
        Edge: 86,
        Firefox: 82,
        Safari: 14,
        Opera: 72
    },
    
    REQUIRED_FEATURES: [
        'FileReader',
        'Blob',
        'URL.createObjectURL',
        'localStorage',
        'fetch'
    ],
    
    OPTIONAL_FEATURES: [
        'showDirectoryPicker',
        'indexedDB',
        'crypto.subtle'
    ]
};

// Performance-Konstanten
export const PERFORMANCE = {
    LARGE_FILE_THRESHOLD: 10 * 1024 * 1024, // 10MB
    CHUNK_SIZE: 64 * 1024, // 64KB für Streaming
    MAX_CONCURRENT_OPERATIONS: 3,
    CACHE_MAX_AGE: 24 * 60 * 60 * 1000, // 24h
    
    // Animation-Performance
    REDUCE_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    HIGH_REFRESH_RATE_QUERY: '(min-resolution: 120dpi)'
};

// Debugging-Konstanten
export const DEBUG = {
    ENABLED: false, // In Produktion auf false setzen
    LOG_LEVELS: {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    },
    DEFAULT_LEVEL: 2, // INFO
    
    MODULES: {
        FILE_HANDLER: 'FileHandler',
        PRODUCT_CODE: 'ProductCode',
        CONFIG_MANAGER: 'ConfigManager',
        HOTFOLDER_API: 'HotfolderAPI',
        VALIDATOR: 'Validator',
        UI_MANAGER: 'UIManager'
    }
};

// Tastenkombinationen
export const KEYBOARD_SHORTCUTS = {
    OPEN_FILE: { key: 'o', ctrl: true, description: 'Datei öffnen' },
    SETTINGS: { key: 's', ctrl: true, description: 'Einstellungen' },
    DOWNLOAD: { key: 'Enter', ctrl: true, description: 'Download' },
    HELP: { key: 'F1', description: 'Hilfe anzeigen' },
    ESCAPE: { key: 'Escape', description: 'Dialog schliessen' },
    
    // Admin-Shortcuts (für Entwicklung)
    DEBUG_CONSOLE: { key: 'F12', description: 'Developer Tools' },
    RELOAD: { key: 'F5', description: 'Seite neu laden' }
};

// Error-Handler-Konstanten
export const ERROR_HANDLING = {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    CRITICAL_ERRORS: [
        'SecurityError',
        'NotAllowedError',
        'QuotaExceededError'
    ],
    
    RECOVERABLE_ERRORS: [
        'NetworkError',
        'TimeoutError',
        'AbortError'
    ]
};

// Export aller Konstanten als Default
export default {
    APP_INFO,
    FILE_CONSTANTS,
    PRODUCT_CODE,
    PAPER_TYPES,
    SWISS_FORMAT,
    UI_CONSTANTS,
    STORAGE_KEYS,
    API_CONSTANTS,
    VALIDATION,
    HOTFOLDER,
    CONFIG_CONSTANTS,
    THEMES,
    BROWSER_SUPPORT,
    PERFORMANCE,
    DEBUG,
    KEYBOARD_SHORTCUTS,
    ERROR_HANDLING
};