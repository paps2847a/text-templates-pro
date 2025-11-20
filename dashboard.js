// dashboard.js - Lógica del dashboard de gestión de plantillas
//cambios en manifiestos

let currentEditingId = null;
let templates = [];
let filteredTemplates = [];

// Elementos del DOM
const createTemplateForm = document.getElementById('createTemplateForm');
const editTemplateForm = document.getElementById('editTemplateForm');
const templatesContainer = document.getElementById('templatesContainer');
const searchInput = document.getElementById('searchInput');
const enableDelayCheckbox = document.getElementById('enableDelay');
const delayTimeInput = document.getElementById('delayTime');
const delayTimeContainer = document.getElementById('delayTimeContainer');
const enableNotificationsCheckbox = document.getElementById('enableNotifications');
const exportTemplatesBtn = document.getElementById('exportTemplates');
const importTemplatesBtn = document.getElementById('importTemplates');
const clearAllTemplatesBtn = document.getElementById('clearAllTemplates');
const saveSettingsBtn = document.getElementById('saveSettings');
const importFileInput = document.getElementById('importFile');

// Inicializar la extensión
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    loadSettings();
    setupEventListeners();
});

// Configurar listeners de eventos
function setupEventListeners() {
    createTemplateForm.addEventListener('submit', handleCreateTemplate);
    editTemplateForm.addEventListener('submit', handleEditTemplate);
    searchInput.addEventListener('input', handleSearch);
    enableDelayCheckbox.addEventListener('change', handleEnableDelayToggle);
    exportTemplatesBtn.addEventListener('click', handleExportTemplates);
    importTemplatesBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportTemplates);
    clearAllTemplatesBtn.addEventListener('click', handleClearAllTemplates);
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
    
    // Delegación de eventos para los botones de las cards
    templatesContainer.addEventListener('click', handleContainerClick);
}

// Manejar clics en el contenedor de plantillas (delegación de eventos)
function handleContainerClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const card = target.closest('.card');
    if (!card) return;

    // Obtener el ID de la plantilla desde un atributo data
    const templateId = card.getAttribute('data-template-id');

    if (target.classList.contains('btn-view')) {
        handleViewTemplate(templateId);
    } else if (target.classList.contains('btn-edit')) {
        handleEditTemplateClick(templateId);
    } else if (target.classList.contains('btn-delete')) {
        handleDeleteTemplate(templateId);
    }
}

// Cargar plantillas desde el almacenamiento
function loadTemplates() {
    chrome.storage.local.get(['templates'], (result) => {
        templates = result.templates || [];
        filteredTemplates = templates;
        renderTemplates();
    });
}

