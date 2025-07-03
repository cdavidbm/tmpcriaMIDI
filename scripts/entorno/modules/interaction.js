import * as THREE from 'three';
import { criaturas } from './creatures.js';
import { camera, controls, scene } from './scene.js';

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();
export let hoveredCriatura = null;
export let selectedCriatura = null;
export let dragging = false;
export let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));

export function onMouseDown(event) {
    if (hoveredCriatura) {
        selectedCriatura = hoveredCriatura;
        dragging = true;
        controls.enabled = false;
    }
}

export function onMouseUp() {
    if (selectedCriatura && dragging) {
        selectedCriatura.velocidad = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            0,
            (Math.random() - 0.5) * 0.05
        );
    }
    selectedCriatura = null;
    dragging = false;
    controls.enabled = true;
}

export function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (dragging && selectedCriatura) {
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);

        selectedCriatura.modelo.position.copy(intersectPoint);
        selectedCriatura.position = {
            x: intersectPoint.x,
            y: intersectPoint.y,
            z: intersectPoint.z
        };
        selectedCriatura.velocidad.set(0, 0, 0);
    }
}

export function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (hoveredCriatura) {
        const escalaOriginal = hoveredCriatura.scale || 1;
        hoveredCriatura.modelo.scale.set(escalaOriginal, escalaOriginal, escalaOriginal);

        hoveredCriatura.modelo.traverse(child => {
            if (child.isMesh) {
                child.material.emissive.setHex(0x000000);
                child.material.emissiveIntensity = 0;
            }
        });
    }

    hoveredCriatura = null;

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        let root = intersectedObject;
        while (root.parent && root.parent.type !== "Scene") {
            root = root.parent;
        }
        const criatura = criaturas.find(c => c.modelo === root);

        if (criatura) {
            hoveredCriatura = criatura;
            const escalaOriginal = criatura.scale || 1;
            criatura.modelo.scale.set(
                escalaOriginal * 1.1,
                escalaOriginal * 1.1,
                escalaOriginal * 1.1
            );

            criatura.modelo.traverse(child => {
                if (child.isMesh) {
                    child.material.emissive.setHex(0x00ff00);
                    child.material.emissiveIntensity = 0.5;
                }
            });
        }
    }
}

export function setupEventListeners() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
}
