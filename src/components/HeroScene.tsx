import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useAnimations, useGLTF } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { pointer } from '../lib/scroll'

const PALETTE = {
  ink: '#0d0d0d',
  clay: '#c7bba6',
  orange: '#ea5a3a',
  bone: '#ece6da',
}

function Avatar() {
  const group = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF('/models/avatar.glb')
  const { actions } = useAnimations(animations, group)
  const look = useRef(new THREE.Vector2())
  const bones = useMemo(() => {
    let head: THREE.Object3D | undefined
    let neck: THREE.Object3D | undefined
    let spine: THREE.Object3D | undefined
    scene.traverse((o) => {
      if (o.name.endsWith('Head') && !head) head = o
      if (o.name.endsWith('Neck') && !neck) neck = o
      if (o.name.endsWith('Spine2') && !spine) spine = o
      const mesh = o as THREE.SkinnedMesh
      if (!mesh.isMesh) return
      const joints = (mesh.material as THREE.Material).name.includes('Joints')
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: joints ? PALETTE.ink : PALETTE.clay,
        roughness: joints ? 0.25 : 0.62,
        metalness: joints ? 0.4 : 0,
        clearcoat: joints ? 1 : 0.15,
        sheen: joints ? 0 : 0.6,
        sheenColor: new THREE.Color(PALETTE.orange),
      })
      mesh.frustumCulled = false
    })
    return { head, neck, spine }
  }, [scene])

  useEffect(() => {
    actions.idle?.reset().fadeIn(0.4).play()
  }, [actions])

  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  useFrame((_, dt) => {
    look.current.x = THREE.MathUtils.damp(look.current.x, pointer.x, 4, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, pointer.y, 4, dt)
    const yaw = look.current.x * 0.7
    const pitch = -look.current.y * 0.35
    const apply = (b: THREE.Object3D | undefined, k: number) => {
      if (!b) return
      e.set(pitch * k, yaw * k, 0)
      q.setFromEuler(e)
      b.quaternion.multiply(q)
    }
    apply(bones.spine, 0.25)
    apply(bones.neck, 0.35)
    apply(bones.head, 0.55)
  })

  return (
    <group ref={group} position={[0, -0.02, 0]}>
      <primitive object={scene} />
    </group>
  )
}

function useShapeGeometries() {
  return useMemo(() => {
    const profile = [
      new THREE.Vector2(0.11, -0.22),
      new THREE.Vector2(0.2, -0.22),
      new THREE.Vector2(0.2, 0.22),
      new THREE.Vector2(0.11, 0.22),
      new THREE.Vector2(0.11, -0.22),
    ]
    const tube = new THREE.LatheGeometry(profile, 48)
    tube.computeVertexNormals()
    const arm = () => new THREE.CylinderGeometry(0.11, 0.11, 0.62, 32)
    const a = arm()
    const b = arm().rotateZ(Math.PI / 2)
    const c = arm().rotateX(Math.PI / 2)
    const cross = mergeGeometries([a, b, c])!
    const knot = new THREE.CapsuleGeometry(0.12, 0.34, 8, 24)
    return [tube, cross, knot]
  }, [])
}

type Body = {
  home: THREE.Vector3
  pos: THREE.Vector3
  vel: THREE.Vector3
  spin: THREE.Vector3
  geo: number
  mat: number
  scale: number
}

function Shapes() {
  const geos = useShapeGeometries()
  const mats = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ color: PALETTE.clay, roughness: 0.5, sheen: 0.4 }),
      new THREE.MeshPhysicalMaterial({ color: PALETTE.orange, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 }),
      new THREE.MeshPhysicalMaterial({ color: PALETTE.bone, roughness: 0.35, clearcoat: 0.6 }),
    ],
    [],
  )
  const bodies = useMemo<Body[]>(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const list: Body[] = []
    for (let i = 0; i < 34; i++) {
      let x = 0
      let z = 0
      do {
        x = rand(-2.6, 2.6)
        z = rand(-2.6, -0.2)
      } while (Math.abs(x) < 0.7 && z > -1.4)
      const home = new THREE.Vector3(x, rand(0.4, 2.4), z)
      list.push({
        home,
        pos: home.clone().add(new THREE.Vector3(0, -4 - Math.random() * 3, 0)),
        vel: new THREE.Vector3(),
        spin: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.4, 0.4)),
        geo: i % 3,
        mat: i % 7 === 0 ? 2 : i % 3 === 0 ? 3 : i % 2 === 0 ? 0 : 1,
        scale: rand(0.7, 1.25),
      })
    }
    return list
  }, [])
  const refs = useRef<THREE.Mesh[]>([])
  const { camera } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 1.2), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    ndc.set(pointer.x, pointer.y)
    ray.setFromCamera(ndc, camera)
    ray.ray.intersectPlane(plane, hit)
    const t = state.clock.elapsedTime
    bodies.forEach((b, i) => {
      const m = refs.current[i]
      if (!m) return
      tmp.copy(b.home)
      tmp.y += Math.sin(t * 0.6 + i) * 0.08
      const force = tmp.sub(b.pos).multiplyScalar(6)
      const dx = b.pos.x - hit.x
      const dy = b.pos.y - hit.y
      const d = Math.hypot(dx, dy)
      if (d < 0.9) {
        const push = (0.9 - d) * 40
        force.x += (dx / (d + 1e-4)) * push
        force.y += (dy / (d + 1e-4)) * push
        b.spin.x += dy * dt * 4
        b.spin.y += dx * dt * 4
      }
      b.vel.addScaledVector(force, dt).multiplyScalar(0.9)
      b.pos.addScaledVector(b.vel, dt)
      b.spin.multiplyScalar(0.995)
      m.position.copy(b.pos)
      m.rotation.x += (b.spin.x + 0.1) * dt
      m.rotation.y += (b.spin.y + 0.08) * dt
      m.rotation.z += b.spin.z * dt
    })
  })

  return (
    <group>
      {bodies.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el
          }}
          geometry={geos[b.geo]}
          material={mats[b.mat]}
          scale={b.scale}
          position={b.pos}
        />
      ))}
    </group>
  )
}

function Rig() {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(0, 1.32, 0), [])
  useFrame((_, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.25, 2.5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.42 + pointer.y * 0.12, 2.5, dt)
    camera.lookAt(target)
  })
  return null
}

export default function HeroScene() {
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.42, 2.65], fov: 32, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[-2.5, 3, 3]} intensity={2.2} color="#fff1df" />
      <spotLight position={[2.6, 2.4, -1.8]} angle={0.7} penumbra={1} intensity={60} color={PALETTE.orange} />
      <pointLight position={[-2, 1, -2]} intensity={6} color="#6f7cff" />
      <Avatar />
      <Shapes />
      <Rig />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, -3]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffd8c2" position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={4} color={PALETTE.orange} position={[4, 1.5, -1]} scale={2} />
      </Environment>
    </Canvas>
  )
}

useGLTF.preload('/models/avatar.glb')
