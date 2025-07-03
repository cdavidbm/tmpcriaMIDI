// =========================
// === ENTORNO PRINCIPAL
// =========================
// Este archivo es el núcleo del simulador de vida artificial. Coordina todos los módulos
// y controla el bucle principal de animación donde las criaturas evolucionan e interactúan.

// Importaciones de módulos específicos para separar responsabilidades
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

/**
 * Inicializa el control de sesión para limpiar datos obsoletos
 * PROPÓSITO: Evitar que datos de sesiones anteriores interfieran con la nueva simulación
 * CÓMO: Compara el timestamp actual con el almacenado en localStorage
 * POR QUÉ: Garantiza que cada ejecución comience con un estado limpio
 */
function initSession() {
    const currentSession = Date.now().toString();
    const lastSession = localStorage.getItem('sessionId');

    // Si la sesión es diferente, limpiamos todos los datos persistentes
    if (lastSession !== currentSession) {
        console.log('Nueva sesión detectada, limpiando localStorage...');
        localStorage.clear(); // Elimina criaturas guardadas de sesiones anteriores
        localStorage.setItem('sessionId', currentSession); // Marca la nueva sesión
    }
}

/**
 * Función principal de inicialización del entorno completo
 * PROPÓSITO: Coordinar la creación de todos los elementos del ecosistema
 * CÓMO: Ejecuta secuencialmente todas las funciones de creación de elementos
 * POR QUÉ: Garantiza que el entorno esté completamente preparado antes de comenzar
 */
async function init() {
    // Limpia datos de sesiones anteriores
    initSession();

    // Crea la escena 3D base con cámara, luces y renderer
    initScene();

    // Crear elementos del terreno en orden específico para evitar conflictos de renderizado
    createGround();        // Base acuática principal
    createOceanicCurrent(); // Corrientes marinas dinámicas
    createMarineLife();     // Vida marina decorativa (corales)
    createSeaBed();         // Lecho marino adicional
    createMarineRock();     // Rocas marinas con colisiones
    createGreenMeadow();    // Praderas verdes
    createHill();           // Colinas con física de colisión

    // Crear sistema de partículas rojas que otorgan vida
    createParticles();

    // Cargar criaturas persistentes desde localStorage
    await cargarCriaturas();

    // Configurar la interacción del usuario (mouse, drag & drop)
    setupEventListeners();

    // Iniciar el bucle de animación principal
    animate();
}

// =========================
// === FUNCIONES AUXILIARES
// =========================

/**
 * Detecta colisiones entre partículas rojas y criaturas
 * PROPÓSITO: Implementar el sistema de alimentación y regeneración de vida
 * CÓMO: Calcula distancias entre cada partícula visible y cada criatura
 * POR QUÉ: Las partículas rojas representan alimento que restaura la vida de las criaturas
 */
function checkParticleCollisions() {
    particles.forEach(particle => {
        // Solo procesamos partículas visibles para optimizar rendimiento
        if (!particle.visible) return;

        criaturas.forEach(criatura => {
            // Calcula distancia euclidiana entre partícula y criatura
            const distance = particle.position.distanceTo(criatura.modelo.position);

            // Si están lo suficientemente cerca, ocurre la "alimentación"
            if (distance < RADIO_COLISION) {
                // La partícula desaparece al ser "consumida"
                particle.visible = false;

                // Incrementa el contador de partículas recolectadas
                criatura.particulasRecolectadas++;

                // Cuando acumula suficientes partículas, restaura vida
                if (criatura.particulasRecolectadas >= PARTICULAS_PARA_VIDA) {
                    // Solo restaura si no está en vida máxima
                    if (criatura.vida < VIDA_INICIAL) {
                        criatura.vida += VIDA_RECUPERADA;
                        // Evita que la vida exceda el máximo
                        criatura.vida = Math.min(criatura.vida, VIDA_INICIAL);
                    }
                    // Reinicia el contador para el próximo ciclo
                    criatura.particulasRecolectadas = 0;
                }
            }
        });
    });
}

/**
 * Actualiza la apariencia visual de las criaturas según su nivel de vida
 * PROPÓSITO: Proporcionar feedback visual del estado de salud de cada criatura
 * CÓMO: Modifica propiedades del material (wireframe, opacity) según la vida
 * POR QUÉ: Permite al usuario ver qué criaturas están en peligro de extinción
 */
function actualizarAparienciaPorVida(criatura) {
    // Recorre todos los meshes del modelo de la criatura
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            // Habilita transparencia para poder cambiar la opacidad
            child.material.transparent = true;

            // Si la vida es crítica, muestra wireframe y reduce opacidad
            if (criatura.vida <= VIDA_WIREFRAME) {
                child.material.wireframe = true; // Modo esqueleto
                // Opacidad proporcional a la vida restante
                child.material.opacity = criatura.vida / VIDA_WIREFRAME;
            } else {
                // Vida normal: apariencia sólida
                child.material.wireframe = false;
                child.material.opacity = 1;
            }
        }
    });
}

// =========================
// === BUCLE DE ANIMACIÓN
// =========================

/**
 * Bucle principal de animación que se ejecuta 60 veces por segundo
 * PROPÓSITO: Actualizar todos los elementos dinámicos del ecosistema
 * CÓMO: Utiliza requestAnimationFrame para sincronizar con el refresh del navegador
 * POR QUÉ: Garantiza animaciones fluidas y comportamiento consistente
 */
