// =========================
// === CONFIGURACIÓN GLOBAL
// =========================

// Importaciones
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// === Variables y constantes principales ===
// (Modifica aquí los parámetros globales del entorno)
let scene, camera, renderer, controls;
const criaturas = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCriatura = null;
let selectedCriatura = null;
let dragging = false;
let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
let dragPoint = new THREE.Vector3();

// Parámetros de criaturas y colisiones
const RADIO_COLISION = 2;
const DURACION_COLISION = 500;
const FUERZA_REBOTE = 0.1;
const MAX_COLISIONES = 3;

// Parámetros de partículas rojas
const PARTICLES_COUNT = 60; // Número base de partículas (se multiplica en createParticles)
const PARTICLE_SIZE = 0.2;
const PARTICLE_SPAWN_INTERVAL = 5000; // ms
let particles = [];
let lastParticleSpawn = 0;

// Parámetros de vida de criaturas
const VIDA_INICIAL = 100;
const VIDA_DEGRADACION = 0.05;
const VIDA_WIREFRAME = 50;
const PARTICULAS_PARA_VIDA = 1;
const VIDA_RECUPERADA = 5;

// Otros parámetros
const DEFAULT_COLOR = 0;
const DEFAULT_SCALE = 1;

// Comunicación entre ventanas
const channel = new BroadcastChannel('criaturas');

// =========================
// === LIMPIAR localStorage
// =========================


function initSession() {
    const currentSession = Date.now().toString();
    const lastSession = localStorage.getItem('sessionId');

    if (lastSession !== currentSession) {
        console.log('Nueva sesión detectada, limpiando localStorage...');
        localStorage.clear();
        localStorage.setItem('sessionId', currentSession);
    }
}



