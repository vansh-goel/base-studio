"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Text3D, Center } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
// Optimized hero performance


// 3D Camera Model Component
function CameraModel({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef} position={position} rotation={rotation}>
                {/* Camera body */}
                <boxGeometry args={[1, 0.6, 0.8]} />
                <meshStandardMaterial color="#0052ff" metalness={0.8} roughness={0.2} />

                {/* Camera lens */}
                <mesh position={[0, 0, 0.5]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* Camera flash */}
                <mesh position={[0.2, 0.2, 0.4]}>
                    <boxGeometry args={[0.1, 0.1, 0.05]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
                </mesh>
            </mesh>
        </Float>
    );
}

// Floating Photo Frames
function PhotoFrame({ position, rotation, imageUrl }: {
    position: [number, number, number];
    rotation: [number, number, number];
    imageUrl: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
            <mesh ref={meshRef} position={position} rotation={rotation}>
                {/* Frame */}
                <boxGeometry args={[0.8, 1, 0.05]} />
                <meshStandardMaterial color="#f8f9fa" />

                {/* Image placeholder */}
                <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[0.7, 0.9]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
            </mesh>
        </Float>
    );
}

// Particle System
function Particles() {
    const pointsRef = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
            pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.02} color="#00d4ff" transparent opacity={0.6} />
        </points>
    );
}

// Main 3D Scene
function Scene() {
    const [hovered, setHovered] = useState(false);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} color="#00d4ff" intensity={0.5} />

            {/* Environment */}
            <Environment preset="city" />

            {/* Particles */}
            <Particles />

            {/* Camera models */}
            <CameraModel position={[-2, 0, 0]} rotation={[0, Math.PI / 4, 0]} />
            <CameraModel position={[2, 1, -1]} rotation={[0, -Math.PI / 4, 0]} />

            {/* Photo frames */}
            <PhotoFrame position={[-1, 2, 1]} rotation={[0, Math.PI / 6, 0]} imageUrl="/placeholder1.jpg" />
            <PhotoFrame position={[1, -1, 1]} rotation={[0, -Math.PI / 6, 0]} imageUrl="/placeholder2.jpg" />
            <PhotoFrame position={[0, 0, -2]} rotation={[0, Math.PI, 0]} imageUrl="/placeholder3.jpg" />

            {/* Central logo */}
            <Center position={[0, 0, 0]}>
                <mesh
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    <boxGeometry args={[1, 0.3, 0.1]} />
                    <meshStandardMaterial
                        color={hovered ? "#00d4ff" : "#0052ff"}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
            </Center>
        </>
    );
}

// Loading fallback - 3D version for Canvas
function LoadingFallback() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#0052ff" transparent opacity={0.6} />
        </mesh>
    );
}

// Main Hero3D Component
export default function Hero3D() {
    return (
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                style={{ background: 'transparent' }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={<LoadingFallback />}>
                    <Scene />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate
                        autoRotateSpeed={0.5}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 2}
                    />
                </Suspense>
            </Canvas>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 pointer-events-none" />
        </div>
    );
}
