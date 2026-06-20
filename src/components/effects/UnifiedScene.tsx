"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { gsap } from "gsap";
import { useTheme } from "@/hooks/use-theme";

// Context Types
interface UnifiedSceneContextType {
  registerItem: (id: string, node: React.ReactNode) => void;
  unregisterItem: (id: string) => void;
  cameraTrack: string;
  setCameraTrack: (track: string) => void;
  scrollProgress: React.MutableRefObject<number>;
}

const UnifiedSceneContext = createContext<UnifiedSceneContextType | null>(null);

// Custom Transition Shader Material
class TransitionWarpMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uProgress: { value: 0.0 },
        uIsLight: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uProgress;
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Warp/fold vertices dynamically during transition
          float fold = sin(uv.x * 3.14159) * uProgress * 1.5;
          pos.z += fold;
          pos.x += sin(uv.y * 3.14159) * uProgress * 0.4;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uProgress;
        uniform float uIsLight;
        void main() {
          // Holographic grid scanlines
          float grid = sin(vUv.x * 60.0) * sin(vUv.y * 60.0);
          grid = step(0.96, grid);
          
          float alpha = sin(uProgress * 3.14159); // peak alpha at 0.5
          vec3 darkGrad = mix(vec3(0.41, 0.0, 0.94), vec3(0.0, 0.90, 0.80), vUv.x); // Cosmic Violet to Cyan
          vec3 lightGrad = mix(vec3(0.31, 0.27, 0.90), vec3(0.03, 0.57, 0.70), vUv.x); // Indigo to Teal
          vec3 baseColor = mix(darkGrad, lightGrad, uIsLight);
          vec3 finalColor = baseColor + grid * 0.25;
          
          gl_FragColor = vec4(finalColor, alpha * 0.65);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }
}

// Optimized Instanced Background Mesh
function NeuralBackgroundV2() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const count = 120;

  const [positions, phases, colors] = useMemo(() => {
    const pos = [];
    const ph = [];
    const col = [];
    const palette = [
      new THREE.Color("#6a00f0"), // Cosmic Violet
      new THREE.Color("#00e6cc"), // Cyber Cyan
      new THREE.Color("#a855f7"), // Light Violet
      new THREE.Color("#3b82f6"), // Cyber Blue
    ];
    for (let i = 0; i < count; i++) {
      pos.push(new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8 - 4
      ));
      ph.push(Math.random() * Math.PI * 2);
      col.push(palette[Math.floor(Math.random() * palette.length)]);
    }
    return [pos, ph, col];
  }, []);

  // Theme-coupled palettes for dynamic interpolation / updates
  const paletteDark = useMemo(() => [
    new THREE.Color("#6a00f0"), // Cosmic Violet
    new THREE.Color("#00e6cc"), // Cyber Cyan
    new THREE.Color("#a855f7"), // Light Violet
    new THREE.Color("#3b82f6"), // Cyber Blue
  ], []);

  const paletteLight = useMemo(() => [
    new THREE.Color("#4f46e5"), // Indigo
    new THREE.Color("#0891b2"), // Teal
    new THREE.Color("#7c3aed"), // Violet
    new THREE.Color("#2563eb"), // Royal Blue
  ], []);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime() * 0.25;
    const inst = meshRef.current;
    const activePalette = isLight ? paletteLight : paletteDark;

    // Apply mouse parallax to camera positions with damping
    mouse.current.targetX += (mouse.current.x - mouse.current.targetX) * 0.05;
    mouse.current.targetY += (mouse.current.y - mouse.current.targetY) * 0.05;

    camera.position.x += (mouse.current.targetX * 2.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.current.targetY * 2.0 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -3);

    if (inst) {
      const tempObj = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        const base = positions[i];
        const phase = phases[i];

        const waveX = Math.sin(t + phase) * 0.25;
        const waveY = Math.cos(t * 0.7 + phase * 0.5) * 0.25;
        const waveZ = Math.sin(t * 0.5 + phase * 0.3) * 0.15;

        tempObj.position.set(base.x + waveX, base.y + waveY, base.z + waveZ);
        const scale = 0.85 + Math.sin(t * 2 + phase) * 0.15;
        tempObj.scale.set(scale, scale, scale);
        tempObj.updateMatrix();

        inst.setMatrixAt(i, tempObj.matrix);
        // Reactive theme-coupled node colors updating in GPU
        inst.setColorAt(i, activePalette[i % activePalette.length]);
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }

    const lines = lineRef.current;
    if (lines && inst) {
      const linePos = lines.geometry.attributes.position.array as Float32Array;
      const tempObj = new THREE.Object3D();
      let lineIndex = 0;
      const maxLines = 180;

      for (let i = 0; i < count; i++) {
        inst.getMatrixAt(i, tempObj.matrix);
        const pi = new THREE.Vector3().setFromMatrixPosition(tempObj.matrix);

        for (let j = i + 1; j < count; j++) {
          inst.getMatrixAt(j, tempObj.matrix);
          const pj = new THREE.Vector3().setFromMatrixPosition(tempObj.matrix);

          const dist = pi.distanceTo(pj);
          if (dist < 3.8 && lineIndex < maxLines) {
            const offset = lineIndex * 6;
            linePos[offset] = pi.x;
            linePos[offset + 1] = pi.y;
            linePos[offset + 2] = pi.z;
            linePos[offset + 3] = pj.x;
            linePos[offset + 4] = pj.y;
            linePos[offset + 5] = pj.z;
            lineIndex++;
          }
        }
      }

      for (let k = lineIndex; k < maxLines; k++) {
        const offset = k * 6;
        linePos[offset] = 0;
        linePos[offset + 1] = 0;
        linePos[offset + 2] = 0;
        linePos[offset + 3] = 0;
        linePos[offset + 4] = 0;
        linePos[offset + 5] = 0;
      }
      lines.geometry.attributes.position.needsUpdate = true;
    }
  });

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(180 * 6), 3));
    return geom;
  }, []);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null as any, null as any, count]} frustumCulled>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshPhysicalMaterial
          roughness={isLight ? 0.2 : 0.1}
          metalness={isLight ? 0.5 : 0.9}
          clearcoat={1.0}
          transparent
          opacity={isLight ? 0.6 : 0.75}
          emissive={isLight ? "#4f46e5" : "#6a00f0"}
          emissiveIntensity={isLight ? 0.35 : 0.15}
        />
      </instancedMesh>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color={isLight ? "#4f46e5" : "#00e6cc"}
          transparent
          opacity={isLight ? 0.08 : 0.06}
        />
      </lineSegments>
    </group>
  );
}