// =========================
// === INICIALIZACIÓN
// =========================
function init() {
    initSession();

    // Fondo procedural de espacio con estrellas, planetas y galaxias
    function generateSpaceBackground() {
        const w = 2048, h = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Fondo gradiente oscuro
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#0a0c1a");
        grad.addColorStop(0.5, "#1a2340");
        grad.addColorStop(1, "#0a0c1a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Estrellas pequeñas
        for (let i = 0; i < 1200; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * 0.7 + 0.2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255,255,${200 + Math.floor(Math.random() * 55)},${Math.random() * 0.7 + 0.3})`;
            ctx.fill();
        }

        // Estrellas grandes y brillantes
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * 2.5 + 1.2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.5})`;
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 12 + Math.random() * 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Galaxias (manchas difusas de color)
        for (let i = 0; i < 3; i++) {
            const gx = Math.random() * w * 0.8 + w * 0.1;
            const gy = Math.random() * h * 0.7 + h * 0.15;
            const gr = Math.random() * 120 + 80;
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
            grad.addColorStop(0, `rgba(${180 + Math.random() * 60},${120 + Math.random() * 80},255,0.25)`);
            grad.addColorStop(0.3, `rgba(180,180,255,0.10)`);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.beginPath();
            ctx.arc(gx, gy, gr, 0, 2 * Math.PI);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        // Planetas (círculos grandes con color)
        for (let i = 0; i < 2; i++) {
            const px = Math.random() * w * 0.7 + w * 0.15;
            const py = Math.random() * h * 0.5 + h * 0.2;
            const pr = Math.random() * 60 + 40;
            const color = i === 0
                ? "rgba(120,180,255,0.25)"
                : "rgba(255,200,120,0.18)";
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        return new THREE.CanvasTexture(canvas);
    }

    scene = new THREE.Scene();
    // Asignar fondo procedural de espacio
    scene.background = generateSpaceBackground();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Suelo
    // Generar textura procedural de tierra y agua con varios tipos y texturas
    function generateGroundWaterTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);

        // Parámetros para controlar la cantidad y forma de agua
        const waterThreshold = 0.89; // Más alto = menos agua
        const waterScale = 0.09;
        const waterOffsetX = Math.random() * 100;
        const waterOffsetY = Math.random() * 100;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let idx = (y * size + x) * 4;
                // Ruido base para manchas irregulares
                let nx = x * waterScale + waterOffsetX;
                let ny = y * waterScale + waterOffsetY;
                let noise = Math.abs(Math.sin(nx) * Math.cos(ny)) + Math.random() * 0.25;

                // Sub-ruido para variedad de texturas
                let detail = Math.abs(Math.sin(x * 0.3 + y * 0.2) * Math.cos(x * 0.13 - y * 0.17));
                let detail2 = Math.abs(Math.sin(x * 0.12 + y * 0.18) * Math.cos(x * 0.21 - y * 0.09));

                if (noise > waterThreshold) {
                    // Agua
                    if (detail > 0.7) {
                        // Agua clara y ligera
                        imgData.data[idx] = 120 + Math.floor(Math.random() * 30); // R
                        imgData.data[idx + 1] = 180 + Math.floor(Math.random() * 40); // G
                        imgData.data[idx + 2] = 240 + Math.floor(Math.random() * 15); // B
                    } else {
                        // Agua normal
                        imgData.data[idx] = 40 + Math.floor(Math.random() * 30);   // R
                        imgData.data[idx + 1] = 90 + Math.floor(Math.random() * 40); // G
                        imgData.data[idx + 2] = 180 + Math.floor(Math.random() * 60); // B
                    }
                } else {
                    // Tierra
                    if (detail > 0.7) {
                        // Tierra oscura y densa
                        const val = Math.floor(Math.random() * 30 + 30);
                        imgData.data[idx] = val + Math.floor(Math.random() * 15);     // R
                        imgData.data[idx + 1] = val + Math.floor(Math.random() * 10); // G
                        imgData.data[idx + 2] = val - Math.floor(Math.random() * 10); // B
                    } else if (detail2 > 0.6) {
                        // Tierra rojiza
                        const val = Math.floor(Math.random() * 40 + 60);
                        imgData.data[idx] = val + 40 + Math.floor(Math.random() * 20); // R
                        imgData.data[idx + 1] = val;                                   // G
                        imgData.data[idx + 2] = val - 10;                              // B
                    } else {
                        // Tierra normal
                        const val = Math.floor(Math.random() * 60 + 60);
                        imgData.data[idx] = val + Math.floor(Math.random() * 30);     // R
                        imgData.data[idx + 1] = val + Math.floor(Math.random() * 15); // G
                        imgData.data[idx + 2] = val;                                  // B
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

    // Generar geometría circular con elevaciones, hundimientos y bordes irregulares tipo isla
    function generateElevatedCircleGeometry(radius, segments, elevCount = 6, elevAmount = 1.2, sinkAmount = -1.2) {
        // Usar CircleGeometry para base circular
        const geometry = new THREE.CircleGeometry(radius, segments);
        // Convertir a BufferGeometry si no lo es
        geometry.computeVertexNormals();
        const positions = geometry.attributes.position;
        const totalVerts = positions.count;

        // Elegir índices únicos para elevaciones y hundimientos
        let elevIndices = [];
        let sinkIndices = [];
        while (elevIndices.length < elevCount) {
            let idx = Math.floor(Math.random() * totalVerts);
            if (!elevIndices.includes(idx)) elevIndices.push(idx);
        }
        while (sinkIndices.length < Math.max(1, Math.floor(elevCount / 2))) {
            let idx = Math.floor(Math.random() * totalVerts);
            if (!elevIndices.includes(idx) && !sinkIndices.includes(idx)) sinkIndices.push(idx);
        }

        // Centro del círculo
        const cx = 0, cz = 0;
        const maxR = radius;

        for (let i = 0; i < totalVerts; i++) {
            let x = positions.getX(i);
            let y = positions.getY(i);
            let z = positions.getZ(i);

            // Elevaciones y hundimientos suaves
            let elev = 0;
            elevIndices.forEach(eidx => {
                let ex = positions.getX(eidx);
                let ez = positions.getZ(eidx);
                let dist = Math.sqrt((x - ex) ** 2 + (z - ez) ** 2);
                elev += elevAmount * Math.exp(-dist * 0.5);
            });
            sinkIndices.forEach(sidx => {
                let sx = positions.getX(sidx);
                let sz = positions.getZ(sidx);
                let dist = Math.sqrt((x - sx) ** 2 + (z - sz) ** 2);
                elev += sinkAmount * Math.exp(-dist * 0.7);
            });

            // Bordes irregulares tipo isla (solo para los vértices cercanos al borde)
            let r = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
            let theta = Math.atan2(z - cz, x - cx);
            if (r > maxR * 0.82) {
                let edgeNoise = Math.sin(theta * 3 + Math.cos(theta * 5)) * 0.7
                    + Math.sin(theta * 7 + r * 0.5) * 0.4
                    + Math.random() * 0.5;
                let edgeCut = (r - maxR * (0.82 + 0.13 * edgeNoise));
                if (edgeCut > 0) {
                    elev -= edgeCut * 8 * (0.7 + Math.random() * 0.6);
                }
            }

            positions.setZ(i, z + elev); // CircleGeometry: y es plano, z es profundidad
        }
        geometry.computeVertexNormals();
        return geometry;
    }

    const groundWaterTexture = generateGroundWaterTexture();
    const planeGeometry = generateElevatedCircleGeometry(40, 192); // Radio aumentado a 40, más segmentos para suavidad
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: groundWaterTexture,
        bumpMap: groundWaterTexture,
        bumpScale: 0.7,
        roughness: 0.8,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7 // Sutil transparencia
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Añadir un wireframe sutil sobre el plano
    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(planeGeometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true })
    );
    wireframe.rotation.x = -Math.PI / 2;
    scene.add(wireframe);

    // Añadir después de crear el plano
    createParticles();

    // === RÍO ALIENÍGENA ===
    function createAlienRiver() {
        // Parámetros del río
        const riverWidth = 2.8 + Math.random() * 1.2;
        const riverLength = 60;
        const riverSegments = 120;
        const riverPoints = [];
        const riverY = 0.3; // Un poco sobre el plano

        // Generar puntos de una curva muy irregular y aleatoria
        let angle = Math.random() * Math.PI * 2;
        let r = 18 + Math.random() * 6;
        for (let i = 0; i < riverSegments; i++) {
            const t = i / (riverSegments - 1);

            // Variación aleatoria de ángulo y radio para mayor irregularidad
            angle += (Math.random() - 0.5) * 0.25 + Math.sin(t * 4 + Math.random()) * 0.07;
            r += (Math.random() - 0.5) * 0.7 + Math.sin(t * 3 + Math.random()) * 0.5;

            // Limitar el radio para que no salga del plano
            r = Math.max(10, Math.min(36, r));

            // Trayectoria con oscilaciones y "meandros"
            const x = Math.cos(angle) * r + Math.sin(t * 2 + Math.random()) * 2.5 + Math.sin(i * 0.18 + Math.random()) * 1.2;
            const z = Math.sin(angle) * r + Math.cos(t * 2.5 + Math.random()) * 2.5 + Math.cos(i * 0.13 + Math.random()) * 1.2;

            riverPoints.push(new THREE.Vector3(x, 0, z));
        }

        // Crear geometría del río como un "ribbon" a lo largo de la curva
        const riverGeom = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const uvs = [];
        for (let i = 0; i < riverPoints.length; i++) {
            const p = riverPoints[i];
            // Calcular dirección perpendicular al río en XZ
            let dir;
            if (i < riverPoints.length - 1) {
                dir = new THREE.Vector3().subVectors(riverPoints[i + 1], p);
            } else {
                dir = new THREE.Vector3().subVectors(p, riverPoints[i - 1]);
            }
            dir.y = 0;
            dir.normalize();
            const perp = new THREE.Vector3(-dir.z, 0, dir.x);

            // Dos vértices por segmento (a cada lado del centro)
            const left = new THREE.Vector3().addVectors(p, perp.clone().multiplyScalar(riverWidth));
            const right = new THREE.Vector3().addVectors(p, perp.clone().multiplyScalar(-riverWidth));
            left.y = right.y = riverY;

            positions.push(left.x, left.y, left.z);
            positions.push(right.x, right.y, right.z);

            // Normales hacia arriba
            normals.push(0, 1, 0, 0, 1, 0);

            // UVs para textura
            uvs.push(0, i / (riverPoints.length - 1));
            uvs.push(1, i / (riverPoints.length - 1));
        }

        // Índices para triángulos
        const indices = [];
        for (let i = 0; i < riverPoints.length - 1; i++) {
            const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
            indices.push(a, b, c);
            indices.push(b, d, c);
        }

        riverGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        riverGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        riverGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        riverGeom.setIndex(indices);
        riverGeom.computeVertexNormals();

        // Textura procedural de agua alienígena
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Fondo azul claro con ondas
        ctx.fillStyle = "#b6eaff";
        ctx.fillRect(0, 0, size, size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v = Math.floor(180 + 40 * Math.sin(x * 0.15 + Math.cos(y * 0.13) * 2));
                ctx.fillStyle = `rgba(${v},${v + 30},255,0.18)`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        // Añadir reflejos y brillos
        for (let i = 0; i < 80; i++) {
            const rx = Math.random() * size;
            const ry = Math.random() * size;
            const rr = Math.random() * 8 + 3;
            const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
            grad.addColorStop(0, "rgba(255,255,255,0.18)");
            grad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.beginPath();
            ctx.arc(rx, ry, rr, 0, 2 * Math.PI);
            ctx.fillStyle = grad;
            ctx.fill();
        }
        const riverTexture = new THREE.CanvasTexture(canvas);
        riverTexture.wrapS = riverTexture.wrapT = THREE.RepeatWrapping;
        riverTexture.repeat.set(8, 2);

        const riverMat = new THREE.MeshStandardMaterial({
            color: 0x88eaff,
            map: riverTexture,
            transparent: true,
            opacity: 0.82,
            roughness: 0.18,
            metalness: 0.7,
            emissive: 0x66ccff,
            emissiveIntensity: 0.18,
            side: THREE.DoubleSide
        });

        const riverMesh = new THREE.Mesh(riverGeom, riverMat);
        riverMesh.receiveShadow = true;
        riverMesh.castShadow = false;
        riverMesh.position.y = 0; // Ya está a la altura adecuada
        scene.add(riverMesh);
    }
    createAlienRiver();

    // === PLANTAS ALIENÍGENAS ===
    function createAlienPlants() {
        const plantCount = 7;
        for (let i = 0; i < plantCount; i++) {
            // Posición aleatoria dentro del radio del plano, pero no en el centro
            const r = 8 + Math.random() * 24;
            const theta = Math.random() * Math.PI * 2;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            const y = 0.7; // Un poco sobre el plano

            // Tronco: cilindro suave y curvado
            const trunkHeight = 2.2 + Math.random() * 1.5;
            const trunkCurve = 0.3 + Math.random() * 0.5;
            const trunkGeom = new THREE.CylinderGeometry(0.18, 0.28, trunkHeight, 12, 32, false);
            trunkGeom.translate(0, trunkHeight / 2, 0);
            // Curvar el tronco
            for (let v = 0; v < trunkGeom.attributes.position.count; v++) {
                let px = trunkGeom.attributes.position.getX(v);
                let py = trunkGeom.attributes.position.getY(v);
                let pz = trunkGeom.attributes.position.getZ(v);
                trunkGeom.attributes.position.setX(v, px + Math.sin(py * 1.2) * trunkCurve);
                trunkGeom.attributes.position.setZ(v, pz + Math.cos(py * 0.8) * trunkCurve * 0.7);
            }
            trunkGeom.computeVertexNormals();
            const trunkMat = new THREE.MeshStandardMaterial({
                color: 0x7c4f2c,
                roughness: 0.7,
                metalness: 0.2
            });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.set(x, y, z);

            // Ramas: varias, curvas y finas
            const branchCount = 2 + Math.floor(Math.random() * 3);
            for (let b = 0; b < branchCount; b++) {
                const branchLen = 1.2 + Math.random() * 1.2;
                const branchGeom = new THREE.CylinderGeometry(0.05, 0.09, branchLen, 8, 16, false);
                branchGeom.translate(0, branchLen / 2, 0);
                // Curvar la rama
                for (let v = 0; v < branchGeom.attributes.position.count; v++) {
                    let px = branchGeom.attributes.position.getX(v);
                    let py = branchGeom.attributes.position.getY(v);
                    let pz = branchGeom.attributes.position.getZ(v);
                    branchGeom.attributes.position.setX(v, px + Math.sin(py * 1.5 + b) * 0.18);
                    branchGeom.attributes.position.setZ(v, pz + Math.cos(py * 1.1 + b) * 0.13);
                }
                branchGeom.computeVertexNormals();
                const branchMat = new THREE.MeshStandardMaterial({
                    color: 0x6a3d1a,
                    roughness: 0.6,
                    metalness: 0.18
                });
                const branch = new THREE.Mesh(branchGeom, branchMat);
                branch.position.set(0, trunkHeight * (0.5 + 0.2 * b), 0);
                branch.rotation.y = Math.random() * Math.PI * 2;
                branch.rotation.z = Math.PI / 4 + Math.random() * Math.PI / 4;
                trunk.add(branch);

                // Hojas: suavizadas, verdes, alienígenas
                const leafCount = 3 + Math.floor(Math.random() * 4);
                for (let l = 0; l < leafCount; l++) {
                    const leafGeom = new THREE.SphereGeometry(0.25 + Math.random() * 0.18, 12, 12);
                    // Aplastar la esfera para hacerla más como hoja
                    for (let v = 0; v < leafGeom.attributes.position.count; v++) {
                        let py = leafGeom.attributes.position.getY(v);
                        leafGeom.attributes.position.setY(v, py * (0.45 + Math.random() * 0.2));
                    }
                    leafGeom.computeVertexNormals();
                    const leafMat = new THREE.MeshStandardMaterial({
                        color: new THREE.Color().setHSL(0.28 + Math.random() * 0.25, 0.85, 0.45 + Math.random() * 0.2),
                        roughness: 0.35,
                        metalness: 0.25,
                        transparent: true,
                        opacity: 0.85
                    });
                    const leaf = new THREE.Mesh(leafGeom, leafMat);
                    leaf.position.set(
                        0.18 + Math.random() * 0.4,
                        branchLen * (0.7 + Math.random() * 0.3),
                        0.18 + Math.random() * 0.4
                    );
                    leaf.rotation.set(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    );
                    branch.add(leaf);

                    // Flor: esfera pequeña y colorida en la punta de la hoja
                    if (Math.random() > 0.5) {
                        const flowerGeom = new THREE.SphereGeometry(0.09 + Math.random() * 0.06, 8, 8);
                        const flowerMat = new THREE.MeshStandardMaterial({
                            color: new THREE.Color().setHSL(0.7 + Math.random() * 0.3, 0.7, 0.7),
                            emissive: new THREE.Color().setHSL(0.7 + Math.random() * 0.3, 0.7, 0.5),
                            emissiveIntensity: 0.7,
                            roughness: 0.2,
                            metalness: 0.5
                        });
                        const flower = new THREE.Mesh(flowerGeom, flowerMat);
                        flower.position.set(
                            0.05 + Math.random() * 0.1,
                            0.18 + Math.random() * 0.1,
                            0.05 + Math.random() * 0.1
                        );
                        leaf.add(flower);
                    }
                }
            }
            scene.add(trunk);
        }
    }
    createAlienPlants();

    cargarCriaturas();
    animate();

    // Añadir eventos de mouse
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
}

// =========================
// === FUNCIONES DE ESCENA
// =========================

// Añadir después de init()
function createParticles() {
    // Más abundancia de partículas rojas y más brillo
    const PARTICLES_COUNT_LOCAL = Math.floor(PARTICLES_COUNT * 1.5);
    for (let i = 0; i < PARTICLES_COUNT_LOCAL; i++) {
        const geometry = new THREE.SphereGeometry(PARTICLE_SIZE * 1.8, 9, 9);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff2222,
            emissive: 0xff2222,
            emissiveIntensity: 2.2,
            roughness: 0.18,
            metalness: 0.7,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        spawnParticle(particle);
        scene.add(particle);
        particles.push(particle);
    }
}

function spawnParticle(particle) {
    particle.position.x = (Math.random() - 0.5) * 40;
    particle.position.z = (Math.random() - 0.5) * 40;
    particle.position.y = 0.5; // altura de las criaturas sobre el plano
    particle.visible = true;
}

function checkParticleCollisions() {
    particles.forEach(particle => {
        if (!particle.visible) return;

        criaturas.forEach(criatura => {
            const distance = particle.position.distanceTo(criatura.modelo.position);
            if (distance < RADIO_COLISION) {
                particle.visible = false;
                criatura.particulasRecolectadas++;

                // Verificar si se debe recuperar vida
                if (criatura.particulasRecolectadas >= PARTICULAS_PARA_VIDA) {
                    if (criatura.vida < VIDA_INICIAL) {
                        criatura.vida += VIDA_RECUPERADA;
                        criatura.vida = Math.min(criatura.vida, VIDA_INICIAL); // No exceder vida máxima
                    }
                    criatura.particulasRecolectadas = 0; // Reiniciar contador
                }
            }
        });
    });
}

function updateParticles() {
    const currentTime = Date.now();
    if (currentTime - lastParticleSpawn > PARTICLE_SPAWN_INTERVAL) {
        particles.forEach(particle => {
            if (!particle.visible) {
                spawnParticle(particle);
            }
        });
        lastParticleSpawn = currentTime;
    }
}

// =========================
// === INTERACCIÓN DE USUARIO
// =========================
// Añadir funciones de interacción
function onMouseDown(event) {
    if (hoveredCriatura) {
        selectedCriatura = hoveredCriatura;
        dragging = true;
        controls.enabled = false; // Deshabilitar controles de cámara durante el arrastre
    }
}

function onMouseUp() {
    if (selectedCriatura && dragging) {
        // Reiniciar movimiento desde la nueva posición
        selectedCriatura.velocidad = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            0,
            (Math.random() - 0.5) * 0.05
        );
    }
    selectedCriatura = null;
    dragging = false;
    controls.enabled = true; // Reactivar controles de cámara
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (dragging && selectedCriatura) {
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);

        // Actualizar posición de la criatura
        selectedCriatura.modelo.position.copy(intersectPoint);
        selectedCriatura.position = {
            x: intersectPoint.x,
            y: intersectPoint.y,
            z: intersectPoint.z
        };
        // Detener movimiento mientras se arrastra
        selectedCriatura.velocidad.set(0, 0, 0);
    }
}

// =========================
// === UTILIDADES Y TEXTURAS
// =========================
// Añadir función para generar textura procedural de ruido (igual que en main.js)
function generateNoiseTexture() {
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

// =========================
// === CARGA Y GESTIÓN DE CRIATURAS
// =========================
async function cargarCriaturas() {
    const criaturasGuardadas = JSON.parse(localStorage.getItem('criaturas') || '[]');
    const loader = new GLTFLoader();

    for (const criatura of criaturasGuardadas) {
        try {
            // CAMBIO: usa la misma ruta que in main.js
            const gltf = await loader.loadAsync('modelo.glb');
            const modelo = gltf.scene.clone();

            // Aplicar los morph targets guardados y mejorar materiales
            modelo.traverse((child) => {
                if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                    Object.entries(criatura.morphTargets).forEach(([name, value]) => {
                        const index = child.morphTargetDictionary[name];
                        if (typeof index !== 'undefined') {
                            child.morphTargetInfluences[index] = value;
                        }
                    });

                    // CAMBIO: convertir color de 0-360 a 0-1
                    if (criatura.color !== undefined) {
                        const color = new THREE.Color().setHSL(criatura.color / 360, 0.7, 0.5);
                        child.material.color = color;
                    }
                }
                // Mejora de materiales y textura procedural (igual que en main.js)
                if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
                    child.material.roughness = 0.25;
                    child.material.metalness = 0.7;
                    child.material.envMapIntensity = 1.2;
                    child.material.clearcoat = 0.6;
                    child.material.clearcoatRoughness = 0.15;
                    child.material.sheen = 0.5;
                    child.material.sheenColor = new THREE.Color(0x88aaff);
                    child.material.bumpMap = generateNoiseTexture();
                    child.material.bumpScale = 0.08;
                    child.material.needsUpdate = true;
                }
            });

            // Aplicar escala si existe (asegura un mínimo razonable)
            let escala = (typeof criatura.scale === "number" && criatura.scale > 0.3) ? criatura.scale : 1;
            modelo.scale.set(escala, escala, escala);

            // Vida y velocidad dependen de la escala
            // Vida: lineal entre 40 (escala 0.5) y 200 (escala 2), 100 en escala 1
            let vida = 100;
            if (escala < 1) {
                vida = 40 + (100 - 40) * escala;
            } else if (escala > 1) {
                vida = 100 + (200 - 100) * (escala - 1) / 1;
            }
            // Velocidad: inversamente proporcional a la escala
            // Ahora criaturas pequeñas son aún más rápidas (factor aumentado de 0.08 a 0.12)
            let velocidadBase = 0.05;
            if (escala < 1) {
                velocidadBase = 0.05 + (1 - escala) * 0.12;
            } else if (escala > 1) {
                velocidadBase = 0.05 - (escala - 1) * 0.025;
            }
            velocidadBase = Math.max(0.015, Math.min(velocidadBase, 0.16));

            // Posicionar la criatura (volver a la posición original)
            // CAMBIO: permitir que las criaturas aparezcan en un área más grande del plano circular
            const radioMax = 38; // Un poco menos que el radio del plano (40)
            let pos = { x: criatura.position.x, y: criatura.position.y, z: criatura.position.z };
            if (Math.sqrt(pos.x * pos.x + pos.z * pos.z) > radioMax) {
                const theta = Math.random() * Math.PI * 2;
                const r = Math.random() * radioMax * 0.95;
                pos.x = Math.cos(theta) * r;
                pos.z = Math.sin(theta) * r;
                pos.y = 0;
            }
            pos.y = 0.6; // Más alto sobre el plano
            modelo.position.set(pos.x, pos.y, pos.z);

            scene.add(modelo);
            criaturas.push({
                id: criatura.id,
                modelo,
                position: { ...pos },
                velocidad: new THREE.Vector3(
                    (Math.random() - 0.5) * velocidadBase,
                    0,
                    (Math.random() - 0.5) * velocidadBase
                ),
                colisionando: false,
                tiempoColision: 0,
                contadorColisiones: 0,
                vida: vida,
                particulasRecolectadas: 0,
                scale: escala,
                velocidadBase,
            });

            document.getElementById('numCriaturas').textContent = criaturas.length;
        } catch (error) {
            console.error('Error al cargar criatura:', error);
        }
    }
}

