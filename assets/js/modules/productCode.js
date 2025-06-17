/**
 * Heidelberg PDF Renamer - Product Code Generator
 * Generiert Produktcodes gemäss Heidelberg Prinect Workflow-Spezifikation
 */

export class ProductCodeGenerator {
    constructor() {
        // Schweizer Zahlenformatierung
        this.numberFormatter = new Intl.NumberFormat('de-CH', {
            useGrouping: true,
            groupingSeparator: '\''
        });
    }

    /**
     * Hauptmethode zum Generieren des Produktcodes
     * Format: Auftrag-Position#Kunde-Produkt#Maschine_Papierart_Papiername#Auflage#D-Papiername#
     * 
     * @param {Object} formData - Formulardaten
     * @param {Object} config - Anwendungskonfiguration
     * @returns {string} Generierter Produktcode
     */
    generate(formData, config) {
        try {
            if (!this.validateInput(formData)) {
                return '';
            }

            const parts = this.buildCodeParts(formData, config);
            return this.assembleCode(parts);

        } catch (error) {
            console.error('Fehler bei Produktcode-Generierung:', error);
            return '';
        }
    }

    /**
     * Eingabedaten validieren
     * @param {Object} formData - Zu validierende Daten
     * @returns {boolean} Validierungsergebnis
     */
    validateInput(formData) {
        const requiredFields = [
            'auftragsnummer', 'kunde', 'auftragsposition', 
            'maschine', 'auflage', 'produkt', 'papierart', 'papiername'
        ];

        return requiredFields.every(field => {
            const value = formData[field];
            return value && value.toString().trim() !== '';
        });
    }

    /**
     * Code-Teile aufbauen
     * @param {Object} formData - Formulardaten  
     * @param {Object} config - Konfiguration
     * @returns {Object} Code-Teile
     */
    buildCodeParts(formData, config) {
        return {
            // Teil 1: Auftragsnummer-Position
            auftragsTeil: this.buildAuftragsTeil(formData),
            
            // Teil 2: Kunde-Produkt
            kundenTeil: this.buildKundenTeil(formData, config),
            
            // Teil 3: Maschine_Papierart_Papiername
            maschineTeil: this.buildMaschineTeil(formData, config),
            
            // Teil 4: Auflage
            auflageTeil: this.buildAuflageTeil(formData),
            
            // Teil 5: D-Papiername
            papierTeil: this.buildPapierTeil(formData, config)
        };
    }

    /**
     * Auftragsteil aufbauen: "A12345-1"
     */
    buildAuftragsTeil(formData) {
        const auftragsnummer = formData.auftragsnummer.trim();
        const position = formData.auftragsposition.toString().trim();
        
        // Sicherstellen, dass Auftragsnummer mit A beginnt
        const cleanAuftrag = auftragsnummer.startsWith('A') ? 
            auftragsnummer : `A${auftragsnummer}`;
        
        return `${cleanAuftrag}-${position}`;
    }

    /**
     * Kundenteil aufbauen: "TestKunde-BRFPP"
     */
    buildKundenTeil(formData, config) {
        const kunde = this.sanitizeText(formData.kunde);
        const produktCode = this.getProductCode(formData.produkt, config);
        
        return `${kunde}-${produktCode}`;
    }

    /**
     * Maschineteil aufbauen: "CX75_u_s_NoSat170"
     */
    buildMaschineTeil(formData, config) {
        const maschinenCode = this.getMachineCode(formData.maschine, config);
        const papierartCode = this.getPaperTypeCode(formData.papierart);
        const papiernameCode = this.getPaperCode(formData.papiername, config);
        
        return `${maschinenCode}_${papierartCode}_${papiernameCode}`;
    }

