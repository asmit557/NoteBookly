"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Neural-network node graph ─────────────────────────────────────────────────

function NeuralNet() {
  const groupRef = useRef<THREE.Group>(null);

  // Build nodes + connecting line segments once
  const { nodeGeo, lineGeo } = useMemo(() => {
    const count = 48;
    const pts: [number, number, number][] = Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 9,
    ]);

    const lineVerts: number[] = [];
    const maxDist = 5.5;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const d = Math.hypot(
          pts[i][0] - pts[j][0],
          pts[i][1] - pts[j][1],
          pts[i][2] - pts[j][2]
        );
        if (d < maxDist) {
          lineVerts.push(...pts[i], ...pts[j]);
        }
      }
    }

    const nodeArr = new Float32Array(pts.flat());
    const lineArr = new Float32Array(lineVerts);

    const nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute("position", new THREE.BufferAttribute(nodeArr, 3));

    const lGeo = new THREE.BufferGeometry();
    if (lineArr.length > 0) {
      lGeo.setAttribute("position", new THREE.BufferAttribute(lineArr, 3));
    }

    return { nodeGeo: nGeo, lineGeo: lGeo };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.032;
    groupRef.current.rotation.x = Math.sin(t * 0.018) * 0.09;
  });

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      <points geometry={nodeGeo}>
        <pointsMaterial
          size={0.09}
          color="#7c6dff"
          transparent
          opacity={0.75}
          sizeAttenuation
        />
      </points>

      {/* Edges */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color="#6c63ff" transparent opacity={0.13} />
      </lineSegments>
    </group>
  );
}

// ── Floating orbs ─────────────────────────────────────────────────────────────

function Orb({
  pos,
  radius,
  speed,
  color,
}: {
  pos: [number, number, number];
  radius: number;
  speed: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed;
    ref.current.position.set(
      pos[0] + Math.cos(t * 0.6) * 0.6,
      pos[1] + Math.sin(t) * 0.5,
      pos[2]
    );
  });

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.055} />
    </mesh>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <NeuralNet />
      <Orb pos={[-5, 3, -4]} radius={3.2} speed={0.22} color="#6c63ff" />
      <Orb pos={[5, -2, -5]} radius={2.8} speed={0.18} color="#a78bfa" />
      <Orb pos={[0, -4, -3]} radius={2} speed={0.28} color="#7c6dff" />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function DashboardBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 11], fov: 52 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
        // Disable R3F event system — same pattern as HeroScene
        events={() =>
          ({ enabled: false, priority: 0, compute: () => {} } as never)
        }
      >
        <Scene />
      </Canvas>

      {/* Vignette overlay so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 40%, transparent 10%, rgba(8,8,16,0.25) 70%, rgba(8,8,16,0.45) 100%)",
        }}
      />
    </div>
  );
}
