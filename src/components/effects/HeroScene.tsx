"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Constellation Coordinates
export const nodePositions: [number, number, number][] = [
  [-2.6, 1.4, 0.2], [-1.8, -1.6, 0.6], [0.1, 2.3, -0.4], [1.9, 1.6, 0.9],
  [2.4, -0.9, -0.4], [0.6, -2.4, 0.3], [-2.1, -0.4, -0.7], [1.2, 0.1, 1.3],
  [-0.9, 1.9, -0.6], [3.2, 0.6, 0.4], [-3.1, -1.1, -0.1], [0.2, -0.9, -1.1],
];

import { useTheme } from "@/hooks/use-theme";

// Individual Node component with reactive hover / magnetic mouse pull
function NeuralNode({ position, color, size = 0.15, isLight }: { position: [number, number, number]; color: string; size?: number; isLight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const { pointer } = useThree();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // 1. Futuristic scale pulsation
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2.5 + position[0] + position[1]) * 0.25;
      meshRef.current.scale.setScalar(scale);

      // 2. Cursor response: subtle magnetic pull towards pointer
      const targetX = initialPos.x + pointer.x * 0.45;
      const targetY = initialPos.y + pointer.y * 0.45;
      
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.08);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.08);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[size, 1]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isLight ? 0.6 : 1.2}
          transparent
          opacity={isLight ? 0.9 : 0.85}
          roughness={isLight ? 0.2 : 0.1}
          metalness={isLight ? 0.7 : 0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          wireframe={Math.random() > 0.6} // 40% chance of being wireframe
        />
      </mesh>
    </Float>
  );
}

// Glowing energy pulses that flow along the data lines
function DataPulse({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    midVec.y += (Math.random() - 0.5) * 0.6; // Create Bezier height offset
    return new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
  }, [start, end]);

  // Individual random speed offset
  const speed = useMemo(() => 0.35 + Math.random() * 0.3, []);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = (clock.getElapsedTime() * speed) % 1.0;
      const currentPos = curve.getPointAt(t);
      pulseRef.current.position.copy(currentPos);
      
      // Pulsate pulse size slightly
      const sizePulse = 0.05 + Math.sin(clock.getElapsedTime() * 10) * 0.015;
      pulseRef.current.scale.setScalar(sizePulse / 0.05);
    }
  });

  return (
    <mesh ref={pulseRef}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

// Connections rendering with Bezier curves & data pulse packets
function NeuralConnections({ nodes, colors }: { nodes: [number, number, number][]; colors: string[] }) {
  const connections = useMemo(() => {
    const conns: { points: [number, number, number][]; start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i][0] - nodes[j][0], 2) +
          Math.pow(nodes[i][1] - nodes[j][1], 2) +
          Math.pow(nodes[i][2] - nodes[j][2], 2)
        );
        if (dist < 2.8 && Math.random() > 0.3) {
          const start = new THREE.Vector3(...nodes[i]);
          const end = new THREE.Vector3(...nodes[j]);
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
          mid.y += (Math.random() - 0.5) * 0.5;
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const pts = curve.getPoints(16).map(p => [p.x, p.y, p.z] as [number, number, number]);
          conns.push({ points: pts, start, end, color: colors[i % colors.length] });
        }
      }
    }
    return conns;
  }, [nodes, colors]);

  return (
    <group>
      {connections.map((conn, i) => (
        <group key={i}>
          <Line
            points={conn.points}
            color={conn.color}
            lineWidth={1.2}
            transparent
            opacity={0.16}
          />
          {/* Only render pulses on 50% of the active connection paths to optimize memory */}
          {i % 2 === 0 && (
            <DataPulse start={conn.start} end={conn.end} color={conn.color} />
          )}
        </group>
      ))}
    </group>
  );
}

// Next-Generation Agent Core representing the main interface system
function AgentCore3D({ isLight }: { isLight: boolean }) {
  const coreRef = useRef<THREE.Group>(null);
  const outerSphereRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (coreRef.current) {
      // Rotate core
      coreRef.current.rotation.y = elapsed * 0.12;
      coreRef.current.rotation.x = elapsed * 0.06;
      
      // Lean core toward pointer
      coreRef.current.position.x = THREE.MathUtils.lerp(coreRef.current.position.x, pointer.x * 0.6, 0.05);
      coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, pointer.y * 0.6, 0.05);
    }
    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.z = -elapsed * 0.2;
    }
  });

  const coreColor = isLight ? "#4f46e5" : "#a855f7";
  const coreEmissive = isLight ? "#312e81" : "#6a00f0";
  const waveColor = isLight ? "#0891b2" : "#00e6cc";
  const torusColor1 = isLight ? "#0f766e" : "#00e6cc";
  const torusColor2 = isLight ? "#1d4ed8" : "#3b82f6";

  return (
    <group ref={coreRef} position={[0, 0, 0]}>
      {/* Inner High-Tech wireframe core */}
      <mesh>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshPhysicalMaterial
          color={coreColor}
          emissive={coreEmissive}
          emissiveIntensity={isLight ? 1.5 : 2.5}
          roughness={isLight ? 0.15 : 0.05}
          metalness={isLight ? 0.8 : 0.95}
          clearcoat={1.0}
          wireframe
        />
      </mesh>

      {/* Holographic energy wave distorter */}
      <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1.2}>
        <Sphere ref={outerSphereRef} args={[1.25, 64, 64]}>
          <MeshDistortMaterial
            color={waveColor}
            emissive={waveColor}
            emissiveIntensity={isLight ? 0.4 : 0.8}
            transparent
            opacity={isLight ? 0.45 : 0.35}
            distort={0.35}
            speed={2.2}
            roughness={0.0}
            metalness={0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
          />
        </Sphere>
      </Float>

      {/* Neon Orbit Path 1 */}
      <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[1.7, 0.015, 8, 80]} />
          <meshBasicMaterial color={torusColor1} transparent opacity={isLight ? 0.5 : 0.4} />
        </mesh>
      </group>

      {/* Neon Orbit Path 2 */}
      <group rotation={[-Math.PI / 4, Math.PI / 3, Math.PI / 2]}>
        <mesh>
          <torusGeometry args={[1.9, 0.01, 8, 80]} />
          <meshBasicMaterial color={torusColor2} transparent opacity={isLight ? 0.45 : 0.35} />
        </mesh>
      </group>
    </group>
  );
}

