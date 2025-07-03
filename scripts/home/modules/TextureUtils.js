import * as THREE from 'three';

export class TextureUtils {
    static generateGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#23243a');
        grad.addColorStop(1, '#7ecfff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        return canvas;
    }

    static generateNoiseTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);

        for (let i = 0; i < size * size * 4; i += 4) {
            const val = Math.floor(Math.random() * 128 + 128);
            imgData.data[i] = val;
            imgData.data[i + 1] = val;
            imgData.data[i + 2] = val;
            imgData.data[i + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        return texture;
    }
}
