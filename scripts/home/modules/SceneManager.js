import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureUtils } from './TextureUtils.js';

/**
 * Gestor de la escena 3D
 * Controla la configuración de Three.js, carga de modelos, iluminación y renderizado
 * Es el núcleo visual de la aplicación
 */
export class SceneManager {
    constructor(containerSelector, audioSystem) {
        this.containerSelector = containerSelector;
        this.audioSystem = audioSystem;

        // Componentes principales de Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Elementos del modelo principal
        this.mainMesh = null;      // Malla principal del modelo
        this.mainModel = null;     // Contenedor del modelo completo

        // Sistema de animación
        this.animationMixer = null;
        this.animationAction = null;
        this.animationPlaying = false;

        // Controles de morph targets
        this.morphSliders = [];
    }

    /**
     * Inicialización completa del sistema 3D
     * Llama a todas las funciones de setup en orden correcto
     */
    async init() {
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        await this.loadModel(); // Operación asíncrona que puede tomar tiempo
    }

    /**
     * Configura la escena básica
     * Crea el contenedor principal donde se renderizan todos los objetos
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null; // Fondo transparente para integrar con CSS
    }

    /**
     * Configura el sistema de iluminación
     * Múltiples luces para crear un aspecto profesional y realista
     */
    setupLighting() {
        // Luz ambiental - iluminación base uniforme
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));

        // Luz hemisférica - simula iluminación del cielo y suelo
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.3);
        hemiLight.position.set(0, 1, 0);
        this.scene.add(hemiLight);

        // Luz direccional - simula luz solar con sombras
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(3, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.bias = -0.0001; // Reduce shadow acne
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Luz spot - acento adicional para resaltar formas
        const spotLight = new THREE.SpotLight(0xfff0e0, 0.25, 0, Math.PI / 6, 0.2, 1.5);
        spotLight.position.set(-8, 12, 8);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    /**
     * Configura la cámara de perspectiva
     * Establece el punto de vista y las proporciones
     */
    setupCamera() {
        const container = document.querySelector(this.containerSelector);
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Cámara perspectiva con FOV de 75° para vista natural
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5; // Posición inicial alejada del modelo
    }

    /**
     * Configura el renderer WebGL
     * Establece calidad visual y efectos de post-procesamiento
     */
    setupRenderer() {
        const container = document.querySelector(this.containerSelector);
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Renderer con alpha para transparencia y antialiasing para suavizar bordes
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setClearColor(0x000000, 0); // Fondo transparente
        this.renderer.setSize(width, height);

        // Tone mapping para colores más cinematográficos
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputEncoding = THREE.sRGBEncoding; // Colores precisos

        container.appendChild(this.renderer.domElement);
    }

    /**
     * Configura los controles de órbita
     * Permite al usuario rotar, hacer zoom y pan con el mouse
     */
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
    }

    /**
     * Carga el modelo GLTF principal
     * Maneja la carga asíncrona y procesa el modelo cargado
     */
    async loadModel() {
        const loader = new GLTFLoader();

        return new Promise((resolve, reject) => {
            loader.load(
                '/assets/modelo.glb', // Ruta del modelo 3D
                (gltf) => {
                    // Éxito en la carga
                    this.scene.add(gltf.scene);
                    this.mainModel = gltf.scene;

                    // Procesar y optimizar el modelo cargado
                    this.processModelMeshes(gltf.scene);
                    this.setupAnimations(gltf);
                    this.setupMorphTargets(gltf.scene);

                    resolve(gltf);
                },
                (progress) => {
                    // Progreso de carga
                    console.log('Cargando modelo:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    // Error en la carga
                    console.error('Error cargando modelo:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Procesa todas las mallas del modelo cargado
     * Aplica materiales mejorados y configura sombras
     */
    processModelMeshes(scene) {
        scene.traverse(obj => {
            if (obj.isMesh) {
                // Guardar referencia al primer mesh encontrado
                if (!this.mainMesh) this.mainMesh = obj;

                // Configurar sombras
                obj.castShadow = true;
                obj.receiveShadow = true;

                // Mejorar materiales existentes
                if (obj.material && obj.material.isMeshStandardMaterial) {
                    obj.material.roughness = 0.25;      // Superficie ligeramente rugosa
                    obj.material.metalness = 0.7;       // Aspecto metálico
                    obj.material.envMapIntensity = 1.2; // Reflejos ambientales
                    obj.material.clearcoat = 0.6;       // Capa transparente
                    obj.material.clearcoatRoughness = 0.15;
                    obj.material.sheen = 0.5;           // Brillo superficial
                    obj.material.sheenColor = new THREE.Color(0x88aaff);

                    // Aplicar textura de ruido como bump map
                    obj.material.bumpMap = TextureUtils.generateNoiseTexture();
                    obj.material.bumpScale = 0.08;
                    obj.material.needsUpdate = true;
                }
            }
        });
    }

    /**
     * Configura el sistema de animación del modelo
     * Prepara las animaciones GLTF para reproducción
     */
    setupAnimations(gltf) {
        if (gltf.animations && gltf.animations.length > 0) {
            this.animationMixer = new THREE.AnimationMixer(gltf.scene);
            this.animationAction = this.animationMixer.clipAction(gltf.animations[0]);
        }
    }

    /**
     * Configura los morph targets del modelo
     * Crea controles UI para cada morph target disponible
     */
    setupMorphTargets(scene) {
        // Nombres personalizados para los controles (más amigables que los nombres técnicos)
        const customMorphNames = [
            'Chrysaora plocamia',
            'Agaricia fragilis',
            'Octopus briareus',
            'Epidendrum secundum',
            'Miconia squamulosa',
            'Bidens rubifolia'
        ];

        scene.traverse(obj => {
            if (obj.isMesh && obj.morphTargetInfluences && obj.morphTargetDictionary) {
                const morphDict = obj.morphTargetDictionary;
                const morphInfluences = obj.morphTargetInfluences;
                const controlsDiv = document.getElementById('morph-controls');

                // Solo crear controles una vez
                if (this.morphSliders.length === 0) {
                    // Establecer mesh principal si no está definido
                    if (!this.mainMesh || !this.mainMesh.morphTargetDictionary) {
                        this.mainMesh = obj;
                    }

                    // Ordenar morph targets por índice para consistencia
                    const sortedMorphKeys = Object.keys(morphDict).sort((a, b) => morphDict[a] - morphDict[b]);

                    // Crear slider para cada morph target
                    sortedMorphKeys.forEach((name, idx) => {
                        const label = document.createElement('label');
                        const slider = document.createElement('input');

                        // Configurar slider
                        slider.type = 'range';
                        slider.min = 0;
                        slider.max = 1;
                        slider.step = 0.01;
                        slider.value = morphInfluences[morphDict[name]];
                        slider.style.setProperty('--val', slider.value * 100);

                        // Event listener para actualizar modelo y reproducir sonido
                        slider.oninput = () => {
                            morphInfluences[morphDict[name]] = parseFloat(slider.value);
                            slider.style.setProperty('--val', slider.value * 100);
                            this.audioSystem.playKnobSound(parseFloat(slider.value));
                        };

                        // Crear etiqueta con nombre personalizado
                        label.appendChild(slider);
                        const span = document.createElement('span');
                        span.className = 'knob-label-text';
                        span.textContent = customMorphNames[idx] || name;
                        label.appendChild(span);
                        controlsDiv.appendChild(label);

                        this.morphSliders.push(slider);
                    });
                }
            }
        });
    }

    /**
     * Inicia el loop de renderizado
     * Función recursiva que se ejecuta cada frame
     */
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            // Actualizar controles de órbita
            this.controls.update();

            // Actualizar animaciones si están reproduciéndose
            if (this.animationMixer && this.animationPlaying) {
                this.animationMixer.update(0.016); // 60 FPS
            }

            // Renderizar escena
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    /**
     * Maneja el redimensionamiento de la ventana
     * Ajusta cámara y renderer para mantener proporciones correctas
     */
    handleResize() {
        const container = document.querySelector(this.containerSelector);
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Actualizar relación de aspecto de la cámara
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Actualizar tamaño del renderer
        this.renderer.setSize(width, height);
    }

    // Getters para acceso desde otros módulos
    get mesh() { return this.mainMesh; }
    get model() { return this.mainModel; }
    get sliders() { return this.morphSliders; }
    get mixer() { return this.animationMixer; }
    get action() { return this.animationAction; }
    get isAnimationPlaying() { return this.animationPlaying; }

    /**
     * Establece el estado de reproducción de animación
     * @param {boolean} playing - Si la animación debe estar reproduciéndose
     */
    setAnimationPlaying(playing) {
        this.animationPlaying = playing;
    }
}
