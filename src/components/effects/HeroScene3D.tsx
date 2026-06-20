"use client";

import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUnifiedScene, RegisterSceneElement } from "./UnifiedScene";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { useTheme } from "@/hooks/use-theme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function MorphingConstellation() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { scrollProgress } = useUnifiedScene();
  const { theme } = useTheme();
  const { size } = useThree();
  const isLight = theme === "light";
  const mouseRef = useRef({ x: 0, y: 0 });

  const count = useMemo(() => {
    if (typeof window === "undefined") return 120;
    const isMobile = size.width < 768;
    return isMobile ? 60 : 120;
  }, [size.width]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  // Generate target coordinates for the three states
  const [states, colors] = useMemo(() => {
    const scattered = [];
    const sphere = [];
    const orbits = [];
    const cols = [];

    const palette = [
      new THREE.Color("#a855f7"), // Cosmic Violet
      new THREE.Color("#00e6cc"), // Cyber Cyan
      new THREE.Color("#3b82f6"), // Cyber Blue
      new THREE.Color("#6a00f0"), // Royal Purple
    ];

    // Core Sphere parameters (State 2)
    const radiusCore = 1.4;

    for (let i = 0; i < count; i++) {
      // 1. Constellation Positions (Random Scatter)
      scattered.push(new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 1
      ));

      // 2. Core Sphere Positions (Fibonacci Sphere Distribution)
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      sphere.push(new THREE.Vector3(
        radiusCore * Math.cos(theta) * Math.sin(phi),
        radiusCore * Math.sin(theta) * Math.sin(phi),
        radiusCore * Math.cos(phi)
      ));

      // 3. Orbiting Rings Positions (State 3)
      // 40 nodes stay in center, 80 orbit in rings
      if (i < 40) {
        // Nucleus
        const nPhi = Math.acos(1 - 2 * (i + 0.5) / 40);
        const nTheta = Math.PI * (1 + Math.sqrt(5)) * i;
        orbits.push(new THREE.Vector3(
          0.6 * Math.cos(nTheta) * Math.sin(nPhi),
          0.6 * Math.sin(nTheta) * Math.sin(nPhi),
          0.6 * Math.cos(nPhi)
        ));
      } else {
        // Orbiting rings
        const ringIdx = (i - 40) % 4; // 4 categories: CHAT, CODE, DATA, WORKFLOW
        const idxInRing = Math.floor((i - 40) / 4);
        const ringCount = 20;
        const angle = (idxInRing / ringCount) * Math.PI * 2;
        const radius = 1.8 + ringIdx * 0.45;

        const pos = new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
        
        // Inclinations per category ring
        if (ringIdx === 0) pos.applyAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), Math.PI / 6);
        else if (ringIdx === 1) pos.applyAxisAngle(new THREE.Vector3(1, 1, 0).normalize(), -Math.PI / 4);
        else if (ringIdx === 2) pos.applyAxisAngle(new THREE.Vector3(0, 1, 1).normalize(), Math.PI / 3);
        else pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 5);

        orbits.push(pos);
      }

      cols.push(palette[i % palette.length]);
    }

    return [{ scattered, sphere, orbits }, cols];
  }, []);

  const paletteDark = useMemo(() => [
    new THREE.Color("#a855f7"), // Cosmic Violet
    new THREE.Color("#00e6cc"), // Cyber Cyan
    new THREE.Color("#3b82f6"), // Cyber Blue
    new THREE.Color("#6a00f0"), // Royal Purple
  ], []);

  const paletteLight = useMemo(() => [
    new THREE.Color("#7c3aed"), // Violet
    new THREE.Color("#0891b2"), // Teal
    new THREE.Color("#2563eb"), // Royal Blue
    new THREE.Color("#4f46e5"), // Indigo
  ], []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const inst = meshRef.current;
    const p = scrollProgress.current;
    const activePalette = isLight ? paletteLight : paletteDark;

    // Mouse parallax with spring damping
    const group = groupRef.current;
    if (group) {
      const targetX = mouseRef.current.y * 0.15;
      const targetY = mouseRef.current.x * 0.15;
      group.rotation.x += (targetX - group.rotation.x) * 0.05;
      group.rotation.y += (targetY - group.rotation.y) * 0.05;
    }

    const t = 0;
    const currentPositions: THREE.Vector3[] = [];

    if (p <= 0.3) {
      // Phase 1: scattered constellation
      const stageProgress = p / 0.3;
      for (let i = 0; i < count; i++) {
        // Slow rotation/float wave in State 1
        const floatWave = new THREE.Vector3(
          Math.sin(elapsed * 0.2 + i) * 0.15,
          Math.cos(elapsed * 0.15 + i) * 0.15,
          0
        );
        const pos = states.scattered[i].clone().add(floatWave);
        currentPositions.push(pos);
      }
    } else if (p > 0.3 && p <= 0.6) {
      // Phase 2: Morphing into Core Sphere
      const stageProgress = (p - 0.3) / 0.3; // 0.0 to 1.0
      // Smooth ease curve
      const ease = stageProgress * stageProgress * (3 - 2 * stageProgress);

      for (let i = 0; i < count; i++) {
        const floatWave = new THREE.Vector3(
          Math.sin(elapsed * 0.2 + i) * 0.15,
          Math.cos(elapsed * 0.15 + i) * 0.15,
          0
        );
        const pos1 = states.scattered[i].clone().add(floatWave);
        const pos2 = states.sphere[i].clone();

        // Slow spin of target sphere
        pos2.applyAxisAngle(new THREE.Vector3(0, 1, 0), elapsed * 0.1);

        currentPositions.push(new THREE.Vector3().lerpVectors(pos1, pos2, ease));
      }
    } else {
      // Phase 3: Launching Orbiting category rings
      const stageProgress = (p - 0.6) / 0.4; // 0.0 to 1.0
      const ease = stageProgress * stageProgress * (3 - 2 * stageProgress);

      for (let i = 0; i < count; i++) {
        const posSphere = states.sphere[i].clone();
        posSphere.applyAxisAngle(new THREE.Vector3(0, 1, 0), elapsed * 0.15);

        const posOrbit = states.orbits[i].clone();
        if (i < 40) {
          // Central Nucleus rotates slowly
          posOrbit.applyAxisAngle(new THREE.Vector3(0, 1, 0), elapsed * 0.3);
        } else {
          // Orbit rings rotate at speeds depending on category
          const ringIdx = (i - 40) % 4;
          const rotationSpeed = 0.4 + (ringIdx * 0.2);
          const rotationAxis = new THREE.Vector3(0, 1, 0);
          
          if (ringIdx === 0) rotationAxis.set(1, 0, 1).normalize();
          else if (ringIdx === 1) rotationAxis.set(1, 1, 0).normalize();
          else if (ringIdx === 2) rotationAxis.set(0, 1, 1).normalize();
          else rotationAxis.set(1, 0, 0);

          posOrbit.applyAxisAngle(rotationAxis, elapsed * rotationSpeed);
        }

        currentPositions.push(new THREE.Vector3().lerpVectors(posSphere, posOrbit, ease));
      }
    }

    // Update node positions inside InstancedMesh
    if (inst) {
      const tempObj = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        tempObj.position.copy(currentPositions[i]);
        // Node pulse scale
        const scale = 0.95 + Math.sin(elapsed * 2 + i) * 0.15;
        tempObj.scale.setScalar(scale);
        tempObj.updateMatrix();
        inst.setMatrixAt(i, tempObj.matrix);
        // Reactive color palette updating in GPU
        inst.setColorAt(i, activePalette[i % activePalette.length]);
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }

    // Dynamic Connections - optimized with spatial hashing
    const lines = lineRef.current;
    if (lines) {
      const linePos = lines.geometry.attributes.position.array as Float32Array;
      let lineIndex = 0;
      const maxLines = 150;
      const maxDist = p > 0.6 ? 1.5 : 2.5;
      const cellSize = maxDist * 1.1;

      // Build spatial hash grid
      const grid = new Map<string, number[]>();
      for (let i = 0; i < count; i++) {
        const pos = currentPositions[i];
        const cellX = Math.floor(pos.x / cellSize);
        const cellY = Math.floor(pos.y / cellSize);
        const cellZ = Math.floor(pos.z / cellSize);
        const key = `${cellX},${cellY},${cellZ}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(i);
      }

      // Only check neighbors in nearby cells
      for (let i = 0; i < count; i++) {
        const pi = currentPositions[i];
        const cellX = Math.floor(pi.x / cellSize);
        const cellY = Math.floor(pi.y / cellSize);
        const cellZ = Math.floor(pi.z / cellSize);

        for (let dx = -1; dx <= 1 && lineIndex < maxLines; dx++) {
          for (let dy = -1; dy <= 1 && lineIndex < maxLines; dy++) {
            for (let dz = -1; dz <= 1 && lineIndex < maxLines; dz++) {
              const key = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
              const cell = grid.get(key);
              if (!cell) continue;
              for (const j of cell) {
                if (j <= i) continue;
                const pj = currentPositions[j];
                const dist = pi.distanceTo(pj);
                if (dist < maxDist) {
                  const offset = lineIndex * 6;
                  linePos[offset] = pi.x;
                  linePos[offset + 1] = pi.y;
                  linePos[offset + 2] = pi.z;
                  linePos[offset + 3] = pj.x;
                  linePos[offset + 4] = pj.y;
                  linePos[offset + 5] = pj.z;
                  lineIndex++;
                  if (lineIndex >= maxLines) break;
                }
              }
            }
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
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(150 * 6), 3));
    return geom;
  }, []);

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null as any, null as any, count]} frustumCulled>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshPhysicalMaterial
          roughness={isLight ? 0.15 : 0.05}
          metalness={isLight ? 0.6 : 0.9}
          clearcoat={1.0}
          transparent
          opacity={0.9}
          emissive={isLight ? "#4f46e5" : "#a855f7"}
          emissiveIntensity={isLight ? 0.6 : 0.25}
        />
      </instancedMesh>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color={isLight ? "#4f46e5" : "#00e6cc"} transparent opacity={isLight ? 0.25 : 0.15} />
      </lineSegments>
    </group>
  );
}

export default function HeroScene3D() {
  const { scrollProgress } = useUnifiedScene();

  useEffect(() => {
    // Scroll progress tracker linked to window scroll
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
      },
    });

    return () => trigger.kill();
  }, [scrollProgress]);

  return (
    <RegisterSceneElement id="hero-scene-3d">
      <MorphingConstellation />
    </RegisterSceneElement>
  );
}