// Añadir el listener de mensajes
channel.onmessage = async (event) => {
    if (event.data.type === 'nueva_criatura') {
        await cargarNuevaCriatura(event.data.data);
    }
};

// Función para cargar una nueva criatura
async function cargarNuevaCriatura(criatura) {
    const loader = new GLTFLoader();
    try {
        // CAMBIO: usa la misma ruta que in main.js
        const gltf = await loader.loadAsync('modelo.glb');
        const modelo = gltf.scene.clone();

        // Aplicar los morph targets y mejorar materiales
        modelo.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
                Object.entries(criatura.morphTargets).forEach(([name, value]) => {
                    const index = child.morphTargetDictionary[name];
                    if (typeof index !== 'undefined') {
                        child.morphTargetInfluences[index] = value;
                    }
                });

                // CAMBIO: convertir color de 0-360 a 0-1
                if (criatura.color !== undefined) {
                    const color = new THREE.Color().setHSL(criatura.color / 360, 0.7, 0.5);
                    child.material.color = color;
                }
            }
            // Mejora de materiales y textura procedural (igual que en main.js)
            if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
                child.material.roughness = 0.25;
                child.material.metalness = 0.7;
                child.material.envMapIntensity = 1.2;
                child.material.clearcoat = 0.6;
                child.material.clearcoatRoughness = 0.15;
                child.material.sheen = 0.5;
                child.material.sheenColor = new THREE.Color(0x88aaff);
                child.material.bumpMap = generateNoiseTexture();
                child.material.bumpScale = 0.08;
                child.material.needsUpdate = true;
            }
        });

        // Aplicar escala si existe (asegura un mínimo razonable)
        let escala = (typeof criatura.scale === "number" && criatura.scale > 0.3) ? criatura.scale : 1;
        modelo.scale.set(escala, escala, escala);

        // Vida y velocidad dependen de la escala
        // Vida: lineal entre 40 (escala 0.5) y 200 (escala 2), 100 en escala 1
        let vida = 100;
        if (escala < 1) {
            vida = 40 + (100 - 40) * escala;
        } else if (escala > 1) {
            vida = 100 + (200 - 100) * (escala - 1) / 1;
        }
        // Velocidad: inversamente proporcional a la escala
        // Ahora criaturas pequeñas son aún más rápidas (factor aumentado de 0.08 a 0.12)
        let velocidadBase = 0.05;
        if (escala < 1) {
            velocidadBase = 0.05 + (1 - escala) * 0.12;
        } else if (escala > 1) {
            velocidadBase = 0.05 - (escala - 1) * 0.025;
        }
        velocidadBase = Math.max(0.015, Math.min(velocidadBase, 0.16));

        // Posicionar la criatura
        // CAMBIO: permitir que las criaturas nuevas aparezcan en un área más grande del plano circular
        const radioMax = 38;
        let pos = { x: criatura.position.x, y: criatura.position.y, z: criatura.position.z };
        if (Math.sqrt(pos.x * pos.x + pos.z * pos.z) > radioMax) {
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * radioMax * 0.95;
            pos.x = Math.cos(theta) * r;
            pos.z = Math.sin(theta) * r;
            pos.y = 0;
        }
        pos.y = 0.6; // Más alto sobre el plano
        modelo.position.set(pos.x, pos.y, pos.z);

        scene.add(modelo);
        criaturas.push({
            id: criatura.id,
            modelo,
            position: { ...pos },
            velocidad: new THREE.Vector3(
                (Math.random() - 0.5) * velocidadBase,
                0,
                (Math.random() - 0.5) * velocidadBase
            ),
            colisionando: false,
            tiempoColision: 0,
            contadorColisiones: 0,
            vida: vida,
            particulasRecolectadas: 0,
            scale: escala,
            velocidadBase,
        });

        // Actualizar contador
        document.getElementById('numCriaturas').textContent = criaturas.length;
    } catch (error) {
        console.error('Error al cargar nueva criatura:', error);
    }
}

