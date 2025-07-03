import * as THREE from 'three';
import { scene } from './scene.js';
import { generateMarineTexture, generateMeadowTexture } from './textures.js';

/**
 * Crea el terreno base circular con elevaciones y depresiones
 * PROPÓSITO: Establecer la superficie principal donde se mueven las criaturas
 * CÓMO: Genera un plano circular con deformaciones procedurales usando ruido
 * POR QUÉ: Proporciona un entorno visualmente interesante y realista
 */
export function createGround() {
    // Genera textura marina procedural para el suelo
    const groundWaterTexture = generateMarineTexture();

    // Crea geometría circular elevada con 192 segmentos para suavidad
    const planeGeometry = generateElevatedCircleGeometry(40, 192);

    // Material acuático con propiedades realistas
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,        // Azul agua
        map: groundWaterTexture, // Textura procedural
        bumpMap: groundWaterTexture, // Usa la misma textura para relieve
        bumpScale: 1.2,         // Intensidad del relieve
        roughness: 0.3,         // Superficie ligeramente rugosa
        metalness: 0.6,         // Propiedades semi-metálicas para reflejos
        transparent: true,      // Permite transparencia
        opacity: 0.85,          // Ligeramente transparente
        emissive: 0x001122,     // Emisión azul tenue
        emissiveIntensity: 0.2  // Intensidad de la emisión
    });

    // Crea el mesh del plano y lo orienta horizontalmente
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Rota 90° para que sea horizontal
    plane.receiveShadow = true;      // Puede recibir sombras
    scene.add(plane);

    // Añade wireframe decorativo para mostrar la geometría
    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(planeGeometry),
        new THREE.LineBasicMaterial({
            color: 0x66ccff,    // Azul claro
            opacity: 0.3,      // Muy transparente
            transparent: true  // Permite transparencia
        })
    );
    wireframe.rotation.x = -Math.PI / 2;
    scene.add(wireframe);
}

/**
 * Genera geometría circular con elevaciones y depresiones aleatorias
 * PROPÓSITO: Crear un terreno orgánico con variaciones de altura
 * CÓMO: Aplica deformaciones basadas en puntos de influencia aleatorios
 * POR QUÉ: Simula la irregularidad natural de los fondos marinos
 */
function generateElevatedCircleGeometry(radius, segments, elevCount = 6, elevAmount = 1.2, sinkAmount = -1.2) {
    // Comienza con una geometría circular básica
    const geometry = new THREE.CircleGeometry(radius, segments);
    geometry.computeVertexNormals(); // Calcula normales para iluminación

    const positions = geometry.attributes.position;
    const totalVerts = positions.count;

    // Selecciona puntos aleatorios para elevaciones
    let elevIndices = [];
    let sinkIndices = [];

    // Genera puntos de elevación
    while (elevIndices.length < elevCount) {
        let idx = Math.floor(Math.random() * totalVerts);
        if (!elevIndices.includes(idx)) elevIndices.push(idx);
    }

    // Genera puntos de depresión (menos cantidad)
    while (sinkIndices.length < Math.max(1, Math.floor(elevCount / 2))) {
        let idx = Math.floor(Math.random() * totalVerts);
        if (!elevIndices.includes(idx) && !sinkIndices.includes(idx)) {
            sinkIndices.push(idx);
        }
    }

    const cx = 0, cz = 0;    // Centro del círculo
    const maxR = radius;     // Radio máximo

    // Aplica deformaciones a cada vértice
    for (let i = 0; i < totalVerts; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);

        let elev = 0; // Acumulador de elevación

        // Aplica influencia de cada punto de elevación
        elevIndices.forEach(eidx => {
            let ex = positions.getX(eidx);
            let ez = positions.getZ(eidx);
            let dist = Math.sqrt((x - ex) ** 2 + (z - ez) ** 2);
            // Función exponencial para suavizar la influencia
            elev += elevAmount * Math.exp(-dist * 0.5);
        });

        // Aplica influencia de cada punto de depresión
        sinkIndices.forEach(sidx => {
            let sx = positions.getX(sidx);
            let sz = positions.getZ(sidx);
            let dist = Math.sqrt((x - sx) ** 2 + (z - sz) ** 2);
            // Influencia más concentrada para depresiones
            elev += sinkAmount * Math.exp(-dist * 0.7);
        });

        // === CREACIÓN DE BORDES IRREGULARES ===
        // Calcula distancia desde el centro y ángulo
        let r = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        let theta = Math.atan2(z - cz, x - cx);

        // Si está cerca del borde, aplica deformación irregular
        if (r > maxR * 0.82) {
            // Combina múltiples ondas sinusoidales para irregularidad
            let edgeNoise = Math.sin(theta * 3 + Math.cos(theta * 5)) * 0.7
                + Math.sin(theta * 7 + r * 0.5) * 0.4
                + Math.random() * 0.5;

            // Calcula cuánto se extiende más allá del borde base
            let edgeCut = (r - maxR * (0.82 + 0.13 * edgeNoise));

            // Si está fuera del borde, aplica depresión
            if (edgeCut > 0) {
                elev -= edgeCut * 8 * (0.7 + Math.random() * 0.6);
            }
        }

        // Aplica la elevación final al vértice
        positions.setZ(i, z + elev);
    }

    // Recalcula normales después de las deformaciones
    geometry.computeVertexNormals();
    return geometry;
}