function animate() {
    // Programa la siguiente ejecución del bucle
    requestAnimationFrame(animate);

    // Sistemas de detección e interacción
    checkIntersection();        // Detecta qué criatura está bajo el cursor
    detectarColisiones();       // Maneja colisiones entre criaturas
    checkParticleCollisions();  // Procesa alimentación con partículas
    updateParticles();          // Actualiza sistema de partículas rojas

    // === ACTUALIZACIÓN DE CRIATURAS ===
    const tiempoActual = Date.now();

    // Iteramos sobre todas las criaturas activas
    criaturas.forEach((criatura, index) => {
        // === SISTEMA DE DEGRADACIÓN DE VIDA ===
        // Calcula la velocidad de degradación según el tamaño
        let degradacion = VIDA_DEGRADACION;

        // Criaturas pequeñas (scale < 1) mueren más rápido
        if (criatura.scale < 1) {
            degradacion = VIDA_DEGRADACION * (1 + (1 - criatura.scale) * 1.2);
        }
        // Criaturas grandes (scale > 1) mueren más lento
        else if (criatura.scale > 1) {
            degradacion = VIDA_DEGRADACION * (1 - (criatura.scale - 1) * 0.5);
        }

        // Establece un mínimo para evitar degradación cero
        degradacion = Math.max(0.01, degradacion);

        // Aplica la degradación
        criatura.vida -= degradacion;

        // Actualiza la apariencia visual según la vida
        actualizarAparienciaPorVida(criatura);

        // === ELIMINACIÓN DE CRIATURAS MUERTAS ===
        if (criatura.vida <= 0) {
            scene.remove(criatura.modelo);           // Elimina del renderizado
            criaturas.splice(index, 1);             // Elimina del array
            // Actualiza el contador visual
            document.getElementById('numCriaturas').textContent = criaturas.length;
            return; // Termina el procesamiento de esta criatura
        }

        // === CONTROL DE ARRASTRE ===
        // Si la criatura está siendo arrastrada, omite el movimiento automático
        if (criatura === selectedCriatura && dragging) return;

        // === RESTAURACIÓN TRAS COLISIÓN ===
        // Restaura apariencia normal después del tiempo de colisión
        if (criatura.colisionando && tiempoActual - criatura.tiempoColision > DURACION_COLISION) {
            restaurarAparienciaNormal(criatura);
        }

        // === MOVIMIENTO AUTOMÁTICO ===
        // Aplica la velocidad a la posición (movimiento continuo)
        criatura.modelo.position.add(criatura.velocidad);

        // === FÍSICA DE LÍMITES CIRCULARES ===
        // Define el radio máximo del área de movimiento
        const radioMax = 38;
        const px = criatura.modelo.position.x;
        const pz = criatura.modelo.position.z;
        const dist = Math.sqrt(px * px + pz * pz);

        // Si la criatura sale del área, la hace rebotar
        if (dist > radioMax) {
            // Calcula la normal de la superficie circular
            const nx = px / dist;
            const nz = pz / dist;

            // Invierte la velocidad para simular rebote
            criatura.velocidad.x *= -1;
            criatura.velocidad.z *= -1;

            // Reposiciona ligeramente dentro del límite
            criatura.modelo.position.x = nx * radioMax * 0.98;
            criatura.modelo.position.z = nz * radioMax * 0.98;
        }

        // === ROTACIÓN AUTOMÁTICA ===
        // Hace girar la criatura lentamente para simular vida
        criatura.modelo.rotation.y += 0.01;

        // === EFECTO DE HOVER ===
        // Si el cursor está sobre la criatura, añade movimiento vertical
        if (hoveredCriatura === criatura) {
            // Mantiene la posición Y original
            criatura.modelo.position.y = criatura.position?.y || 0;
            // Añade oscilación sinusoidal para efecto de "flotación"
            criatura.modelo.position.y += Math.sin(Date.now() * 0.01) * 0.1;
        }
    });

    // === COLISIONES CON COLINA ===
    // Verifica si existe la colina global y aplica física de colisión
    if (window._alienHill) {
        const hill = window._alienHill;
        const hillPos = hill.position;
        const hillRadius = hill.geometry.parameters.radius || 8;
        const hillHeight = hillRadius * 0.6 * 1.2;

        criaturas.forEach(criatura => {
            const pos = criatura.modelo.position;

            // Calcula distancia horizontal a la colina
            const dx = pos.x - hillPos.x;
            const dz = pos.z - hillPos.z;
            const distXZ = Math.sqrt(dx * dx + dz * dz);

            // Si la criatura está dentro del radio de la colina
            if (distXZ < hillRadius * 0.98) {
                let maxY = hillPos.y;

                // Intenta calcular la altura exacta del terreno
                if (hill.geometry && hill.geometry.attributes && hill.geometry.attributes.position) {
                    let minDist = Infinity;
                    // Busca el vértice más cercano para determinar la altura
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
                    // Cálculo aproximado de altura basado en distancia
                    maxY = hillPos.y + Math.max(0, hillHeight * (1 - distXZ / hillRadius));
                }

                // Si la criatura está por debajo de la superficie, la eleva
                if (pos.y < maxY + 0.2) {
                    pos.y = maxY + 0.2;
                    // Ajusta velocidad vertical para evitar que se hunda
                    if (criatura.velocidad) {
                        criatura.velocidad.y = Math.abs(criatura.velocidad.y) * 0.5;
                    }
                }
            }
        });
    }

    // === RENDERIZADO FINAL ===
    // Renderiza la escena desde la perspectiva de la cámara
    renderer.render(scene, camera);
    // Actualiza los controles de cámara
    controls.update();
}

// =========================
// === INICIO DEL PROGRAMA ===
// =========================

// Inicia todo el sistema
init();

// Configura el redimensionamiento automático de la ventana
window.addEventListener('resize', handleResize);
