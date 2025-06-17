/**
 * Heidelberg PDF Renamer - Hotfolder API
 * Verwaltet die Integration mit dem File System Access API für Hotfolder-Funktionalität
 */

export class HotfolderAPI {
    constructor() {
        this.storageKey = 'heidelberg-hotfolder-handle';
        this.isSupported = this.checkSupport();
    }

    /**
     * Browser-Unterstützung für File System Access API prüfen
     * @returns {boolean} Unterstützungsstatus
     */
    checkSupport() {
        return 'showDirectoryPicker' in window && 
               'showSaveFilePicker' in window &&
               typeof window.showDirectoryPicker === 'function';
    }

    /**
     * Hotfolder auswählen
     * @returns {Promise<FileSystemDirectoryHandle|null>} Directory Handle
     */
    async selectHotfolder() {
        if (!this.isSupported) {
            throw new Error('File System Access API wird von diesem Browser nicht unterstützt. Verwenden Sie Chrome oder Edge.');
        }

        try {
            // Directory Picker öffnen
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Handle speichern (für spätere Verwendung)
            await this.saveHotfolderHandle(dirHandle);

            console.log('Hotfolder ausgewählt:', dirHandle.name);
            return dirHandle;

        } catch (error) {
            if (error.name === 'AbortError') {
                // Benutzer hat Dialog abgebrochen
                return null;
            }
            
            console.error('Fehler bei Hotfolder-Auswahl:', error);
            throw new Error(`Hotfolder konnte nicht ausgewählt werden: ${error.message}`);
        }
    }