/**
 * Crea corrientes oceánicas serpenteantes
 * PROPÓSITO: Añadir elementos dinámicos que simulen flujos de agua
 * CÓMO: Genera un camino curvo usando splines y lo convierte en geometría
 * POR QUÉ: Proporciona contexto visual y sugiere movimiento en el ecosistema
 */
export function createOceanicCurrent() {
    // Parámetros de la corriente
    const currentWidth = 4.5 + Math.random() * 2; // Ancho variable
    const currentSegments = 140; // Número de segmentos para suavidad
    const currentPoints = [];    // Puntos que definen el camino
    const currentY = 0.4;        // Altura sobre el suelo

    // Genera camino serpenteante usando coordenadas polares
    let angle = Math.random() * Math.PI * 2; // Ángulo inicial aleatorio
    let r = 20 + Math.random() * 8;          // Radio inicial

    for (let i = 0; i < currentSegments; i++) {
        const t = i / (currentSegments - 1); // Parámetro normalizado (0-1)

        // Variación del ángulo para crear curvas
        angle += (Math.random() - 0.5) * 0.15 + Math.sin(t * 6 + Math.random()) * 0.05;

        // Variación del radio para crear serpenteado
        r += (Math.random() - 0.5) * 0.8 + Math.sin(t * 4 + Math.random()) * 0.7;
        r = Math.max(12, Math.min(36, r)); // Mantiene dentro de límites

        // Convierte a coordenadas cartesianas con ruido adicional
        const x = Math.cos(angle) * r + Math.sin(t * 3 + Math.random()) * 3;
        const z = Math.sin(angle) * r + Math.cos(t * 3.5 + Math.random()) * 3;

        currentPoints.push(new THREE.Vector3(x, 0, z));
    }

    // === CONSTRUCCIÓN DE GEOMETRÍA DE CINTA ===
    const riverGeom = new THREE.BufferGeometry();
    const positions = []; // Posiciones de vértices
    const normals = [];   // Normales para iluminación
    const uvs = [];       // Coordenadas UV para texturas

    // Convierte la línea central en una cinta con ancho
    for (let i = 0; i < currentPoints.length; i++) {
        const p = currentPoints[i];

        // Calcula dirección del segmento
        let dir;
        if (i < currentPoints.length - 1) {
            dir = new THREE.Vector3().subVectors(currentPoints[i + 1], p);
        } else {
            dir = new THREE.Vector3().subVectors(p, currentPoints[i - 1]);
        }

        dir.y = 0; // Mantiene horizontal
        dir.normalize();

        // Calcula vector perpendicular para el ancho
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);

        // Crea vértices izquierdo y derecho
        const left = new THREE.Vector3().addVectors(p, perp.clone().multiplyScalar(currentWidth));
        const right = new THREE.Vector3().addVectors(p, perp.clone().multiplyScalar(-currentWidth));
        left.y = right.y = currentY;

        // Añade vértices y propiedades
        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);
        normals.push(0, 1, 0, 0, 1, 0); // Normales hacia arriba
        uvs.push(0, i / (currentPoints.length - 1)); // Coordenadas UV
        uvs.push(1, i / (currentPoints.length - 1));
    }

    // Crea triángulos para formar la superficie
    const indices = [];
    for (let i = 0; i < currentPoints.length - 1; i++) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
        // Dos triángulos por segmento
        indices.push(a, b, c);
        indices.push(b, d, c);
    }

    // Aplica geometría al buffer
    riverGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    riverGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    riverGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    riverGeom.setIndex(indices);

    // Material acuático para la corriente
    const currentMat = new THREE.MeshStandardMaterial({
        color: 0xc8f0ff,    // Azul muy claro
        transparent: true,  // Permite transparencia
        opacity: 0.85,      // Ligeramente transparente
        roughness: 0.05,    // Muy suave (reflectante)
        metalness: 0.9      // Altamente metálico para reflejos
    });

    const currentMesh = new THREE.Mesh(riverGeom, currentMat);
    scene.add(currentMesh);
}

