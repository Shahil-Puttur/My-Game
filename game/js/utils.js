export function getSyncTime() {
    return Date.now(); // Simplified for now, real implementation might use Firebase server time offset
}

export function showAlert(text, color) {
    const alertBox = document.getElementById('alert-text');
    if (!alertBox) return;
    alertBox.innerText = text;
    alertBox.style.color = color; 
    alertBox.classList.remove('show-alert');
    void alertBox.offsetWidth; // trigger reflow
    alertBox.classList.add('show-alert');
    if (window.alertTimeout) clearTimeout(window.alertTimeout);
    window.alertTimeout = setTimeout(() => alertBox.classList.remove('show-alert'), 1500);
}

export function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
        document.getElementById('orientation-warning').style.display = 'flex';
    } else {
        document.getElementById('orientation-warning').style.display = 'none';
    }
}
