/**
 * Heidelberg PDF Renamer - Validation Module
 * Validiert Benutzereingaben und Dateien nach Heidelberg-Spezifikationen
 */

export class Validator {
    constructor() {
        this.rules = this.getValidationRules();
    }

    /**
     * Validierungsregeln definieren
     * @returns {Object} Validierungsregeln
     */
    getValidationRules() {
        return {
            auftragsnummer: {
                required: true,
                pattern: /^A\d+$/,
                minLength: 2,
                maxLength: 20,
                message: 'Auftragsnummer muss mit "A" beginnen und Zahlen enthalten (z.B. A12345)'
            },
            kunde: {
                required: true,
                pattern: /^[a-zA-Z0-9äöüÄÖÜß\s\-_&.]+$/,
                minLength: 1,
                maxLength: 50,
                message: 'Kundenname darf nur Buchstaben, Zahlen und die Zeichen - _ & . enthalten'
            },
            auftragsposition: {
                required: true,
                pattern: /^\d+$/,
                min: 0,
                max: 999,
                message: 'Auftragsposition muss eine Zahl zwischen 0 und 999 sein'
            },
            auflage: {
                required: true,
                pattern: /^[\d''\s]+$/,
                min: 1,
                max: 1000000,
                message: 'Auflage muss eine positive Zahl sein (z.B. 1\'200)'
            },
            maschine: {
                required: true,
                pattern: /^[A-Z0-9_-]+$/,
                minLength: 1,
                maxLength: 20,
                message: 'Maschine muss ausgewählt werden'
            },
            produkt: {
                required: true,
                pattern: /^[A-Z0-9_-]+$/,
                minLength: 1,
                maxLength: 20,
                message: 'Produkt muss ausgewählt werden'
            },
            papierart: {
                required: true,
                enum: ['gestrichen', 'ungestrichen'],
                message: 'Papierart muss ausgewählt werden'
            },
            papiername: {
                required: true,
                pattern: /^[A-Za-z0-9_-]+$/,
                minLength: 1,
                maxLength: 30,
                message: 'Papiername muss ausgewählt werden'
            },
            // Konfigurationselemente
            machineName: {
                required: true,
                pattern: /^[a-zA-Z0-9äöüÄÖÜß\s\-_.]+$/,
                minLength: 1,
                maxLength: 30,
                message: 'Maschinenname darf nur Buchstaben, Zahlen und - _ . enthalten'
            },
            machineCode: {
                required: true,
                pattern: /^[A-Z0-9_-]+$/,
                minLength: 1,
                maxLength: 10,
                message: 'Maschinencode darf nur Grossbuchstaben, Zahlen, _ und - enthalten'
            },
            productName: {
                required: true,
                pattern: /^[a-zA-Z0-9äöüÄÖÜß\s\-_.]+$/,
                minLength: 1,
                maxLength: 30,
                message: 'Produktname darf nur Buchstaben, Zahlen und - _ . enthalten'
            },
            productCode: {
                required: true,
                pattern: /^[A-Z0-9_-]+$/,
                minLength: 1,
                maxLength: 10,
                message: 'Produktcode darf nur Grossbuchstaben, Zahlen, _ und - enthalten'
            },
            paperName: {
                required: true,
                pattern: /^[a-zA-Z0-9äöüÄÖÜß\s\-_.]+$/,
                minLength: 1,
                maxLength: 30,
                message: 'Papiername darf nur Buchstaben, Zahlen und - _ . enthalten'
            },
            paperCode: {
                required: true,
                pattern: /^[A-Za-z0-9_-]+$/,
                minLength: 1,
                maxLength: 15,
                message: 'Papiercode darf nur Buchstaben, Zahlen, _ und - enthalten'
            }
        };
    }

