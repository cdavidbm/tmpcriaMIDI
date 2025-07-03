/**
 * Punto de entrada principal de la aplicación
 * Coordina la inicialización de todos los módulos y maneja eventos globales
 */
import { AudioSystem } from './modules/AudioSystem.js';
import { CreatureManager } from './modules/CreatureManager.js';
import { MIDIController } from './modules/MIDIController.js';
import { SceneManager } from './modules/SceneManager.js';
import { UIController } from './modules/UIController.js';

// Crear instancias de todos los módulos principales
// Orden importante: AudioSystem primero ya que otros módulos lo necesitan
const audioSystem = new AudioSystem();
const sceneManager = new SceneManager('#escena', audioSystem);
const uiController = new UIController(sceneManager, audioSystem);
const creatureManager = new CreatureManager(sceneManager, audioSystem);
const midiController = new MIDIController(uiController, audioSystem);

/**
 * Función principal de inicialización
 * Coordina la inicialización asíncrona de todos los módulos
 */
async function init() {
    try {
        // Inicializar escena 3D y cargar modelo - esto puede tomar tiempo
        await sceneManager.init();

        // Inicializar controlador MIDI - requiere permisos del usuario
        await midiController.init();

        // Configurar eventos globales del teclado
        setupGlobalEvents();

        // Iniciar el loop de renderizado de Three.js
        sceneManager.startRenderLoop();

        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}

/**
 * Configura los eventos globales del teclado
 * Proporciona atajos rápidos para funciones principales
 */
function setupGlobalEvents() {
    // Eventos de teclado para control rápido
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'Enter':
                // Aprobar criatura actual y guardarla
                creatureManager.aprobarCriatura();
                break;
            case 'a':
            case 'A':
                // Girar la figura en Y para ver desde diferentes ángulos
                creatureManager.girarFiguraY();
                break;
            case 'w':
            case 'W':
                // Toggle wireframe para ver geometría
                uiController.toggleWireframe();
                break;
            case 's':
            case 'S':
                // Toggle sistema de sonidos
                audioSystem.toggle();
                break;
        }
    });

    // Manejar redimensionamiento de ventana para responsive design
    window.addEventListener('resize', () => {
        sceneManager.handleResize();
    });
}

// Exponer funciones globales para compatibilidad con HTML onclick events
// Esto permite que los botones HTML llamen directamente a estas funciones
window.resetAll = () => uiController.resetAll();
window.toggleWireframe = () => uiController.toggleWireframe();
window.aprobarCriatura = () => creatureManager.aprobarCriatura();
window.girarFiguraY = (velocidad, duracion) => creatureManager.girarFiguraY(velocidad, duracion);
window.detenerGiroFiguraY = () => creatureManager.detenerGiroFiguraY();

// Inicializar cuando el DOM esté completamente cargado
// Esto asegura que todos los elementos HTML estén disponibles
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // Si ya está cargado, inicializar inmediatamente
}
