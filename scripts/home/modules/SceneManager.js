import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureUtils } from './TextureUtils.js';

export class SceneManager {
    constructor(containerSelector, audioSystem) {
        this.containerSelector = containerSelector;
        this.audioSystem = audioSystem;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mainMesh = null;
        this.mainModel = null;
        this.animationMixer = null;
        this.animationAction = null;
        this.animationPlaying = false;
        this.morphSliders = [];
    }

    async init() {
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        await this.loadModel();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null;
    }

    setupLighting() {
        // Iluminación ambiental
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));

        // Luz hemisférica
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.3);
        hemiLight.position.set(0, 1, 0);
        this.scene.add(hemiLight);

        // Luz direccional
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(3, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.bias = -0.0001;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Luz spot
        const spotLight = new THREE.SpotLight(0xfff0e0, 0.25, 0, Math.PI / 6, 0.2, 1.5);
        spotLight.position.set(-8, 12, 8);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    setupCamera() {
        const container = document.querySelector(this.containerSelector);
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;
    }

    setupRenderer() {
        const container = document.querySelector(this.containerSelector);
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(width, height);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
    }

    async loadModel() {
        const loader = new GLTFLoader();

        return new Promise((resolve, reject) => {
            loader.load(
                '/assets/modelo.glb',
                (gltf) => {
                    this.scene.add(gltf.scene);
                    this.mainModel = gltf.scene;

                    this.processModelMeshes(gltf.scene);
                    this.setupAnimations(gltf);
                    this.setupMorphTargets(gltf.scene);

                    resolve(gltf);
                },
                (progress) => {
                    console.log('Cargando modelo:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error('Error cargando modelo:', error);
                    reject(error);
                }
            );
        });
    }

    processModelMeshes(scene) {
        scene.traverse(obj => {
            if (obj.isMesh) {
                if (!this.mainMesh) this.mainMesh = obj;
                obj.castShadow = true;
                obj.receiveShadow = true;

                if (obj.material && obj.material.isMeshStandardMaterial) {
                    obj.material.roughness = 0.25;
                    obj.material.metalness = 0.7;
                    obj.material.envMapIntensity = 1.2;
                    obj.material.clearcoat = 0.6;
                    obj.material.clearcoatRoughness = 0.15;
                    obj.material.sheen = 0.5;
                    obj.material.sheenColor = new THREE.Color(0x88aaff);
                    obj.material.bumpMap = TextureUtils.generateNoiseTexture();
                    obj.material.bumpScale = 0.08;
                    obj.material.needsUpdate = true;
                }
            }
        });
    }

    setupAnimations(gltf) {
        if (gltf.animations && gltf.animations.length > 0) {
            this.animationMixer = new THREE.AnimationMixer(gltf.scene);
            this.animationAction = this.animationMixer.clipAction(gltf.animations[0]);
        }
    }

    setupMorphTargets(scene) {
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

                if (this.morphSliders.length === 0) {
                    if (!this.mainMesh || !this.mainMesh.morphTargetDictionary) {
                        this.mainMesh = obj;
                    }

                    const sortedMorphKeys = Object.keys(morphDict).sort((a, b) => morphDict[a] - morphDict[b]);

                    sortedMorphKeys.forEach((name, idx) => {
                        const label = document.createElement('label');
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.min = 0;
                        slider.max = 1;
                        slider.step = 0.01;
                        slider.value = morphInfluences[morphDict[name]];
                        slider.style.setProperty('--val', slider.value * 100);

                        slider.oninput = () => {
                            morphInfluences[morphDict[name]] = parseFloat(slider.value);
                            slider.style.setProperty('--val', slider.value * 100);
                            this.audioSystem.playKnobSound(parseFloat(slider.value));
                        };

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

    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();

            if (this.animationMixer && this.animationPlaying) {
                this.animationMixer.update(0.016);
            }

            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    handleResize() {
        const container = document.querySelector(this.containerSelector);
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // Getters para acceso desde otros módulos
    get mesh() { return this.mainMesh; }
    get model() { return this.mainModel; }
    get sliders() { return this.morphSliders; }
    get mixer() { return this.animationMixer; }
    get action() { return this.animationAction; }
    get isAnimationPlaying() { return this.animationPlaying; }

    setAnimationPlaying(playing) {
        this.animationPlaying = playing;
    }
}
