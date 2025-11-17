// background.js - Service Worker para la extensión

// Escuchar la instalación de la extensión
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Abrir la página de bienvenida
        chrome.tabs.create({ url: 'welcome.html' });

        // Inicializar el almacenamiento con valores por defecto
        chrome.storage.local.get(['templates', 'settings'], (result) => {
            if (!result.templates) {
                chrome.storage.local.set({ templates: [] });
            }
            if (!result.settings) {
                chrome.storage.local.set({
                    settings: {
                        delayTime: 1000,
                        enableNotifications: true
                    }
                });
            }
        });
    }
});

// Escuchar mensajes desde el content script o popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTemplates') {
        chrome.storage.local.get(['templates'], (result) => {
            sendResponse({ templates: result.templates || [] });
        });
        return true; // Indica que la respuesta es asincrónica
    }

    if (request.action === 'getSettings') {
        chrome.storage.local.get(['settings'], (result) => {
            sendResponse({ settings: result.settings || { delayTime: 1000, enableNotifications: true } });
        });
        return true;
    }
});