// =========================
// === DETECCIÓN Y EFECTOS DE COLISIÓN
// =========================
function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Restaurar criatura previamente hovereada
    if (hoveredCriatura) {
        // Restaurar escala original
        const escalaOriginal = hoveredCriatura.scale || 1;
        hoveredCriatura.modelo.scale.set(escalaOriginal, escalaOriginal, escalaOriginal);

        hoveredCriatura.modelo.traverse(child => {
            if (child.isMesh) {
                child.material.emissive.setHex(0x000000);
                child.material.emissiveIntensity = 0;
            }
        });
    }

    hoveredCriatura = null;

    // Verificar nueva intersección
    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        // Buscar el modelo raíz ascendiendo en la jerarquía
        let root = intersectedObject;
        while (root.parent && root.parent.type !== "Scene") {
            root = root.parent;
        }
        const criatura = criaturas.find(c => c.modelo === root);

        if (criatura) {
            hoveredCriatura = criatura;
            // Aplicar efecto hover manteniendo la escala original
            const escalaOriginal = criatura.scale || 1;
            criatura.modelo.scale.set(
                escalaOriginal * 1.1,
                escalaOriginal * 1.1,
                escalaOriginal * 1.1
            );

            criatura.modelo.traverse(child => {
                if (child.isMesh) {
                    child.material.emissive.setHex(0x00ff00);
                    child.material.emissiveIntensity = 0.5;
                }
            });
        }
    }
}