// Transition Mesh Component
function TransitionPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<TransitionWarpMaterial>(null);
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    const material = shaderRef.current;
    if (material) {
      material.uniforms.uIsLight.value = isLight ? 1.0 : 0.0;
    }
  }, [isLight]);

  useEffect(() => {
    const material = shaderRef.current;
    if (!material) return;

    // Trigger vertex warp fold on route change
    const animObj = { progress: 0.0 };
    gsap.killTweensOf(animObj);
    gsap.to(animObj, {
      progress: 1.0,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: () => {
        material.uniforms.uProgress.value = animObj.progress;
      },
      onComplete: () => {
        material.uniforms.uProgress.value = 0.0;
      }
    });
  }, [pathname]);

  const mat = useMemo(() => new TransitionWarpMaterial(), []);

  return (
    <mesh ref={meshRef} position={[0, 0, 5]}>
      <planeGeometry args={[16, 12, 32, 32]} />
      <primitive ref={shaderRef} object={mat} attach="material" />
    </mesh>
  );
}

function ResponsiveSceneWrapper({ children }: { children: React.ReactNode }) {
  const { size } = useThree();
  const aspect = size.width / size.height;
  const scale = aspect < 1.1 ? Math.max(0.55, aspect * 0.9) : 1.0;
  return <group scale={[scale, scale, scale]}>{children}</group>;
}

export function UnifiedSceneProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Map<string, React.ReactNode>>(new Map());
  const [cameraTrack, setCameraTrack] = useState<string>("default");
  const scrollProgress = useRef<number>(0);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false);

  const registerItem = (id: string, node: React.ReactNode) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.set(id, node);
      return next;
    });
  };

  const unregisterItem = (id: string) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <UnifiedSceneContext.Provider value={{ registerItem, unregisterItem, cameraTrack, setCameraTrack, scrollProgress }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* CSS low-poly loader overlay to prevent layout/visual shifts during compilation */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-out z-[1] pointer-events-none ${
            isCanvasLoaded ? "opacity-0" : "opacity-100"
          }`}
          style={{
            background: isLight
              ? "radial-gradient(ellipse at 50% 50%, rgba(224, 231, 255, 0.12) 0%, rgba(243, 244, 246, 1) 75%)"
              : "radial-gradient(ellipse at 50% 50%, rgba(18, 11, 46, 0.25) 0%, rgba(9, 9, 11, 1) 75%)",
          }}
        >
          {/* Subtle neon glow representations of center network nodes */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[90px] animate-pulse ${
              isLight ? "bg-indigo-500/10" : "bg-purple-600/10"
            }`}
          />
          <div
            className={`absolute top-[45%] left-[55%] w-56 h-56 rounded-full blur-[70px] animate-pulse [animation-delay:0.5s] ${
              isLight ? "bg-cyan-500/10" : "bg-cyan-600/10"
            }`}
          />
          {/* Faux scanline CSS grid */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "45px 45px",
            }}
          />
        </div>

        <Canvas
          onCreated={() => setIsCanvasLoaded(true)}
          camera={{ position: [0, 0, 7], fov: 60 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent", pointerEvents: "none" }}
        >
          <ambientLight intensity={isLight ? 0.85 : 0.4} />
          <pointLight position={[10, 10, 10]} intensity={isLight ? 1.5 : 1.2} color={isLight ? "#4f46e5" : "#6a00f0"} />
          <pointLight position={[-10, -10, 5]} intensity={isLight ? 0.8 : 0.6} color={isLight ? "#0891b2" : "#00e6cc"} />

          {/* Core high-performance background network */}
          <NeuralBackgroundV2 />

          {/* WebGL warp page fold transition overlay */}
          <TransitionPlane />

          {/* Registered 3D meshes per page wrapped in responsive group to prevent mobile frustum clipping */}
          <ResponsiveSceneWrapper>
            {Array.from(items.entries()).map(([id, node]) => (
              <React.Fragment key={id}>{node}</React.Fragment>
            ))}
          </ResponsiveSceneWrapper>
        </Canvas>
      </div>
    </UnifiedSceneContext.Provider>
  );
}

export function useUnifiedScene() {
  const ctx = useContext(UnifiedSceneContext);
  if (!ctx) {
    throw new Error("useUnifiedScene must be used within UnifiedSceneProvider");
  }
  return ctx;
}

export function RegisterSceneElement({ id, children }: { id: string; children: React.ReactNode }) {
  const { registerItem, unregisterItem } = useUnifiedScene();

  useEffect(() => {
    registerItem(id, children);
    return () => unregisterItem(id);
  }, [id]);

  return null;
}
