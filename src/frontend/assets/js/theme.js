// Gerenciador de Tema (Claro / Escuro) persistido no LocalStorage
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Aplica o tema salvo inicial
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            let targetTheme = 'light';
            if (document.documentElement.getAttribute('data-theme') === 'light') {
                targetTheme = 'dark';
            }
            
            document.documentElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);
        });
    }
});