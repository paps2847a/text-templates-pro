// content.js - Script de contenido para monitorear y reemplazar plantillas de texto

let templates = [];
let settings = { enableDelay: false, delayTime: 150, enableNotifications: true };
let inactivityTimer = null;

// Cargar plantillas y configuración
chrome.storage.local.get(['templates', 'settings'], (result) => {
    templates = result.templates || [];
    settings = result.settings || { delayTime: 1000, enableNotifications: true };
});

// Escuchar cambios en las plantillas desde el dashboard
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        if (changes.templates) {
            templates = changes.templates.newValue || [];
        }
        if (changes.settings) {
            settings = changes.settings.newValue || settings;
        }
    }
});

// Escuchar mensajes desde el dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'templatesUpdated') {
        templates = request.templates || [];
        sendResponse({ status: 'success' });
    }
});

// Monitorear eventos de entrada de texto en el documento
document.addEventListener('input', handleInput, true);
document.addEventListener('keyup', handleKeyUp, true);

// Manejar entrada de texto
function handleInput(event) {
    const element = event.target;
    
    // Verificar si el elemento es un campo de texto válido
    if (!isValidTextElement(element)) {
        return;
    }
    
    // Limpiar el temporizador anterior
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    // Establecer un nuevo temporizador de inactividad
    // Si el delay está desactivado, usar 0ms (inmediato)
    const delay = settings.enableDelay ? settings.delayTime : 0;
    inactivityTimer = setTimeout(() => {
        try {
            checkAndReplaceTemplate(element);
        } catch (error) {
            showErrorNotification('❌ Error: ' + error.message);
            console.error('Error en checkAndReplaceTemplate:', error);
        }
    }, delay);
}

// Manejar keyup para mejorar la detección
function handleKeyUp(event) {
    const element = event.target;
    
    if (!isValidTextElement(element)) {
        return;
    }
}

// Verificar si el elemento es un campo de texto válido
function isValidTextElement(element) {
    if (!element) {
        return false;
    }
    
    // Elementos input de tipo texto
    if (element.tagName === 'INPUT') {
        const type = element.type.toLowerCase();
        return ['text', 'email', 'search', 'url', ''].includes(type);
    }
    
    // Elementos textarea
    if (element.tagName === 'TEXTAREA') {
        return true;
    }
    
    // Elementos contenteditable
    if (element.contentEditable === 'true' || element.contentEditable === 'inherit') {
        return true;
    }
    
    return false;
}

// Obtener el texto actual del elemento
function getElementText(element) {
    try {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return element.value || '';
        } else if (element.contentEditable === 'true' || element.contentEditable === 'inherit') {
            // Para contenteditable, usar innerText es más confiable
            return element.innerText || '';
        }
        return '';
    } catch (error) {
        console.error('Error al obtener el texto del elemento:', error);
        throw new Error('No se pudo obtener el texto del elemento');
    }
}

// Obtener la posición del cursor
function getCursorPosition(element) {
    try {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return element.selectionStart || 0;
        } else if (element.contentEditable === 'true' || element.contentEditable === 'inherit') {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
                return 0;
            }
            
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            
            return preCaretRange.toString().length;
        }
        return 0;
    } catch (error) {
        console.error('Error al obtener la posición del cursor:', error);
        throw new Error('No se pudo obtener la posición del cursor');
    }
}

