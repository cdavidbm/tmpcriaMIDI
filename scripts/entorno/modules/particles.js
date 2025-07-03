import * as THREE from 'three';
import { PARTICLES_COUNT, PARTICLE_SIZE, PARTICLE_SPAWN_INTERVAL } from './constants.js';
import { scene } from './scene.js';

export let particles = [];
export let lastParticleSpawn = 0;

export function createParticles() {
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
    particle.position.y = 0.5;
    particle.visible = true;
}

export function updateParticles() {
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
