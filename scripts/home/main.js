import { AudioSystem } from './modules/AudioSystem.js';
import { CreatureManager } from './modules/CreatureManager.js';
import { MIDIController } from './modules/MIDIController.js';
import { SceneManager } from './modules/SceneManager.js';
import { UIController } from './modules/UIController.js';

// Instancias principales
const audioSystem = new AudioSystem();
const sceneManager = new SceneManager('#escena', audioSystem);
const uiController = new UIController(sceneManager, audioSystem);
const creatureManager = new CreatureManager(sceneManager, audioSystem);
const midiController = new MIDIController(uiController, audioSystem);

// Inicializar la aplicación
async function init() {
    try {
        await sceneManager.init();
        await midiController.init();

        // Configurar eventos globales
        setupGlobalEvents();

        // Iniciar el loop de renderizado
        sceneManager.startRenderLoop();

        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}

function setupGlobalEvents() {
    // Teclas globales
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'Enter':
                creatureManager.aprobarCriatura();
                break;
            case 'a':
            case 'A':
                creatureManager.girarFiguraY();
                break;
            case 'w':
            case 'W':
                uiController.toggleWireframe();
                break;
            case 's':
            case 'S':
                audioSystem.toggle();
                break;
        }
    });

    // Resize de ventana
    window.addEventListener('resize', () => {
        sceneManager.handleResize();
    });
}

// Exponer funciones globales para compatibilidad
window.resetAll = () => uiController.resetAll();
window.toggleWireframe = () => uiController.toggleWireframe();
window.aprobarCriatura = () => creatureManager.aprobarCriatura();
window.girarFiguraY = (velocidad, duracion) => creatureManager.girarFiguraY(velocidad, duracion);
window.detenerGiroFiguraY = () => creatureManager.detenerGiroFiguraY();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