function detectarColisiones() {
    for (let i = 0; i < criaturas.length; i++) {
        for (let j = i + 1; j < criaturas.length; j++) {
            const criatura1 = criaturas[i];
            const criatura2 = criaturas[j];

            const distancia = criatura1.modelo.position.distanceTo(criatura2.modelo.position);

            if (distancia < RADIO_COLISION) {
                // Incrementar contadores
                criatura1.contadorColisiones++;
                criatura2.contadorColisiones++;

                // Calcular dirección de rebote
                const direccion = new THREE.Vector3()
                    .subVectors(criatura1.modelo.position, criatura2.modelo.position)
                    .normalize();

                // Aplicar rebote con menor fuerza
                criatura1.velocidad.add(direccion.multiplyScalar(FUERZA_REBOTE));
                criatura2.velocidad.add(direccion.multiplyScalar(-FUERZA_REBOTE));

                // Marcar colisión
                criatura1.colisionando = true;
                criatura2.colisionando = true;
                criatura1.tiempoColision = Date.now();
                criatura2.tiempoColision = Date.now();

                // Aplicar efecto visual
                aplicarEfectoColision(criatura1);
                aplicarEfectoColision(criatura2);

                // Verificar si deben ser eliminadas
                verificarEliminacion(criatura1);
                verificarEliminacion(criatura2);
            }
        }
    }
}

