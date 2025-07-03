import * as THREE from 'three';
import { FUERZA_REBOTE, MAX_COLISIONES, RADIO_COLISION } from './constants.js';
import { criaturas } from './creatures.js';
import { scene } from './scene.js';

export function detectarColisiones() {
    for (let i = 0; i < criaturas.length; i++) {
        for (let j = i + 1; j < criaturas.length; j++) {
            const criatura1 = criaturas[i];
            const criatura2 = criaturas[j];

            const distancia = criatura1.modelo.position.distanceTo(criatura2.modelo.position);

            if (distancia < RADIO_COLISION) {
                criatura1.contadorColisiones++;
                criatura2.contadorColisiones++;

                const direccion = new THREE.Vector3()
                    .subVectors(criatura1.modelo.position, criatura2.modelo.position)
                    .normalize();

                criatura1.velocidad.add(direccion.multiplyScalar(FUERZA_REBOTE));
                criatura2.velocidad.add(direccion.multiplyScalar(-FUERZA_REBOTE));

                criatura1.colisionando = true;
                criatura2.colisionando = true;
                criatura1.tiempoColision = Date.now();
                criatura2.tiempoColision = Date.now();

                aplicarEfectoColision(criatura1);
                aplicarEfectoColision(criatura2);

                verificarEliminacion(criatura1);
                verificarEliminacion(criatura2);
            }
        }
    }
}

export function aplicarEfectoColision(criatura) {
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            child.material.emissive.setHex(0xff0000);
            child.material.emissiveIntensity = 1;
        }
    });
}

export function restaurarAparienciaNormal(criatura) {
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
        }
    });
    criatura.colisionando = false;
}

export function verificarEliminacion(criatura) {
    if (criatura.contadorColisiones >= MAX_COLISIONES) {
        scene.remove(criatura.modelo);
        const index = criaturas.indexOf(criatura);
        if (index > -1) {
            criaturas.splice(index, 1);
        }
        document.getElementById('numCriaturas').textContent = criaturas.length;
    }
}