/**
 * Crea vida marina decorativa (corales)
 * PROPÓSITO: Añadir biodiversidad visual al ecosistema
 * CÓMO: Distribuye aleatoriamente corales con formas y colores variados
 * POR QUÉ: Hace el entorno más realista y visualmente interesante
 */
export function createMarineLife() {
    const marineCount = 12; // Número de elementos marinos

    for (let i = 0; i < marineCount; i++) {
        // Posición aleatoria en coordenadas polares
        const r = 10 + Math.random() * 26;      // Radio desde el centro
        const theta = Math.random() * Math.PI * 2; // Ángulo aleatorio
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const y = 0.5; // Altura sobre el suelo

        // 60% de probabilidad de crear coral
        if (Math.random() > 0.6) {
            // Crea coral con forma cónica
            const coralHeight = 1.5 + Math.random() * 2;
            const coralGeom = new THREE.ConeGeometry(
                0.3 + Math.random() * 0.4, // Radio base variable
                coralHeight,                 // Altura variable
                8,                          // Segmentos radiales
                16,                         // Segmentos de altura
                false                       // No abierto en la base
            );

            // Material con color aleatorio en tonos cálidos
            const coralMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(
                    Math.random() * 0.2 + 0.8, // Matiz entre 0.8-1.0 (rojos/magentas)
                    0.8,                        // Saturación alta
                    0.6                         // Luminosidad media
                )
            });

            const coral = new THREE.Mesh(coralGeom, coralMat);
            coral.position.set(x, y, z);
            scene.add(coral);
        }
    }
}

/**
 * Crea un lecho marino plano adicional
 * PROPÓSITO: Añadir variedad al terreno con áreas planas
 * CÓMO: Coloca un círculo plano en posición aleatoria
 * POR QUÉ: Simula zonas de sedimentación natural en el fondo marino
 */
export function createSeaBed() {
    // Parámetros aleatorios para el lecho
    const seabedRadius = 8 + Math.random() * 3;
    const seabedTheta = Math.random() * Math.PI * 2;
    const seabedDist = 16 + Math.random() * 8;
    const sx = Math.cos(seabedTheta) * seabedDist;
    const sz = Math.sin(seabedTheta) * seabedDist;
    const sy = 0.25;

    // Geometría circular plana
    const geometry = new THREE.CircleGeometry(seabedRadius, 48);
    geometry.rotateX(-Math.PI / 2); // Horizontal

    // Material sedimentario
    const material = new THREE.MeshStandardMaterial({
        color: 0xa8c4d4,    // Gris azulado
        roughness: 0.7,     // Rugoso como sedimento
        metalness: 0.3      // Ligeramente metálico
    });

    const seabed = new THREE.Mesh(geometry, material);
    seabed.position.set(sx, sy, sz);
    scene.add(seabed);
}

/**
 * Crea una roca marina con física de colisión
 * PROPÓSITO: Añadir obstáculos físicos que afecten el movimiento de las criaturas
 * CÓMO: Crea una esfera que se registra globalmente para detección de colisiones
 * POR QUÉ: Proporciona complejidad física al entorno
 */