    /**
     * Einzelnes Feld validieren
     * @param {string} fieldName - Feldname
     * @param {any} value - Zu validierender Wert
     * @param {Object} customRules - Zusätzliche Regeln (optional)
     * @returns {Object} Validierungsergebnis
     */
    validateField(fieldName, value, customRules = {}) {
        const rules = { ...this.rules[fieldName], ...customRules };
        
        if (!rules) {
            return { valid: true, value: value };
        }

        // Required Check
        if (rules.required && this.isEmpty(value)) {
            return {
                valid: false,
                error: `${this.getFieldDisplayName(fieldName)} ist erforderlich`,
                code: 'REQUIRED'
            };
        }

        // Wenn Feld leer und nicht required, als gültig betrachten
        if (this.isEmpty(value) && !rules.required) {
            return { valid: true, value: value };
        }

        // String-Wert für weitere Validierung
        const stringValue = value.toString().trim();

        // Pattern Check
        if (rules.pattern && !rules.pattern.test(stringValue)) {
            return {
                valid: false,
                error: rules.message || `${this.getFieldDisplayName(fieldName)} hat ungültiges Format`,
                code: 'PATTERN'
            };
        }

        // Length Checks
        if (rules.minLength && stringValue.length < rules.minLength) {
            return {
                valid: false,
                error: `${this.getFieldDisplayName(fieldName)} muss mindestens ${rules.minLength} Zeichen haben`,
                code: 'MIN_LENGTH'
            };
        }

        if (rules.maxLength && stringValue.length > rules.maxLength) {
            return {
                valid: false,
                error: `${this.getFieldDisplayName(fieldName)} darf maximal ${rules.maxLength} Zeichen haben`,
                code: 'MAX_LENGTH'
            };
        }

        // Numeric Checks
        if ((rules.min !== undefined || rules.max !== undefined) && fieldName !== 'auflage') {
            const numValue = parseFloat(stringValue);
            
            if (isNaN(numValue)) {
                return {
                    valid: false,
                    error: `${this.getFieldDisplayName(fieldName)} muss eine Zahl sein`,
                    code: 'NOT_NUMERIC'
                };
            }

            if (rules.min !== undefined && numValue < rules.min) {
                return {
                    valid: false,
                    error: `${this.getFieldDisplayName(fieldName)} muss mindestens ${rules.min} sein`,
                    code: 'MIN_VALUE'
                };
            }

            if (rules.max !== undefined && numValue > rules.max) {
                return {
                    valid: false,
                    error: `${this.getFieldDisplayName(fieldName)} darf maximal ${rules.max} sein`,
                    code: 'MAX_VALUE'
                };
            }
        }

        // Spezielle Auflage-Validierung (Schweizer Formatierung)
        if (fieldName === 'auflage') {
            const auflageResult = this.validateAuflage(stringValue);
            if (!auflageResult.valid) {
                return auflageResult;
            }
        }

        // Enum Check
        if (rules.enum && !rules.enum.includes(stringValue)) {
            return {
                valid: false,
                error: `${this.getFieldDisplayName(fieldName)} muss einer der folgenden Werte sein: ${rules.enum.join(', ')}`,
                code: 'INVALID_ENUM'
            };
        }

        // Auftragsnummer spezielle Validierung
        if (fieldName === 'auftragsnummer') {
            const auftragResult = this.validateAuftragsnummer(stringValue);
            if (!auftragResult.valid) {
                return auftragResult;
            }
        }

        return { 
            valid: true, 
            value: stringValue,
            normalizedValue: this.normalizeValue(fieldName, stringValue)
        };
    }

    /**
     * Ganzes Formular validieren
     * @param {Object} formData - Formulardaten
     * @returns {Object} Validierungsergebnis
     */
    validateForm(formData) {
        const results = {};
        const errors = [];
        let allValid = true;

        // Alle Formularfelder validieren
        const requiredFields = [
            'auftragsnummer', 'kunde', 'auftragsposition', 
            'maschine', 'auflage', 'produkt', 'papierart', 'papiername'
        ];

        requiredFields.forEach(field => {
            const value = formData[field];
            const result = this.validateField(field, value);
            
            results[field] = result;
            
            if (!result.valid) {
                allValid = false;
                errors.push({
                    field: field,
                    error: result.error,
                    code: result.code
                });
            }
        });

        // Cross-Field Validierung
        const crossValidation = this.validateCrossFields(formData);
        if (!crossValidation.valid) {
            allValid = false;
            errors.push(...crossValidation.errors);
        }

        return {
            valid: allValid,
            errors: errors,
            results: results,
            summary: this.generateValidationSummary(results, errors)
        };
    }

