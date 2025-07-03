/**
 * Sistema de audio para feedback sonoro de la interfaz
 * Genera sonidos procedurales usando Web Audio API para mejorar la experiencia del usuario
 */
export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.masterVolume = 0.3; // Volumen maestro para controlar la intensidad global
        this.init();
    }

    /**
     * Inicializa el contexto de audio
     * Usa Web Audio API que es compatible con navegadores modernos
     */
    init() {
        try {
            // Crear contexto de audio con compatibilidad para navegadores legacy
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no soportada');
            this.enabled = false; // Deshabilitar si no hay soporte
        }
    }

    /**
     * Reproduce sonido para controles knob/slider
     * La frecuencia cambia según el valor para dar feedback del estado
     * @param {number} value - Valor normalizado (0-1) que afecta la frecuencia
     * @param {number} duration - Duración del sonido en segundos
     */
    playKnobSound(value = 0.5, duration = 0.05) {
        if (!this.enabled || !this.audioContext) return;

        // Crear nodos de audio para síntesis
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Mapear valor a frecuencia (200-800 Hz) para feedback tonal
        const frequency = 200 + (value * 600);
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine'; // Onda suave para sonido agradable

        // Filtro pasa-bajos para suavizar el sonido
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);

        // Envelope ADSR para evitar clicks y hacer sonido más musical
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        // Conectar nodos en cadena de procesamiento
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Reproducir sonido
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Sonido para botones - tono descendente que simula "click" profundo
     * Usado para acciones como wireframe, animación, etc.
     */
    playButtonSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioSystem.createBiquadFilter();

        // Frecuencia descendente para simular "click" de botón
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        oscillator.type = 'square'; // Onda cuadrada para sonido más percusivo

        // Filtro para suavizar la onda cuadrada
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);

        // Envelope rápido para simular click
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Sonido para acciones importantes como aprobar criatura
     * Acorde ascendente que da sensación de éxito/completitud
     */
    playActionSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Dos osciladores en armonía para crear acorde ascendente
        oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime); // La4
        oscillator1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2); // La5
        oscillator1.type = 'sine';

        oscillator2.frequency.setValueAtTime(660, this.audioContext.currentTime); // Mi5
        oscillator2.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.2); // Mi6
        oscillator2.type = 'sine';

        // Envelope más largo para sonido de celebración
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Sonido específico para toggle de wireframe
     * Frecuencia descendente con onda diente de sierra para efecto "tech"
     */
    playWireframeSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Frecuencia descendente con onda diente de sierra para efecto "digital"
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.15);
        oscillator.type = 'sawtooth'; // Onda con armónicos para sonido "digital"

        // Envelope medio para transition suave
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * Alterna el estado de habilitación del audio
     * Útil para usuarios que prefieren trabajar en silencio
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log('Sonidos:', this.enabled ? 'activados' : 'desactivados');
    }

    /**
     * Establece el estado de habilitación del audio
     * @param {boolean} enabled - Si el audio debe estar habilitado
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Controla el volumen maestro del sistema
     * @param {number} volume - Volumen entre 0 y 1
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume)); // Clamp entre 0-1
    }
}
