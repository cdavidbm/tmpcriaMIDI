export class CreatureManager {
    constructor(sceneManager, audioSystem) {
        this.sceneManager = sceneManager;
        this.audioSystem = audioSystem;
        this.channel = new BroadcastChannel('criaturas');
        this.isRotating = false;
    }

    aprobarCriatura() {
        const mainMesh = this.sceneManager.mesh;
        if (!mainMesh) return;

        // Capturar estado actual
        const criaturaEstado = {};
        if (mainMesh.morphTargetDictionary && mainMesh.morphTargetInfluences) {
            Object.entries(mainMesh.morphTargetDictionary).forEach(([name, index]) => {
                criaturaEstado[name] = mainMesh.morphTargetInfluences[index];
            });
        }

        const nuevaCriatura = {
            id: Date.now(),
            morphTargets: criaturaEstado,
            position: {
                x: (Math.random() - 0.5) * 20,
                y: 0,
                z: (Math.random() - 0.5) * 20
            },
            color: parseInt(document.getElementById('color').value),
            scale: parseInt(document.getElementById('size').value) / 100,
            timestamp: new Date().toISOString()
        };

        // Guardar en localStorage
        const criaturas = JSON.parse(localStorage.getItem('criaturas') || '[]');
        criaturas.push(nuevaCriatura);
        localStorage.setItem('criaturas', JSON.stringify(criaturas));

        // Enviar mensaje
        this.channel.postMessage({
            type: 'nueva_criatura',
            data: nuevaCriatura
        });

        this.audioSystem.playActionSound();

        // Reset después de aprobar
        if (window.resetAll) {
            window.resetAll();
        }
    }

    girarFiguraY(velocidad = 0.02, duracion = 2000) {
        const mainModel = this.sceneManager.model;
        if (!mainModel || this.isRotating) return;

        this.isRotating = true;
        const tiempoInicio = performance.now();

        const rotarY = (now) => {
            if (!this.isRotating || !mainModel) return;

            const elapsed = now - tiempoInicio;
            if (elapsed < duracion) {
                mainModel.rotation.y += velocidad;
                requestAnimationFrame(rotarY);
            } else {
                this.isRotating = false;
            }
        };

        requestAnimationFrame(rotarY);
    }

    detenerGiroFiguraY() {
        this.isRotating = false;
    }
}
