import * as THREE from 'three';
import { scene } from './scene.js';
import { generateMarineTexture, generateMeadowTexture } from './textures.js';

export function createGround() {
    const groundWaterTexture = generateMarineTexture();
    const planeGeometry = generateElevatedCircleGeometry(40, 192);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,
        map: groundWaterTexture,
        bumpMap: groundWaterTexture,
        bumpScale: 1.2,
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85,
        emissive: 0x001122,
        emissiveIntensity: 0.2
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(planeGeometry),
        new THREE.LineBasicMaterial({ color: 0x66ccff, opacity: 0.3, transparent: true })
    );
    wireframe.rotation.x = -Math.PI / 2;
    scene.add(wireframe);
}

function generateElevatedCircleGeometry(radius, segments, elevCount = 6, elevAmount = 1.2, sinkAmount = -1.2) {
    const geometry = new THREE.CircleGeometry(radius, segments);
    geometry.computeVertexNormals();
    const positions = geometry.attributes.position;
    const totalVerts = positions.count;

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

    const cx = 0, cz = 0;
    const maxR = radius;

    for (let i = 0; i < totalVerts; i++) {
        let x = positions.getX(i);
        let y = positions.getY(i);
        let z = positions.getZ(i);

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

        positions.setZ(i, z + elev);
    }
    geometry.computeVertexNormals();
    return geometry;
}

export function createOceanicCurrent() {
    const currentWidth = 4.5 + Math.random() * 2;
    const currentSegments = 140;
    const currentPoints = [];
    const currentY = 0.4;

    let angle = Math.random() * Math.PI * 2;
    let r = 20 + Math.random() * 8;
    for (let i = 0; i < currentSegments; i++) {
        const t = i / (currentSegments - 1);
        angle += (Math.random() - 0.5) * 0.15 + Math.sin(t * 6 + Math.random()) * 0.05;
        r += (Math.random() - 0.5) * 0.8 + Math.sin(t * 4 + Math.random()) * 0.7;
        r = Math.max(12, Math.min(36, r));

        const x = Math.cos(angle) * r + Math.sin(t * 3 + Math.random()) * 3;
        const z = Math.sin(angle) * r + Math.cos(t * 3.5 + Math.random()) * 3;
        currentPoints.push(new THREE.Vector3(x, 0, z));
    }

    const riverGeom = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];

    for (let i = 0; i < currentPoints.length; i++) {
        const p = currentPoints[i];
        let dir;
        if (i < currentPoints.length - 1) {
            dir = new THREE.Vector3().subVectors(currentPoints[i + 1], p);
        } else {
            dir = new THREE.Vector3().subVectors(p, currentPoints[i - 1]);
        }
        dir.y = 0;
        dir.normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);

        const left = new THREE.Vector3().addVectors(p, perp.clone().multiplyScalar(currentWidth));
        const right = new THREE.Vector3().addVectors(p, perp.clone().multiplyScalar(-currentWidth));
        left.y = right.y = currentY;

        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);
        normals.push(0, 1, 0, 0, 1, 0);
        uvs.push(0, i / (currentPoints.length - 1));
        uvs.push(1, i / (currentPoints.length - 1));
    }

    const indices = [];
    for (let i = 0; i < currentPoints.length - 1; i++) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
        indices.push(a, b, c);
        indices.push(b, d, c);
    }

    riverGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    riverGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    riverGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    riverGeom.setIndex(indices);

    const currentMat = new THREE.MeshStandardMaterial({
        color: 0xc8f0ff,
        transparent: true,
        opacity: 0.85,
        roughness: 0.05,
        metalness: 0.9
    });

    const currentMesh = new THREE.Mesh(riverGeom, currentMat);
    scene.add(currentMesh);
}

export function createMarineLife() {
    const marineCount = 12;
    for (let i = 0; i < marineCount; i++) {
        const r = 10 + Math.random() * 26;
        const theta = Math.random() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const y = 0.5;

        if (Math.random() > 0.6) {
            const coralHeight = 1.5 + Math.random() * 2;
            const coralGeom = new THREE.ConeGeometry(0.3 + Math.random() * 0.4, coralHeight, 8, 16, false);
            const coralMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.8, 0.8, 0.6)
            });
            const coral = new THREE.Mesh(coralGeom, coralMat);
            coral.position.set(x, y, z);
            scene.add(coral);
        }
    }
}

export function createSeaBed() {
    const seabedRadius = 8 + Math.random() * 3;
    const seabedTheta = Math.random() * Math.PI * 2;
    const seabedDist = 16 + Math.random() * 8;
    const sx = Math.cos(seabedTheta) * seabedDist;
    const sz = Math.sin(seabedTheta) * seabedDist;
    const sy = 0.25;

    const geometry = new THREE.CircleGeometry(seabedRadius, 48);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
        color: 0xa8c4d4,
        roughness: 0.7,
        metalness: 0.3
    });
    const seabed = new THREE.Mesh(geometry, material);
    seabed.position.set(sx, sy, sz);
    scene.add(seabed);
}

export function createMarineRock() {
    const rockRadius = 7 + Math.random() * 2;
    const rockTheta = Math.random() * Math.PI * 2;
    const rockDist = 20 + Math.random() * 8;
    const rx = Math.cos(rockTheta) * rockDist;
    const rz = Math.sin(rockTheta) * rockDist;
    const ry = 0.3;

    const baseGeometry = new THREE.SphereGeometry(rockRadius, 16, 12);
    const material = new THREE.MeshStandardMaterial({
        color: 0x4a6b7c,
        roughness: 0.8,
        metalness: 0.4
    });
    const rock = new THREE.Mesh(baseGeometry, material);
    rock.position.set(rx, ry, rz);
    scene.add(rock);

    window._alienHill = rock;
}

export function createGreenMeadow() {
    const meadowRadius = 7 + Math.random() * 4;
    const meadowTheta = Math.random() * Math.PI * 2;
    const meadowDist = 15 + Math.random() * 10;
    const mx = Math.cos(meadowTheta) * meadowDist;
    const mz = Math.sin(meadowTheta) * meadowDist;
    const my = 0.35;

    const geometry = new THREE.CircleGeometry(meadowRadius, 48);
    geometry.rotateX(-Math.PI / 2);

    const meadowTexture = generateMeadowTexture();
    const material = new THREE.MeshStandardMaterial({
        color: 0x6be86b,
        map: meadowTexture,
        roughness: 0.5,
        metalness: 0.18
    });
    const meadow = new THREE.Mesh(geometry, material);
    meadow.position.set(mx, my, mz);
    scene.add(meadow);
}

export function createHill() {
    const hillRadius = 6 + Math.random() * 3;
    const hillTheta = Math.random() * Math.PI * 2;
    const hillDist = 18 + Math.random() * 10;
    const hx = Math.cos(hillTheta) * hillDist;
    const hz = Math.sin(hillTheta) * hillDist;
    const hy = 0.2;

    const geometry = new THREE.SphereGeometry(hillRadius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const material = new THREE.MeshStandardMaterial({
        color: 0x8dbf5a,
        roughness: 0.6,
        metalness: 0.15,
        flatShading: true
    });
    const hill = new THREE.Mesh(geometry, material);
    hill.position.set(hx, hy, hz);
    scene.add(hill);

    window._alienHill = hill;
}