export function createMarineRock() {
    // Parámetros aleatorios para la roca
    const rockRadius = 7 + Math.random() * 2;
    const rockTheta = Math.random() * Math.PI * 2;
    const rockDist = 20 + Math.random() * 8;
    const rx = Math.cos(rockTheta) * rockDist;
    const rz = Math.sin(rockTheta) * rockDist;
    const ry = 0.3;

    // Geometría esférica básica
    const baseGeometry = new THREE.SphereGeometry(rockRadius, 16, 12);

    // Material pétreo
    const material = new THREE.MeshStandardMaterial({
        color: 0x4a6b7c,    // Gris azulado oscuro
        roughness: 0.8,     // Muy rugoso
        metalness: 0.4      // Ligeramente metálico
    });

    const rock = new THREE.Mesh(baseGeometry, material);
    rock.position.set(rx, ry, rz);
    scene.add(rock);

    // Registra globalmente para detección de colisiones
    // NOTA: Esto sobrescribe la colina si existe
    window._alienHill = rock;
}

/**
 * Crea una pradera verde terrestre
 * PROPÓSITO: Añadir contraste visual con áreas terrestres
 * CÓMO: Coloca un círculo con textura de hierba procedural
 * POR QUÉ: Simula islas o áreas emergidas en el ecosistema
 */
export function createGreenMeadow() {
    // Parámetros aleatorios para la pradera
    const meadowRadius = 7 + Math.random() * 4;
    const meadowTheta = Math.random() * Math.PI * 2;
    const meadowDist = 15 + Math.random() * 10;
    const mx = Math.cos(meadowTheta) * meadowDist;
    const mz = Math.sin(meadowTheta) * meadowDist;
    const my = 0.35;

    // Geometría circular horizontal
    const geometry = new THREE.CircleGeometry(meadowRadius, 48);
    geometry.rotateX(-Math.PI / 2);

    // Textura procedural de hierba
    const meadowTexture = generateMeadowTexture();

    // Material herbáceo
    const material = new THREE.MeshStandardMaterial({
        color: 0x6be86b,        // Verde hierba
        map: meadowTexture,     // Textura procedural
        roughness: 0.5,         // Rugosidad natural
        metalness: 0.18         // Baja metalicidad
    });

    const meadow = new THREE.Mesh(geometry, material);
    meadow.position.set(mx, my, mz);
    scene.add(meadow);
}

/**
 * Crea una colina con física de colisión compleja
 * PROPÓSITO: Añadir elevación significativa con física realista
 * CÓMO: Crea una semiesfera que actúa como obstáculo físico
 * POR QUÉ: Proporciona el obstáculo principal para la física de las criaturas
 */
export function createHill() {
    // Parámetros aleatorios para la colina
    const hillRadius = 6 + Math.random() * 3;
    const hillTheta = Math.random() * Math.PI * 2;
    const hillDist = 18 + Math.random() * 10;
    const hx = Math.cos(hillTheta) * hillDist;
    const hz = Math.sin(hillTheta) * hillDist;
    const hy = 0.2;

    // Geometría de semiesfera (solo la parte superior)
    const geometry = new THREE.SphereGeometry(
        hillRadius,     // Radio
        12,            // Segmentos horizontales
        8,             // Segmentos verticales
        0,             // Inicio phi (horizontal)
        Math.PI * 2,   // Longitud phi (círculo completo)
        0,             // Inicio theta (vertical)
        Math.PI / 1.7  // Longitud theta (menos de media esfera)
    );

    // Material terrestre
    const material = new THREE.MeshStandardMaterial({
        color: 0x8dbf5a,        // Verde oliva
        roughness: 0.6,         // Rugosidad natural
        metalness: 0.15,        // Baja metalicidad
        flatShading: true       // Sombreado plano para apariencia rocosa
    });

    const hill = new THREE.Mesh(geometry, material);
    hill.position.set(hx, hy, hz);
    scene.add(hill);

    // Registra globalmente para física de colisión
    // IMPORTANTE: Esta colina es la que se usa para física en el bucle principal
    window._alienHill = hill;
}
