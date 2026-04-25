"use client";
import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Center, Bounds } from "@react-three/drei";
import * as THREE from "three";
import { type BodyGender, type BodyZoneId, boneToZone } from "@/lib/bodyZones";

// ── Zone colours ────────────────────────────────────────────────────────────
const COLOR_SKIN     = new THREE.Color("#c8956c");
const COLOR_HOVER    = new THREE.Color("#4d9dff");
const COLOR_SELECTED = new THREE.Color("#34d399");

// ── Types ───────────────────────────────────────────────────────────────────
interface ModelProps {
  gender: BodyGender;
  selectedZone: BodyZoneId | null;
  hoveredZone: BodyZoneId | null;
  onZoneHover: (z: BodyZoneId | null) => void;
  onZoneClick: (z: BodyZoneId) => void;
}

// ── Zone detection from skinned mesh hit ─────────────────────────────────────
function getZoneFromHit(
  e: ThreeEvent<PointerEvent>,
  gender: BodyGender
): BodyZoneId | null {
  const obj = e.object;
  if (!(obj instanceof THREE.SkinnedMesh)) return null;
  const face = e.face;
  if (!face) return null;

  const geo = obj.geometry;
  const skinIndex  = geo.attributes.skinIndex  as THREE.BufferAttribute | undefined;
  const skinWeight = geo.attributes.skinWeight as THREE.BufferAttribute | undefined;
  if (!skinIndex || !skinWeight) return null;

  const boneWeights = new Map<number, number>();
  for (const v of [face.a, face.b, face.c]) {
    for (let j = 0; j < 4; j++) {
      const bIdx = skinIndex.getComponent(v, j);
      const w    = skinWeight.getComponent(v, j);
      if (w > 0) boneWeights.set(bIdx, (boneWeights.get(bIdx) ?? 0) + w);
    }
  }

  const sorted = Array.from(boneWeights.entries()).sort(([, a], [, b]) => b - a);
  for (const [bIdx] of sorted) {
    const bone = obj.skeleton.bones[bIdx];
    if (!bone) continue;
    const zone = boneToZone(bone.name, gender);
    if (zone) return zone;
  }
  return null;
}

// ── Material cache ──────────────────────────────────────────────────────────
function makeSkinMat(color: THREE.Color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.0,
  });
}

// ── 3-D Model scene ─────────────────────────────────────────────────────────
function HumanModel({ gender, selectedZone, hoveredZone, onZoneHover, onZoneClick }: ModelProps) {
  const { scene } = useGLTF(`/models/${gender}/body.gltf`);
  const orbitRef = useRef<{ autoRotate: boolean } | null>(null) as React.MutableRefObject<{ autoRotate: boolean } | null>;
  const autoRotateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map each mesh to the zone it belongs to via its first bone influence
  const meshZoneMap = useRef<Map<THREE.SkinnedMesh, BodyZoneId | null>>(new Map());

  // Override all materials + build mesh → zone map
  useEffect(() => {
    const clone = scene; // we already have the scene directly
    clone.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.SkinnedMesh) && !(child instanceof THREE.Mesh)) return;
      const mesh = child as THREE.Mesh;

      // Strip original material(s), apply flat skin colour
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(() => makeSkinMat(COLOR_SKIN));
      } else {
        mesh.material = makeSkinMat(COLOR_SKIN);
      }
    });
  }, [scene]);

  // Update material colour when hover/selection changes
  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.SkinnedMesh) && !(child instanceof THREE.Mesh)) return;
      const sm = child as THREE.SkinnedMesh;

      const geo  = sm.geometry;
      const si   = geo?.attributes.skinIndex  as THREE.BufferAttribute | undefined;
      const sw   = geo?.attributes.skinWeight as THREE.BufferAttribute | undefined;

      // Determine dominant zone for this mesh by sampling first vertex
      let meshZone: BodyZoneId | null = meshZoneMap.current.get(sm) ?? null;
      if (!meshZoneMap.current.has(sm)) {
        if (si && sw && sm.skeleton) {
          const weights = new Map<number, number>();
          const totalV  = Math.min(geo.attributes.position.count, 100);
          for (let v = 0; v < totalV; v++) {
            for (let j = 0; j < 4; j++) {
              const bIdx = si.getComponent(v, j);
              const w    = sw.getComponent(v, j);
              if (w > 0) weights.set(bIdx, (weights.get(bIdx) ?? 0) + w);
            }
          }
          const sorted = Array.from(weights.entries()).sort(([, a], [, b]) => b - a);
          for (const [bIdx] of sorted) {
            const bone = sm.skeleton.bones[bIdx];
            if (!bone) continue;
            const z = boneToZone(bone.name, gender);
            if (z) { meshZone = z; break; }
          }
        }
        meshZoneMap.current.set(sm, meshZone);
      }

      const isSelected = selectedZone !== null && meshZone === selectedZone;
      const isHovered  = hoveredZone !== null && meshZone === hoveredZone && !isSelected;

      const color = isSelected ? COLOR_SELECTED : isHovered ? COLOR_HOVER : COLOR_SKIN;

      const applyColor = (mat: THREE.Material) => {
        if (mat instanceof THREE.MeshStandardMaterial) mat.color.set(color);
      };
      if (Array.isArray(sm.material)) sm.material.forEach(applyColor);
      else applyColor(sm.material);
    });
  }, [scene, selectedZone, hoveredZone, gender]);

  const pauseAutoRotate = useCallback(() => {
    if (orbitRef.current) orbitRef.current.autoRotate = false;
    if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
    autoRotateTimer.current = setTimeout(() => {
      if (orbitRef.current) orbitRef.current.autoRotate = true;
    }, 4000);
  }, []);

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const z = getZoneFromHit(e, gender);
    onZoneHover(z);
  }

  function onPointerLeave() {
    onZoneHover(null);
  }

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const z = getZoneFromHit(e, gender);
    if (z) {
      onZoneClick(z);
      pauseAutoRotate();
    }
  }

  return (
    <>
      <Bounds fit clip observe>
        <Center>
          <primitive
            object={scene}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerDown={onPointerDown}
          />
        </Center>
      </Bounds>
      <OrbitControls
        ref={orbitRef as unknown as React.Ref<never>}
        autoRotate
        autoRotateSpeed={1.2}
        enablePan={false}
        minDistance={0.5}
        maxDistance={3}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.9}
      />
    </>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <mesh>
      <cylinderGeometry args={[0.15, 0.15, 1.7, 16]} />
      <meshStandardMaterial color="#1e2130" />
    </mesh>
  );
}

// ── CameraSetup ─────────────────────────────────────────────────────────────
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.5, 2.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

// ── Public component ─────────────────────────────────────────────────────────
interface BodyMap3DProps {
  gender: BodyGender;
  selectedZone: BodyZoneId | null;
  onZoneSelect: (zone: BodyZoneId) => void;
}

export function BodyMap3D({ gender, selectedZone, onZoneSelect }: BodyMap3DProps) {
  const [hoveredZone, setHoveredZone] = useState<BodyZoneId | null>(null);

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <CameraSetup />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 5]}  intensity={1.2} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <Suspense fallback={<LoadingFallback />}>
          <HumanModel
            gender={gender}
            selectedZone={selectedZone}
            hoveredZone={hoveredZone}
            onZoneHover={setHoveredZone}
            onZoneClick={onZoneSelect}
          />
        </Suspense>
      </Canvas>

    </div>
  );
}

// Preload both models
useGLTF.preload("/models/male/body.gltf");
useGLTF.preload("/models/female/body.gltf");
