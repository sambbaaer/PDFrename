/**
 * Heidelberg PDF Renamer - UI Manager
 * Verwaltet Benutzeroberflächen-Interaktionen und Feedback
 */

export class UIManager {
    constructor() {
        this.notifications = [];
        this.modals = new Map();
        this.activeTooltips = new Set();
        this.animationQueue = [];
        
        this.init();
    }

    /**
     * UI Manager initialisieren
     */
    init() {
        this.setupGlobalEventListeners();
        this.setupKeyboardShortcuts();
        this.setupAccessibility();
    }

    /**
     * Globale Event Listener einrichten
     */
    setupGlobalEventListeners() {
        // Modal-Hintergrund-Klicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Escape-Taste für Modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        // Resize Handler für responsive Anpassungen
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Vor-Seitenladung-Handler
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
            }
        });
    }

    /**
     * Tastenkombinationen einrichten
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + O: Datei öffnen
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                document.getElementById('fileInput')?.click();
            }
            
            // Ctrl/Cmd + S: Einstellungen öffnen
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.openModal('settingsModal');
            }
            
            // Ctrl/Cmd + Enter: Download (wenn möglich)
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const downloadBtn = document.getElementById('downloadBtn');
                if (downloadBtn && !downloadBtn.disabled) {
                    downloadBtn.click();
                }
            }
            
            // F1: Hilfe
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
        });
    }

    /**
     * Barrierefreiheit einrichten
     */
    setupAccessibility() {
        // ARIA-Labels dynamisch setzen
        this.updateAriaLabels();
        
        // Focus-Management für Modals
        this.setupFocusManagement();
        
        // Kontrast-Unterstützung
        this.setupContrastSupport();
    }

    /**
     * Benachrichtigung anzeigen
     * @param {string} type - Typ (success, error, warning, info)
     * @param {string} title - Titel
     * @param {string} message - Nachricht
     * @param {number} duration - Anzeigedauer in ms (0 = permanent)
     */
    showNotification(type = 'info', title = '', message = '', duration = 5000) {
        const notification = this.createNotificationElement(type, title, message);
        
        // Zur Liste hinzufügen
        this.notifications.push(notification);
        
        // Zum DOM hinzufügen
        document.body.appendChild(notification.element);
        
        // Animation
        this.animateIn(notification.element, 'slideInNotification');
        
        // Auto-Remove
        if (duration > 0) {
            notification.timer = setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
        
        // Maximal 5 Benachrichtigungen
        if (this.notifications.length > 5) {
            this.removeNotification(this.notifications[0].id);
        }
        
        return notification.id;
    }

    /**
     * Benachrichtigungs-Element erstellen
     */
    createNotificationElement(type, title, message) {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const element = document.createElement('div');
        element.id = id;
        element.className = `notification ${type}`;
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'polite');
        
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        element.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${iconMap[type] || iconMap.info}</span>
                <span class="notification-title">${title}</span>
                <button class="notification-close" onclick="window.app?.uiManager?.removeNotification('${id}')" aria-label="Benachrichtigung schliessen">×</button>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        return {
            id: id,
            element: element,
            type: type,
            title: title,
            message: message,
            timestamp: Date.now(),
            timer: null
        };
    }

    /**
     * Benachrichtigung entfernen
     * @param {string} notificationId - ID der Benachrichtigung
     */
    removeNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index === -1) return;
        
        const notification = this.notifications[index];
        
        // Timer stoppen
        if (notification.timer) {
            clearTimeout(notification.timer);
        }
        
        // Aus DOM entfernen mit Animation
        this.animateOut(notification.element, 'slideOutNotification', () => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        });
        
        // Aus Liste entfernen
        this.notifications.splice(index, 1);
    }

    /**
     * Alle Benachrichtigungen entfernen
     */
    clearAllNotifications() {
        [...this.notifications].forEach(notification => {
            this.removeNotification(notification.id);
        });
    }

    /**
     * Modal öffnen
     * @param {string} modalId - Modal-ID
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Fokus-Element vor Modal speichern
        this.modals.set(modalId, {
            previousFocus: document.activeElement,
            element: modal
        });
        
        // Modal anzeigen
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Body-Scroll verhindern
        document.body.style.overflow = 'hidden';
        
        // Fokus ins Modal setzen
        this.focusModal(modal);
        
        // Animation
        this.animateIn(modal, 'fadeIn');
    }

    /**
     * Modal schliessen
     * @param {string} modalId - Modal-ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const modalData = this.modals.get(modalId);
        
        // Animation vor dem Schliessen
        this.animateOut(modal, 'fadeOut', () => {
            // Modal verstecken
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            
            // Body-Scroll wiederherstellen
            document.body.style.overflow = '';
            
            // Fokus wiederherstellen
            if (modalData?.previousFocus) {
                modalData.previousFocus.focus();
            }
            
            // Aus Map entfernen
            this.modals.delete(modalId);
        });
    }

    /**
     * Oberstes Modal schliessen
     */
    closeTopModal() {
        const openModals = Array.from(this.modals.keys());
        if (openModals.length > 0) {
            this.closeModal(openModals[openModals.length - 1]);
        }
    }

    /**
     * Fokus ins Modal setzen
     */
    focusModal(modal) {
        // Erstes fokussierbares Element finden
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Loading-Zustand für Element setzen
     * @param {HTMLElement|string} element - Element oder Selektor
     * @param {boolean} loading - Loading-Zustand
     */
    setLoading(element, loading = true) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        if (loading) {
            el.classList.add('loading');
            el.disabled = true;
            el.setAttribute('aria-busy', 'true');
        } else {
            el.classList.remove('loading');
            el.disabled = false;
            el.setAttribute('aria-busy', 'false');
        }
    }

    /**
     * Progress Bar anzeigen
     * @param {number} percentage - Fortschritt in Prozent (0-100)
     * @param {string} message - Statusmeldung
     */
    showProgress(percentage, message = '') {
        let progressContainer = document.getElementById('progressContainer');
        
        if (!progressContainer) {
            progressContainer = this.createProgressContainer();
            document.body.appendChild(progressContainer);
        }
        
        const progressBar = progressContainer.querySelector('.progress-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        progressText.textContent = message;
        
        progressContainer.style.display = 'block';
        progressContainer.setAttribute('aria-hidden', 'false');
    }

    /**
     * Progress Bar verstecken
     */
    hideProgress() {
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.style.display = 'none';
            progressContainer.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Progress Container erstellen
     */
    createProgressContainer() {
        const container = document.createElement('div');
        container.id = 'progressContainer';
        container.className = 'progress-container';
        container.innerHTML = `
            <div class="progress-wrapper">
                <div class="progress-text">Verarbeitung läuft...</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Element-Zustand aktualisieren
     * @param {HTMLElement|string} element - Element oder Selektor
     * @param {string} state - Zustand (success, error, warning, normal)
     */
    setElementState(element, state = 'normal') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        // Alle State-Klassen entfernen
        el.classList.remove('success', 'error', 'warning');
        
        // Neue State-Klasse hinzufügen
        if (state !== 'normal') {
            el.classList.add(state);
        }
    }

    /**
     * Tooltip anzeigen
     * @param {HTMLElement} element - Element für Tooltip
     * @param {string} text - Tooltip-Text
     * @param {string} position - Position (top, bottom, left, right)
     */
    showTooltip(element, text, position = 'top') {
        // Existierendes Tooltip entfernen
        this.hideTooltip(element);
        
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip-popup tooltip-${position}`;
        tooltip.textContent = text;
        tooltip.setAttribute('role', 'tooltip');
        
        document.body.appendChild(tooltip);
        
        // Position berechnen
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        
        // Tooltip-Referenz speichern
        element._tooltip = tooltip;
        this.activeTooltips.add(element);
        
        // Auto-Hide nach 5 Sekunden
        setTimeout(() => {
            this.hideTooltip(element);
        }, 5000);
    }

    /**
     * Tooltip verstecken
     * @param {HTMLElement} element - Element mit Tooltip
     */
    hideTooltip(element) {
        if (element._tooltip) {
            element._tooltip.remove();
            delete element._tooltip;
            this.activeTooltips.delete(element);
        }
    }

    /**
     * Alle Tooltips verstecken
     */
    hideAllTooltips() {
        this.activeTooltips.forEach(element => {
            this.hideTooltip(element);
        });
    }

    /**
     * Konfirmationsdialog anzeigen
     * @param {string} title - Titel
     * @param {string} message - Nachricht
     * @param {Function} onConfirm - Bestätigung-Callback
     * @param {Function} onCancel - Abbruch-Callback
     */
    showConfirmDialog(title, message, onConfirm, onCancel) {
        const dialog = this.createConfirmDialog(title, message, onConfirm, onCancel);
        document.body.appendChild(dialog);
        
        // Modal-ähnliches Verhalten
        document.body.style.overflow = 'hidden';
        
        // Fokus auf ersten Button
        const firstButton = dialog.querySelector('button');
        if (firstButton) {
            firstButton.focus();
        }
    }

    /**
     * Konfirmationsdialog erstellen
     */
    createConfirmDialog(title, message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog-overlay';
        
        dialog.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-dialog-header">
                    <h3>${title}</h3>
                </div>
                <div class="confirm-dialog-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-dialog-footer">
                    <button class="btn btn-secondary cancel-btn">Abbrechen</button>
                    <button class="btn btn-primary confirm-btn">Bestätigen</button>
                </div>
            </div>
        `;
        
        // Event Listeners
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        const cleanup = () => {
            document.body.style.overflow = '';
            dialog.remove();
        };
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });
        
        // Escape-Taste
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escapeHandler);
                cleanup();
                if (onCancel) onCancel();
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
        
        return dialog;
    }

    /**
     * Animation helpers
     */
    animateIn(element, animationClass) {
        element.classList.add(animationClass);
        element.addEventListener('animationend', () => {
            element.classList.remove(animationClass);
        }, { once: true });
    }

    animateOut(element, animationClass, callback) {
        element.classList.add(animationClass);
        element.addEventListener('animationend', () => {
            element.classList.remove(animationClass);
            if (callback) callback();
        }, { once: true });
    }

    /**
     * Utility-Funktionen
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    handleResize() {
        // Responsive Anpassungen
        this.hideAllTooltips();
        this.updateAriaLabels();
    }

    hasUnsavedChanges() {
        // Prüfen ob ungespeicherte Änderungen vorhanden sind
        // Diese Logik könnte erweitert werden
        return false;
    }

    updateAriaLabels() {
        // ARIA-Labels dynamisch aktualisieren
        document.querySelectorAll('[data-aria-label]').forEach(el => {
            el.setAttribute('aria-label', el.dataset.ariaLabel);
        });
    }

    setupFocusManagement() {
        // Focus-Trap für Modals implementieren
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.modals.size > 0) {
                // Tab-Navigation in Modals kontrollieren
                this.handleModalTabNavigation(e);
            }
        });
    }

    handleModalTabNavigation(e) {
        const openModals = Array.from(this.modals.values());
        if (openModals.length === 0) return;
        
        const currentModal = openModals[openModals.length - 1].element;
        const focusableElements = currentModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    setupContrastSupport() {
        // High-Contrast-Modus erkennen und anpassen
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
    }

    showHelp() {
        this.showNotification('info', 'Hilfe', 'Tastenkombinationen: Ctrl+O (Datei öffnen), Ctrl+S (Einstellungen), Ctrl+Enter (Download)', 8000);
    }

    /**
     * Debug-Informationen
     */
    debug() {
        console.group('UIManager Debug Info');
        console.log('Active Notifications:', this.notifications.length);
        console.log('Open Modals:', this.modals.size);
        console.log('Active Tooltips:', this.activeTooltips.size);
        console.log('Animation Queue:', this.animationQueue.length);
        console.groupEnd();
    }
}