    /**
     * Datei validieren
     * @param {File} file - Zu validierende Datei
     * @returns {Object} Validierungsergebnis
     */
    validateFile(file) {
        if (!file) {
            return {
                valid: false,
                error: 'Keine Datei ausgewählt',
                code: 'NO_FILE'
            };
        }

        // Dateigrösse (max 100MB)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `Datei zu gross. Maximum: ${this.formatFileSize(maxSize)}`,
                code: 'FILE_TOO_LARGE'
            };
        }

        // Leer-Datei
        if (file.size === 0) {
            return {
                valid: false,
                error: 'Datei ist leer',
                code: 'EMPTY_FILE'
            };
        }

        // PDF-Typ prüfen
        const allowedTypes = ['application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Nur PDF-Dateien sind erlaubt',
                code: 'INVALID_FILE_TYPE'
            };
        }

        // Dateiendung prüfen
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.pdf')) {
            return {
                valid: false,
                error: 'Datei muss die Endung .pdf haben',
                code: 'INVALID_FILE_EXTENSION'
            };
        }

        // Dateiname validieren
        const fileNameValidation = this.validateFileName(file.name);
        if (!fileNameValidation.valid) {
            return fileNameValidation;
        }

        return { 
            valid: true,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type
            }
        };
    }

    /**
     * Auftragsnummer spezifisch validieren
     * @param {string} value - Auftragsnummer
     * @returns {Object} Validierungsergebnis
     */
    validateAuftragsnummer(value) {
        // Muss mit A beginnen
        if (!value.startsWith('A')) {
            return {
                valid: false,
                error: 'Auftragsnummer muss mit "A" beginnen',
                code: 'INVALID_PREFIX'
            };
        }

        // Nur A + Zahlen erlaubt
        if (!/^A\d+$/.test(value)) {
            return {
                valid: false,
                error: 'Auftragsnummer darf nur "A" gefolgt von Zahlen enthalten',
                code: 'INVALID_FORMAT'
            };
        }

        // Mindestens eine Zahl nach A
        if (value.length < 2) {
            return {
                valid: false,
                error: 'Auftragsnummer muss mindestens eine Zahl nach "A" enthalten',
                code: 'TOO_SHORT'
            };
        }

        return { valid: true, value: value };
    }

    /**
     * Auflage spezifisch validieren (Schweizer Formatierung)
     * @param {string} value - Auflage
     * @returns {Object} Validierungsergebnis
     */
    validateAuflage(value) {
        // Schweizer Apostrophe und Leerzeichen entfernen für Validierung
        const cleanValue = value.replace(/[''\s]/g, '');
        
        // Muss eine Zahl sein
        if (!/^\d+$/.test(cleanValue)) {
            return {
                valid: false,
                error: 'Auflage muss eine Zahl sein (z.B. 1\'200 oder 1200)',
                code: 'NOT_NUMERIC'
            };
        }

        const numValue = parseInt(cleanValue, 10);

        // Mindestens 1
        if (numValue < 1) {
            return {
                valid: false,
                error: 'Auflage muss mindestens 1 sein',
                code: 'TOO_SMALL'
            };
        }

        // Maximum 1 Million
        if (numValue > 1000000) {
            return {
                valid: false,
                error: 'Auflage darf maximal 1\'000\'000 sein',
                code: 'TOO_LARGE'
            };
        }

        return { 
            valid: true, 
            value: value,
            numericValue: numValue,
            formattedValue: this.formatSwissNumber(numValue)
        };
    }

    /**
     * Dateiname validieren
     * @param {string} fileName - Dateiname
     * @returns {Object} Validierungsergebnis
     */
    validateFileName(fileName) {
        // Ungültige Zeichen
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(fileName)) {
            return {
                valid: false,
                error: 'Dateiname enthält ungültige Zeichen',
                code: 'INVALID_CHARACTERS'
            };
        }

        // Reservierte Namen (Windows)
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
        if (reservedNames.test(fileName)) {
            return {
                valid: false,
                error: 'Dateiname ist ein reservierter Name',
                code: 'RESERVED_NAME'
            };
        }

        // Länge prüfen
        if (fileName.length > 255) {
            return {
                valid: false,
                error: 'Dateiname ist zu lang (max. 255 Zeichen)',
                code: 'TOO_LONG'
            };
        }

        return { valid: true, value: fileName };
    }

    /**
     * Cross-Field Validierung
     * @param {Object} formData - Formulardaten
     * @returns {Object} Validierungsergebnis
     */
    validateCrossFields(formData) {
        const errors = [];

        // Konsistenz zwischen Papierart und Papiername prüfen
        // (Diese Logik könnte erweitert werden basierend auf Konfiguration)

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Hilfsfunktionen
     */
    isEmpty(value) {
        return value === null || 
               value === undefined || 
               (typeof value === 'string' && value.trim() === '');
    }

    getFieldDisplayName(fieldName) {
        const displayNames = {
            auftragsnummer: 'Auftragsnummer',
            kunde: 'Kunde',
            auftragsposition: 'Auftragsposition',
            maschine: 'Maschine',
            auflage: 'Auflage',
            produkt: 'Produkt',
            papierart: 'Papierart',
            papiername: 'Papiername',
            machineName: 'Maschinenname',
            machineCode: 'Maschinencode',
            productName: 'Produktname',
            productCode: 'Produktcode',
            paperName: 'Papiername',
            paperCode: 'Papiercode'
        };

        return displayNames[fieldName] || fieldName;
    }

    normalizeValue(fieldName, value) {
        switch (fieldName) {
            case 'kunde':
                return value.trim();
            case 'auftragsnummer':
                return value.toUpperCase();
            case 'machineCode':
            case 'productCode':
                return value.toUpperCase();
            case 'auflage':
                // Schweizer Formatierung beibehalten
                return value;
            default:
                return value.trim();
        }
    }

    formatSwissNumber(number) {
        return new Intl.NumberFormat('de-CH', {
            useGrouping: true
        }).format(number);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateValidationSummary(results, errors) {
        const totalFields = Object.keys(results).length;
        const validFields = Object.values(results).filter(r => r.valid).length;
        
        return {
            totalFields: totalFields,
            validFields: validFields,
            invalidFields: totalFields - validFields,
            errorCount: errors.length,
            isComplete: validFields === totalFields && errors.length === 0
        };
    }

    /**
     * Validierung für Realtime-Feedback
     * @param {HTMLElement} field - Formularfeld
     * @returns {Object} Validierungsergebnis
     */
    validateFieldRealtime(field) {
        const fieldName = field.name || field.id;
        const value = field.value;
        
        const result = this.validateField(fieldName, value);
        
        // UI-Feedback anwenden
        this.applyFieldValidationUI(field, result);
        
        return result;
    }

    /**
     * UI-Feedback für Feldvalidierung anwenden
     * @param {HTMLElement} field - Formularfeld
     * @param {Object} result - Validierungsergebnis
     */
    applyFieldValidationUI(field, result) {
        // CSS-Klassen zurücksetzen
        field.classList.remove('valid', 'invalid', 'error');
        
        // Fehlermeldung entfernen
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (result.valid) {
            field.classList.add('valid');
        } else {
            field.classList.add('invalid', 'error');
            
            // Fehlermeldung hinzufügen
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = result.error;
            field.parentElement.appendChild(errorElement);
        }
    }

    /**
     * Debug-Informationen
     */
    debug() {
        console.group('Validator Debug Info');
        console.log('Validation Rules:', this.rules);
        console.log('Available Fields:', Object.keys(this.rules));
        console.groupEnd();
    }
}