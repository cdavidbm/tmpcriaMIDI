// Inicializar Hydra
const hydra = new Hydra({
    canvas: document.getElementById('hydra-canvas'),
    detectAudio: false
});

// Animación de Hydra para el fondo
osc(10, 0.1, 0.8)
    .color(0.2, 0.1, 0.8)
    .rotate(0.1, 0.1)
    .mult(osc(20, 0.1).rotate(0, -0.1))
    .blend(noise(4).color(0.1, 0.2, 0.3), 0.6)
    .modulateScale(osc(8).rotate(0.05), 0.2)
    .out();