// =========================
// === ENTORNO PRINCIPAL
// =========================

import { detectarColisiones, restaurarAparienciaNormal } from './modules/collision.js';
import {
    DURACION_COLISION,
    PARTICULAS_PARA_VIDA,
    RADIO_COLISION,
    VIDA_DEGRADACION,
    VIDA_INICIAL,
    VIDA_RECUPERADA,
    VIDA_WIREFRAME
} from './modules/constants.js';
import { cargarCriaturas, criaturas } from './modules/creatures.js';
import {
    checkIntersection,
    dragging,
    hoveredCriatura,
    selectedCriatura,
    setupEventListeners
} from './modules/interaction.js';
import { createParticles, particles, updateParticles } from './modules/particles.js';
import { camera, controls, handleResize, initScene, renderer, scene } from './modules/scene.js';
import {
    createGreenMeadow,
    createGround,
    createHill,
    createMarineLife,
    createMarineRock,
    createOceanicCurrent,
    createSeaBed
} from './modules/terrain.js';

// =========================
// === INICIALIZACIÓN
// =========================
function initSession() {
    const currentSession = Date.now().toString();
    const lastSession = localStorage.getItem('sessionId');

    if (lastSession !== currentSession) {
        console.log('Nueva sesión detectada, limpiando localStorage...');
        localStorage.clear();
        localStorage.setItem('sessionId', currentSession);
    }
}

async function init() {
    initSession();
    initScene();

    // Crear elementos del terreno
    createGround();
    createOceanicCurrent();
    createMarineLife();
    createSeaBed();
    createMarineRock();
    createGreenMeadow();
    createHill();

    // Crear partículas
    createParticles();

    // Cargar criaturas
    await cargarCriaturas();

    // Configurar eventos
    setupEventListeners();

    // Iniciar animación
    animate();
}

// =========================
// === FUNCIONES AUXILIARES
// =========================
function checkParticleCollisions() {
    particles.forEach(particle => {
        if (!particle.visible) return;

        criaturas.forEach(criatura => {
            const distance = particle.position.distanceTo(criatura.modelo.position);
            if (distance < RADIO_COLISION) {
                particle.visible = false;
                criatura.particulasRecolectadas++;

                if (criatura.particulasRecolectadas >= PARTICULAS_PARA_VIDA) {
                    if (criatura.vida < VIDA_INICIAL) {
                        criatura.vida += VIDA_RECUPERADA;
                        criatura.vida = Math.min(criatura.vida, VIDA_INICIAL);
                    }
                    criatura.particulasRecolectadas = 0;
                }
            }
        });
    });
}

function actualizarAparienciaPorVida(criatura) {
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            child.material.transparent = true;

            if (criatura.vida <= VIDA_WIREFRAME) {
                child.material.wireframe = true;
                child.material.opacity = criatura.vida / VIDA_WIREFRAME;
            } else {
                child.material.wireframe = false;
                child.material.opacity = 1;
            }
        }
    });
}

// =========================
// === BUCLE DE ANIMACIÓN
// =========================
function animate() {
    requestAnimationFrame(animate);

    checkIntersection();
    detectarColisiones();
    checkParticleCollisions();
    updateParticles();

    // Actualizar criaturas
    const tiempoActual = Date.now();
    criaturas.forEach((criatura, index) => {
        // Degradación de vida: criaturas pequeñas mueren más rápido, grandes más lento
        let degradacion = VIDA_DEGRADACION;
        if (criatura.scale < 1) {
            degradacion = VIDA_DEGRADACION * (1 + (1 - criatura.scale) * 1.2);
        } else if (criatura.scale > 1) {
            degradacion = VIDA_DEGRADACION * (1 - (criatura.scale - 1) * 0.5);
        }
        degradacion = Math.max(0.01, degradacion);

        criatura.vida -= degradacion;

        // Actualizar apariencia
        actualizarAparienciaPorVida(criatura);

        // Eliminar si la vida llega a 0
        if (criatura.vida <= 0) {
            scene.remove(criatura.modelo);
            criaturas.splice(index, 1);
            document.getElementById('numCriaturas').textContent = criaturas.length;
            return;
        }

        if (criatura === selectedCriatura && dragging) return;

        if (criatura.colisionando && tiempoActual - criatura.tiempoColision > DURACION_COLISION) {
            restaurarAparienciaNormal(criatura);
        }

        // Restaurar movimiento en todos los ejes
        criatura.modelo.position.add(criatura.velocidad);

        // Rebote en los límites del plano circular
        const radioMax = 38;
        const px = criatura.modelo.position.x;
        const pz = criatura.modelo.position.z;
        const dist = Math.sqrt(px * px + pz * pz);
        if (dist > radioMax) {
            // Rebote circular: invertir la velocidad y reposicionar en el borde
            const nx = px / dist;
            const nz = pz / dist;
            criatura.velocidad.x *= -1;
            criatura.velocidad.z *= -1;
            criatura.modelo.position.x = nx * radioMax * 0.98;
            criatura.modelo.position.z = nz * radioMax * 0.98;
        }

        criatura.modelo.rotation.y += 0.01;

        if (hoveredCriatura === criatura) {
            criatura.modelo.position.y = criatura.position?.y || 0;
            criatura.modelo.position.y += Math.sin(Date.now() * 0.01) * 0.1;
        }
    });

    // Colisión criaturas-colina (si existe la colina)
    if (window._alienHill) {
        const hill = window._alienHill;
        const hillPos = hill.position;
        const hillRadius = hill.geometry.parameters.radius || 8;
        const hillHeight = hillRadius * 0.6 * 1.2;

        criaturas.forEach(criatura => {
            const pos = criatura.modelo.position;
            const dx = pos.x - hillPos.x;
            const dz = pos.z - hillPos.z;
            const distXZ = Math.sqrt(dx * dx + dz * dz);

            if (distXZ < hillRadius * 0.98) {
                let maxY = hillPos.y;
                if (hill.geometry && hill.geometry.attributes && hill.geometry.attributes.position) {
                    let minDist = Infinity;
                    for (let i = 0; i < hill.geometry.attributes.position.count; i++) {
                        const vx = hill.geometry.attributes.position.getX(i) + hillPos.x;
                        const vz = hill.geometry.attributes.position.getZ(i) + hillPos.z;
                        const vy = hill.geometry.attributes.position.getY(i) + hillPos.y;
                        const d = (vx - pos.x) ** 2 + (vz - pos.z) ** 2;
                        if (d < minDist) {
                            minDist = d;
                            maxY = vy;
                        }
                    }
                } else {
                    maxY = hillPos.y + Math.max(0, hillHeight * (1 - distXZ / hillRadius));
                }

                if (pos.y < maxY + 0.2) {
                    pos.y = maxY + 0.2;
                    if (criatura.velocidad) {
                        criatura.velocidad.y = Math.abs(criatura.velocidad.y) * 0.5;
                    }
                }
            }
        });
    }

    renderer.render(scene, camera);
    controls.update();
}

// =========================
// === INICIO
// =========================
init();
window.addEventListener('resize', handleResize);
