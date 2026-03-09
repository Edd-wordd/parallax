"use client";

import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
interface OrbitControlsRef {
  target: THREE.Vector3;
  update: () => void;
}
import * as THREE from "three";
import type { SkyTargetMarker } from "@/lib/sky/useSkyModel";
import { SKY_SPHERE_RADIUS } from "@/lib/sky/skyConstants";

const TARGET_COLOR = "#22d3ee";

const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 0, 95];

interface LiveSkyCanvasProps {
  starPositions: Float32Array;
  starSizes: Float32Array;
  starCount: number;
  constellationLinePoints: Float32Array;
  constellationLineCount: number;
  targetMarkers: SkyTargetMarker[];
  showConstellations: boolean;
  showTargets: boolean;
  showHorizon: boolean;
  hoveredTargetId: string | null;
  onTargetHover: (target: SkyTargetMarker | null, pos?: { x: number; y: number }) => void;
  orbitKey: number;
}

/** Resets camera and controls when orbitKey changes */
function RecenterController({
  orbitKey,
  controlsRef,
}: {
  orbitKey: number;
  controlsRef: React.RefObject<OrbitControlsRef | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...DEFAULT_CAMERA_POSITION);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [orbitKey, camera, controlsRef]);

  return null;
}

const SkyDome = React.memo(function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[SKY_SPHERE_RADIUS * 1.01, 32, 32]} />
      <meshBasicMaterial
        color="#0a0c10"
        transparent
        opacity={0.02}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
});

const Starfield = React.memo(function Starfield({
  positions,
  count,
}: {
  positions: Float32Array;
  sizes: Float32Array;
  count: number;
}) {
  // Removed useFrame opacity pulse — was causing continuous repaints
  if (count === 0) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color="#e8eaed"
      />
    </points>
  );
});

const ConstellationLinesLayer = React.memo(function ConstellationLinesLayer({
  points,
  count,
  visible,
}: {
  points: Float32Array;
  count: number;
  visible: boolean;
}) {
  if (!visible || count === 0) return null;

  const linePairs = useMemo(() => {
    const pairs: [number, number, number][][] = [];
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      pairs.push(
        [
          [points[o], points[o + 1], points[o + 2]],
          [points[o + 3], points[o + 4], points[o + 5]],
        ] as [number, number, number][]
      );
    }
    return pairs;
  }, [points, count]);

  return (
    <group>
      {linePairs.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#0f766e"
          lineWidth={0.5}
          transparent
          opacity={0.5}
        />
      ))}
    </group>
  );
});

const TargetMarker = React.memo(function TargetMarker({
  target,
  visible,
  hovered,
  onHover,
}: {
  target: SkyTargetMarker;
  visible: boolean;
  hovered: boolean;
  onHover: (target: SkyTargetMarker | null, pos?: { x: number; y: number }) => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover(target, { x: e.clientX, y: e.clientY });
    },
    [target, onHover]
  );

  const handlePointerOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  if (!visible) return null;

  const [x, y, z] = target.vector;
  const color = target.color ?? TARGET_COLOR;
  const displayScale = hovered ? 1.15 : 1;

  return (
    <group position={[x, y, z]} scale={displayScale}>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerOver}
      >
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.5, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={14}>
        <span
          className="uppercase font-mono text-[9px] text-cyan-500/70 whitespace-nowrap"
          style={{ textShadow: "0 0 8px rgba(6,182,212,0.3)" }}
        >
          {target.label}
        </span>
      </Html>
    </group>
  );
});

const Horizon = React.memo(function Horizon({ visible }: { visible: boolean }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const r = SKY_SPHERE_RADIUS;
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(t) * r, 0, Math.sin(t) * r]);
    }
    return pts;
  }, []);

  const cardinals = useMemo(
    () => [
      { label: "N", x: 0, z: SKY_SPHERE_RADIUS, y: 0 },
      { label: "E", x: SKY_SPHERE_RADIUS, z: 0, y: 0 },
      { label: "S", x: 0, z: -SKY_SPHERE_RADIUS, y: 0 },
      { label: "W", x: -SKY_SPHERE_RADIUS, z: 0, y: 0 },
    ],
    []
  );

  if (!visible) return null;

  return (
    <group>
      <Line
        points={points}
        color="#0f172a"
        lineWidth={0.8}
        transparent
        opacity={0.5}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[SKY_SPHERE_RADIUS - 2, SKY_SPHERE_RADIUS + 2, 64]} />
        <meshBasicMaterial
          color="#0e7490"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {cardinals.map(({ label, x, z }) => (
        <Html key={label} position={[x, 0, z]} center distanceFactor={14}>
          <span
            className="uppercase font-mono text-[9px] text-cyan-500/40"
            style={{ textShadow: "0 0 8px rgba(6,182,212,0.3)" }}
          >
            {label}
          </span>
        </Html>
      ))}
    </group>
  );
});

/** Subtle dome edge outline at sphere boundary */
const DomeEdgeOutline = React.memo(function DomeEdgeOutline() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const r = SKY_SPHERE_RADIUS;
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(t) * r, 0, Math.sin(t) * r]);
    }
    return pts;
  }, []);

  return (
    <Line
      points={points}
      color="#1e3a5f"
      lineWidth={0.4}
      transparent
      opacity={0.12}
    />
  );
});

function Scene(props: LiveSkyCanvasProps) {
  const controlsRef = useRef<OrbitControlsRef>(null);
  const {
    starPositions,
    starSizes,
    starCount,
    constellationLinePoints,
    constellationLineCount,
    targetMarkers,
    showConstellations,
    showTargets,
    showHorizon,
    hoveredTargetId,
    onTargetHover,
    orbitKey,
  } = props;

  return (
    <>
      <color attach="background" args={["#050607"]} />
      <fog attach="fog" args={["#050607", 60, 400]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[12, 12, 12]} intensity={0.6} />
      <RecenterController orbitKey={orbitKey} controlsRef={controlsRef} />
      <Starfield
        positions={starPositions}
        sizes={starSizes}
        count={starCount}
      />
      <SkyDome />
      <ConstellationLinesLayer
        points={constellationLinePoints}
        count={constellationLineCount}
        visible={showConstellations}
      />
      {targetMarkers.map((t) => (
        <TargetMarker
          key={t.id}
          target={t}
          visible={showTargets}
          hovered={t.id === hoveredTargetId}
          onHover={onTargetHover}
        />
      ))}
      <Horizon visible={showHorizon} />
      <DomeEdgeOutline />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={70}
        maxDistance={140}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function LiveSkyCanvas(props: LiveSkyCanvasProps) {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
      }}
      camera={{
        position: DEFAULT_CAMERA_POSITION,
        fov: 50,
        near: 0.1,
        far: 400,
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
