import * as THREE from 'three';

/**
 * Utilidades para generar texturas procedurales
 * Crea texturas usando Canvas 2D API para mejorar el aspecto visual del modelo
 */
export class TextureUtils {
    /**
     * Genera una textura de gradiente lineal
     * Útil para fondos o efectos de iluminación ambiental
     * @returns {HTMLCanvasElement} Canvas con gradiente aplicado
     */
    static generateGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Crear gradiente vertical de azul oscuro a azul claro
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#23243a'); // Azul oscuro en la parte superior
        grad.addColorStop(1, '#7ecfff'); // Azul claro en la parte inferior

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        return canvas;
    }

    /**
     * Genera una textura de ruido procedural
     * Añade detalle superficial al modelo para un aspecto más realista
     * @returns {THREE.CanvasTexture} Textura Three.js con ruido aplicado
     */
    static generateNoiseTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);

        // Generar ruido aleatorio píxel por píxel
        for (let i = 0; i < size * size * 4; i += 4) {
            // Generar valor aleatorio en rango alto (128-255) para ruido sutil
            const val = Math.floor(Math.random() * 128 + 128);
            imgData.data[i] = val;     // Red
            imgData.data[i + 1] = val; // Green
            imgData.data[i + 2] = val; // Blue
            imgData.data[i + 3] = 255; // Alpha (opaco)
        }

        ctx.putImageData(imgData, 0, 0);

        // Convertir canvas a textura Three.js
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Repetir textura
        texture.repeat.set(4, 4); // Repetir 4x4 veces para mayor detalle
        return texture;
    }
}
