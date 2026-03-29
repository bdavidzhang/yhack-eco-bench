import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { latLonToVector3, REGIONS, sciToColor } from './sciUtils'
import type { Region } from './sciUtils'

// Region pairs to connect with beams
const CONNECTIONS: [string, string][] = [
  ['eu-north', 'eu-west'],
  ['eu-west',  'us-east'],
  ['us-east',  'us-west'],
  ['us-west',  'ap-ne'],
  ['ap-ne',    'ap-se'],
  ['ap-se',    'ap-au'],
  ['us-east',  'sa-east'],
  ['sa-east',  'eu-west'],
]

// Great-circle interpolation: lerp then normalize back to radius
function arcPoints(
  latA: number, lonA: number,
  latB: number, lonB: number,
  segments: number,
  radius: number
): THREE.Vector3[] {
  const a = latLonToVector3(latA, lonA, radius)
  const b = latLonToVector3(latB, lonB, radius)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    pts.push(new THREE.Vector3().lerpVectors(a, b, i / segments).normalize().multiplyScalar(radius))
  }
  return pts
}

interface ArcBeamProps {
  regionA: string
  regionB: string
  delay: number
}

function ArcBeam({ regionA, regionB, delay }: ArcBeamProps) {
  const rA = REGIONS.find(r => r.id === regionA)!
  const rB = REGIONS.find(r => r.id === regionB)!

  const SEGMENTS = 80
  const TAIL     = 16        // how many segments the glowing tail spans
  const RADIUS   = 1.058     // just above the markers (at 1.05)
  const SPEED    = 0.28      // arc traversals per second

  const points = useMemo(
    () => arcPoints(rA.lat, rA.lon, rB.lat, rB.lon, SEGMENTS, RADIUS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ── Static dim trail (full arc) ──────────────────────────────────────────────
  const trailGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points]
  )
  const trailMat = useMemo(
    () => new THREE.LineBasicMaterial({
      color: new THREE.Color(sciToColor(rA.sci)),
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const trailLine = useMemo(() => new THREE.Line(trailGeo, trailMat), [trailGeo, trailMat])

  // ── Animated beam head (dynamic slice of the arc) ────────────────────────────
  const beamGeo = useMemo(() => new THREE.BufferGeometry(), [])
  const beamMat = useMemo(
    () => new THREE.LineBasicMaterial({
      color: new THREE.Color('#b8e8ff'),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    []
  )
  const beamLine = useMemo(() => new THREE.Line(beamGeo, beamMat), [beamGeo, beamMat])

  const progress = useRef(delay)

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * SPEED) % 1
    const head  = Math.floor(progress.current * SEGMENTS)
    const tail  = Math.max(0, head - TAIL)
    const slice = points.slice(tail, head + 1)
    if (slice.length >= 2) {
      beamGeo.setFromPoints(slice)
      beamGeo.computeBoundingSphere()
    }
    // Soft fade at the very start / end of each pass
    beamMat.opacity = 0.4 + 0.6 * Math.sin(progress.current * Math.PI)
  })

  useEffect(() => {
    return () => {
      trailGeo.dispose()
      trailMat.dispose()
      beamGeo.dispose()
      beamMat.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group>
      <primitive object={trailLine} />
      <primitive object={beamLine} />
    </group>
  )
}

// ── Vertical (radial) beam through each region marker ────────────────────────

function VerticalBeam({ region }: { region: Region }) {
  const color = sciToColor(region.sci)

  // Outward normal at this region's surface point
  const normal = useMemo(
    () => latLonToVector3(region.lat, region.lon, 1.0).normalize(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const BEAM_BOTTOM = 0.92   // starts slightly inside the globe
  const BEAM_TOP    = 1.32   // extends above the surface
  const height      = BEAM_TOP - BEAM_BOTTOM
  const centerR     = (BEAM_BOTTOM + BEAM_TOP) / 2

  // Center position of the cylinder and rotation to align Y → outward normal
  const position = useMemo(() => normal.clone().multiplyScalar(centerR), [normal])
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    return q
  }, [normal])

  const outerMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const innerMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const timeRef = useRef(Math.random() * Math.PI * 2)

  useFrame((_, delta) => {
    timeRef.current += delta * 1.6
    const pulse = 0.5 + 0.5 * Math.sin(timeRef.current)
    if (outerMatRef.current) outerMatRef.current.opacity = 0.10 + 0.18 * pulse
    if (innerMatRef.current) innerMatRef.current.opacity = 0.45 + 0.45 * pulse
  })

  return (
    <group position={position} quaternion={quaternion}>
      {/* Wide soft outer glow */}
      <mesh>
        <cylinderGeometry args={[0.007, 0.007, height, 8, 1, true]} />
        <meshBasicMaterial
          ref={outerMatRef}
          color={color}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Narrow bright core */}
      <mesh>
        <cylinderGeometry args={[0.002, 0.002, height, 6]} />
        <meshBasicMaterial
          ref={innerMatRef}
          color={color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function GlobeBeams() {
  return (
    <group>
      {CONNECTIONS.map(([a, b], i) => (
        <ArcBeam
          key={`${a}-${b}`}
          regionA={a}
          regionB={b}
          delay={i / CONNECTIONS.length}
        />
      ))}
      {REGIONS.map(r => (
        <VerticalBeam key={r.id} region={r} />
      ))}
    </group>
  )
}
