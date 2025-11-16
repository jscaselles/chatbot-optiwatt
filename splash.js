// Control de pantalla de carga
window.addEventListener('load', () => {
  const splashScreen = document.getElementById('splashScreen');
  const mainContainer = document.getElementById('mainContainer');
  
  // Esperar 2.5 segundos antes de mostrar el chatbot
  setTimeout(() => {
    splashScreen.classList.add('hidden');
    
    // Mostrar el chatbot después de la animación
    setTimeout(() => {
      mainContainer.style.display = 'flex';
      mainContainer.style.flexDirection = 'column';
      // Forzar reflow para activar la animación
      mainContainer.offsetHeight;
      mainContainer.style.opacity = '1';
      
      // Enfocar el input si existe
      const userInput = document.getElementById('userInput');
      if (userInput) {
        userInput.focus();
      }
    }, 500); // Esperar a que termine la animación de fade out
  }, 2500); // Tiempo que se muestra el logo (2.5 segundos)
});

