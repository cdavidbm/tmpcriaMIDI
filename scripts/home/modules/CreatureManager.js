/**
 * Gestor de criaturas
 * Maneja la creación, guardado y comunicación de criaturas generadas
 * Permite guardar configuraciones del modelo como "criaturas" individuales
 */
export class CreatureManager {
    constructor(sceneManager, audioSystem) {
        this.sceneManager = sceneManager;
        this.audioSystem = audioSystem;

        // Canal de comunicación entre pestañas/ventanas del navegador
        this.channel = new BroadcastChannel('criaturas');
        this.isRotating = false; // Estado de rotación automática
    }

    /**
     * Aprueba y guarda la criatura actual
     * Captura el estado actual del modelo y lo guarda como nueva criatura
     */
    aprobarCriatura() {
        const mainMesh = this.sceneManager.mesh;
        if (!mainMesh) return;

        // Capturar estado de todos los morph targets
        const criaturaEstado = {};
        if (mainMesh.morphTargetDictionary && mainMesh.morphTargetInfluences) {
            Object.entries(mainMesh.morphTargetDictionary).forEach(([name, index]) => {
                criaturaEstado[name] = mainMesh.morphTargetInfluences[index];
            });
        }

        // Crear objeto criatura con todos los parámetros
        const nuevaCriatura = {
            id: Date.now(), // ID único basado en timestamp
            morphTargets: criaturaEstado,
            position: {
                // Posición aleatoria para visualización en galería
                x: (Math.random() - 0.5) * 20,
                y: 0,
                z: (Math.random() - 0.5) * 20
            },
            color: parseInt(document.getElementById('color').value),
            scale: parseInt(document.getElementById('size').value) / 100,
            timestamp: new Date().toISOString()
        };

        // Guardar en localStorage para persistencia
        const criaturas = JSON.parse(localStorage.getItem('criaturas') || '[]');
        criaturas.push(nuevaCriatura);
        localStorage.setItem('criaturas', JSON.stringify(criaturas));

        // Enviar mensaje a otras pestañas/ventanas
        this.channel.postMessage({
            type: 'nueva_criatura',
            data: nuevaCriatura
        });

        // Feedback sonoro de éxito
        this.audioSystem.playActionSound();

        // Limpiar editor para nueva criatura
        if (window.resetAll) {
            window.resetAll();
        }
    }

    /**
     * Inicia rotación automática del modelo
     * Útil para ver el modelo desde diferentes ángulos
     * @param {number} velocidad - Velocidad de rotación en radianes por frame
     * @param {number} duracion - Duración de la rotación en milisegundos
     */
    girarFiguraY(velocidad = 0.02, duracion = 2000) {
        const mainModel = this.sceneManager.model;
        if (!mainModel || this.isRotating) return;

        this.isRotating = true;
        const tiempoInicio = performance.now();

        // Función recursiva para animación suave
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

    /**
     * Detiene la rotación automática
     * Permite al usuario detener la rotación manualmente
     */
    detenerGiroFiguraY() {
        this.isRotating = false;
    }
}
