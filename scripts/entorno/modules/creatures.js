import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';
import { generateNoiseTexture } from './textures.js';

export const criaturas = [];
export const channel = new BroadcastChannel('criaturas');

export async function cargarCriaturas() {
    const criaturasGuardadas = JSON.parse(localStorage.getItem('criaturas') || '[]');
    const loader = new GLTFLoader();

    for (const criatura of criaturasGuardadas) {
        await cargarCriatura(criatura, loader);
    }
}

export async function cargarNuevaCriatura(criatura) {
    const loader = new GLTFLoader();
    await cargarCriatura(criatura, loader);
}

async function cargarCriatura(criatura, loader) {
    try {
        const gltf = await loader.loadAsync('/assets/modelo.glb');
        const modelo = gltf.scene.clone();

        modelo.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                Object.entries(criatura.morphTargets).forEach(([name, value]) => {
                    const index = child.morphTargetDictionary[name];
                    if (typeof index !== 'undefined') {
                        child.morphTargetInfluences[index] = value;
                    }
                });

                if (criatura.color !== undefined) {
                    const color = new THREE.Color().setHSL(criatura.color / 360, 0.7, 0.5);
                    child.material.color = color;
                }
            }

            if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
                child.material.roughness = 0.25;
                child.material.metalness = 0.7;
                child.material.bumpMap = generateNoiseTexture();
                child.material.bumpScale = 0.08;
                child.material.needsUpdate = true;
            }
        });

        let escala = (typeof criatura.scale === "number" && criatura.scale > 0.3) ? criatura.scale : 1;
        modelo.scale.set(escala, escala, escala);

        let vida = 100;
        if (escala < 1) {
            vida = 40 + (100 - 40) * escala;
        } else if (escala > 1) {
            vida = 100 + (200 - 100) * (escala - 1) / 1;
        }

        let velocidadBase = 0.05;
        if (escala < 1) {
            velocidadBase = 0.05 + (1 - escala) * 0.12;
        } else if (escala > 1) {
            velocidadBase = 0.05 - (escala - 1) * 0.025;
        }
        velocidadBase = Math.max(0.015, Math.min(velocidadBase, 0.16));

        const radioMax = 38;
        let pos = { x: criatura.position.x, y: criatura.position.y, z: criatura.position.z };
        if (Math.sqrt(pos.x * pos.x + pos.z * pos.z) > radioMax) {
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * radioMax * 0.95;
            pos.x = Math.cos(theta) * r;
            pos.z = Math.sin(theta) * r;
            pos.y = 0;
        }
        pos.y = 0.6;
        modelo.position.set(pos.x, pos.y, pos.z);

        scene.add(modelo);
        criaturas.push({
            id: criatura.id,
            modelo,
            position: { ...pos },
            velocidad: new THREE.Vector3(
                (Math.random() - 0.5) * velocidadBase,
                0,
                (Math.random() - 0.5) * velocidadBase
            ),
            colisionando: false,
            tiempoColision: 0,
            contadorColisiones: 0,
            vida: vida,
            particulasRecolectadas: 0,
            scale: escala,
            velocidadBase,
        });

        document.getElementById('numCriaturas').textContent = criaturas.length;
    } catch (error) {
        console.error('Error al cargar criatura:', error);
    }
}

channel.onmessage = async (event) => {
    if (event.data.type === 'nueva_criatura') {
        await cargarNuevaCriatura(event.data.data);
    }
};
