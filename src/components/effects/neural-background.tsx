"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface NeuralBackgroundProps {
  variant?: "default" | "dashboard" | "minimal";
}

export function NeuralBackground({ variant = "default" }: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = variant === "minimal" ? 20 : 12;

    const nodesCount = variant === "minimal" ? 40 : 120;
    const geometries: THREE.Mesh[] = [];

    const nodeGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x6a00f0 });

    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < nodesCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 8 - 2;
      positions.push(new THREE.Vector3(x, y, z));
      if (nodesCount <= 120) {
        const node = new THREE.Mesh(nodeGeo, nodeMat.clone());
        node.position.set(x, y, z);
        scene.add(node);
        geometries.push(node);
      }
    }

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6a00f0,
      transparent: true,
      opacity: 0.15,
    });

    const connections = new Set<string>();
    const maxDist = variant === "minimal" ? 6 : 4.5;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < maxDist && Math.random() < 0.3) {
          const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
          connections.add(key);
        }
      }
    }

    const lineVertices: number[] = [];
    connections.forEach((key) => {
      const [i, j] = key.split("-").map(Number);
      lineVertices.push(
        positions[i].x, positions[i].y, positions[i].z,
        positions[j].x, positions[j].y, positions[j].z,
      );
    });

    const lineGeo3 = new THREE.BufferGeometry();
    lineGeo3.setAttribute("position", new THREE.Float32BufferAttribute(lineVertices, 3));
    const lineSystem = new THREE.LineSegments(lineGeo3, lineMat);
    scene.add(lineSystem);

    const morphMeshes: THREE.Mesh[] = [];
    if (variant !== "minimal") {
      const morphCount = 3;
      for (let i = 0; i < morphCount; i++) {
        const size = 0.8 + Math.random() * 1.2;
        const geo = new THREE.IcosahedronGeometry(size, 1);
        const mat = new THREE.MeshPhysicalMaterial({
          color: i === 1 ? 0x00e6cc : 0x6a00f0,
          transparent: true,
          opacity: 0.06 + Math.random() * 0.04,
          wireframe: true,
          metalness: 0.3,
          roughness: 0.7,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          -3 - Math.random() * 4,
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        scene.add(mesh);
        morphMeshes.push(mesh);
      }
    }

    let time = 0;
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
      time += 0.003;
      animationId = requestAnimationFrame(animate);

      const mx = mouseRef.current.x * 0.3;
      const my = mouseRef.current.y * 0.3;

      if (nodesCount <= 120) {
        geometries.forEach((node, i) => {
          node.position.x += Math.sin(time + i) * 0.002;
          node.position.y += Math.cos(time * 0.7 + i * 0.5) * 0.002;
          const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i * 0.3);
          (node.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.7;
        });
      }

      const isBlue = Math.sin(time * 0.5) > 0;
      const glowColor = isBlue ? 0x00e6cc : 0x6a00f0;
      const glowVec = new THREE.Color(glowColor);
      lineMat.color.copy(glowVec);
      lineMat.opacity = 0.08 + 0.07 * Math.sin(time * 0.5);

      morphMeshes.forEach((mesh, i) => {
        mesh.rotation.x += 0.002 + i * 0.001;
        mesh.rotation.y += 0.003 + i * 0.001;
        mesh.position.x += Math.sin(time * 0.2 + i * 2) * 0.003;
        mesh.position.y += Math.cos(time * 0.3 + i * 2) * 0.003;
        const scale = 1 + 0.1 * Math.sin(time * 0.5 + i);
        mesh.scale.set(scale, scale, scale);
      });

      camera.position.x += (mx * 0.5 - camera.position.x) * 0.02;
      camera.position.y += (-my * 0.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    function onMouseMove(e: MouseEvent) {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    }
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      nodeGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      lineGeo3.dispose();
      morphMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      });
      renderer.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
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
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}
