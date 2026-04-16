"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/* ── Particles ─────────────────────────────────────────── */
function Particles({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.018;
    ref.current.rotation.x = clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        color="#6c63ff"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Floating wireframe ─────────────────────────────────── */
function FloatingGeo() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current || !groupRef.current) return;
    const t = clock.elapsedTime;
    // Slow self-rotation
    meshRef.current.rotation.x = t * 0.12;
    meshRef.current.rotation.y = t * 0.18;
    // Float
    groupRef.current.position.y = Math.sin(t * 0.55) * 0.18;
    // Mouse parallax (damped)
    groupRef.current.rotation.x += (mouse.y * 0.3 - groupRef.current.rotation.x) * 0.04;
    groupRef.current.rotation.y += (mouse.x * 0.3 - groupRef.current.rotation.y) * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* Outer wireframe */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial color="#6c63ff" wireframe transparent opacity={0.13} />
      </mesh>
      {/* Inner solid — very faint */}
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial color="#6c63ff" transparent opacity={0.03} side={THREE.FrontSide} />
      </mesh>
      {/* Soft glow point */}
      <pointLight color="#6c63ff" intensity={2} distance={6} decay={2} />
    </group>
  );
}

/* ── Ring ───────────────────────────────────────────────── */
function Ring() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.elapsedTime * 0.06;
    ref.current.rotation.x = Math.PI / 2 + Math.sin(clock.elapsedTime * 0.4) * 0.15;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[2.6, 0.006, 2, 120]} />
      <meshBasicMaterial color="#a78bfa" transparent opacity={0.18} />
    </mesh>
  );
}

/* ── Canvas wrapper ─────────────────────────────────────── */
export default function HeroScene() {
  return (
    <Canvas
      camera={{ fov: 55, near: 0.1, far: 100, position: [0, 0, 6] }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Particles />
      <FloatingGeo />
      <Ring />
    </Canvas>
  );
}