    /**
     * Auflageteil aufbauen: "1200"
     */
    buildAuflageTeil(formData) {
        // Schweizer Formatierung entfernen (Apostrophe) und zu Nummer konvertieren
        const auflageStr = formData.auflage.toString().replace(/'/g, '').replace(/\s/g, '');
        const auflageNum = parseInt(auflageStr, 10);
        
        if (isNaN(auflageNum)) {
            throw new Error('Ungültige Auflage');
        }
        
        return auflageNum.toString();
    }

    /**
     * Papierteil aufbauen: "D-NoSat170"
     */
    buildPapierTeil(formData, config) {
        const papiernameCode = this.getPaperCode(formData.papiername, config);
        return `D-${papiernameCode}`;
    }

    /**
     * Code zusammensetzen
     */
    assembleCode(parts) {
        return [
            parts.auftragsTeil,
            parts.kundenTeil,
            parts.maschineTeil,
            parts.auflageTeil,
            parts.papierTeil
        ].join('#') + '#';
    }

    /**
     * Maschinencode aus Konfiguration holen
     */
    getMachineCode(machineValue, config) {
        const machine = config.machines?.find(m => m.code === machineValue);
        return machine ? machine.code : machineValue;
    }

    /**
     * Produktcode aus Konfiguration holen
     */
    getProductCode(productValue, config) {
        const product = config.products?.find(p => p.code === productValue);
        return product ? product.code : productValue;
    }

    /**
     * Papiercode aus Konfiguration holen
     */
    getPaperCode(paperValue, config) {
        const paper = config.papers?.find(p => p.code === paperValue);
        return paper ? paper.code : paperValue;
    }

    /**
     * Papierart-Code generieren
     */
    getPaperTypeCode(papierart) {
        const typeMap = {
            'gestrichen': 'g_s',      // gestrichen
            'ungestrichen': 'u_s',    // ungestrichen
        };
        
        // Für custom Papierarten, ersten Buchstaben + '_s' verwenden
        return typeMap[papierart] || `${papierart.charAt(0).toLowerCase()}_s`;
    }

    /**
     * Text für Verwendung in Produktcode bereinigen
     */
    sanitizeText(text) {
        return text
            .trim()
            .replace(/[^a-zA-Z0-9äöüÄÖÜß\-_]/g, '') // Nur erlaubte Zeichen
            .replace(/\s+/g, '-') // Leerzeichen durch Bindestriche ersetzen
            .substring(0, 20); // Maximale Länge begrenzen
    }

    /**
     * Produktcode in Teile zerlegen (für Debugging/Analyse)
     */
    parseCode(productCode) {
        const parts = productCode.split('#');
        if (parts.length < 5) {
            throw new Error('Ungültiger Produktcode-Format');
        }

        const [auftragTeil, kundenTeil, maschineTeil, auflageTeil, papierTeil] = parts;
        
        return {
            auftrag: auftragTeil.split('-')[0],
            position: auftragTeil.split('-')[1],
            kunde: kundenTeil.split('-')[0],
            produkt: kundenTeil.split('-')[1],
            maschine: maschineTeil.split('_')[0],
            papierart: maschineTeil.split('_')[1] + '_' + maschineTeil.split('_')[2],
            papiername: maschineTeil.split('_')[3],
            auflage: auflageTeil,
            papierPrefix: papierTeil.split('-')[0],
            papierSuffix: papierTeil.split('-')[1]
        };
    }

    /**
     * Code-Format validieren
     */
    validateCode(productCode) {
        try {
            const parsed = this.parseCode(productCode);
            return {
                valid: true,
                parsed: parsed
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Schweizer Zahlenformatierung anwenden
     */
    formatSwissNumber(number) {
        return this.numberFormatter.format(number);
    }

    /**
     * Beispiel-Produktcode generieren (für Testing/Demo)
     */
    generateExample() {
        const exampleData = {
            auftragsnummer: 'A12345',
            kunde: 'TestKunde',
            auftragsposition: '1',
            maschine: 'CX75',
            auflage: '1200',
            produkt: 'BRFPP',
            papierart: 'ungestrichen',
            papiername: 'NoSat170'
        };

        const exampleConfig = {
            machines: [{ name: 'CX75', code: 'CX75' }],
            products: [{ name: 'Broschüre', code: 'BRFPP' }],
            papers: [{ name: 'NoSat170', code: 'NoSat170', type: 'ungestrichen' }]
        };

        return this.generate(exampleData, exampleConfig);
    }

    /**
     * Debug-Informationen ausgeben
     */
    debug(formData, config) {
        console.group('Produktcode-Generator Debug');
        console.log('Input Data:', formData);
        console.log('Config:', config);
        
        if (this.validateInput(formData)) {
            const parts = this.buildCodeParts(formData, config);
            console.log('Code Parts:', parts);
            console.log('Final Code:', this.assembleCode(parts));
        } else {
            console.log('Validation failed');
        }
        
        console.groupEnd();
    }
}