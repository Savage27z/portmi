import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useAnimations, useGLTF } from '@react-three/drei'
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
        color: joints ? PALETTE.orange : '#16181d',
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

function usePlaneGeometry() {
  return useMemo(() => {
    const nose = [0, 0, 0.6]
    const tl = [-0.42, 0.07, -0.4]
    const tr = [0.42, 0.07, -0.4]
    const c = [0, 0, -0.4]
    const k = [0, -0.14, -0.4]
    const tris = [nose, tl, c, nose, c, tr, nose, c, k, nose, k, c]
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3))
    g.computeVertexNormals()
    return g
  }, [])
}

const COUNT = 140

function Planes() {
  const geo = usePlaneGeometry()
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.55, sheen: 0.5, side: THREE.DoubleSide, flatShading: true }),
    [],
  )
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const data = useMemo(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const tints = [PALETTE.bone, PALETTE.bone, PALETTE.clay, PALETTE.bone, PALETTE.orange, '#1a1a1a']
    return Array.from({ length: COUNT }, () => {
      const dir = Math.random() < 0.75 ? 1 : -1
      return {
        pos: new THREE.Vector3(rand(-7, 7), rand(-0.6, 3.4), rand(-5, 0.9)),
        vel: new THREE.Vector3(dir * rand(0.5, 1.3), rand(-0.05, 0.12), rand(-0.25, 0.25)),
        push: new THREE.Vector3(),
        phase: rand(0, 6.28),
        scale: rand(0.18, 0.42),
        color: new THREE.Color(tints[Math.floor(Math.random() * tints.length)]),
      }
    })
  }, [])
  const { camera } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 1.5), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ahead = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useEffect(() => {
    data.forEach((d, i) => mesh.current.setColorAt(i, d.color))
    mesh.current.instanceColor!.needsUpdate = true
  }, [data])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = state.clock.elapsedTime
    ndc.set(pointer.x, pointer.y)
    ray.setFromCamera(ndc, camera)
    ray.ray.intersectPlane(plane, hit)
    data.forEach((d, i) => {
      d.pos.addScaledVector(d.vel, dt)
      if (d.pos.x > 7.5) d.pos.x = -7.5
      if (d.pos.x < -7.5) d.pos.x = 7.5
      if (d.pos.y > 3.8) d.pos.y = -0.8
      const dx = d.pos.x + d.push.x - hit.x
      const dy = d.pos.y + d.push.y - hit.y
      const dist = Math.hypot(dx, dy)
      if (dist < 1.1 && d.pos.z > -2.5) {
        const f = (1.1 - dist) * 9 * dt
        d.push.x += (dx / (dist + 1e-4)) * f
        d.push.y += (dy / (dist + 1e-4)) * f
      }
      d.push.multiplyScalar(0.97)
      dummy.position.copy(d.pos).add(d.push)
      dummy.position.y += Math.sin(t * 1.4 + d.phase) * 0.06
      ahead.copy(dummy.position).add(d.vel)
      dummy.lookAt(ahead)
      dummy.rotateZ(Math.sin(t * 1.1 + d.phase) * 0.35 + d.push.x * 1.5)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geo, mat, COUNT]} frustumCulled={false} />
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
      <Planes />
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
