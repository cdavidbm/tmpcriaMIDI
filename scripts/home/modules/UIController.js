import * as THREE from 'three';

export class UIController {
    constructor(sceneManager, audioSystem) {
        this.sceneManager = sceneManager;
        this.audioSystem = audioSystem;
        this.wireframeMode = false;
        this.init();
    }

    init() {
        this.setupColorSlider();
        this.setupSizeSlider();
        this.setupButtons();
    }

    setupColorSlider() {
        const colorSlider = document.getElementById('color');
        if (colorSlider) {
            colorSlider.addEventListener('input', () => {
                const mainMesh = this.sceneManager.mesh;
                if (mainMesh && mainMesh.material) {
                    const h = colorSlider.value / 360;
                    const s = 0.7, l = 0.5;
                    const color = new THREE.Color().setHSL(h, s, l);

                    if (Array.isArray(mainMesh.material)) {
                        mainMesh.material.forEach(mat => {
                            if (mat.color) mat.color.set(color);
                        });
                    } else {
                        if (mainMesh.material.color) mainMesh.material.color.set(color);
                    }
                }
                this.audioSystem.playKnobSound(colorSlider.value / 360);
            });
        }
    }

    setupSizeSlider() {
        const sizeSlider = document.getElementById('size');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', () => {
                const mainMesh = this.sceneManager.mesh;
                if (mainMesh) {
                    const scale = sizeSlider.value / 100;
                    mainMesh.scale.set(scale, scale, scale);
                }
                this.audioSystem.playKnobSound((sizeSlider.value - 50) / 100);
            });
        }
    }

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

    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        const mainMesh = this.sceneManager.mesh;

        if (mainMesh) {
            if (Array.isArray(mainMesh.material)) {
                mainMesh.material.forEach(mat => {
                    if ('wireframe' in mat) mat.wireframe = this.wireframeMode;
                });
            } else if (mainMesh.material && 'wireframe' in mainMesh.material) {
                mainMesh.material.wireframe = this.wireframeMode;
            }
        }
        this.audioSystem.playWireframeSound();
    }

    toggleAnimation() {
        const mixer = this.sceneManager.mixer;
        const action = this.sceneManager.action;

        if (mixer && action) {
            if (!this.sceneManager.isAnimationPlaying) {
                action.play();
                this.sceneManager.setAnimationPlaying(true);
            } else {
                action.paused = !action.paused;
            }
        }
        this.audioSystem.playButtonSound();
    }

    resetAll() {
        const mainMesh = this.sceneManager.mesh;
        const morphSliders = this.sceneManager.sliders;

        // Reset morph targets
        if (mainMesh && mainMesh.morphTargetDictionary && mainMesh.morphTargetInfluences) {
            Object.keys(mainMesh.morphTargetDictionary).forEach(name => {
                const index = mainMesh.morphTargetDictionary[name];
                mainMesh.morphTargetInfluences[index] = 0;
            });
        }

        // Reset sliders
        morphSliders.forEach(slider => {
            if (slider) {
                slider.value = 0;
                slider.style.setProperty('--val', 0);
                slider.dispatchEvent(new Event('input'));
            }
        });

        // Reset color and size sliders
        const colorSlider = document.getElementById('color');
        const sizeSlider = document.getElementById('size');

        if (colorSlider) {
            colorSlider.value = 0;
            colorSlider.dispatchEvent(new Event('input'));
        }

        if (sizeSlider) {
            sizeSlider.value = 100;
            sizeSlider.dispatchEvent(new Event('input'));
        }

        // Reset wireframe
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

    updateMorphSlider(index, value) {
        const morphSliders = this.sceneManager.sliders;
        if (morphSliders[index]) {
            morphSliders[index].value = value;
            morphSliders[index].style.setProperty('--val', value * 100);
            morphSliders[index].dispatchEvent(new Event('input'));
        }
    }

    updateColorSlider(value) {
        const colorSlider = document.getElementById('color');
        if (colorSlider) {
            colorSlider.value = value;
            colorSlider.dispatchEvent(new Event('input'));
        }
    }

    updateSizeSlider(value) {
        const sizeSlider = document.getElementById('size');
        if (sizeSlider) {
            sizeSlider.value = value;
            sizeSlider.dispatchEvent(new Event('input'));
        }
    }
}
