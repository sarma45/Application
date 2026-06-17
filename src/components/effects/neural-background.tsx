"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface NeuralBackgroundProps {
  variant?: "default" | "dashboard" | "minimal";
}

export function NeuralBackground({ variant = "default" }: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMinimal = variant === "minimal";

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = isMinimal ? 18 : 10;

    const clock = new THREE.Clock();

    const nodeCount = isMinimal ? 30 : 80;
    const morphCount = isMinimal ? 1 : 5;
    const particleCount = isMinimal ? 100 : 600;

    const palette = [
      new THREE.Color(0x6a00f0),
      new THREE.Color(0x00e6cc),
      new THREE.Color(0xa855f7),
      new THREE.Color(0x3b82f6),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x06b6d4),
    ];

    const nodeMeshes: { mesh: THREE.Mesh; basePos: THREE.Vector3; phase: number; color: THREE.Color }[] = [];
    const positions: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 6 - 1;
      const pos = new THREE.Vector3(x, y, z);
      positions.push(pos);

      const size = 0.06 + Math.random() * 0.08;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const geo = new THREE.SphereGeometry(size, 12, 12);
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
        roughness: 0.1,
        metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      nodeMeshes.push({ mesh, basePos: pos.clone(), phase: Math.random() * Math.PI * 2, color });
    }

    const lineMat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.08,
    });

    const connectionPairs: { i: number; j: number; dist: number }[] = [];
    const maxDist = isMinimal ? 7 : 5;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < maxDist && Math.random() < 0.25) {
          connectionPairs.push({ i, j, dist });
        }
      }
    }

    const linePositions = new Float32Array(connectionPairs.length * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineSystem = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSystem);

    const morphs: { mesh: THREE.Mesh; phase: number; speed: number }[] = [];
    const morphGeos = [new THREE.IcosahedronGeometry(1, 1), new THREE.OctahedronGeometry(1, 0), new THREE.TorusKnotGeometry(0.5, 0.2, 32, 8)];

    for (let i = 0; i < morphCount; i++) {
      const scale = 0.6 + Math.random() * 1.0;
      const geo = morphGeos[i % morphGeos.length];
      const color = palette[i % palette.length];
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.05 + Math.random() * 0.04,
        wireframe: true,
        metalness: 0.4,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(scale);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        -4 - Math.random() * 4,
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);
      morphs.push({ mesh, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.3 });
    }

    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 20;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      particleSizes[i] = 1 + Math.random() * 3;
      particleSpeeds.push(0.1 + Math.random() * 0.3);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0x6a00f0,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    let animationId: number;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    function animate() {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const t = elapsed * 0.4;

      mouseRef.current.targetX += (mouseRef.current.x - mouseRef.current.targetX) * 0.05;
      mouseRef.current.targetY += (mouseRef.current.y - mouseRef.current.targetY) * 0.05;

      const mx = mouseRef.current.targetX * 0.4;
      const my = mouseRef.current.targetY * 0.4;

      nodeMeshes.forEach(({ mesh, basePos, phase, color }) => {
        const waveX = Math.sin(t + phase) * 0.15;
        const waveY = Math.cos(t * 0.7 + phase * 0.5) * 0.15;
        const waveZ = Math.sin(t * 0.5 + phase * 0.3) * 0.1;
        mesh.position.x = basePos.x + waveX;
        mesh.position.y = basePos.y + waveY;
        mesh.position.z = basePos.z + waveZ;

        const pulse = 0.6 + 0.4 * Math.sin(t * 1.5 + phase);
        (mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.3 + pulse * 0.7;
        mesh.scale.setScalar(0.8 + pulse * 0.2);
      });

      const cycle = Math.sin(t * 0.3);
      const glowColor = cycle > 0 ? palette[1] : palette[0];
      const lerpColor = palette[0].clone().lerp(palette[1], Math.abs(cycle));
      lineMat.color.copy(lerpColor);
      lineMat.opacity = 0.05 + 0.06 * Math.abs(cycle);

      const posAttr = lineGeo.attributes.position;
      const array = posAttr.array as Float32Array;
      connectionPairs.forEach(({ i, j }, idx) => {
        const ni = nodeMeshes[i];
        const nj = nodeMeshes[j];
        if (ni && nj) {
          const offset = idx * 6;
          array[offset] = ni.mesh.position.x;
          array[offset + 1] = ni.mesh.position.y;
          array[offset + 2] = ni.mesh.position.z;
          array[offset + 3] = nj.mesh.position.x;
          array[offset + 4] = nj.mesh.position.y;
          array[offset + 5] = nj.mesh.position.z;
        }
      });
      posAttr.needsUpdate = true;

      morphs.forEach(({ mesh, phase, speed }) => {
        mesh.rotation.x += 0.004 * speed;
        mesh.rotation.y += 0.006 * speed;
        mesh.rotation.z += 0.002 * speed;
        const waveX = Math.sin(t * 0.15 + phase) * 0.5;
        const waveY = Math.cos(t * 0.2 + phase) * 0.5;
        mesh.position.x += (waveX - mesh.position.x + (mesh.position.x > 0 ? -1 : 1) * 2) * 0.0005;
        mesh.position.y += (waveY - mesh.position.y) * 0.0005;
        const breathe = 1 + 0.15 * Math.sin(t * speed + phase);
        mesh.scale.setScalar(breathe);
        (mesh.material as THREE.MeshPhysicalMaterial).opacity = 0.04 + 0.04 * Math.sin(t * 0.5 + phase);
        (mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.05 + 0.1 * Math.sin(t * 0.3 + phase);
      });

      const pPos = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3 + 1] += Math.sin(elapsed * particleSpeeds[i] + i) * 0.001;
        pPos[i * 3] += Math.cos(elapsed * particleSpeeds[i] * 0.7 + i * 0.5) * 0.001;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      particleMat.color.copy(lerpColor);
      particleMat.opacity = 0.2 + 0.2 * Math.abs(cycle);

      camera.position.x += (mx * 0.6 - camera.position.x) * 0.015;
      camera.position.y += (-my * 0.6 - camera.position.y) * 0.015;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
            else child.material.dispose();
          }
        }
      });
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
    />
  );
}
