/**
 * Heidelberg PDF Renamer - Main Application Logic
 * Koordiniert alle Module und verwaltet die Anwendung
 */

// Import der Module
import { FileHandler } from './modules/fileHandler.js';
import { ProductCodeGenerator } from './modules/productCode.js';
import { ConfigManager } from './modules/configManager.js';
import { HotfolderAPI } from './modules/hotfolderAPI.js';
import { Validator } from './modules/validation.js';
import { UIManager } from './modules/ui.js';

/**
 * Hauptanwendungsklasse
 */
class HeidelbergPDFRenamer {
    constructor() {
        this.currentFile = null;
        this.config = null;
        this.hotfolderHandle = null;

        // Module initialisieren
        this.fileHandler = new FileHandler();
        this.productCodeGenerator = new ProductCodeGenerator();
        this.configManager = new ConfigManager();
        this.hotfolderAPI = new HotfolderAPI();
        this.validator = new Validator();
        this.uiManager = new UIManager();

        this.init();
    }

    /**
     * Anwendung initialisieren
     */
    async init() {
        try {
            console.log('Heidelberg PDF Renamer wird initialisiert...');

            // Konfiguration laden
            await this.loadConfiguration();

            // Event Listeners einrichten
            this.setupEventListeners();

            // UI initialisieren
            this.initializeUI();

            // Gespeicherten Hotfolder laden
            await this.loadSavedHotfolder();

            console.log('Anwendung erfolgreich initialisiert');
            this.showNotification('success', 'Anwendung bereit', 'PDF Renamer ist einsatzbereit');

        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            this.showNotification('error', 'Initialisierungsfehler', error.message);
        }
    }

    /**
     * Konfiguration laden
     */
    async loadConfiguration() {
        this.config = await this.configManager.loadConfig();
        this.populateDropdowns();
    }