// Establecer la posición del cursor
function setCursorPosition(element, position) {
    try {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.setSelectionRange(position, position);
            element.focus();
        } else if (element.contentEditable === 'true' || element.contentEditable === 'inherit') {
            const selection = window.getSelection();
            const range = document.createRange();
            
            let charCount = 0;
            let nodeStack = [element];
            let node, foundStart = false;
            
            while (!foundStart && (node = nodeStack.pop())) {
                if (node.nodeType === 3) { // Nodo de texto
                    const nextCharCount = charCount + node.length;
                    if (position <= nextCharCount) {
                        range.setStart(node, position - charCount);
                        foundStart = true;
                    }
                    charCount = nextCharCount;
                } else {
                    let i = node.childNodes.length;
                    while (i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }
            
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            element.focus();
        }
    } catch (error) {
        console.error('Error al establecer la posición del cursor:', error);
        throw new Error('No se pudo establecer la posición del cursor');
    }
}

// Buscar la palabra clave antes del cursor
function findKeywordBeforeCursor(text, cursorPosition) {
    try {
        if (!text || cursorPosition < 1) {
            return null;
        }
        
        // Obtener el texto antes del cursor
        const textBeforeCursor = text.substring(0, cursorPosition);
        
        // Buscar la última ocurrencia de '/' seguida de caracteres válidos
        // La palabra clave debe estar después de un espacio, salto de línea o al inicio
        const keywordMatch = textBeforeCursor.match(/(?:^|\s|\n)(\/[a-zA-Z0-9_-]*)$/);
        
        if (!keywordMatch) {
            return null;
        }
        
        const fullMatch = keywordMatch[1].trim(); // Obtener el match sin espacios
        const keyword = fullMatch.substring(1); // Remover el '/'
        
        // Validar que la palabra clave no esté vacía
        if (!keyword) {
            return null;
        }
        
        // Encontrar la posición exacta del '/'
        const slashIndex = textBeforeCursor.lastIndexOf('/' + keyword);
        
        if (slashIndex === -1) {
            return null;
        }
        
        return {
            keyword: keyword.toLowerCase(),
            start: slashIndex,
            end: cursorPosition,
            fullMatch: '/' + keyword
        };
    } catch (error) {
        console.error('Error al buscar la palabra clave:', error);
        throw new Error('No se pudo buscar la palabra clave');
    }
}

// Verificar y reemplazar la plantilla
function checkAndReplaceTemplate(element) {
    try {
        // Validar que el elemento sea válido
        if (!isValidTextElement(element)) {
            throw new Error('Elemento de texto no válido');
        }
        
        // Obtener el texto actual
        const text = getElementText(element);
        if (!text) {
            return; // Texto vacío, salir silenciosamente
        }
        
        // Obtener la posición del cursor
        const cursorPosition = getCursorPosition(element);
        
        // Buscar la palabra clave
        const keywordMatch = findKeywordBeforeCursor(text, cursorPosition);
        
        if (!keywordMatch || !keywordMatch.keyword) {
            return; // No hay palabra clave, salir silenciosamente
        }
        
        // Buscar la plantilla correspondiente
        const template = templates.find(t => t.keyword === keywordMatch.keyword);
        
        if (!template) {
            return; // No hay plantilla coincidente, salir silenciosamente
        }
        
        // Realizar el reemplazo
        performReplacement(element, text, keywordMatch, template);
        
    } catch (error) {
        showErrorNotification('❌ Error: ' + error.message);
        console.error('Error en checkAndReplaceTemplate:', error);
    }
}

// Realizar el reemplazo de texto
function performReplacement(element, text, keywordMatch, template) {
    try {
        // Validar que el contenido de la plantilla sea válido
        if (!template.content || typeof template.content !== 'string') {
            throw new Error('Contenido de la plantilla inválido');
        }
        
        // Construir el nuevo texto
        const beforeKeyword = text.substring(0, keywordMatch.start);
        const afterKeyword = text.substring(keywordMatch.end);
        const newText = beforeKeyword + template.content + afterKeyword;
        
        // Actualizar el elemento según su tipo
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = newText;
            
            // Establecer la posición del cursor después del contenido insertado
            const newCursorPosition = keywordMatch.start + template.content.length;
            element.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // Disparar eventos de cambio
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
        } else if (element.contentEditable === 'true' || element.contentEditable === 'inherit') {
            element.innerText = newText;
            
            // Establecer la posición del cursor después del contenido insertado
            const newCursorPosition = keywordMatch.start + template.content.length;
            setCursorPosition(element, newCursorPosition);
            
            // Disparar eventos de cambio
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            throw new Error('Tipo de elemento no soportado');
        }
        
        // Mostrar notificación de éxito si está habilitada
        if (settings.enableNotifications) {
            showSuccessNotification(`✓ Plantilla "${template.title}" insertada`);
        }
        
    } catch (error) {
        showErrorNotification('❌ Error al reemplazar: ' + error.message);
        console.error('Error en performReplacement:', error);
    }
}

// Mostrar notificación de éxito
function showSuccessNotification(message) {
    try {
        const notification = createNotification(message, 'success');
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    } catch (error) {
        console.error('Error al mostrar notificación de éxito:', error);
    }
}

// Mostrar notificación de error
function showErrorNotification(message) {
    try {
        const notification = createNotification(message, 'error');
        document.body.appendChild(notification);
        
        // Mantener la notificación de error visible por más tiempo
        setTimeout(() => {
            notification.remove();
        }, 5000);
    } catch (error) {
        console.error('Error al mostrar notificación de error:', error);
    }
}

// Crear elemento de notificación
function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `text-templates-notification text-templates-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
        notification.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
        notification.style.border = '1px solid #f5c6cb';
    }
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('text-templates-styles')) {
        const style = document.createElement('style');
        style.id = 'text-templates-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return notification;
}

// Limpiar el timeout cuando la página se descarga
window.addEventListener('beforeunload', () => {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
});