"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/* ─── Constants ──────────────────────────────────────────── */
const W = 1.82;
const H = 2.42;
const PAGES = 7;

const C_COVER_N = new THREE.Color("#0c0c1e");
const C_COVER_P = new THREE.Color("#eeeef6");
const C_SPINE_N = new THREE.Color("#6c63ff");
const C_SPINE_P = new THREE.Color("#ef4444");

/* ─── Single page ────────────────────────────────────────── */
function Page({
  idx,
  prog,
}: {
  idx: number;
  prog: React.MutableRefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat  = useRef<THREE.MeshStandardMaterial>(null);

  const t     = idx / (PAGES - 1);
  const baseZ = 0.006 + idx * 0.013;

  const c0 = useMemo(() => new THREE.Color("#0c0c1e"), []);
  const c1 = useMemo(() => new THREE.Color("#f2f2f8"), []);

  useFrame(() => {
    if (!mesh.current || !mat.current) return;
    const p     = prog.current;
    const burst = Math.sin(p * Math.PI);
    const fan   = burst * (t - 0.5) * 2.8;

    mesh.current.rotation.y  = fan;
    mesh.current.position.x  = Math.sin(fan) * 1.15;
    mesh.current.position.z  = baseZ + burst * 0.035 * t;
    mat.current.color.lerpColors(c0, c1, p);
    mat.current.emissiveIntensity = burst * 0.12;
  });

  return (
    <mesh ref={mesh} position={[0, 0, baseZ]}>
      <boxGeometry args={[W - 0.16, H - 0.14, 0.007]} />
      <meshStandardMaterial
        ref={mat}
        color={c0}
        emissive={C_SPINE_N}
        emissiveIntensity={0}
        roughness={0.45}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Full document ──────────────────────────────────────── */
function Document({ hovered }: { hovered: boolean }) {
  const prog      = useRef(0);
  const coverMat  = useRef<THREE.MeshStandardMaterial>(null);
  const spineMat  = useRef<THREE.MeshStandardMaterial>(null);
  const headerMat = useRef<THREE.MeshBasicMaterial>(null);
  const codeRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const docRefs   = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  /* Front face z — always in front of pages + cover */
  const frontZ = 0.006 + PAGES * 0.013 + 0.045;

  const cLines = useMemo(() => [
    { y:  0.86, w: 1.02, c: "#6c63ff" },
    { y:  0.62, w: 0.70, c: "#a78bfa" },
    { y:  0.38, w: 0.90, c: "#818cf8" },
    { y:  0.14, w: 0.54, c: "#6c63ff" },
    { y: -0.10, w: 0.84, c: "#a78bfa" },
    { y: -0.34, w: 0.60, c: "#818cf8" },
    { y: -0.58, w: 0.76, c: "#6c63ff" },
    { y: -0.82, w: 0.48, c: "#a78bfa" },
  ], []);

  const dLines = useMemo(() => [
    { y:  0.64, w: 1.18 },
    { y:  0.46, w: 0.90 },
    { y:  0.28, w: 1.08 },
    { y:  0.10, w: 0.74 },
    { y: -0.08, w: 1.02 },
    { y: -0.26, w: 0.84 },
    { y: -0.44, w: 1.12 },
    { y: -0.62, w: 0.60 },
    { y: -0.80, w: 0.98 },
  ], []);

  useFrame((_, delta) => {
    prog.current += ((hovered ? 1 : 0) - prog.current) * Math.min(delta * 3.2, 1);
    const p     = prog.current;
    const burst = Math.sin(p * Math.PI);

    if (coverMat.current) {
      coverMat.current.color.lerpColors(C_COVER_N, C_COVER_P, p);
      coverMat.current.emissiveIntensity = burst * 0.2;
    }
    if (spineMat.current) {
      spineMat.current.color.lerpColors(C_SPINE_N, C_SPINE_P, p);
      spineMat.current.emissiveIntensity = burst * 0.15;
    }
    if (headerMat.current) {
      headerMat.current.opacity = p * 0.96;
    }

    codeRefs.current.forEach(m => { if (m) m.opacity = (1 - p) * 0.78; });
    docRefs.current.forEach(m  => { if (m) m.opacity = p * 0.68; });
  });

  return (
    <group>
      {/* ── Pages ── */}
      {Array.from({ length: PAGES }, (_, i) => (
        <Page key={i} idx={i} prog={prog} />
      ))}

      {/* ── Back cover ── */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[W, H, 0.02]} />
        <meshStandardMaterial color="#0c0c1e" roughness={0.5} />
      </mesh>

      {/* ── Front cover ── */}
      <mesh>
        <boxGeometry args={[W, H, 0.055]} />
        <meshStandardMaterial
          ref={coverMat}
          color="#0c0c1e"
          emissive={C_SPINE_N}
          emissiveIntensity={0}
          roughness={0.28}
          metalness={0.06}
        />
      </mesh>

      {/* ── Spine ── */}
      <mesh position={[-(W / 2 - 0.022), 0, 0]}>
        <boxGeometry args={[0.044, H, 0.18]} />
        <meshStandardMaterial
          ref={spineMat}
          color="#6c63ff"
          emissive="#6c63ff"
          emissiveIntensity={0}
          roughness={0.35}
        />
      </mesh>

      {/* ── Notebook code lines ── */}
      {cLines.map((l, i) => (
        <mesh key={`c${i}`} position={[-0.18, l.y, frontZ]}>
          <planeGeometry args={[l.w, 0.052]} />
          <meshBasicMaterial
            ref={(el: THREE.MeshBasicMaterial | null) => { codeRefs.current[i] = el; }}
            color={l.c}
            transparent
            opacity={0.78}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── PDF red header ── */}
      <mesh position={[0.02, 1.02, frontZ]}>
        <planeGeometry args={[1.56, 0.14]} />
        <meshBasicMaterial
          ref={headerMat}
          color="#ef4444"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* ── PDF document lines ── */}
      {dLines.map((l, i) => (
        <mesh key={`d${i}`} position={[-0.06, l.y, frontZ]}>
          <planeGeometry args={[l.w, 0.048]} />
          <meshBasicMaterial
            ref={(el: THREE.MeshBasicMaterial | null) => { docRefs.current[i] = el; }}
            color="#8b90aa"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Sparkles ── */}
      <Sparkles
        visible={hovered}
        count={55}
        scale={[3.6, 4.8, 2.2]}
        size={1.4}
        speed={0.55}
        color="#6c63ff"
        opacity={0.75}
      />
    </group>
  );
}

/* ─── Exported Canvas ────────────────────────────────────── */
export default function ConversionCanvas({ hovered }: { hovered: boolean }) {
  return (
    <Canvas
      camera={{ fov: 40, position: [0, 0, 6.2], near: 0.1, far: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 5, 6]} intensity={1.1} color="#ffffff" />
      <pointLight position={[-3, 2, 4]} intensity={1.0} color="#6c63ff" />
      <pointLight position={[3, -2, 3]} intensity={0.5} color="#a78bfa" />

      <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.28}>
        <Document hovered={hovered} />
      </Float>
    </Canvas>
  );
}
