import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Variables globales para los componentes principales de Three.js
export let scene, camera, renderer, controls;

/**
 * Inicializa la escena 3D completa con todos sus componentes
 * PROPÓSITO: Configurar el entorno de renderizado 3D base
 * CÓMO: Crea y configura escena, cámara, renderer, controles e iluminación
 * POR QUÉ: Establece la infraestructura necesaria para visualizar el ecosistema
 */
export function initScene() {
    // === CREACIÓN DE LA ESCENA ===
    // La escena es el contenedor principal de todos los objetos 3D
    scene = new THREE.Scene();

    // === CONFIGURACIÓN DE LA CÁMARA ===
    // Cámara perspectiva para visión realista en 3D
    camera = new THREE.PerspectiveCamera(
        75,                                    // Campo de visión (FOV) en grados
        window.innerWidth / window.innerHeight, // Relación de aspecto
        0.1,                                   // Plano cercano de recorte
        1000                                   // Plano lejano de recorte
    );

    // Posición inicial de la cámara (x, y, z)
    // Posicionada arriba y atrás para vista general del ecosistema
    camera.position.set(0, 5, 10);

    // === CONFIGURACIÓN DEL RENDERER ===
    // WebGLRenderer para renderizado acelerado por hardware
    renderer = new THREE.WebGLRenderer({
        antialias: true, // Suavizado de bordes para mejor calidad visual
        alpha: true      // Permite transparencia del fondo
    });

    // Fondo completamente transparente para integración con HTML
    renderer.setClearColor(0x000000, 0);

    // Ajusta el tamaño al viewport del navegador
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Habilita el sistema de sombras para realismo
    renderer.shadowMap.enabled = true;

    // Añade el canvas del renderer al documento HTML
    document.body.appendChild(renderer.domElement);

    // === CONFIGURACIÓN DE CONTROLES ===
    // OrbitControls permite rotar, hacer zoom y pan con el mouse
    controls = new OrbitControls(camera, renderer.domElement);

    // Los controles se actualizan automáticamente en el bucle de animación
    // Permite al usuario explorar el ecosistema desde diferentes ángulos

    // === CONFIGURACIÓN DE ILUMINACIÓN ===

    // Luz ambiental: iluminación uniforme y suave
    // PROPÓSITO: Evitar que las zonas no iluminadas directamente estén completamente negras
    const ambientLight = new THREE.AmbientLight(
        0x404040  // Color gris medio para iluminación suave
    );
    scene.add(ambientLight);

    // Luz direccional: simula luz solar
    // PROPÓSITO: Crear sombras y dar volumen a los objetos
    const directionalLight = new THREE.DirectionalLight(
        0xffffff, // Color blanco puro
        1         // Intensidad completa
    );

    // Posiciona la luz como si fuera el sol
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // NOTA: Se podría añadir configuración de sombras aquí:
    // directionalLight.castShadow = true;
    // directionalLight.shadow.mapSize.width = 2048;
    // directionalLight.shadow.mapSize.height = 2048;
}

/**
 * Maneja el redimensionamiento de la ventana del navegador
 * PROPÓSITO: Mantener la proporción correcta cuando cambia el tamaño de ventana
 * CÓMO: Actualiza la cámara y renderer con las nuevas dimensiones
 * POR QUÉ: Evita deformación de la imagen y mantiene la experiencia visual
 */
export function handleResize() {
    // Actualiza la relación de aspecto de la cámara
    camera.aspect = window.innerWidth / window.innerHeight;

    // Aplica los cambios a la matriz de proyección
    camera.updateProjectionMatrix();

    // Redimensiona el renderer para ocupar toda la ventana
    renderer.setSize(window.innerWidth, window.innerHeight);

    // NOTA: Los controles se adaptan automáticamente al nuevo tamaño
}
