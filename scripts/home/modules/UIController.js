import * as THREE from 'three';

/**
 * Controlador de interfaz de usuario
 * Maneja la interacción con sliders, botones y otros controles HTML
 * Conecta la UI con el modelo 3D y proporciona feedback visual/sonoro
 */
export class UIController {
    constructor(sceneManager, audioSystem) {
        this.sceneManager = sceneManager;
        this.audioSystem = audioSystem;
        this.wireframeMode = false; // Estado del modo wireframe
        this.init();
    }

    /**
     * Inicializa todos los controles de la interfaz
     * Configura event listeners para sliders y botones
     */
    init() {
        this.setupColorSlider();
        this.setupSizeSlider();
        this.setupButtons();
    }

    /**
     * Configura el slider de color
     * Convierte valores de hue (0-360) a colores HSL y los aplica al modelo
     */
    setupColorSlider() {
        const colorSlider = document.getElementById('color');
        if (colorSlider) {
            colorSlider.addEventListener('input', () => {
                const mainMesh = this.sceneManager.mesh;
                if (mainMesh && mainMesh.material) {
                    // Convertir valor del slider (0-360) a color HSL
                    const h = colorSlider.value / 360;
                    const s = 0.7, l = 0.5; // Saturación y luminosidad fijas para colores vibrantes
                    const color = new THREE.Color().setHSL(h, s, l);

                    // Aplicar color a todos los materiales (malla puede tener múltiples materiales)
                    if (Array.isArray(mainMesh.material)) {
                        mainMesh.material.forEach(mat => {
                            if (mat.color) mat.color.set(color);
                        });
                    } else {
                        if (mainMesh.material.color) mainMesh.material.color.set(color);
                    }
                }
                // Feedback sonoro basado en el valor del color
                this.audioSystem.playKnobSound(colorSlider.value / 360);
            });
        }
    }

    /**
     * Configura el slider de tamaño
     * Aplica escala uniforme al modelo 3D
     */
    setupSizeSlider() {
        const sizeSlider = document.getElementById('size');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', () => {
                const mainMesh = this.sceneManager.mesh;
                if (mainMesh) {
                    // Convertir valor del slider (0-200) a escala (0-2)
                    const scale = sizeSlider.value / 100;
                    mainMesh.scale.set(scale, scale, scale); // Escala uniforme en X, Y, Z
                }
                // Feedback sonoro basado en la desviación del tamaño normal (100)
                this.audioSystem.playKnobSound((sizeSlider.value - 50) / 100);
            });
        }
    }

    /**
     * Configura los botones de la interfaz
     * Busca botones por su posición en el DOM (nth-child)
     */
    setupButtons() {
        const wireframeBtn = document.querySelector('.btn:nth-child(3)');
        const animarBtn = document.querySelector('.btn:nth-child(1)');

        if (wireframeBtn) {
            wireframeBtn.addEventListener('click', () => {
                this.toggleWireframe();
            });
        }

        if (animarBtn) {
            animarBtn.addEventListener('click', () => {
                this.toggleAnimation();
            });
        }
    }

    /**
     * Alterna el modo wireframe del modelo
     * Muestra/oculta la estructura geométrica del modelo
     */
    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        const mainMesh = this.sceneManager.mesh;

        if (mainMesh) {
            // Aplicar wireframe a todos los materiales
            if (Array.isArray(mainMesh.material)) {
                mainMesh.material.forEach(mat => {
                    if ('wireframe' in mat) mat.wireframe = this.wireframeMode;
                });
            } else if (mainMesh.material && 'wireframe' in mainMesh.material) {
                mainMesh.material.wireframe = this.wireframeMode;
            }
        }
        // Sonido específico para wireframe
        this.audioSystem.playWireframeSound();
    }

    /**
     * Controla la reproducción de animaciones del modelo
     * Inicia/pausa/reanuda animaciones GLTF
     */
    toggleAnimation() {
        const mixer = this.sceneManager.mixer;
        const action = this.sceneManager.action;

        if (mixer && action) {
            if (!this.sceneManager.isAnimationPlaying) {
                // Iniciar animación desde el principio
                action.play();
                this.sceneManager.setAnimationPlaying(true);
            } else {
                // Pausar/reanudar animación existente
                action.paused = !action.paused;
            }
        }
        this.audioSystem.playButtonSound();
    }

    /**
     * Resetea todos los controles a sus valores por defecto
     * Útil para empezar una nueva criatura desde cero
     */
    resetAll() {
        const mainMesh = this.sceneManager.mesh;
        const morphSliders = this.sceneManager.sliders;

        // Resetear morph targets a 0 (forma base)
        if (mainMesh && mainMesh.morphTargetDictionary && mainMesh.morphTargetInfluences) {
            Object.keys(mainMesh.morphTargetDictionary).forEach(name => {
                const index = mainMesh.morphTargetDictionary[name];
                mainMesh.morphTargetInfluences[index] = 0;
            });
        }

        // Resetear todos los sliders de morph targets
        morphSliders.forEach(slider => {
            if (slider) {
                slider.value = 0;
                slider.style.setProperty('--val', 0); // CSS custom property para styling
                slider.dispatchEvent(new Event('input')); // Disparar evento para actualizar modelo
            }
        });

        // Resetear controles de color y tamaño
        const colorSlider = document.getElementById('color');
        const sizeSlider = document.getElementById('size');

        if (colorSlider) {
            colorSlider.value = 0; // Color inicial
            colorSlider.dispatchEvent(new Event('input'));
        }

        if (sizeSlider) {
            sizeSlider.value = 100; // Tamaño normal
            sizeSlider.dispatchEvent(new Event('input'));
        }

        // Resetear wireframe a modo normal
        this.wireframeMode = false;
        if (mainMesh) {
            if (Array.isArray(mainMesh.material)) {
                mainMesh.material.forEach(mat => {
                    if ('wireframe' in mat) mat.wireframe = false;
                });
            } else if (mainMesh.material && 'wireframe' in mainMesh.material) {
                mainMesh.material.wireframe = false;
            }
        }

        this.audioSystem.playButtonSound();
    }

    /**
     * Actualiza un slider de morph target específico
     * Usado por el controlador MIDI para sincronizar hardware con software
     */
    updateMorphSlider(index, value) {
        const morphSliders = this.sceneManager.sliders;
        if (morphSliders[index]) {
            morphSliders[index].value = value;
            morphSliders[index].style.setProperty('--val', value * 100); // Para CSS styling
            morphSliders[index].dispatchEvent(new Event('input')); // Actualizar modelo
        }
    }

    /**
     * Actualiza el slider de color externamente
     * Usado por controlador MIDI
     */
    updateColorSlider(value) {
        const colorSlider = document.getElementById('color');
        if (colorSlider) {
            colorSlider.value = value;
            colorSlider.dispatchEvent(new Event('input'));
        }
    }

    /**
     * Actualiza el slider de tamaño externamente
     * Usado por controlador MIDI
     */
    updateSizeSlider(value) {
        const sizeSlider = document.getElementById('size');
        if (sizeSlider) {
            sizeSlider.value = value;
            sizeSlider.dispatchEvent(new Event('input'));
        }
    }
}
