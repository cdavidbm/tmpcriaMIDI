export class MIDIController {
    constructor(uiController, audioSystem) {
        this.uiController = uiController;
        this.audioSystem = audioSystem;
        this.midiAccess = null;
    }

    async init() {
        if (!navigator.requestMIDIAccess) {
            console.warn('MIDI no soportado en este navegador');
            return;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.setupMIDIInputs();
            console.log('MIDI inicializado correctamente');
        } catch (error) {
            console.warn('No se pudo acceder a MIDI:', error);
        }
    }

    setupMIDIInputs() {
        for (let input of this.midiAccess.inputs.values()) {
            input.onmidimessage = (event) => this.handleMIDIMessage(event);
        }
    }

    handleMIDIMessage(event) {
        const [status, cc, value] = event.data;
        console.log('MIDI recibido:', { status: status.toString(16), cc, value });

        // Control Change messages
        if ((status & 0xF0) === 0xB0) {
            this.handleControlChange(cc, value);
        }

        // Note On messages
        if ((status & 0xF0) === 0x90 && value > 0) {
            this.handleNoteOn(cc, value); // cc es la nota en este caso
        }
    }

    handleControlChange(cc, value) {
        // Morph knobs
        if ([16, 17, 18, 20, 21, 22].includes(cc)) {
            const ccToIdx = { 16: 0, 17: 1, 18: 2, 20: 3, 21: 4, 22: 5 };
            const idx = ccToIdx[cc];
            const normalizedValue = value / 127;

            this.uiController.updateMorphSlider(idx, normalizedValue);
            this.audioSystem.playKnobSound(normalizedValue, 0.03);
        }

        // Color control
        if (cc === 19) {
            const colorValue = Math.round((value / 127) * 360);
            this.uiController.updateColorSlider(colorValue);
        }

        // Size control
        if (cc === 23) {
            const sizeValue = Math.round(50 + (value / 127) * 100);
            this.uiController.updateSizeSlider(sizeValue);
        }
    }

    handleNoteOn(note, velocity) {
        console.log(`Nota MIDI: ${note}`);

        if (note === 3 || note === 6) {
            window.aprobarCriatura();
        }

        if (note === 1) {
            window.girarFiguraY();
            this.audioSystem.playButtonSound();
        }

        if (note === 4) {
            this.uiController.toggleWireframe();
        }
    }
}