// Añadir función para efecto visual de colisión
function aplicarEfectoColision(criatura) {
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            child.material.emissive.setHex(0xff0000);
            child.material.emissiveIntensity = 1;
        }
    });
}

// Añadir función para restaurar apariencia normal
function restaurarAparienciaNormal(criatura) {
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
        }
    });
    criatura.colisionando = false;
}

// Modificar función verificarEliminacion
function verificarEliminacion(criatura) {
    if (criatura.contadorColisiones >= MAX_COLISIONES) {
        // Eliminar del escenario
        scene.remove(criatura.modelo);

        // Eliminar del array de criaturas
        const index = criaturas.indexOf(criatura);
        if (index > -1) {
            criaturas.splice(index, 1);
        }

        // Actualizar contador en la interfaz
        document.getElementById('numCriaturas').textContent = criaturas.length;
    }
}

// Modificar la función actualizarAparienciaPorVida
function actualizarAparienciaPorVida(criatura) {
    criatura.modelo.traverse(child => {
        if (child.isMesh) {
            // Solo modificamos la opacidad y el wireframe
            child.material.transparent = true;

            if (criatura.vida <= VIDA_WIREFRAME) {
                // Cuando la vida es baja, activamos wireframe y ajustamos opacidad
                child.material.wireframe = true;
                child.material.opacity = criatura.vida / VIDA_WIREFRAME;
            } else {
                // Mantener sólido y totalmente visible
                child.material.wireframe = false;
                child.material.opacity = 1;
            }
        }
    });
}

