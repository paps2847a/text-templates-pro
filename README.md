# Text Templates Pro - Extensión de Google Chrome

**Text Templates Pro** es una extensión de Google Chrome diseñada para aumentar tu productividad permitiéndote guardar, gestionar e invocar plantillas de texto de forma rápida en cualquier campo de texto de tu navegador.

## Características

*   **Reemplazo Inmediato por Defecto (v9):** El reemplazo de texto es **inmediato (0ms)** por defecto. El usuario puede activar y configurar un tiempo de espera (delay) si lo desea desde el Dashboard.
*   **Popup Mejorado (v9):** El Popup es ahora **más ancho**, y la lista de plantillas es **scrollable** (máximo 500px de altura) con una visualización más clara de cada plantilla (título, palabra clave y descripción).
*   **Reemplazo Robusto:** Lógica de detección y reemplazo de texto significativamente mejorada para funcionar de manera fiable en `textarea`, `input` y elementos `contenteditable`.
*   **Manejo de Errores:** Notificación de error visible (roja) en caso de fallo en el proceso de reemplazo, deteniendo la operación para evitar problemas.
*   **Recursos Locales:** Todos los recursos de Bootstrap (CSS, JS, Icons) se han descargado y se cargan localmente, asegurando el funcionamiento **sin conexión a internet**.
*   **Cumplimiento de CSP:** Se ha corregido el error de Content Security Policy (CSP) eliminando los manejadores de eventos en línea (`onclick`) y utilizando delegación de eventos en JavaScript.
*   **Interfaz Separada (Popup vs. Dashboard):**
    *   **Popup:** Interfaz ligera y rápida con buscador y lista de plantillas.
    *   **Dashboard:** Página completa para la gestión CRUD y configuración.
*   **Búsqueda Instantánea:** Barra de búsqueda funcional para filtrar plantillas por título, palabra clave o descripción.
*   **Gestión Completa de Plantillas (CRUD):** Crea, lee, edita y elimina plantillas de texto con un título, una descripción y una palabra clave única.
*   **Activación por Palabra Clave:** Invoca tus plantillas escribiendo una barra diagonal (`/`) seguida de la palabra clave (ej. `/saludo`).
*   **Soporte para Diversos Campos:** Funciona en `textarea`, `input` de tipo texto y elementos con `contenteditable="true"`.
*   **Interfaz Moderna:** Desarrollada con la última versión de **Bootstrap 5** para una experiencia de usuario limpia y responsiva.
*   **Configuración Personalizable:** Ajusta el tiempo de espera para el reemplazo automático (mínimo 50ms).
*   **Copia de Seguridad:** Funcionalidad para exportar e importar tus plantillas en formato JSON.

## Estructura de la Extensión

La extensión sigue la arquitectura estándar de Chrome Extension Manifest V3:

| Archivo | Propósito |
| :--- | :--- |
| `manifest.json` | Archivo de configuración principal de la extensión (Manifest V3). |
| `popup.html` | **Popup:** Interfaz ligera con buscador y lista de plantillas. **(Ancho y scroll mejorados)** |
| `popup.js` | Lógica JavaScript para `popup.html`, incluyendo la búsqueda y la función para abrir el dashboard. **(Renderizado mejorado)** |
| `dashboard.html` | **Dashboard:** Página completa para la gestión CRUD y configuración (se abre en una nueva pestaña). |
| `dashboard.js` | Lógica JavaScript para `dashboard.html`, incluyendo la gestión de plantillas (CRUD), la funcionalidad de búsqueda y la interacción con `chrome.storage.local`. **(Control de delay)** |
| `styles.css` | Estilos CSS personalizados para ambas interfaces. |
| `content.js` | Script de contenido inyectado en todas las páginas web para monitorear la entrada de texto y realizar el reemplazo de plantillas. **(Soporte para 0ms delay)** |
| `background.js` | Service Worker que maneja eventos de fondo, como la instalación y la inicialización del almacenamiento. |
| `welcome.html` | Página de bienvenida que se abre tras la primera instalación. |
| `images/` | Contiene los iconos de la extensión. |
| `lib/` | Contiene los archivos locales de Bootstrap (CSS, JS, Icons). |

## Instalación

Para instalar la extensión en Google Chrome:

1.  **Descarga** el archivo ZIP de la extensión.
2.  **Descomprime** el archivo en una ubicación de fácil acceso.
3.  Abre Google Chrome y navega a `chrome://extensions`.
4.  Activa el **Modo de desarrollador** (Developer mode) en la esquina superior derecha.
5.  Haz clic en **Cargar descomprimida** (Load unpacked).
6.  Selecciona la carpeta `text-templates-extension` que descomprimiste.
7.  La extensión **Text Templates Pro** aparecerá en tu lista de extensiones.

## Uso

### 1. Búsqueda Rápida (Popup)

1.  Haz clic en el icono de la extensión en la barra de herramientas de Chrome.
2.  Usa la barra de búsqueda para encontrar rápidamente la palabra clave de una plantilla.
3.  El popup muestra las plantillas de forma clara para una referencia rápida.

### 2. Gestión Completa (Dashboard)

1.  En el popup, haz clic en el botón **<i class="bi bi-gear"></i>** para **Abrir Dashboard**.
2.  El dashboard se abrirá en una nueva pestaña del navegador.
3.  Desde aquí puedes:
    *   **Agregar Plantilla:** Usando el botón principal.
    *   **Editar/Eliminar:** Usando los botones en las cards de plantillas.
    *   **Configuración:** Activar y ajustar el tiempo de espera para el reemplazo automático (por defecto está desactivado).
    *   **Exportar/Importar:** Realizar copias de seguridad de tus plantillas.

### 3. Invocar una Plantilla

1.  En cualquier página web, haz clic en un campo de texto (`textarea`, `input` o `contenteditable`).
2.  Escribe la barra diagonal (`/`) seguida de la palabra clave de tu plantilla (ej. `/saludo`).
3.  **El reemplazo será inmediato** a menos que hayas activado un tiempo de espera en la configuración.

## Notas Técnicas

El mecanismo de reemplazo de texto se basa en la detección de la palabra clave justo antes de la posición actual del cursor. El temporizador de inactividad (`setTimeout` en `content.js`) es crucial para diferenciar entre una palabra clave que se está escribiendo y una que ya ha sido completada.

El uso de `chrome.storage.local` garantiza que tus plantillas se guarden de forma persistente y segura en tu perfil de Chrome.
