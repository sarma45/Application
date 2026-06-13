"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function NeuralNode({ position, color, size = 0.15 }: { position: [number, number, number]; color: string; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2 + position[0] + position[1]) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
        />
      </mesh>
    </Float>
  );
}

function NeuralConnections({ nodes, colors }: { nodes: [number, number, number][]; colors: string[] }) {
  const connections = useMemo(() => {
    const conns: { points: [number, number, number][]; color: string }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i][0] - nodes[j][0], 2) +
          Math.pow(nodes[i][1] - nodes[j][1], 2) +
          Math.pow(nodes[i][2] - nodes[j][2], 2)
        );
        if (dist < 2.5 && Math.random() > 0.4) {
          const start = new THREE.Vector3(...nodes[i]);
          const end = new THREE.Vector3(...nodes[j]);
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
          mid.y += (Math.random() - 0.5) * 0.5;
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const pts = curve.getPoints(16).map(p => [p.x, p.y, p.z] as [number, number, number]);
          conns.push({ points: pts, color: colors[i % colors.length] });
        }
      }
    }
    return conns;
  }, [nodes, colors]);

  return (
    <group>
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={conn.points}
          color={conn.color}
          lineWidth={1}
          transparent
          opacity={0.12}
        />
      ))}
    </group>
  );
}

function MorphingSphere({ color, position, scale = 1 }: { color: string; position: [number, number, number]; scale?: number }) {
  return (
    <Float speed={0.8} rotationIntensity={0.8} floatIntensity={1.2}>
      <Sphere args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          transparent
          opacity={0.25}
          roughness={0.2}
          metalness={0.6}
          distort={0.25}
          speed={1.5}
          clearcoat={0.5}
        />
      </Sphere>
    </Float>
  );
}

function FloatingParticles({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#6a00f0"),
      new THREE.Color("#00e6cc"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#3b82f6"),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, col];
  }, [count]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(clock.getElapsedTime() * 0.3 + i) * 0.001;
        positions[i * 3] += Math.cos(clock.getElapsedTime() * 0.2 + i) * 0.001;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function SpinningTorii() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.2;
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.15) * 0.1;
    }
  });

  const torii = useMemo(() => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      const radius = 1.8 + i * 0.3;
      const color = i % 2 === 0 ? "#6a00f0" : "#00e6cc";
      items.push({ radius, color, opacity: 0.15 - i * 0.012 });
    }
    return items;
  }, []);

  return (
    <group ref={groupRef}>
      {torii.map((t, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[t.radius, 0.015, 16, 100]} />
          <meshPhysicalMaterial
            color={t.color}
            emissive={t.color}
            emissiveIntensity={0.2}
            transparent
            opacity={Math.max(0.05, t.opacity)}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

export const nodePositions: [number, number, number][] = [
  [-2.5, 1.2, 0], [-1.5, -1.8, 0.5], [0, 2.2, -0.3], [1.8, 1.5, 0.8],
  [2.2, -1, -0.5], [0.5, -2.5, 0.2], [-2, -0.5, -0.8], [1, 0, 1.2],
  [-1, 1.8, -0.5], [3, 0.5, 0.3], [-3, -1.2, -0.2], [0, -1, -1],
];

const nodeColors = ["#6a00f0", "#00e6cc", "#a855f7", "#3b82f6", "#8b5cf6", "#06b6d4", "#c084fc", "#38bdf8", "#7c3aed", "#22d3ee", "#a78bfa", "#0ea5e9"];

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6a00f0" />
        <pointLight position={[-10, -10, 5]} intensity={0.5} color="#00e6cc" />
        <spotLight position={[0, 5, 5]} angle={0.3} intensity={0.8} color="#a855f7" />

        <FloatingParticles count={250} />

        <MorphingSphere color="#6a00f0" position={[-1.5, 0.8, -1]} scale={0.6} />
        <MorphingSphere color="#00e6cc" position={[2, -0.5, -0.5]} scale={0.4} />
        <MorphingSphere color="#8b5cf6" position={[-1, -1.5, -0.8]} scale={0.35} />

        <SpinningTorii />

        {nodePositions.map((pos, i) => (
          <NeuralNode key={i} position={pos} color={nodeColors[i % nodeColors.length]} size={0.08 + Math.random() * 0.06} />
        ))}

        <NeuralConnections nodes={nodePositions} colors={nodeColors} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}