// Renderizar plantillas en el contenedor
function renderTemplates() {
    if (filteredTemplates.length === 0) {
        templatesContainer.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">No hay plantillas guardadas</p>
                <p class="small">Haz clic en "Agregar Plantilla" para comenzar</p>
            </div>
        `;
        return;
    }

    templatesContainer.innerHTML = filteredTemplates.map(template => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm" data-template-id="${template.id}">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(template.title)}</h5>
                    <p class="card-text text-muted">${escapeHtml(template.description || 'Sin descripción')}</p>
                    <div class="mb-3">
                        <small class="text-secondary"><strong>Palabra clave:</strong></small>
                        <br>
                        <code class="bg-light p-2 rounded d-inline-block">/${escapeHtml(template.keyword)}</code>
                    </div>
                </div>
                <div class="card-footer bg-white border-top">
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-sm btn-outline-info btn-view flex-grow-1">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-warning btn-edit flex-grow-1">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-delete flex-grow-1">
                            <i class="bi bi-trash"></i> Borrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Manejar búsqueda
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredTemplates = templates.filter(template => 
        template.title.toLowerCase().includes(searchTerm) ||
        template.keyword.toLowerCase().includes(searchTerm) ||
        (template.description && template.description.toLowerCase().includes(searchTerm))
    );
    renderTemplates();
}

// Manejar creación de plantilla
function handleCreateTemplate(event) {
    event.preventDefault();

    const title = document.getElementById('templateTitle').value;
    const keyword = document.getElementById('templateKeyword').value.toLowerCase();
    const description = document.getElementById('templateDescription').value;
    const content = document.getElementById('templateContent').value;

    // Validar que la palabra clave sea única
    if (templates.some(t => t.keyword === keyword)) {
        showAlert('Ya existe una plantilla con esta palabra clave', 'danger');
        return;
    }

    const newTemplate = {
        id: Date.now().toString(),
        title,
        keyword,
        description,
        content
    };

    templates.push(newTemplate);
    saveTemplates();
    createTemplateForm.reset();
    bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
    showAlert('Plantilla creada correctamente', 'success');
}

// Manejar edición de plantilla
function handleEditTemplate(event) {
    event.preventDefault();

    const title = document.getElementById('editTitle').value;
    const keyword = document.getElementById('editKeyword').value.toLowerCase();
    const description = document.getElementById('editDescription').value;
    const content = document.getElementById('editContent').value;

    // Validar que la palabra clave sea única (excepto para la plantilla actual)
    if (templates.some(t => t.keyword === keyword && t.id !== currentEditingId)) {
        showAlert('Ya existe una plantilla con esta palabra clave', 'danger');
        return;
    }

    const templateIndex = templates.findIndex(t => t.id === currentEditingId);
    if (templateIndex !== -1) {
        templates[templateIndex] = {
            id: currentEditingId,
            title,
            keyword,
            description,
            content
        };
        saveTemplates();
        editTemplateForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        showAlert('Plantilla actualizada correctamente', 'success');
    }
}

// Manejar vista de plantilla
function handleViewTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    document.getElementById('viewTitle').textContent = template.title;
    document.getElementById('viewKeyword').textContent = '/' + template.keyword;
    document.getElementById('viewDescription').textContent = template.description || 'Sin descripción';
    document.getElementById('viewContent').textContent = template.content;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewModal')).show();
}

// Manejar clic en editar
function handleEditTemplateClick(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    currentEditingId = templateId;
    document.getElementById('editTitle').value = template.title;
    document.getElementById('editKeyword').value = template.keyword;
    document.getElementById('editDescription').value = template.description || '';
    document.getElementById('editContent').value = template.content;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('editModal')).show();
}

// Manejar eliminación de plantilla
function handleDeleteTemplate(templateId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
        templates = templates.filter(t => t.id !== templateId);
        saveTemplates();
        showAlert('Plantilla eliminada correctamente', 'success');
    }
}

// Manejar exportación de plantillas
function handleExportTemplates() {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-templates-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showAlert('Plantillas exportadas correctamente', 'success');
}

// Manejar importación de plantillas
function handleImportTemplates(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTemplates = JSON.parse(e.target.result);
            if (Array.isArray(importedTemplates)) {
                templates = importedTemplates;
                saveTemplates();
                showAlert('Plantillas importadas correctamente', 'success');
            } else {
                showAlert('El archivo no contiene un formato válido', 'danger');
            }
        } catch (error) {
            showAlert('Error al importar las plantillas', 'danger');
        }
    };
    reader.readAsText(file);
    importFileInput.value = '';
    window.location.reload();
}

// Manejar eliminación de todas las plantillas
function handleClearAllTemplates() {
    if (confirm('¿Estás seguro de que deseas eliminar TODAS las plantillas? Esta acción no se puede deshacer.')) {
        templates = [];
        saveTemplates();
        showAlert('Todas las plantillas han sido eliminadas', 'success');
    }
}

// Manejar el guardado de configuración
function handleSaveSettings() {
    const delayTime = parseInt(delayTimeInput.value);
    const enableNotifications = enableNotificationsCheckbox.checked;
    const enableDelay = enableDelayCheckbox.checked;
    
    if (enableDelay && (delayTime < 50 || delayTime > 5000)) {
        showAlert('El tiempo de espera debe estar entre 50 y 5000 ms', 'danger');
        return;
    }

    chrome.storage.local.set({
        settings: { enableDelay, delayTime, enableNotifications }
    }, () => {
        showAlert('Configuración guardada correctamente', 'success');
        bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
    });
}

// Cargar configuración
function loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings || { enableDelay: false, delayTime: 150, enableNotifications: true };
        enableDelayCheckbox.checked = settings.enableDelay;
        delayTimeInput.value = settings.delayTime;
        enableNotificationsCheckbox.checked = settings.enableNotifications;
        
        // Mostrar u ocultar el contenedor de delay según el estado del checkbox
        updateDelayTimeVisibility();
    });
}

// Manejar el toggle de activación/desactivación del delay
function handleEnableDelayToggle() {
    updateDelayTimeVisibility();
}

// Actualizar la visibilidad del contenedor de delay
function updateDelayTimeVisibility() {
    if (enableDelayCheckbox.checked) {
        delayTimeContainer.style.display = 'block';
    } else {
        delayTimeContainer.style.display = 'none';
    }
}

// Guardar plantillas en el almacenamiento
function saveTemplates() {
    chrome.storage.local.set({ templates }, () => {
        renderTemplates();
        // Notificar al content script que las plantillas han sido actualizadas
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'templatesUpdated', 
                    templates 
                }).catch(() => {
                    // Ignorar errores si la pestaña no tiene el content script
                });
            });
        });
    });
}

// Mostrar alerta
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Escapar caracteres HTML para prevenir XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
