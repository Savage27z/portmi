import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { pointer } from '../lib/scroll'

const PALETTE = {
  ink: '#0d0d0d',
  clay: '#c7bba6',
  orange: '#ea5a3a',
  bone: '#ece6da',
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

const COUNT = 40

function useToonGradient() {
  return useMemo(() => {
    const tex = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 165, 165, 165, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat)
    tex.minFilter = THREE.NearestFilter
    tex.magFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    tex.needsUpdate = true
    return tex
  }, [])
}

function Planes() {
  const geo = usePlaneGeometry()
  const gradient = useToonGradient()
  const mat = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradient, side: THREE.DoubleSide }),
    [gradient],
  )
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const ink = useRef<THREE.InstancedMesh>(null!)
  // Cel "ink line": a slightly larger black copy of each plane, pushed behind it in depth.
  const inkGeo = useMemo(() => {
    const g = geo.clone()
    g.computeBoundingBox()
    const c = new THREE.Vector3()
    g.boundingBox!.getCenter(c)
    g.translate(-c.x, -c.y, -c.z).scale(1.16, 1.5, 1.12).translate(c.x, c.y, c.z)
    return g
  }, [geo])
  const inkMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#0b0a09',
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 4,
        polygonOffsetUnits: 4,
      }),
    [],
  )
  const data = useMemo(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const tints = [PALETTE.bone, PALETTE.bone, PALETTE.clay, PALETTE.bone, PALETTE.orange, '#2a2622']
    return Array.from({ length: COUNT }, () => {
      const dir = Math.random() < 0.75 ? 1 : -1
      return {
        pos: new THREE.Vector3(rand(-7, 7), rand(-0.4, 3.2), rand(-5, 0.05)),
        vel: new THREE.Vector3(dir * rand(0.5, 1.3), rand(-0.05, 0.12), rand(-0.25, 0.25)),
        push: new THREE.Vector3(),
        phase: rand(0, 6.28),
        scale: rand(0.25, 0.5),
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
    ink.current.instanceMatrix = mesh.current.instanceMatrix
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

  return (
    <>
      <instancedMesh ref={ink} args={[inkGeo, inkMat, COUNT]} frustumCulled={false} renderOrder={0} />
      <instancedMesh ref={mesh} args={[geo, mat, COUNT]} frustumCulled={false} renderOrder={1} />
    </>
  )
}

function Rig() {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(0, 1.3, 0), [])
  useFrame((_, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.25, 2.5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.34 + pointer.y * 0.05, 2.5, dt)
    camera.lookAt(target)
  })
  return null
}

export default function HeroScene() {
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.34, 0.72], fov: 34, near: 0.05, far: 40 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[-2.5, 3, 3]} intensity={2.4} color="#fff1df" />
      <Planes />
      <Rig />
    </Canvas>
  )
}

