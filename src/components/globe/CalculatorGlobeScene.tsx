import { useEffect, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { GlobeMesh } from './GlobeMesh'
import { CalculatorTower } from './CalculatorTower'
import { CARBON_REGIONS, intensityToColor } from './calculatorData'

interface SciEntry {
  name: string
  sci: number
}

export function CalculatorGlobeScene() {
  // Per-region SCI values pushed from the parent page via postMessage.
  // Falls back to raw carbon intensity until the parent sends real data.
  const [sciData, setSciData]       = useState<SciEntry[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('')

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'SET_SCI_DATA')       setSciData(e.data.data as SciEntry[])
      if (e.data.type === 'SET_SELECTED_REGION') setSelectedRegion(e.data.region as string)
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
    setSelectedRegion(regionName)
    window.parent.postMessage({ type: 'REGION_SELECTED', region: regionName }, '*')
  }

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
        return (
          <CalculatorTower
            key={region.id}
            lat={region.lat}
            lon={region.lon}
            sci={sci}
            maxSci={maxSci}
            color={intensityToColor(region.intensity)}
            label={region.name}
            isSelected={selectedRegion === region.name}
            onSelect={() => handleTowerClick(region.name)}
          />
        )
      })}

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