// Morphing Ambient Nodes in space
function MorphingSphere({ color, position, scale = 1, isLight }: { color: string; position: [number, number, number]; scale?: number; isLight: boolean }) {
  return (
    <Float speed={1.2} rotationIntensity={1.2} floatIntensity={1.5}>
      <Sphere args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isLight ? 0.15 : 0.2}
          transparent
          opacity={isLight ? 0.3 : 0.2}
          roughness={0.15}
          metalness={0.7}
          distort={0.3}
          speed={1.8}
          clearcoat={0.6}
        />
      </Sphere>
    </Float>
  );
}

// Glowing high-tech starfield / particle grid
function FloatingParticles({ count = 200, isLight }: { count?: number; isLight: boolean }) {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    const paletteDark = [
      new THREE.Color("#6a00f0"),
      new THREE.Color("#00e6cc"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#3b82f6"),
    ];
    
    const paletteLight = [
      new THREE.Color("#4f46e5"),
      new THREE.Color("#0891b2"),
      new THREE.Color("#7c3aed"),
      new THREE.Color("#2563eb"),
    ];

    const palette = isLight ? paletteLight : paletteDark;

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7;

      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, col];
  }, [count, isLight]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const array = meshRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      for (let i = 0; i < count; i++) {
        array[i * 3 + 1] += Math.sin(time * 0.4 + i) * 0.0015;
        array[i * 3] += Math.cos(time * 0.3 + i) * 0.001;
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
        size={0.035}
        vertexColors
        transparent
        opacity={isLight ? 0.8 : 0.7}
        blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// Responsive helper to scale down elements on portrait aspect ratios (e.g., mobile)
function ResponsiveGroup({ children }: { children: React.ReactNode }) {
  const { size } = useThree();
  const aspect = size.width / size.height;
  // Dynamic scale scaling factor for narrow layouts
  const scale = aspect < 1.1 ? Math.max(0.6, aspect * 0.9) : 1.0;
  return <group scale={[scale, scale, scale]}>{children}</group>;
}

export default function HeroScene() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const nodeColors = isLight
    ? ["#4f46e5", "#0891b2", "#7c3aed", "#2563eb", "#6366f1", "#0e7490", "#8b5cf6", "#1d4ed8", "#6d28d9", "#0f766e", "#7c3aed", "#1e3a8a"]
    : ["#6a00f0", "#00e6cc", "#a855f7", "#3b82f6", "#8b5cf6", "#06b6d4", "#c084fc", "#38bdf8", "#7c3aed", "#22d3ee", "#a78bfa", "#0ea5e9"];

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={isLight ? 1.0 : 0.6} />
        
        {/* Neon Directional Lighting System */}
        <pointLight position={[8, 8, 8]} intensity={isLight ? 1.2 : 1.8} color={isLight ? "#4f46e5" : "#6a00f0"} />
        <pointLight position={[-8, -8, 6]} intensity={isLight ? 0.8 : 1.2} color={isLight ? "#0891b2" : "#00e6cc"} />
        <spotLight position={[0, 7, 7]} angle={0.4} intensity={isLight ? 1.5 : 2.0} color={isLight ? "#7c3aed" : "#a855f7"} />
        
        <ResponsiveGroup>
          {/* Dynamic Holographic Core */}
          <AgentCore3D isLight={isLight} />

          {/* Ambient Orbiting Spheres */}
          <MorphingSphere color={isLight ? "#4f46e5" : "#6a00f0"} position={[-2, 1, -1.5]} scale={0.45} isLight={isLight} />
          <MorphingSphere color={isLight ? "#0891b2" : "#00e6cc"} position={[2.2, -0.8, -1]} scale={0.35} isLight={isLight} />
          <MorphingSphere color={isLight ? "#7c3aed" : "#a855f7"} position={[-1.2, -1.8, -1.2]} scale={0.3} isLight={isLight} />

          {/* Particle Cloud */}
          <FloatingParticles count={280} isLight={isLight} />

          {/* Constellation Nodes */}
          {nodePositions.map((pos, i) => (
            <NeuralNode 
              key={i} 
              position={pos} 
              color={nodeColors[i % nodeColors.length]} 
              size={0.07 + Math.random() * 0.05} 
              isLight={isLight}
            />
          ))}

          {/* Dynamic Connective Lines & Data Pulse Packets */}
          <NeuralConnections nodes={nodePositions} colors={nodeColors} />
        </ResponsiveGroup>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.25}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}