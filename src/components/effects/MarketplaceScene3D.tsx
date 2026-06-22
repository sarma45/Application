"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMarketplaceStore, MarketplaceAgent } from "@/hooks/use-marketplace-store";
import { RegisterSceneElement } from "./UnifiedScene";
import { useTheme } from "@/hooks/use-theme";
import { Html, Line } from "@react-three/drei";
import { useRouter } from "next/navigation";

function AgentMarketNode({
  agent,
  position,
  isHovered,
  isLight,
  onHover,
  onClick,
}: {
  agent: MarketplaceAgent;
  position: [number, number, number];
  isHovered: boolean;
  isLight: boolean;
  onHover: (_hovered: boolean) => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const ring = ringRef.current;
    const t = clock.getElapsedTime();

    if (mesh) {
      const hoverScale = isHovered ? 1.35 : 1.0;
      const pulse = 1.0 + Math.sin(t * 3.0 + agent.totalRuns) * 0.05;
      mesh.scale.setScalar(hoverScale * pulse);
    }

    if (ring) {
      ring.rotation.z = t * (isHovered ? 2.2 : 0.5);
      ring.rotation.x = t * 0.25;
    }
  });

  const nodeColor = useMemo(() => {
    if (agent.category === "CHAT") return isLight ? "#7c3aed" : "#a855f7";
    if (agent.category === "CODE") return isLight ? "#0891b2" : "#00e6cc";
    if (agent.category === "DATA") return isLight ? "#ea580c" : "#f97316";
    return isLight ? "#2563eb" : "#3b82f6";
  }, [agent.category, isLight]);

  return (
    <group position={position}>
      {/* Outer Force-Field Aura (Pulse Glow) */}
      <mesh>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={isHovered ? 0.35 : 0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Cybernetic Planetary Orbit Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.38, 0.015, 8, 32]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={isHovered ? 0.75 : 0.25}
          wireframe
        />
      </mesh>

      {/* Node Core */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshPhysicalMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isHovered ? 1.5 : 0.4}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Floating 3D HUD Label */}
      <Html distanceFactor={6} position={[0, 0.52, 0]} center>
        <div
          onClick={onClick}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          className={`glass px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all duration-300 cursor-pointer pointer-events-auto select-none backdrop-blur-md ${
            isHovered
              ? "border-purple-500 scale-105 shadow-[0_0_20px_rgba(168,85,247,0.45)] bg-purple-950/30"
              : "border-theme/10 opacity-75 bg-theme/5 hover:border-theme/40 hover:opacity-100"
          }`}
          style={{
            whiteSpace: "nowrap",
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-theme">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isHovered ? "animate-ping" : ""}`} style={{ backgroundColor: nodeColor }} />
              {agent.name}
            </span>
            <span className="text-[8px] opacity-70 font-mono">({agent.totalRuns} runs)</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

function MarketGalaxy() {
  const { agents, hoveredAgentId, setHoveredAgentId } = useMarketplaceStore();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Position nodes along a helical spiral layout
  const nodePositions = useMemo(() => {
    const coords: Record<string, [number, number, number]> = {};
    if (agents.length === 0) return coords;

    const radius = 2.4;
    const heightRange = 2.4;

    agents.forEach((agent, idx) => {
      const angle = (idx / agents.length) * Math.PI * 2.0;
      const y = heightRange / 2 - (idx / (agents.length - 1 || 1)) * heightRange;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      coords[agent.id] = [x, y, z];
    });

    return coords;
  }, [agents]);

  // Slowly rotate the entire galaxy
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    
    // Auto rotation unless hovered
    if (!hoveredAgentId) {
      group.rotation.y = clock.getElapsedTime() * 0.08;
    }
  });

  // Track camera transitions on node hover
  useEffect(() => {
    if (hoveredAgentId && nodePositions[hoveredAgentId]) {
      const pos = nodePositions[hoveredAgentId];
      // Target camera slightly dollied in
      const targetPos = new THREE.Vector3(pos[0], pos[1], pos[2] + 4.5);
      
      
      
      // Perform smooth camera interpolation using standard easing
      const targetX = targetPos.x;
      const targetY = targetPos.y;
      const targetZ = targetPos.z;

      const runDolly = () => {
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
      };

      const id = setInterval(runDolly, 16);
      return () => clearInterval(id);
    } else {
      // Return to default position
      const runDolly = () => {
        camera.position.x += (0 - camera.position.x) * 0.05;
        camera.position.y += (0 - camera.position.y) * 0.05;
        camera.position.z += (7 - camera.position.z) * 0.05;
      };
      const id = setInterval(runDolly, 16);
      return () => clearInterval(id);
    }
  }, [hoveredAgentId, nodePositions, camera]);

  if (agents.length === 0) return null;

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
      {/* Node Renderers */}
      {agents.map((agent) => {
        const pos = nodePositions[agent.id];
        if (!pos) return null;
        return (
          <AgentMarketNode
            key={agent.id}
            agent={agent}
            position={pos}
            isHovered={hoveredAgentId === agent.id}
            isLight={isLight}
            onHover={(h) => setHoveredAgentId(h ? agent.id : null)}
            onClick={() => {
              setHoveredAgentId(null);
              router.push(`/agents/${agent.slug}`);
            }}
          />
        );
      })}

      {/* Dynamic Network Connections between nodes in the same category */}
      {agents.flatMap((agentA, i) =>
        agents.slice(i + 1).map((agentB) => {
          if (agentA.category !== agentB.category) return null;
          const posA = nodePositions[agentA.id];
          const posB = nodePositions[agentB.id];
          if (!posA || !posB) return null;

          const points = [new THREE.Vector3(...posA), new THREE.Vector3(...posB)];
          const lineColor =
            agentA.category === "CHAT"
              ? "#a855f7"
              : agentA.category === "CODE"
                ? "#00e6cc"
                : agentA.category === "DATA"
                  ? "#f97316"
                  : "#3b82f6";
          const isActive = hoveredAgentId === agentA.id || hoveredAgentId === agentB.id;

          return (
            <Line
              key={`${agentA.id}-${agentB.id}`}
              points={points}
              color={lineColor}
              lineWidth={isActive ? 1.8 : 0.6}
              transparent
              opacity={isActive ? 0.5 : 0.15}
            />
          );
        })
      )}
    </group>
  );
}

export default function MarketplaceScene3D() {
  const { agents } = useMarketplaceStore();

  if (agents.length === 0) return null;

  return (
    <RegisterSceneElement id="marketplace-scene-3d">
      <MarketGalaxy />
    </RegisterSceneElement>
  );
}
