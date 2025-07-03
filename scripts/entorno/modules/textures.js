import * as THREE from 'three';

export function generateNoiseTexture() {
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

export function generateMarineTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);

    const coralThreshold = 0.85;
    const rockThreshold = 0.75;
    const coralScale = 0.08;
    const rockScale = 0.12;
    const offsetX = Math.random() * 100;
    const offsetY = Math.random() * 100;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let idx = (y * size + x) * 4;
            let nx = x * coralScale + offsetX;
            let ny = y * coralScale + offsetY;
            let noise = Math.abs(Math.sin(nx) * Math.cos(ny)) + Math.random() * 0.3;
            let rockNoise = Math.abs(Math.sin(x * rockScale) * Math.cos(y * rockScale));
            let detail = Math.abs(Math.sin(x * 0.3 + y * 0.2) * Math.cos(x * 0.13 - y * 0.17));
            let detail2 = Math.abs(Math.sin(x * 0.15 + y * 0.18) * Math.cos(x * 0.21 - y * 0.09));

            if (noise > coralThreshold) {
                if (detail > 0.6) {
                    imgData.data[idx] = 255;
                    imgData.data[idx + 1] = 120 + Math.floor(Math.random() * 60);
                    imgData.data[idx + 2] = 150 + Math.floor(Math.random() * 40);
                } else {
                    imgData.data[idx] = 180 + Math.floor(Math.random() * 40);
                    imgData.data[idx + 1] = 100 + Math.floor(Math.random() * 50);
                    imgData.data[idx + 2] = 255;
                }
            } else if (rockNoise > rockThreshold) {
                if (detail2 > 0.7) {
                    const val = Math.floor(Math.random() * 40 + 20);
                    imgData.data[idx] = val;
                    imgData.data[idx + 1] = val + 10;
                    imgData.data[idx + 2] = val + 30;
                } else {
                    imgData.data[idx] = 60 + Math.floor(Math.random() * 30);
                    imgData.data[idx + 1] = 120 + Math.floor(Math.random() * 40);
                    imgData.data[idx + 2] = 180 + Math.floor(Math.random() * 40);
                }
            } else {
                if (detail > 0.5) {
                    const val = Math.floor(Math.random() * 60 + 180);
                    imgData.data[idx] = val;
                    imgData.data[idx + 1] = val - 20;
                    imgData.data[idx + 2] = val + 20;
                } else {
                    const val = Math.floor(Math.random() * 40 + 140);
                    imgData.data[idx] = val;
                    imgData.data[idx + 1] = val + 30;
                    imgData.data[idx + 2] = val + 60;
                }
            }
            imgData.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

export function generateMeadowTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "#6be86b";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 5 + 2;
        const g = 180 + Math.floor(Math.random() * 60);
        const b = 80 + Math.floor(Math.random() * 60);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(60,${g},${b},${Math.random() * 0.18 + 0.13})`;
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
}
