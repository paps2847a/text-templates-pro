// popup.js - Lógica simple del popup (búsqueda y visualización)

let templates = [];
let filteredTemplates = [];

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const templatesContainer = document.getElementById('templatesContainer');
const openDashboardBtn = document.getElementById('openDashboardBtn');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    setupEventListeners();
});

// Configurar listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    openDashboardBtn.addEventListener('click', openDashboard);
}

// Cargar plantillas
function loadTemplates() {
    chrome.storage.local.get(['templates'], (result) => {
        templates = result.templates || [];
        filteredTemplates = [...templates];
        renderTemplates();
    });
}

// Renderizar plantillas con mejor visualización
function renderTemplates() {
    if (filteredTemplates.length === 0) {
        templatesContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                <p class="mt-2 small">
                    ${templates.length === 0 ? 'No hay plantillas' : 'Sin resultados'}
                </p>
            </div>
        `;
        return;
    }

    templatesContainer.innerHTML = filteredTemplates.map(template => `
        <div class="template-item">
            <div class="template-title">${escapeHtml(template.title)}</div>
            <div class="mb-2">
                <span class="template-keyword">/${escapeHtml(template.keyword)}</span>
            </div>
            ${template.description ? `<div class="template-description">${escapeHtml(template.description)}</div>` : ''}
        </div>
    `).join('');
}

// Manejar búsqueda
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredTemplates = [...templates];
    } else {
        filteredTemplates = templates.filter(template => {
            return (
                template.title.toLowerCase().includes(searchTerm) ||
                template.keyword.toLowerCase().includes(searchTerm) ||
                (template.description && template.description.toLowerCase().includes(searchTerm))
            );
        });
    }

    renderTemplates();
}

// Abrir dashboard
function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
}

// Escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escuchar actualizaciones de plantillas desde el dashboard
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.templates) {
        templates = changes.templates.newValue || [];
        filteredTemplates = [...templates];
        renderTemplates();
    }
});
