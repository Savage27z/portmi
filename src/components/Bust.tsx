import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { pointer } from '../lib/scroll'

const HEAD_R = 0.155
const HEAD_Y = 1.32
const SKIN = '#e4b79c'
const HAIR = '#6d2334'
const TEE = '#8d8984'
const EYE = '#25151a'

const headProfile: [number, number][] = [
  [0.001, -1.0], [0.26, -0.95], [0.47, -0.82], [0.66, -0.62], [0.82, -0.38],
  [0.92, -0.1], [0.97, 0.14], [0.95, 0.4], [0.86, 0.65], [0.66, 0.86],
  [0.36, 0.99], [0.001, 1.03],
]

const torsoProfile: [number, number][] = [
  [0.001, 0.03], [0.08, 0.01], [0.15, -0.05], [0.21, -0.13], [0.245, -0.22],
  [0.255, -0.34], [0.25, -0.52], [0.24, -0.68],
]

function lathe(points: [number, number][], sx: number, sy: number) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(r * sx, 0.0008), y * sy)),
    64,
  )
}

export default function Bust() {
  const head = useRef<THREE.Group>(null!)
  const torso = useRef<THREE.Group>(null!)
  const eyeL = useRef<THREE.Mesh>(null!)
  const eyeR = useRef<THREE.Mesh>(null!)
  const blink = useRef(0)

  const geos = useMemo(
    () => ({
      head: lathe(headProfile, HEAD_R, 0.168),
      torso: lathe(torsoProfile, 1, 1),
      cap: new THREE.SphereGeometry(HEAD_R * 1.06, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52),
      back: new THREE.SphereGeometry(HEAD_R * 1.05, 48, 32, Math.PI * 0.85, Math.PI * 1.3, Math.PI * 0.18, Math.PI * 0.62),
      strand: new THREE.CylinderGeometry(0.03, 0.011, 0.15, 6),
      nape: new THREE.CylinderGeometry(0.045, 0.03, 0.12, 16),
      neck: new THREE.CylinderGeometry(0.048, 0.055, 0.11, 32),
      eye: new THREE.SphereGeometry(0.026, 24, 16),
      glint: new THREE.SphereGeometry(0.007, 12, 8),
      brow: new THREE.BoxGeometry(0.045, 0.007, 0.012),
      mouth: new THREE.TorusGeometry(0.018, 0.0035, 8, 24, Math.PI * 0.8),
      pendant: new THREE.OctahedronGeometry(0.013),
      cord: new THREE.TorusGeometry(0.052, 0.0022, 6, 40, Math.PI),
      collar: new THREE.TorusGeometry(0.058, 0.011, 10, 48),
    }),
    [],
  )

  const mats = useMemo(
    () => ({
      skin: new THREE.MeshPhysicalMaterial({ color: SKIN, roughness: 0.62, sheen: 0.35, sheenColor: new THREE.Color('#ffd9c4') }),
      hair: new THREE.MeshPhysicalMaterial({ color: HAIR, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color('#ff8fa8') }),
      tee: new THREE.MeshPhysicalMaterial({ color: TEE, roughness: 0.85, sheen: 0.3, sheenColor: new THREE.Color('#ffffff') }),
      eye: new THREE.MeshPhysicalMaterial({ color: EYE, roughness: 0.20, clearcoat: 1, clearcoatRoughness: 0.05 }),
      glint: new THREE.MeshBasicMaterial({ color: '#fff6ef' }),
      lip: new THREE.MeshStandardMaterial({ color: '#a8695f', roughness: 0.6 }),
      metal: new THREE.MeshPhysicalMaterial({ color: '#b9ad99', metalness: 0.9, roughness: 0.25 }),
      cord: new THREE.MeshStandardMaterial({ color: '#3a3632', roughness: 0.8 }),
    }),
    [],
  )

  const strands = useMemo(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    return Array.from({ length: 9 }, (_, i) => {
      const t = (i / 8) * 2 - 1
      const ang = t * 1.15
      return {
        pos: [Math.sin(ang) * HEAD_R * 0.92, HEAD_Y + 0.058 - Math.abs(t) * 0.02, Math.cos(ang) * HEAD_R * 0.86] as [number, number, number],
        rot: [rand(-0.16, 0.1), -ang * 0.55, ang * 0.42 + rand(-0.12, 0.12)] as [number, number, number],
        scale: rand(0.85, 1.15),
      }
    })
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = state.clock.elapsedTime
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, pointer.x * 0.42, 3.2, dt)
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, -pointer.y * 0.2, 3.2, dt)
      head.current.rotation.z = Math.sin(t * 0.7) * 0.015 + pointer.x * 0.05
      head.current.position.y = HEAD_Y + Math.sin(t * 1.1) * 0.004
    }
    if (torso.current) {
      torso.current.rotation.y = THREE.MathUtils.damp(torso.current.rotation.y, pointer.x * 0.09, 2.2, dt)
      const breathe = 1 + Math.sin(t * 1.05) * 0.006
      torso.current.scale.set(breathe, 1, breathe)
      torso.current.position.y = -0.02 + Math.sin(t * 1.05) * 0.003
    }
    blink.current -= dt
    if (blink.current < -2.6 - Math.random()) blink.current = 0.14
    const lid = blink.current > 0 && blink.current < 0.14 ? Math.abs(Math.cos((blink.current / 0.14) * Math.PI)) : 1
    for (const e of [eyeL.current, eyeR.current]) {
      if (e) e.scale.y = Math.max(lid, 0.06)
    }
  })

  return (
    <group position={[0, 0, 0]}>
      <group ref={torso} position={[0, -0.02, 0]}>
        <mesh geometry={geos.torso} material={mats.tee} position={[0, 0.96, 0]} scale={[1, 1.05, 0.92]} />
        <mesh geometry={geos.neck} material={mats.skin} position={[0, 1.1, 0.005]} />
        <mesh geometry={geos.collar} material={mats.tee} position={[0, 1.055, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={geos.cord} material={mats.cord} position={[0, 1.02, 0.075]} rotation={[0.28, 0, Math.PI]} />
        <mesh geometry={geos.pendant} material={mats.metal} position={[0, 0.955, 0.086]} rotation={[0.3, 0.4, 0]} />
        <mesh geometry={geos.nape} material={mats.hair} position={[0, 1.2, -0.05]} scale={[1, 1, 0.8]} />
      </group>

      <group ref={head} position={[0, HEAD_Y, 0]}>
        <mesh geometry={geos.head} material={mats.skin} scale={[1, 1, 0.93]} />
        <mesh geometry={geos.cap} material={mats.hair} scale={[1, 1, 0.97]} />
        <mesh geometry={geos.back} material={mats.hair} scale={[1, 1.05, 1]} />
        {strands.map((s, i) => (
          <mesh key={i} geometry={geos.strand} material={mats.hair} position={s.pos} rotation={s.rot} scale={s.scale} />
        ))}
        <mesh geometry={geos.strand} material={mats.hair} position={[-0.135, HEAD_Y * 0 + 0.01, 0.045]} rotation={[0.1, 0.4, 0.12]} scale={[1.15, 1.25, 1.15]} />
        <mesh geometry={geos.strand} material={mats.hair} position={[0.135, 0.01, 0.045]} rotation={[0.1, -0.4, -0.12]} scale={[1.15, 1.25, 1.15]} />

        <mesh ref={eyeL} geometry={geos.eye} material={mats.eye} position={[-0.056, -0.005, 0.128]} scale={[1, 1, 0.55]} rotation={[0, 0.16, 0.06]} />
        <mesh ref={eyeR} geometry={geos.eye} material={mats.eye} position={[0.056, -0.005, 0.128]} scale={[1, 1, 0.55]} rotation={[0, -0.16, -0.06]} />
        <mesh geometry={geos.glint} material={mats.glint} position={[-0.049, 0.002, 0.143]} />
        <mesh geometry={geos.glint} material={mats.glint} position={[0.063, 0.002, 0.143]} />
        <mesh geometry={geos.brow} material={mats.hair} position={[-0.056, 0.028, 0.135]} rotation={[0, 0.16, 0.08]} />
        <mesh geometry={geos.brow} material={mats.hair} position={[0.056, 0.028, 0.135]} rotation={[0, -0.16, -0.08]} />
        <mesh geometry={geos.mouth} material={mats.lip} position={[0, -0.078, 0.121]} rotation={[0.16, 0, Math.PI * 1.1]} />
      </group>
    </group>
  )
}
