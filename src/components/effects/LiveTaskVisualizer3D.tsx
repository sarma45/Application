"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVisualizerStore, VisualizerStep } from "@/hooks/use-visualizer-store";
import { RegisterSceneElement } from "./UnifiedScene";
import { useTheme } from "@/hooks/use-theme";
import { Line, Text } from "@react-three/drei";

function TaskNodeMesh({
  position,
  step,
  isLight,
}: {
  position: [number, number, number];
  step: VisualizerStep;
  isLight: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Pulse ready or running steps
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const ring = ringRef.current;
    const t = clock.getElapsedTime();

    if (mesh) {
      if (step.status === "running") {
        const scale = 1.2 + Math.sin(t * 8) * 0.15;
        mesh.scale.setScalar(scale);
      } else {
        mesh.scale.setScalar(1.0);
      }
    }

    if (ring && step.status === "running") {
      ring.rotation.x = t * 2.0;
      ring.rotation.y = t * 1.5;
    }
  });

  const materialProps = useMemo(() => {
    let color = "#4b5563"; // pending
    let emissive = "#1f2937";
    let emissiveIntensity = 0.2;

    if (step.status === "running") {
      color = isLight ? "#2563eb" : "#3b82f6";
      emissive = "#60a5fa";
      emissiveIntensity = 1.5;
    } else if (step.status === "success") {
      color = isLight ? "#059669" : "#10b981";
      emissive = "#34d399";
      emissiveIntensity = 1.0;
    } else if (step.status === "error") {
      color = isLight ? "#dc2626" : "#ef4444";
      emissive = "#f87171";
      emissiveIntensity = 2.0;
    } else {
      // Pending / ready
      color = isLight ? "#6366f1" : "#8b5cf6";
      emissive = "#a78bfa";
      emissiveIntensity = 0.4;
    }

    return { color, emissive, emissiveIntensity };
  }, [step.status, isLight]);

  return (
    <group position={position}>
      {/* Dynamic 3D Label above node */}
      <Text
        position={[0, 0.45, 0]}
        fontSize={0.11}
        color={isLight ? "#1e293b" : "#f8fafc"}
        anchorX="center"
        anchorY="middle"
        font={undefined} // defaults to roboto/standard Drei font
      >
        {step.title.length > 20 ? `${step.title.slice(0, 18)}...` : step.title}
      </Text>

      {/* Node Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshPhysicalMaterial
          color={materialProps.color}
          emissive={materialProps.emissive}
          emissiveIntensity={materialProps.emissiveIntensity}
          roughness={0.15}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Outer Rotating Cybernetic Ring for running nodes */}
      {step.status === "running" && (
        <mesh ref={ringRef}>
          <torusGeometry args={[0.28, 0.02, 8, 24]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.65} wireframe />
        </mesh>
      )}

      {/* Static outer ring for successful node indicators */}
      {step.status === "success" && (
        <mesh>
          <torusGeometry args={[0.26, 0.015, 8, 24]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.4} wireframe />
        </mesh>
      )}
    </group>
  );
}

function TaskConnectionLine({
  start,
  end,
  status,
  isLight,
}: {
  start: [number, number, number];
  end: [number, number, number];
  status: string;
  isLight: boolean;
}) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  
  const pulseRef = useRef<THREE.Mesh>(null);

  // Pulse traveling along the execution path
  useFrame(({ clock }) => {
    const pulse = pulseRef.current;
    if (!pulse) return;

    if (status === "running") {
      const t = (clock.getElapsedTime() * 1.5) % 1.0;
      const pos = new THREE.Vector3().lerpVectors(points[0], points[1], t);
      pulse.position.copy(pos);
      pulse.visible = true;
    } else {
      pulse.visible = false;
    }
  });

  const lineColor = useMemo(() => {
    if (status === "success") return isLight ? "#10b981" : "#059669";
    if (status === "error") return isLight ? "#ef4444" : "#b91c1c";
    if (status === "running") return isLight ? "#3b82f6" : "#2563eb";
    return isLight ? "#cbd5e1" : "#3f3f46";
  }, [status, isLight]);

  return (
    <group>
      <Line
        points={points}
        color={lineColor}
        lineWidth={status === "running" ? 2.5 : 1.2}
        transparent
        opacity={status === "pending" ? 0.3 : 0.75}
      />
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color={isLight ? "#60a5fa" : "#93c5fd"} />
      </mesh>
    </group>
  );
}

function LiveGraph() {
  const { plan } = useVisualizerStore();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const groupRef = useRef<THREE.Group>(null);

  // Calculate layout coordinates
  const nodePositions = useMemo(() => {
    const coords: Record<string, [number, number, number]> = {};
    if (plan.length === 0) return coords;

    // Helic tree / curved flow representation
    const radius = 2.0;
    const heightRange = 3.6;

    plan.forEach((step: VisualizerStep, idx: number) => {
      // Helix angle
      const angle = (idx / plan.length) * Math.PI * 1.8;
      // Linear height transition (from top to bottom)
      const y = heightRange / 2 - (idx / (plan.length - 1 || 1)) * heightRange;
      
      // Calculate branching offset if it has dependencies
      let x = radius * Math.cos(angle);
      let z = radius * Math.sin(angle);

      // Offset a bit if it depends on a specific task to show clean tree spacing
      if (step.dependsOn.length > 0) {
        const primaryDep = step.dependsOn[0];
        const depPos = coords[primaryDep];
        if (depPos) {
          x = depPos[0] + (Math.random() - 0.5) * 0.8;
          z = depPos[2] + (Math.random() - 0.5) * 0.8;
        }
      }

      coords[step.id] = [x * 0.8, y, z * 0.8];
    });

    return coords;
  }, [plan]);

  // Orbit rotation
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y = clock.getElapsedTime() * 0.12;
  });

  if (plan.length === 0) return null;

  return (
    <group ref={groupRef} position={[0, -0.2, -1]}>
      {/* Node Renderers */}
      {plan.map((step: VisualizerStep) => {
        const pos = nodePositions[step.id];
        if (!pos) return null;
        return (
          <TaskNodeMesh
            key={step.id}
            position={pos}
            step={step}
            isLight={isLight}
          />
        );
      })}

      {/* Connection Edges */}
      {plan.flatMap((step: VisualizerStep) => {
        const endPos = nodePositions[step.id];
        if (!endPos) return [];

        return step.dependsOn.map((depId: string) => {
          const startPos = nodePositions[depId];
          if (!startPos) return null;

          return (
            <TaskConnectionLine
              key={`${depId}-${step.id}`}
              start={startPos}
              end={endPos}
              status={step.status === "running" ? "running" : step.status === "success" ? "success" : "pending"}
              isLight={isLight}
            />
          );
        });
      })}
    </group>
  );
}

export default function LiveTaskVisualizer3D() {
  const { isActive, plan } = useVisualizerStore();

  if (!isActive || plan.length === 0) return null;

  return (
    <RegisterSceneElement id="live-task-visualizer-3d">
      <LiveGraph />
    </RegisterSceneElement>
  );
}