    /**
     * Datei in Hotfolder speichern
     * @param {FileSystemDirectoryHandle} dirHandle - Verzeichnis-Handle
     * @param {File} file - Zu speichernde Datei
     * @param {string} fileName - Dateiname
     * @returns {Promise<boolean>} Erfolgsstatus
     */
    async saveToHotfolder(dirHandle, file, fileName) {
        if (!dirHandle) {
            throw new Error('Kein Hotfolder ausgewählt');
        }

        try {
            // Berechtigung prüfen
            const permission = await this.verifyPermission(dirHandle);
            if (!permission) {
                throw new Error('Keine Berechtigung für Hotfolder-Zugriff');
            }

            // Bereinigten Dateinamen erstellen
            const cleanFileName = this.sanitizeFileName(fileName);

            // Datei-Handle erstellen
            const fileHandle = await dirHandle.getFileHandle(cleanFileName, { 
                create: true 
            });

            // Writable Stream erstellen
            const writable = await fileHandle.createWritable();

            // Datei schreiben
            await writable.write(file);
            await writable.close();

            console.log(`Datei "${cleanFileName}" erfolgreich in Hotfolder gespeichert`);
            return true;

        } catch (error) {
            console.error('Fehler beim Speichern in Hotfolder:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Zugriff auf Hotfolder verweigert. Bitte Berechtigungen prüfen.');
            } else if (error.name === 'QuotaExceededError') {
                throw new Error('Nicht genügend Speicherplatz im Hotfolder.');
            } else if (error.name === 'InvalidModificationError') {
                throw new Error('Datei kann nicht überschrieben werden. Möglicherweise ist sie in Verwendung.');
            }
            
            throw new Error(`Fehler beim Speichern: ${error.message}`);
        }
    }

    /**
     * Hotfolder-Handle speichern (für Persistierung)
     * @param {FileSystemDirectoryHandle} dirHandle - Zu speichernder Handle
     */
    async saveHotfolderHandle(dirHandle) {
        try {
            // IndexedDB verwenden für persistente Handle-Speicherung
            await this.storeHandleInIndexedDB(dirHandle);
        } catch (error) {
            console.warn('Handle konnte nicht persistent gespeichert werden:', error);
        }
    }

    /**
     * Gespeicherten Hotfolder laden
     * @returns {Promise<FileSystemDirectoryHandle|null>} Geladener Handle
     */
    async loadSavedHotfolder() {
        try {
            const handle = await this.loadHandleFromIndexedDB();
            
            if (handle) {
                // Berechtigung prüfen
                const permission = await this.verifyPermission(handle);
                if (permission) {
                    console.log('Gespeicherter Hotfolder geladen:', handle.name);
                    return handle;
                } else {
                    console.warn('Keine Berechtigung für gespeicherten Hotfolder');
                    await this.clearSavedHandle();
                }
            }
        } catch (error) {
            console.warn('Gespeicherter Hotfolder konnte nicht geladen werden:', error);
            await this.clearSavedHandle();
        }
        
        return null;
    }

    /**
     * Berechtigung für Directory Handle verifizieren
     * @param {FileSystemDirectoryHandle} dirHandle - Zu prüfender Handle
     * @param {boolean} withWrite - Schreibberechtigung erforderlich
     * @returns {Promise<boolean>} Berechtigungsstatus
     */
    async verifyPermission(dirHandle, withWrite = true) {
        const options = withWrite ? { mode: 'readwrite' } : { mode: 'read' };
        
        // Aktuelle Berechtigung prüfen
        if (await dirHandle.queryPermission(options) === 'granted') {
            return true;
        }
        
        // Berechtigung anfordern
        if (await dirHandle.requestPermission(options) === 'granted') {
            return true;
        }
        
        return false;
    }

    /**
     * Hotfolder-Inhalt auflisten
     * @param {FileSystemDirectoryHandle} dirHandle - Verzeichnis-Handle
     * @returns {Promise<Array>} Liste der Dateien
     */
    async listHotfolderContents(dirHandle) {
        if (!dirHandle) {
            throw new Error('Kein Hotfolder ausgewählt');
        }

        try {
            const files = [];
            
            for await (const [name, handle] of dirHandle.entries()) {
                if (handle.kind === 'file') {
                    const file = await handle.getFile();
                    files.push({
                        name: name,
                        size: file.size,
                        lastModified: new Date(file.lastModified),
                        type: file.type,
                        handle: handle
                    });
                }
            }
            
            // Nach Namen sortieren
            return files.sort((a, b) => a.name.localeCompare(b.name));
            
        } catch (error) {
            console.error('Fehler beim Auflisten des Hotfolder-Inhalts:', error);
            throw new Error(`Hotfolder-Inhalt konnte nicht geladen werden: ${error.message}`);
        }
    }

    /**
     * Datei aus Hotfolder löschen
     * @param {FileSystemDirectoryHandle} dirHandle - Verzeichnis-Handle
     * @param {string} fileName - Zu löschende Datei
     * @returns {Promise<boolean>} Erfolgsstatus
     */
    async deleteFromHotfolder(dirHandle, fileName) {
        if (!dirHandle) {
            throw new Error('Kein Hotfolder ausgewählt');
        }

        try {
            await dirHandle.removeEntry(fileName);
            console.log(`Datei "${fileName}" aus Hotfolder gelöscht`);
            return true;
            
        } catch (error) {
            console.error('Fehler beim Löschen aus Hotfolder:', error);
            throw new Error(`Datei konnte nicht gelöscht werden: ${error.message}`);
        }
    }

    /**
     * Hotfolder-Informationen abrufen
     * @param {FileSystemDirectoryHandle} dirHandle - Verzeichnis-Handle
     * @returns {Promise<Object>} Hotfolder-Informationen
     */
    async getHotfolderInfo(dirHandle) {
        if (!dirHandle) {
            return null;
        }

        try {
            const files = await this.listHotfolderContents(dirHandle);
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            
            return {
                name: dirHandle.name,
                fileCount: files.length,
                totalSize: totalSize,
                formattedSize: this.formatFileSize(totalSize),
                lastAccessed: new Date().toISOString(),
                files: files.slice(0, 10) // Nur erste 10 Dateien für Übersicht
            };
            
        } catch (error) {
            console.error('Fehler beim Abrufen der Hotfolder-Informationen:', error);
            return {
                name: dirHandle.name,
                error: error.message
            };
        }
    }

    /**
     * Handle in IndexedDB speichern
     * @param {FileSystemDirectoryHandle} handle - Zu speichernder Handle
     */
    async storeHandleInIndexedDB(handle) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('HeidelbergPDFRenamer', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['handles'], 'readwrite');
                const store = transaction.objectStore('handles');
                
                store.put({
                    id: 'hotfolder',
                    handle: handle,
                    timestamp: Date.now()
                });
                
                transaction.oncomplete = () => {
                    db.close();
                    resolve();
                };
                
                transaction.onerror = () => {
                    db.close();
                    reject(transaction.error);
                };
            };
        });
    }

    /**
     * Handle aus IndexedDB laden
     * @returns {Promise<FileSystemDirectoryHandle|null>} Geladener Handle
     */
    async loadHandleFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('HeidelbergPDFRenamer', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('handles')) {
                    db.close();
                    resolve(null);
                    return;
                }
                
                const transaction = db.transaction(['handles'], 'readonly');
                const store = transaction.objectStore('handles');
                const getRequest = store.get('hotfolder');
                
                getRequest.onsuccess = () => {
                    db.close();
                    const result = getRequest.result;
                    resolve(result ? result.handle : null);
                };
                
                getRequest.onerror = () => {
                    db.close();
                    reject(getRequest.error);
                };
            };
        });
    }

    /**
     * Gespeicherten Handle löschen
     */
    async clearSavedHandle() {
        return new Promise((resolve) => {
            const request = indexedDB.open('HeidelbergPDFRenamer', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('handles')) {
                    db.close();
                    resolve();
                    return;
                }
                
                const transaction = db.transaction(['handles'], 'readwrite');
                const store = transaction.objectStore('handles');
                
                store.delete('hotfolder');
                
                transaction.oncomplete = () => {
                    db.close();
                    resolve();
                };
                
                transaction.onerror = () => {
                    db.close();
                    resolve(); // Auch bei Fehler als erfolgreich behandeln
                };
            };
            
            request.onerror = () => resolve();
        });
    }

    /**
     * Dateiname für Hotfolder bereinigen
     * @param {string} fileName - Zu bereinigender Dateiname
     * @returns {string} Bereinigter Dateiname
     */
    sanitizeFileName(fileName) {
        return fileName
            // Ungültige Zeichen für Dateisysteme entfernen
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
            // Mehrfache Unterstriche durch einen ersetzen
            .replace(/_+/g, '_')
            // Führende/nachgestellte Punkte und Leerzeichen entfernen
            .replace(/^[\s.]+|[\s.]+$/g, '')
            // Maximale Länge begrenzen
            .substring(0, 255);
    }

    /**
     * Dateigrösse formatieren
     * @param {number} bytes - Anzahl Bytes
     * @returns {string} Formatierte Dateigrösse
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Fallback für Browser ohne File System Access API
     * @param {File} file - Datei
     * @param {string} fileName - Dateiname
     * @returns {Promise<boolean>} Erfolgsstatus
     */
    async downloadAsFallback(file, fileName) {
        try {
            const blob = new Blob([file], { type: file.type });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = this.sanitizeFileName(fileName);
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return true;
            
        } catch (error) {
            console.error('Fallback-Download fehlgeschlagen:', error);
            throw new Error('Download fehlgeschlagen');
        }
    }

    /**
     * Browser-Unterstützung und Fallback-Informationen
     * @returns {Object} Support-Informationen
     */
    getBrowserSupport() {
        return {
            fileSystemAccessAPI: this.isSupported,
            indexedDB: 'indexedDB' in window,
            downloadAttribute: 'download' in document.createElement('a'),
            recommended: this.isSupported ? 'Chrome oder Edge verwenden für beste Erfahrung' : 'Bitte Chrome oder Edge verwenden',
            fallbackAvailable: true
        };
    }

    /**
     * Debug-Informationen
     */
    async debug() {
        console.group('HotfolderAPI Debug Info');
        console.log('Browser Support:', this.getBrowserSupport());
        console.log('Storage Key:', this.storageKey);
        
        try {
            const savedHandle = await this.loadSavedHotfolder();
            if (savedHandle) {
                const info = await this.getHotfolderInfo(savedHandle);
                console.log('Saved Hotfolder Info:', info);
            } else {
                console.log('No saved hotfolder found');
            }
        } catch (error) {
            console.log('Debug error:', error.message);
        }
        
        console.groupEnd();
    }
}