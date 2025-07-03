import * as THREE from 'three';

/**
 * Genera una textura de ruido procedural para efectos de superficie
 * PROPÓSITO: Crear variación visual en las superficies sin usar imágenes externas
 * CÓMO: Utiliza un canvas 2D para generar píxeles aleatorios con valores controlados
 * POR QUÉ: Las texturas procedurales son más ligeras y no requieren archivos externos
 */
export function generateNoiseTexture() {
    const size = 128; // Resolución de la textura (128x128 píxeles)

    // Crea un canvas virtual para generar la textura
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Obtiene acceso directo a los píxeles del canvas
    const imgData = ctx.createImageData(size, size);

    // Genera ruido aleatorio píxel por píxel
    for (let i = 0; i < size * size * 4; i += 4) {
        // Valor aleatorio entre 128-255 para mantener tonos claros
        const val = Math.floor(Math.random() * 128 + 128);

        // Asigna el mismo valor a RGB para obtener escala de grises
        imgData.data[i] = val;     // Rojo
        imgData.data[i + 1] = val; // Verde
        imgData.data[i + 2] = val; // Azul
        imgData.data[i + 3] = 255; // Alpha (opacidad completa)
    }

    // Aplica los píxeles al canvas
    ctx.putImageData(imgData, 0, 0);

    // Convierte el canvas a textura de Three.js
    const texture = new THREE.CanvasTexture(canvas);

    // Configura el modo de repetición para patrones continuos
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Repite 4 veces en cada dirección

    return texture;
}

/**
 * Genera una textura marina compleja con corales, rocas y arena
 * PROPÓSITO: Crear una textura rica y varied para el fondo marino
 * CÓMO: Combina múltiples capas de ruido con diferentes escalas y umbrales
 * POR QUÉ: Simula la complejidad visual de un ecosistema marino real
 */
export function generateMarineTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);

    // Parámetros para diferentes tipos de elementos marinos
    const coralThreshold = 0.85;  // Umbral para aparición de corales
    const rockThreshold = 0.75;   // Umbral para aparición de rocas
    const coralScale = 0.08;      // Escala de ruido para corales
    const rockScale = 0.12;       // Escala de ruido para rocas

    // Desplazamientos aleatorios para variación
    const offsetX = Math.random() * 100;
    const offsetY = Math.random() * 100;

    // Genera la textura píxel por píxel
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let idx = (y * size + x) * 4; // Índice del píxel en el array

            // Calcula diferentes capas de ruido para variedad
            let nx = x * coralScale + offsetX;
            let ny = y * coralScale + offsetY;

            // Ruido principal para corales (funciones trigonométricas para suavidad)
            let noise = Math.abs(Math.sin(nx) * Math.cos(ny)) + Math.random() * 0.3;

            // Ruido para rocas con escala diferente
            let rockNoise = Math.abs(Math.sin(x * rockScale) * Math.cos(y * rockScale));

            // Detalles adicionales para más complejidad
            let detail = Math.abs(Math.sin(x * 0.3 + y * 0.2) * Math.cos(x * 0.13 - y * 0.17));
            let detail2 = Math.abs(Math.sin(x * 0.15 + y * 0.18) * Math.cos(x * 0.21 - y * 0.09));

            // Decide qué tipo de elemento crear según los umbrales
            if (noise > coralThreshold) {
                // Zona de corales con variaciones de color
                if (detail > 0.6) {
                    // Corales rosados/rojos
                    imgData.data[idx] = 255;
                    imgData.data[idx + 1] = 120 + Math.floor(Math.random() * 60);
                    imgData.data[idx + 2] = 150 + Math.floor(Math.random() * 40);
                } else {
                    // Corales azules/púrpuras
                    imgData.data[idx] = 180 + Math.floor(Math.random() * 40);
                    imgData.data[idx + 1] = 100 + Math.floor(Math.random() * 50);
                    imgData.data[idx + 2] = 255;
                }
            } else if (rockNoise > rockThreshold) {
                // Zona de rocas con tonos oscuros
                if (detail2 > 0.7) {
                    // Rocas muy oscuras
                    const val = Math.floor(Math.random() * 40 + 20);
                    imgData.data[idx] = val;
                    imgData.data[idx + 1] = val + 10;
                    imgData.data[idx + 2] = val + 30;
                } else {
                    // Rocas azul-gris
                    imgData.data[idx] = 60 + Math.floor(Math.random() * 30);
                    imgData.data[idx + 1] = 120 + Math.floor(Math.random() * 40);
                    imgData.data[idx + 2] = 180 + Math.floor(Math.random() * 40);
                }
            } else {
                // Zona de arena con variaciones
                if (detail > 0.5) {
                    // Arena clara
                    const val = Math.floor(Math.random() * 60 + 180);
                    imgData.data[idx] = val;
                    imgData.data[idx + 1] = val - 20;
                    imgData.data[idx + 2] = val + 20;
                } else {
                    // Arena normal
                    const val = Math.floor(Math.random() * 40 + 140);
                    imgData.data[idx] = val;
                    imgData.data[idx + 1] = val + 30;
                    imgData.data[idx + 2] = val + 60;
                }
            }

            // Opacidad completa para todos los píxeles
            imgData.data[idx + 3] = 255;
        }
    }

    // Aplica la textura generada al canvas
    ctx.putImageData(imgData, 0, 0);

    // Convierte a textura Three.js con repetición
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8); // Repetición más densa para detalles finos

    return texture;
}

/**
 * Genera una textura de pradera verde con detalles orgánicos
 * PROPÓSITO: Crear una superficie que simule hierba y vegetación
 * CÓMO: Combina un fondo verde con círculos semitransparentes para simular textura
 * POR QUÉ: Proporciona contraste visual con las áreas marinas del entorno
 */
export function generateMeadowTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fondo base verde hierba
    ctx.fillStyle = "#6be86b";
    ctx.fillRect(0, 0, size, size);

    // Añade 1200 puntos aleatorios para crear textura orgánica
    for (let i = 0; i < 1200; i++) {
        // Posición aleatoria en el canvas
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 5 + 2; // Radio variable entre 2-7 píxeles

        // Colores verde variados para simular diferentes tipos de hierba
        const g = 180 + Math.floor(Math.random() * 60); // Verde variable
        const b = 80 + Math.floor(Math.random() * 60);  // Azul variable

        // Dibuja círculos semitransparentes
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(60,${g},${b},${Math.random() * 0.18 + 0.13})`;
        ctx.fill();
    }

    // Convierte a textura Three.js
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3); // Repetición moderada para mantener detalles

    return texture;
}
