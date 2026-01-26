// Dark Mode Funktionalität
// Diese Datei kann in index.html vor script.js eingebunden werden:
// <script src="dark-mode.js"></script>

// Dark Mode Initialisierung
(function() {
    const darkModeSaved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Wenn explizit gespeichert, das verwenden, sonst System-Präferenz
    if (darkModeSaved === 'true' || (darkModeSaved === null && prefersDark)) {
        document.body.classList.add('dark-mode');
    } else if (darkModeSaved === 'false') {
        document.body.classList.add('light-mode');
    }
})();

// Dark Mode Toggle Funktion
function toggleDarkMode() {
    const body = document.body;
    const icon = document.querySelector('.dark-mode-icon');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        if (icon) icon.textContent = '🌙';
        localStorage.setItem('darkMode', 'false');
        if (typeof showNotification === 'function') {
            showNotification('☀️ Light Mode aktiviert');
        }
    } else {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        if (icon) icon.textContent = '☀️';
        localStorage.setItem('darkMode', 'true');
        if (typeof showNotification === 'function') {
            showNotification('🌙 Dark Mode aktiviert');
        }
    }
}

// Icon beim Laden aktualisieren
window.addEventListener('DOMContentLoaded', function() {
    const icon = document.querySelector('.dark-mode-icon');
    if (icon && document.body.classList.contains('dark-mode')) {
        icon.textContent = '☀️';
    } else if (icon) {
        icon.textContent = '🌙';
    }
    
    // Keyboard Shortcut für Dark Mode (Strg+D)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        }
    });
});
