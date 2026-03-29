import { useEffect, useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { GlobeMesh } from './GlobeMesh'
import { CalculatorTower, towerHeight } from './CalculatorTower'
import { CARBON_REGIONS, intensityToColor } from './calculatorData'
import { latLonToVector3 } from './sciUtils'

interface SciEntry {
  name: string
  sci: number
}

// ── Dashed arch connector between two selected towers ─────────────────────────

interface ConnectorProps {
  latA: number; lonA: number; heightA: number
  latB: number; lonB: number; heightB: number
}

function DashedArch({ points }: { points: THREE.Vector3[] }) {
  const ref = useRef<THREE.Line>(null)
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  useEffect(() => {
    ref.current?.computeLineDistances()
  }, [points])

  // Animate dash offset for a "marching ants" effect
  useFrame((_, delta) => {
    const mat = ref.current?.material as THREE.LineDashedMaterial | undefined
    if (mat) mat.dashOffset -= delta * 0.25
  })

  return (
    <line ref={ref} geometry={geometry}>
      <lineDashedMaterial
        color="#ffffff"
        dashSize={0.035}
        gapSize={0.025}
        linewidth={1}
        transparent
        opacity={0.85}
      />
    </line>
  )
}

const RISE = 0.30  // how far above tower top the arch rises before bending

function TowerConnector({ latA, lonA, heightA, latB, lonB, heightB }: ConnectorProps) {
  const { pointsA, pointsB } = useMemo(() => {
    const normalA = latLonToVector3(latA, lonA, 1.0).normalize()
    const normalB = latLonToVector3(latB, lonB, 1.0).normalize()

    const topA = normalA.clone().multiplyScalar(1.0 + heightA + 0.005)
    const topB = normalB.clone().multiplyScalar(1.0 + heightB + 0.005)

    const tipA = normalA.clone().multiplyScalar(1.0 + heightA + 0.005 + RISE)
    const tipB = normalB.clone().multiplyScalar(1.0 + heightB + 0.005 + RISE)

    // Midpoint: outward from the sphere at the average normal, at RISE height
    const midNormal = normalA.clone().add(normalB).normalize()
    const midHeight = Math.max(heightA, heightB) + 0.005 + RISE
    const mid = midNormal.clone().multiplyScalar(1.0 + midHeight)

    return {
      pointsA: [topA, tipA, mid],
      pointsB: [topB, tipB, mid],
    }
  }, [latA, lonA, heightA, latB, lonB, heightB])

  return (
    <>
      <DashedArch points={pointsA} />
      <DashedArch points={pointsB} />
    </>
  )
}

// ── Main scene ────────────────────────────────────────────────────────────────

export function CalculatorGlobeScene() {
  const [sciData, setSciData]           = useState<SciEntry[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'SET_SCI_DATA') {
        setSciData(e.data.data as SciEntry[])
      }
      if (e.data.type === 'SET_SELECTED_REGION') {
        // Dropdown changed — reset to single selection
        setSelectedRegions(e.data.region ? [e.data.region as string] : [])
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Build a lookup: region name → sci value
  const sciMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const entry of sciData) m[entry.name] = entry.sci
    return m
  }, [sciData])

  const maxSci = useMemo(() => {
    const vals = CARBON_REGIONS.map(r => sciMap[r.name] ?? r.intensity)
    return Math.max(...vals, 1)
  }, [sciMap])

  function handleTowerClick(regionName: string) {
    setSelectedRegions(prev => {
      let next: string[]
      if (prev.length < 2) {
        if (prev.includes(regionName)) {
          // Deselect if already selected
          next = prev.filter(r => r !== regionName)
        } else {
          next = [...prev, regionName]
        }
      } else {
        // 2 already selected — start fresh
        next = [regionName]
      }
      window.parent.postMessage({ type: 'GLOBE_REGIONS_SELECTED', regions: next }, '*')
      return next
    })
  }

  // Find data for the two selected towers (for connector)
  const connectorData = useMemo(() => {
    if (selectedRegions.length !== 2) return null
    const rA = CARBON_REGIONS.find(r => r.name === selectedRegions[0])
    const rB = CARBON_REGIONS.find(r => r.name === selectedRegions[1])
    if (!rA || !rB) return null
    const sciA = sciMap[rA.name] ?? rA.intensity
    const sciB = sciMap[rB.name] ?? rB.intensity
    return {
      latA: rA.lat, lonA: rA.lon, heightA: towerHeight(sciA, maxSci),
      latB: rB.lat, lonB: rB.lon, heightB: towerHeight(sciB, maxSci),
    }
  }, [selectedRegions, sciMap, maxSci])

  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />

      <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />

      <GlobeMesh />

      {CARBON_REGIONS.map(region => {
        const sci = sciMap[region.name] ?? region.intensity
        const selIdx = selectedRegions.indexOf(region.name)
        return (
          <CalculatorTower
            key={region.id}
            lat={region.lat}
            lon={region.lon}
            sci={sci}
            maxSci={maxSci}
            color={intensityToColor(region.intensity)}
            label={region.name}
            selectionIndex={selIdx}
            onSelect={() => handleTowerClick(region.name)}
          />
        )
      })}

      {connectorData && (
        <TowerConnector
          latA={connectorData.latA} lonA={connectorData.lonA} heightA={connectorData.heightA}
          latB={connectorData.latB} lonB={connectorData.lonB} heightB={connectorData.heightB}
        />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={1.8}
        maxDistance={5.5}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  )
}