// Modificar la función animate para incluir la degradación de vida
function animate() {
    requestAnimationFrame(animate);

    // Actualizar raycast
    checkIntersection();

    // Detectar colisiones
    detectarColisiones();
    checkParticleCollisions();
    updateParticles();

    // Mover criaturas
    const tiempoActual = Date.now();
    criaturas.forEach((criatura, index) => {
        // Degradación de vida: criaturas pequeñas mueren más rápido, grandes más lento
        let degradacion = VIDA_DEGRADACION;
        if (criatura.scale < 1) {
            degradacion = VIDA_DEGRADACION * (1 + (1 - criatura.scale) * 1.2);
        } else if (criatura.scale > 1) {
            degradacion = VIDA_DEGRADACION * (1 - (criatura.scale - 1) * 0.5);
        }
        degradacion = Math.max(0.01, degradacion);

        criatura.vida -= degradacion;

        // Actualizar apariencia
        actualizarAparienciaPorVida(criatura);

        // Eliminar si la vida llega a 0
        if (criatura.vida <= 0) {
            scene.remove(criatura.modelo);
            criaturas.splice(index, 1);
            document.getElementById('numCriaturas').textContent = criaturas.length;
            return;
        }

        if (criatura === selectedCriatura && dragging) return;

        if (criatura.colisionando && tiempoActual - criatura.tiempoColision > DURACION_COLISION) {
            restaurarAparienciaNormal(criatura);
        }

        // Restaurar movimiento en todos los ejes
        criatura.modelo.position.add(criatura.velocidad);

        // CAMBIO: Rebote en los límites del plano circular
        const radioMax = 38;
        const px = criatura.modelo.position.x;
        const pz = criatura.modelo.position.z;
        const dist = Math.sqrt(px * px + pz * pz);
        if (dist > radioMax) {
            // Rebote circular: invertir la velocidad y reposicionar en el borde
            const nx = px / dist;
            const nz = pz / dist;
            criatura.velocidad.x *= -1;
            criatura.velocidad.z *= -1;
            criatura.modelo.position.x = nx * radioMax * 0.98;
            criatura.modelo.position.z = nz * radioMax * 0.98;
        }

        criatura.modelo.rotation.y += 0.01;

        if (hoveredCriatura === criatura) {
            criatura.modelo.position.y = criatura.position?.y || 0;
            criatura.modelo.position.y += Math.sin(Date.now() * 0.01) * 0.1;
        }
    });

    // Colisión criaturas-colina (si existe la colina)
    if (window._alienHill) {
        const hill = window._alienHill;
        const hillPos = hill.position;
        const hillRadius = hill.geometry.parameters.radius || 8;
        const hillHeight = hillRadius * 0.6 * 1.2; // Altura máxima aproximada

        criaturas.forEach(criatura => {
            const pos = criatura.modelo.position;
            // Proyectar criatura sobre XZ del centro de la colina
            const dx = pos.x - hillPos.x;
            const dz = pos.z - hillPos.z;
            const distXZ = Math.sqrt(dx * dx + dz * dz);

            if (distXZ < hillRadius * 0.98) {
                // Altura máxima de la colina en ese punto (aprox. triangular)
                // Buscar el vértice más cercano de la colina para altura realista
                let maxY = hillPos.y;
                if (hill.geometry && hill.geometry.attributes && hill.geometry.attributes.position) {
                    let minDist = Infinity;
                    for (let i = 0; i < hill.geometry.attributes.position.count; i++) {
                        const vx = hill.geometry.attributes.position.getX(i) + hillPos.x;
                        const vz = hill.geometry.attributes.position.getZ(i) + hillPos.z;
                        const vy = hill.geometry.attributes.position.getY(i) + hillPos.y;
                        const d = (vx - pos.x) ** 2 + (vz - pos.z) ** 2;
                        if (d < minDist) {
                            minDist = d;
                            maxY = vy;
                        }
                    }
                } else {
                    // Fallback: usar forma esférica achatada
                    maxY = hillPos.y + Math.max(0, hillHeight * (1 - distXZ / hillRadius));
                }
                // Si la criatura está por debajo de la colina, la subimos
                if (pos.y < maxY + 0.2) {
                    pos.y = maxY + 0.2;
                    // Rebote simple
                    if (criatura.velocidad) {
                        criatura.velocidad.y = Math.abs(criatura.velocidad.y) * 0.5;
                    }
                }
            }
        });
    }

    renderer.render(scene, camera);
    controls.update();
}

