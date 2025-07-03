import * as THREE from 'three';
import { PARTICLES_COUNT, PARTICLE_SIZE, PARTICLE_SPAWN_INTERVAL } from './constants.js';
import { scene } from './scene.js';

// Arrays y variables globales para el sistema de partículas
export let particles = [];        // Array que contiene todas las partículas
export let lastParticleSpawn = 0; // Timestamp del último spawn de partículas

/**
 * Inicializa el sistema de partículas rojas que otorgan vida
 * PROPÓSITO: Crear un sistema de "alimento" para las criaturas
 * CÓMO: Genera múltiples esferas rojas emisivas distribuidas aleatoriamente
 * POR QUÉ: Proporciona un mecanismo de supervivencia para las criaturas
 */
export function createParticles() {
    // Aumenta ligeramente el número de partículas para mayor densidad
    const PARTICLES_COUNT_LOCAL = Math.floor(PARTICLES_COUNT * 1.5);

    // Crea cada partícula individualmente
    for (let i = 0; i < PARTICLES_COUNT_LOCAL; i++) {
        // === GEOMETRÍA DE LA PARTÍCULA ===
        // Esfera pequeña con suficientes segmentos para suavidad
        const geometry = new THREE.SphereGeometry(
            PARTICLE_SIZE * 1.8, // Radio aumentado para mejor visibilidad
            9,                   // Segmentos horizontales
            9                    // Segmentos verticales
        );

        // === MATERIAL EMISIVO ===
        // Material que emite luz propia para destacar visualmente
        const material = new THREE.MeshStandardMaterial({
            color: 0xff2222,           // Rojo intenso
            emissive: 0xff2222,        // Emisión roja (brilla por sí misma)
            emissiveIntensity: 2.2,    // Intensidad de emisión alta
            roughness: 0.18,           // Superficie bastante lisa
            metalness: 0.7,            // Propiedades metálicas para reflejos
            transparent: true,         // Permite efectos de transparencia
            opacity: 1                 // Opacidad completa inicialmente
        });

        // Crea el mesh de la partícula
        const particle = new THREE.Mesh(geometry, material);

        // Coloca la partícula en posición aleatoria
        spawnParticle(particle);

        // Añade a la escena y al array de seguimiento
        scene.add(particle);
        particles.push(particle);
    }
}

/**
 * Coloca una partícula en posición aleatoria dentro del área de juego
 * PROPÓSITO: Distribuir partículas de manera uniforme en el ecosistema
 * CÓMO: Genera coordenadas aleatorias dentro de un área rectangular
 * POR QUÉ: Asegura que las partículas estén disponibles en todo el entorno
 */
function spawnParticle(particle) {
    // Posición X aleatoria dentro del área de 40x40 unidades
    particle.position.x = (Math.random() - 0.5) * 40;

    // Posición Z aleatoria dentro del área de 40x40 unidades
    particle.position.z = (Math.random() - 0.5) * 40;

    // Altura fija ligeramente sobre el suelo
    particle.position.y = 0.5;

    // Hace visible la partícula
    particle.visible = true;
}

/**
 * Actualiza el sistema de partículas en cada frame
 * PROPÓSITO: Mantener un suministro constante de partículas disponibles
 * CÓMO: Reposiciona partículas invisibles después de un intervalo de tiempo
 * POR QUÉ: Evita que se agoten las partículas cuando son consumidas
 */
export function updateParticles() {
    const currentTime = Date.now();

    // Verifica si ha pasado suficiente tiempo desde el último spawn
    if (currentTime - lastParticleSpawn > PARTICLE_SPAWN_INTERVAL) {
        // Recorre todas las partículas
        particles.forEach(particle => {
            // Si la partícula está invisible (fue consumida), la reposiciona
            if (!particle.visible) {
                spawnParticle(particle);
            }
        });

        // Actualiza el timestamp del último spawn
        lastParticleSpawn = currentTime;
    }
}

// NOTAS ADICIONALES:
// - Las partículas se vuelven invisibles cuando son "consumidas" por las criaturas
// - El sistema de respawn asegura que siempre haya partículas disponibles
// - La emisión roja las hace fácilmente identificables como fuente de alimento
// - El tamaño y la posición están optimizados para la detección de colisiones
