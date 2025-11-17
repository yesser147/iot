import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';

interface HelmetVisualizationProps {
    rotation: { x: number; y: number; z: number };
}

function Helmet({ rotation }: HelmetVisualizationProps) {
    const meshRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x = rotation.x * (Math.PI / 180);
            meshRef.current.rotation.y = rotation.y * (Math.PI / 180);
            meshRef.current.rotation.z = rotation.z * (Math.PI / 180);
        }
    });

    // Main helmet shell
    const helmetGeometry = useMemo(() => {
        return new THREE.SphereGeometry(1.2, 32, 32, 0, Math.PI * 2, 0, Math.PI);
    }, []);

    // Visor geometry
    const visorGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.8, 0.3);
        shape.quadraticCurveTo(0, 0.8, 0.8, 0.3);
        shape.lineTo(0.8, -0.2);
        shape.quadraticCurveTo(0, 0.2, -0.8, -0.2);
        shape.lineTo(-0.8, 0.3);

        const extrudeSettings = {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 8
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    // Chin guard
    const chinGuardGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.6, -1.1);
        shape.quadraticCurveTo(0, -1.3, 0.6, -1.1);
        shape.lineTo(0.6, -0.8);
        shape.quadraticCurveTo(0, -1.0, -0.6, -0.8);
        shape.lineTo(-0.6, -1.1);

        const extrudeSettings = {
            depth: 0.8,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 8
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    return (
        <group ref={meshRef} scale={0.7}>
            {/* Main helmet body */}
            <mesh geometry={helmetGeometry} position={[0, 0, 0]}>
                <meshPhysicalMaterial
                    color="#2c3e50"
                    metalness={0.3}
                    roughness={0.4}
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                    envMapIntensity={1}
                />
            </mesh>

            {/* Visor */}
            <mesh geometry={visorGeometry} position={[0, 0.2, 1.15]} rotation={[0, 0, 0]}>
                <meshPhysicalMaterial
                    color="#87ceeb"
                    transparent
                    opacity={0.7}
                    transmission={0.2}
                    roughness={0.1}
                    metalness={0.9}
                    iridescence={1}
                    iridescenceIOR={1.3}
                    thickness={0.5}
                    envMapIntensity={1.5}
                />
            </mesh>

            {/* Chin guard */}
            <mesh geometry={chinGuardGeometry} position={[0, -0.6, 0.4]}>
                <meshPhysicalMaterial
                    color="#34495e"
                    metalness={0.3}
                    roughness={0.4}
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                    envMapIntensity={1}
                />
            </mesh>

            {/* Ventilation holes */}
            <mesh position={[0, 0.8, 0.9]} rotation={[Math.PI / 6, 0, 0]}>
                <boxGeometry args={[0.8, 0.1, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Side vents */}
            <mesh position={[0.9, 0.3, 0.6]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.3, 0.2, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-0.9, 0.3, 0.6]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.3, 0.2, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Decorative stripes */}
            <mesh position={[0, -0.2, 1.21]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[1.0, 1.0, 0.02, 32]} />
                <meshStandardMaterial color="#e74c3c" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Rear spoiler */}
            <mesh position={[0, 0.1, -1.1]} rotation={[Math.PI / 8, 0, 0]}>
                <boxGeometry args={[0.6, 0.1, 0.3]} />
                <meshStandardMaterial color="#2c3e50" metalness={0.3} roughness={0.4} />
            </mesh>

            {/* Cheek pads */}
            <mesh position={[0.7, -0.3, 0.3]} rotation={[0, -Math.PI / 6, 0]}>
                <sphereGeometry args={[0.25, 16, 16, 0, Math.PI, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
            <mesh position={[-0.7, -0.3, 0.3]} rotation={[0, Math.PI / 6, 0]}>
                <sphereGeometry args={[0.25, 16, 16, 0, Math.PI, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Background environment component
function SceneEnvironment() {
    return (
        <>
            {/* Sky gradient background */}
            <Sky
                distance={450000}
                sunPosition={[5, 1, 8]}
                inclination={0}
                azimuth={0.25}
            />

            {/* HDRI Environment for reflections */}
            <Environment
                preset="city"
                background={false}
            />

            {/* Floating particles for depth */}
            <FloatingParticles count={50} />

            {/* Ground plane with texture */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
                <circleGeometry args={[8, 32]} />
                <meshStandardMaterial
                    color="#4a5568"
                    metalness={0.2}
                    roughness={0.6}
                />
            </mesh>
        </>
    );
}

// Floating particles for background depth
function FloatingParticles({ count = 50 }) {
    const particlesRef = useRef<THREE.Points>(null);

    const particlesGeometry = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Random positions in a sphere around the scene
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 20;

            sizes[i] = Math.random() * 0.1 + 0.05;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometry;
    }, [count]);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <points ref={particlesRef}>
            <primitive object={particlesGeometry} />
            <pointsMaterial
                size={0.1}
                sizeAttenuation={true}
                color="#87ceeb"
                transparent
                opacity={0.6}
            />
        </points>
    );
}

export default function HelmetVisualization({ rotation }: HelmetVisualizationProps) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg overflow-hidden">
            <Canvas
                camera={{ position: [2.5, 1, 2.5], fov: 50 }}
                shadows
            >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ff6b6b" />
                <pointLight position={[0, 2, 0]} intensity={0.2} color="#87ceeb" />

                {/* Scene Background and Environment */}
                <SceneEnvironment />

                {/* Main Helmet */}
                <Helmet rotation={rotation} />

                {/* Controls */}
                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    minDistance={1.5}
                    maxDistance={6}
                    enableDamping
                    dampingFactor={0.05}
                />

                {/* Soft grid for reference */}
                <gridHelper
                    args={[8, 8, '#4a5568', '#2d3748']}
                    position={[0, -1.5, 0]}
                />
            </Canvas>
        </div>
    );
}