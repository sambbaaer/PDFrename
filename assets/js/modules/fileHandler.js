/**
 * Heidelberg PDF Renamer - File Handler
 * Verwaltet Dateioperationen: Upload, Download, Validierung
 */

export class FileHandler {
    constructor() {
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.allowedTypes = ['application/pdf'];
        this.allowedExtensions = ['.pdf'];
    }

    /**
     * Datei validieren
     * @param {File} file - Zu validierende Datei
     * @returns {Object} Validierungsergebnis
     */
    validateFile(file) {
        // Null/undefined Check
        if (!file) {
            return {
                valid: false,
                error: 'Keine Datei ausgewählt'
            };
        }

        // Dateigrösse prüfen
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `Datei zu gross. Maximum: ${this.formatFileSize(this.maxFileSize)}`
            };
        }

        // Leer-Datei prüfen
        if (file.size === 0) {
            return {
                valid: false,
                error: 'Datei ist leer'
            };
        }

        // MIME-Type prüfen
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Ungültiger Dateityp. Erlaubt: ${this.allowedTypes.join(', ')}`
            };
        }

        // Dateiendung prüfen
        const extension = this.getFileExtension(file.name);
        if (!this.allowedExtensions.includes(extension.toLowerCase())) {
            return {
                valid: false,
                error: `Ungültige Dateiendung. Erlaubt: ${this.allowedExtensions.join(', ')}`
            };
        }

        // Dateiname-Validierung
        if (!this.isValidFileName(file.name)) {
            return {
                valid: false,
                error: 'Dateiname enthält ungültige Zeichen'
            };
        }

        return {
            valid: true,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified),
                extension: extension
            }
        };
    }

    /**
     * Datei herunterladen
     * @param {File} file - Original-Datei
     * @param {string} newFileName - Neuer Dateiname
     */
    async downloadFile(file, newFileName) {
        try {
            // Dateiname bereinigen
            const cleanFileName = this.sanitizeFileName(newFileName);
            
            // Blob erstellen
            const blob = new Blob([file], { type: file.type });
            
            // Download-URL erstellen
            const url = URL.createObjectURL(blob);
            
            // Download-Link erstellen und auslösen
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = cleanFileName;
            downloadLink.style.display = 'none';
            
            // Link zum DOM hinzufügen, klicken und entfernen
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // URL freigeben (nach kurzer Verzögerung)
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);

            return {
                success: true,
                fileName: cleanFileName,
                size: file.size
            };

        } catch (error) {
            console.error('Download-Fehler:', error);
            throw new Error(`Download fehlgeschlagen: ${error.message}`);
        }
    }

    /**
     * Datei als ArrayBuffer lesen
     * @param {File} file - Zu lesende Datei
     * @returns {Promise<ArrayBuffer>} Dateiinhalt
     */
    async readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Fehler beim Lesen der Datei'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Datei als Data URL lesen (für Vorschau)
     * @param {File} file - Zu lesende Datei
     * @returns {Promise<string>} Data URL
     */
    async readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Fehler beim Lesen der Datei'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Mehrere Dateien verarbeiten (Batch-Upload)
     * @param {FileList} files - Dateiliste
     * @returns {Object} Verarbeitungsergebnis
     */
    processMultipleFiles(files) {
        const results = {
            valid: [],
            invalid: [],
            totalSize: 0
        };

        Array.from(files).forEach((file, index) => {
            const validation = this.validateFile(file);
            
            if (validation.valid) {
                results.valid.push({
                    file: file,
                    index: index,
                    info: validation.fileInfo
                });
                results.totalSize += file.size;
            } else {
                results.invalid.push({
                    file: file,
                    index: index,
                    error: validation.error
                });
            }
        });

        return results;
    }

    /**
     * Dateiname bereinigen
     * @param {string} fileName - Zu bereinigender Dateiname
     * @returns {string} Bereinigter Dateiname
     */
    sanitizeFileName(fileName) {
        return fileName
            // Ungültige Zeichen entfernen/ersetzen
            .replace(/[<>:"/\\|?*]/g, '_')
            // Mehrfache Unterstriche durch einen ersetzen
            .replace(/_+/g, '_')
            // Führende/nachgestellte Punkte und Leerzeichen entfernen
            .replace(/^[\s.]+|[\s.]+$/g, '')
            // Maximale Länge begrenzen (Windows-Kompatibilität)
            .substring(0, 255);
    }

    /**
     * Dateiendung extrahieren
     * @param {string} fileName - Dateiname
     * @returns {string} Dateiendung mit Punkt
     */
    getFileExtension(fileName) {
        const lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    }

    /**
     * Dateiname ohne Endung
     * @param {string} fileName - Dateiname
     * @returns {string} Dateiname ohne Endung
     */
    getFileNameWithoutExtension(fileName) {
        const lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
    }

    /**
     * Dateiname validieren
     * @param {string} fileName - Zu validierender Dateiname
     * @returns {boolean} Validierungsergebnis
     */
    isValidFileName(fileName) {
        // Ungültige Zeichen für Windows/Mac/Linux
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        
        // Reservierte Namen (Windows)
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
        
        return !invalidChars.test(fileName) && 
               !reservedNames.test(fileName) && 
               fileName.length > 0 && 
               fileName.length <= 255;
    }

    /**
     * Dateigrösse formatieren
     * @param {number} bytes - Anzahl Bytes
     * @returns {string} Formatierte Dateigrösse
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Dateiinfo sammeln
     * @param {File} file - Datei
     * @returns {Object} Detaillierte Dateiinformationen
     */
    getFileInfo(file) {
        return {
            name: file.name,
            nameWithoutExtension: this.getFileNameWithoutExtension(file.name),
            extension: this.getFileExtension(file.name),
            size: file.size,
            sizeFormatted: this.formatFileSize(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified),
            lastModifiedFormatted: new Date(file.lastModified).toLocaleDateString('de-CH'),
            isValid: this.validateFile(file).valid
        };
    }

    /**
     * Datei-Hash generieren (für Duplikat-Erkennung)
     * @param {File} file - Datei
     * @returns {Promise<string>} SHA-256 Hash
     */
    async generateFileHash(file) {
        try {
            const buffer = await this.readFileAsArrayBuffer(file);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Hash-Generierung fehlgeschlagen:', error);
            return null;
        }
    }

    /**
     * Temporäre URL für Datei erstellen
     * @param {File} file - Datei
     * @returns {string} Temporäre URL
     */
    createTemporaryURL(file) {
        return URL.createObjectURL(file);
    }

    /**
     * Temporäre URL freigeben
     * @param {string} url - Freizugebende URL
     */
    revokeTemporaryURL(url) {
        URL.revokeObjectURL(url);
    }

    /**
     * Drag & Drop Event-Utilities
     */
    static getDragEventFiles(event) {
        return event.dataTransfer?.files || [];
    }

    static isDragEventValid(event) {
        return event.dataTransfer && 
               event.dataTransfer.files && 
               event.dataTransfer.files.length > 0;
    }

    /**
     * Browser-Unterstützung prüfen
     */
    static checkBrowserSupport() {
        const support = {
            fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
            dragDrop: 'draggable' in document.createElement('div'),
            download: 'download' in document.createElement('a'),
            url: !!(window.URL || window.webkitURL)
        };

        return {
            ...support,
            allSupported: Object.values(support).every(s => s)
        };
    }

    /**
     * Debug-Informationen
     */
    debug() {
        console.group('FileHandler Debug Info');
        console.log('Max File Size:', this.formatFileSize(this.maxFileSize));
        console.log('Allowed Types:', this.allowedTypes);
        console.log('Allowed Extensions:', this.allowedExtensions);
        console.log('Browser Support:', FileHandler.checkBrowserSupport());
        console.groupEnd();
    }
}