// =========================
// === INICIO DE LA ESCENA
// =========================
init();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================
// === PRADO VERDE
// =========================
function createGreenMeadow() {
    // Zona de prado: círculo verde con borde y altura irregulares y textura procedural
    const meadowRadius = 7 + Math.random() * 4;
    const meadowTheta = Math.random() * Math.PI * 2;
    const meadowDist = 15 + Math.random() * 10;
    const mx = Math.cos(meadowTheta) * meadowDist;
    const mz = Math.sin(meadowTheta) * meadowDist;
    const my = 0.35;

    const segments = 48;
    const geometry = new THREE.CircleGeometry(meadowRadius, segments);
    geometry.rotateX(-Math.PI / 2);

    // Irregularidad en el borde y altura
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        let x = geometry.attributes.position.getX(i);
        let z = geometry.attributes.position.getZ(i);
        let r = Math.sqrt(x * x + z * z);

        // Borde irregular
        if (r > meadowRadius * 0.7) {
            const angle = Math.atan2(z, x);
            const noise = Math.sin(angle * 3 + Math.random() * 2) * 0.7 + Math.cos(angle * 7 + Math.random()) * 0.4;
            const factor = 1 + 0.13 * noise + (Math.random() - 0.5) * 0.09;
            x *= factor;
            z *= factor;
            geometry.attributes.position.setX(i, x);
            geometry.attributes.position.setZ(i, z);
        }

        // Altura brusca e irregular
        let y = 0.05 * Math.cos((r / meadowRadius) * Math.PI / 2);
        y += Math.sin(x * 1.2 + z * 0.7) * 0.13 * (1 - r / meadowRadius);
        y += (Math.random() - 0.5) * 0.08 * (1 - r / meadowRadius);
        geometry.attributes.position.setY(i, y);
    }
    geometry.computeVertexNormals();

    // --- Textura procedural de prado ---
    function generateMeadowTexture(size = 128) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Fondo base verde
        ctx.fillStyle = "#6be86b";
        ctx.fillRect(0, 0, size, size);

        // Manchas verdes oscuras y claras
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
        // Simular hierba con líneas finas
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = Math.random() * 10 + 8;
            const angle = Math.random() * Math.PI * 2;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -len);
            ctx.strokeStyle = `rgba(60,${180 + Math.floor(Math.random() * 60)},80,${Math.random() * 0.25 + 0.18})`;
            ctx.lineWidth = Math.random() * 1.2 + 0.5;
            ctx.stroke();
            ctx.restore();
        }
        // Flores pequeñas
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.5 + 0.7, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(${180 + Math.random() * 60},${120 + Math.random() * 80},${180 + Math.random() * 60},0.7)`;
            ctx.fill();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
        return texture;
    }

    const meadowTexture = generateMeadowTexture();

    const material = new THREE.MeshStandardMaterial({
        color: 0x6be86b,
        map: meadowTexture,
        bumpMap: meadowTexture,
        bumpScale: 0.13,
        roughness: 0.5,
        metalness: 0.18,
        transparent: true,
        opacity: 0.85
    });
    const meadow = new THREE.Mesh(geometry, material);
    meadow.position.set(mx, my, mz);
    meadow.receiveShadow = true;
    scene.add(meadow);
}
createGreenMeadow();

// === COLINA ===
function createHill() {
    // Colina: forma triangular, abrupta y sólida
    const hillRadius = 6 + Math.random() * 3;
    const hillTheta = Math.random() * Math.PI * 2;
    const hillDist = 18 + Math.random() * 10;
    const hx = Math.cos(hillTheta) * hillDist;
    const hz = Math.sin(hillTheta) * hillDist;
    const hy = 0.2;

    // Menos segmentos para polígonos más abruptos
    const widthSegments = 8 + Math.floor(Math.random() * 4);
    const heightSegments = 5 + Math.floor(Math.random() * 3);
    const geometry = new THREE.SphereGeometry(hillRadius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI / 1.7);

    // Deformar para triangularidad y brusquedad
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        let x = geometry.attributes.position.getX(i);
        let y = geometry.attributes.position.getY(i);
        let z = geometry.attributes.position.getZ(i);

        // Aplastar y triangularidad
        y *= 0.6;
        // Triangularidad: empujar hacia un vértice
        const r = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);
        // Tres puntas principales
        let tri = Math.sin(angle * 3 + Math.random() * 0.5) * 0.7;
        // Brusquedad poligonal
        let abrupt = (Math.random() - 0.5) * 1.2;
        y += tri * 1.2 * (1 - r / hillRadius) + abrupt * 0.25 * (1 - r / hillRadius);

        geometry.attributes.position.setY(i, y);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x8dbf5a,
        roughness: 0.6,
        metalness: 0.15,
        transparent: true,
        opacity: 0.93,
        flatShading: true // Polígonos abruptos
    });
    const hill = new THREE.Mesh(geometry, material);
    hill.position.set(hx, hy, hz);
    hill.receiveShadow = true;
    hill.castShadow = true;
    scene.add(hill);

    // --- Solidez para criaturas ---
    // Guardar la colina para colisiones
    window._alienHill = hill;
}
createHill();