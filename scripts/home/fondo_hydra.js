const hydra = new Hydra({
	canvas: document.getElementById("hydra-canvas"),
	detectAudio: false,
});

// Fondo base: aguamarina suave con textura líquida
solid(0.016, 0.6, 0.8, 1.493)
	.add(noise(3.5, 0.2)
		.color(0.028, 0.6, 0.396)
		.brightness(0.039)
		.contrast(1.649), 0.6)
	.add(osc(12, 0.03, 0.5)
		.modulate(noise(2, 0.582)
			.scale(1.5), 0.2)
		.color(0.566, 0.85, 0.676)
		.brightness(0.05)
		.luma(0.4, 0.2)
		.contrast(0.862), 0.428)
	.add(osc(40, 0.013, 0.5)
		.rotate(() => 0.1 + 0.02 * Math.sin(time * 0.484))
		.modulate(noise(0.716, 0.007)
			.scale(1.2), 0.2)
		.color(0.8, 0.027, 1.0)
		.luma(0.4, 0.2)
		.brightness(0.15), 0.005)
	.add(osc(10, 0.04, 0.6)
		.modulate(noise(1.794, 0.144), 0.1)
		.color(0.2, 0.7, 0.423)
		.brightness(0.05), 0.036)
	.saturate(1.3)
	.modulate(noise(0.4, 0.2)
		.rotate(0.143), 0.125)
	.scale(() => 1 + 0.01 * Math.sin(time * 0.3))
	.out();