    /**
     * Dropdowns mit Konfigurationsdaten füllen
     */
    populateDropdowns() {
        // Maschinen
        const machineSelect = document.getElementById('maschine');
        machineSelect.innerHTML = '<option value="">Maschine wählen...</option>';
        this.config.machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine.code;
            option.textContent = `${machine.name} (${machine.code})`;
            option.dataset.name = machine.name;
            machineSelect.appendChild(option);
        });

        // Produkte
        const productSelect = document.getElementById('produkt');
        productSelect.innerHTML = '<option value="">Produkt wählen...</option>';
        this.config.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.code;
            option.textContent = `${product.name} (${product.code})`;
            option.dataset.name = product.name;
            productSelect.appendChild(option);
        });

        // Papiere
        const paperSelect = document.getElementById('papiername');
        paperSelect.innerHTML = '<option value="">Papier wählen...</option>';
        this.config.papers.forEach(paper => {
            const option = document.createElement('option');
            option.value = paper.code;
            option.textContent = `${paper.name} (${paper.code})`;
            option.dataset.name = paper.name;
            option.dataset.type = paper.type;
            paperSelect.appendChild(option);
        });
    }

    /**
     * Event Listeners einrichten
     */
    setupEventListeners() {
        // Datei-Handling
        const fileDropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('fileInput');
        const removeFileBtn = document.getElementById('removeFile');

        fileDropZone.addEventListener('click', () => fileInput.click());
        fileDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        fileDropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        fileDropZone.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        removeFileBtn.addEventListener('click', this.removeFile.bind(this));

        // Formular-Events
        const form = document.getElementById('pdfRenameForm');
        form.addEventListener('input', this.updateProductCode.bind(this));
        form.addEventListener('change', this.updateProductCode.bind(this));

        // Papierart Radio-Buttons
        const paperRadios = document.querySelectorAll('input[name="papierart"]');
        paperRadios.forEach(radio => {
            radio.addEventListener('change', this.handlePaperTypeChange.bind(this));
        });

        // Action Buttons
        document.getElementById('downloadBtn').addEventListener('click', this.downloadRenamedFile.bind(this));
        document.getElementById('saveToHotfolderBtn').addEventListener('click', this.saveToHotfolder.bind(this));
        document.getElementById('selectHotfolder').addEventListener('click', this.selectHotfolder.bind(this));

        // Settings Modal
        document.getElementById('settingsBtn').addEventListener('click', this.openSettings.bind(this));
        document.getElementById('closeSettings').addEventListener('click', this.closeSettings.bind(this));

        // Settings Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Add Buttons in Settings
        document.getElementById('addMachineBtn').addEventListener('click', this.addMachine.bind(this));
        document.getElementById('addProductBtn').addEventListener('click', this.addProduct.bind(this));
        document.getElementById('addPaperBtn').addEventListener('click', this.addPaper.bind(this));

        // Export/Import
        document.getElementById('exportConfig').addEventListener('click', this.exportConfiguration.bind(this));
        document.getElementById('importConfig').addEventListener('click', this.importConfiguration.bind(this));
    }

    /**
     * UI initialisieren
     */
    initializeUI() {
        this.updateProductCode();
        this.updateUIState();
    }

    /**
     * Drag Over Handler
     */
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    /**
     * Drag Leave Handler
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    }

    /**
     * File Drop Handler
     */
    async handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    /**
     * File Select Handler
     */
    async handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    /**
     * Datei verarbeiten
     */
    async processFile(file) {
        try {
            // Validierung
            const isValid = this.validator.validateFile(file);
            if (!isValid.valid) {
                this.showNotification('error', 'Ungültige Datei', isValid.error);
                return;
            }

            this.currentFile = file;
            this.showFilePreview(file);
            this.updateUIState();
            this.updateProductCode();

        } catch (error) {
            console.error('Fehler bei Dateiverarbeitung:', error);
            this.showNotification('error', 'Fehler', 'Datei konnte nicht verarbeitet werden');
        }
    }

    /**
     * Dateivorschau anzeigen
     */
    showFilePreview(file) {
        const filePreview = document.getElementById('filePreview');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const dropZone = document.getElementById('fileDropZone');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        dropZone.style.display = 'none';
        filePreview.style.display = 'block';
    }

    /**
     * Datei entfernen
     */
    removeFile() {
        this.currentFile = null;
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('fileDropZone').style.display = 'block';
        document.getElementById('fileInput').value = '';
        this.updateUIState();
        this.updateProductCode();
    }

    /**
     * Produktcode aktualisieren
     */
    updateProductCode() {
        const formData = this.getFormData();
        const productCode = this.productCodeGenerator.generate(formData, this.config);

        const codeElement = document.getElementById('generatedCode');
        if (productCode && this.isFormValid(formData)) {
            codeElement.textContent = productCode;
            codeElement.parentElement.classList.remove('error');
            codeElement.parentElement.classList.add('success');
        } else {
            codeElement.textContent = 'Bitte alle Felder ausfüllen...';
            codeElement.parentElement.classList.remove('success');
        }
    }

    /**
     * Formulardaten sammeln
     */
    getFormData() {
        const form = document.getElementById('pdfRenameForm');
        const formData = new FormData(form);

        // Custom Paper Type handling
        const customPaperRadio = document.getElementById('customPaperRadio');
        const customPaperType = document.getElementById('customPaperType');

        let papierart = formData.get('papierart');
        if (papierart === 'custom' && customPaperType.value) {
            papierart = customPaperType.value;
        }

        return {
            auftragsnummer: formData.get('auftragsnummer'),
            kunde: formData.get('kunde'),
            auftragsposition: formData.get('auftragsposition'),
            maschine: formData.get('maschine'),
            auflage: formData.get('auflage'),
            produkt: formData.get('produkt'),
            papierart: papierart,
            papiername: formData.get('papiername')
        };
    }

    /**
     * Formular-Validierung
     */
    isFormValid(formData) {
        return formData.auftragsnummer &&
               formData.kunde &&
               formData.auftragsposition &&
               formData.maschine &&
               formData.auflage &&
               formData.produkt &&
               formData.papierart &&
               formData.papiername;
    }

    /**
     * Papierart Change Handler
     */
    handlePaperTypeChange(e) {
        const customInput = document.getElementById('customPaperType');
        customInput.disabled = e.target.value !== 'custom';
        if (e.target.value !== 'custom') {
            customInput.value = '';
        }
        this.updateProductCode();
    }

    /**
     * UI-Zustand aktualisieren
     */
    updateUIState() {
        const hasFile = !!this.currentFile;
        const formValid = this.isFormValid(this.getFormData());
        const hasHotfolder = !!this.hotfolderHandle;

        document.getElementById('downloadBtn').disabled = !hasFile || !formValid;
        document.getElementById('saveToHotfolderBtn').disabled = !hasFile || !formValid || !hasHotfolder;
    }

    /**
     * Umbenannte Datei herunterladen
     */
    async downloadRenamedFile() {
        try {
            if (!this.currentFile) return;

            const formData = this.getFormData();
            const productCode = this.productCodeGenerator.generate(formData, this.config);
            const newFileName = `${productCode}${this.currentFile.name}`;

            await this.fileHandler.downloadFile(this.currentFile, newFileName);
            this.showNotification('success', 'Download erfolgreich', `Datei als "${newFileName}" heruntergeladen`);

        } catch (error) {
            console.error('Download-Fehler:', error);
            this.showNotification('error', 'Download-Fehler', error.message);
        }
    }

    /**
     * In Hotfolder speichern
     */
    async saveToHotfolder() {
        try {
            if (!this.currentFile || !this.hotfolderHandle) return;

            const formData = this.getFormData();
            const productCode = this.productCodeGenerator.generate(formData, this.config);
            const newFileName = `${productCode}${this.currentFile.name}`;

            await this.hotfolderAPI.saveToHotfolder(this.hotfolderHandle, this.currentFile, newFileName);
            this.showNotification('success', 'In Hotfolder gespeichert', `Datei als "${newFileName}" im Hotfolder gespeichert`);

        } catch (error) {
            console.error('Hotfolder-Fehler:', error);
            this.showNotification('error', 'Hotfolder-Fehler', error.message);
        }
    }

    /**
     * Hotfolder auswählen
     */
    async selectHotfolder() {
        try {
            this.hotfolderHandle = await this.hotfolderAPI.selectHotfolder();
            if (this.hotfolderHandle) {
                document.getElementById('hotfolderPath').textContent = this.hotfolderHandle.name;
                this.updateUIState();
                this.showNotification('success', 'Hotfolder gewählt', `Hotfolder: ${this.hotfolderHandle.name}`);
            }
        } catch (error) {
            console.error('Hotfolder-Auswahl-Fehler:', error);
            this.showNotification('error', 'Hotfolder-Fehler', 'Hotfolder konnte nicht ausgewählt werden');
        }
    }

    /**
     * Gespeicherten Hotfolder laden
     */
    async loadSavedHotfolder() {
        try {
            this.hotfolderHandle = await this.hotfolderAPI.loadSavedHotfolder();
            if (this.hotfolderHandle) {
                document.getElementById('hotfolderPath').textContent = this.hotfolderHandle.name;
                this.updateUIState();
            }
        } catch (error) {
            console.warn('Gespeicherter Hotfolder konnte nicht geladen werden:', error);
        }
    }

    /**
     * Settings Modal öffnen
     */
    openSettings() {
        document.getElementById('settingsModal').style.display = 'flex';
        this.populateSettingsLists();
    }

    /**
     * Settings Modal schliessen
     */
    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    /**
     * Tab wechseln
     */
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    /**
     * Settings Listen befüllen
     */
    populateSettingsLists() {
        this.populateConfigList('machines', this.config.machines);
        this.populateConfigList('products', this.config.products);
        this.populateConfigList('papers', this.config.papers);
    }

    /**
     * Konfigurationsliste befüllen
     */
    populateConfigList(type, items) {
        const container = document.getElementById(`${type}List`);
        container.innerHTML = '';

        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'config-item';
            itemElement.innerHTML = `
                <div class="config-item-info">
                    <div class="config-name">${item.name}</div>
                    <div class="config-code">${item.code}</div>
                    ${item.type ? `<div class="config-type">${item.type}</div>` : ''}
                </div>
                <div class="config-actions">
                    <button class="btn btn-edit" onclick="app.editConfigItem('${type}', ${index})">✏️</button>
                    <button class="btn btn-delete" onclick="app.deleteConfigItem('${type}', ${index})">🗑️</button>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    /**
     * Hilfsfunktionen
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Benachrichtigung anzeigen
     */
    showNotification(type, title, message) {
        this.uiManager.showNotification(type, title, message);
    }

    /**
     * Neue Maschine hinzufügen
     */
    async addMachine() {
        const name = document.getElementById('newMachineName').value.trim();
        const code = document.getElementById('newMachineCode').value.trim();

        if (!name || !code) {
            this.showNotification('error', 'Fehler', 'Name und Code sind erforderlich');
            return;
        }

        try {
            this.config = await this.configManager.addItem('machines', { name, code });
            this.populateDropdowns();
            this.populateSettingsLists();

            // Formular zurücksetzen
            document.getElementById('newMachineName').value = '';
            document.getElementById('newMachineCode').value = '';

            this.showNotification('success', 'Maschine hinzugefügt', `${name} (${code}) wurde hinzugefügt`);
        } catch (error) {
            this.showNotification('error', 'Fehler', error.message);
        }
    }

    /**
     * Neues Produkt hinzufügen
     */
    async addProduct() {
        const name = document.getElementById('newProductName').value.trim();
        const code = document.getElementById('newProductCode').value.trim();

        if (!name || !code) {
            this.showNotification('error', 'Fehler', 'Name und Code sind erforderlich');
            return;
        }

        try {
            this.config = await this.configManager.addItem('products', { name, code });
            this.populateDropdowns();
            this.populateSettingsLists();

            // Formular zurücksetzen
            document.getElementById('newProductName').value = '';
            document.getElementById('newProductCode').value = '';

            this.showNotification('success', 'Produkt hinzugefügt', `${name} (${code}) wurde hinzugefügt`);
        } catch (error) {
            this.showNotification('error', 'Fehler', error.message);
        }
    }

    /**
     * Neues Papier hinzufügen
     */
    async addPaper() {
        const name = document.getElementById('newPaperName').value.trim();
        const code = document.getElementById('newPaperCode').value.trim();
        const type = document.getElementById('newPaperType').value;

        if (!name || !code || !type) {
            this.showNotification('error', 'Fehler', 'Name, Code und Typ sind erforderlich');
            return;
        }

        try {
            this.config = await this.configManager.addItem('papers', { name, code, type });
            this.populateDropdowns();
            this.populateSettingsLists();

            // Formular zurücksetzen
            document.getElementById('newPaperName').value = '';
            document.getElementById('newPaperCode').value = '';
            document.getElementById('newPaperType').value = 'gestrichen';

            this.showNotification('success', 'Papier hinzugefügt', `${name} (${code}) wurde hinzugefügt`);
        } catch (error) {
            this.showNotification('error', 'Fehler', error.message);
        }
    }

    /**
     * Konfigurationselement bearbeiten
     */
    async editConfigItem(type, index) {
        const items = this.config[type];
        if (!items || !items[index]) return;

        const item = items[index];
        const newName = prompt(`Neuer Name für "${item.name}":`, item.name);

        if (newName === null) return; // Abbruch
        if (!newName.trim()) {
            this.showNotification('error', 'Fehler', 'Name darf nicht leer sein');
            return;
        }

        const newCode = prompt(`Neuer Code für "${item.name}":`, item.code);
        if (newCode === null) return; // Abbruch
        if (!newCode.trim()) {
            this.showNotification('error', 'Fehler', 'Code darf nicht leer sein');
            return;
        }

        try {
            const updates = { name: newName.trim(), code: newCode.trim().toUpperCase() };
            if (item.type) {
                const newType = prompt(`Neuer Typ für "${item.name}":`, item.type);
                if (newType === null) return;
                updates.type = newType;
            }

            this.config = await this.configManager.updateItem(type, item.id, updates);
            this.populateDropdowns();
            this.populateSettingsLists();

            this.showNotification('success', 'Aktualisiert', `${newName} wurde aktualisiert`);
        } catch (error) {
            this.showNotification('error', 'Fehler', error.message);
        }
    }

    /**
     * Konfigurationselement löschen
     */
    async deleteConfigItem(type, index) {
        const items = this.config[type];
        if (!items || !items[index]) return;

        const item = items[index];
        const confirmed = confirm(`"${item.name}" wirklich löschen?`);

        if (!confirmed) return;

        try {
            this.config = await this.configManager.deleteItem(type, item.id);
            this.populateDropdowns();
            this.populateSettingsLists();

            this.showNotification('success', 'Gelöscht', `${item.name} wurde gelöscht`);
        } catch (error) {
            this.showNotification('error', 'Fehler', error.message);
        }
    }

    /**
     * Konfiguration exportieren
     */
    async exportConfiguration() {
        try {
            const configJSON = await this.configManager.exportConfig();
            const blob = new Blob([configJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `heidelberg-config-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);

            this.showNotification('success', 'Export erfolgreich', 'Konfiguration wurde heruntergeladen');
        } catch (error) {
            this.showNotification('error', 'Export-Fehler', error.message);
        }
    }

    /**
     * Konfiguration importieren
     */
    async importConfiguration() {
        const fileInput = document.getElementById('importFile');
        fileInput.click();

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                this.config = await this.configManager.importConfig(text);
                this.populateDropdowns();
                this.populateSettingsLists();

                this.showNotification('success', 'Import erfolgreich', 'Konfiguration wurde importiert');
            } catch (error) {
                this.showNotification('error', 'Import-Fehler', error.message);
            }

            // Input zurücksetzen
            fileInput.value = '';
        };
    }
}

// Globale App-Instanz
window.app = null;

// Anwendung starten wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HeidelbergPDFRenamer();
});

// Für Debugging
window.debugApp = () => window.app;
