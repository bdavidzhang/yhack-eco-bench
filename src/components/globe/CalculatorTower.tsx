import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { Html, useCursor } from '@react-three/drei'
import { latLonToVector3 } from './sciUtils'

interface Props {
  lat: number
  lon: number
  sci: number        // computed SCI value for this region
  maxSci: number     // max across all regions (for normalization)
  color: string
  label: string
  selectionIndex: number  // -1 = not selected, 0 = first selected, 1 = second selected
  onSelect: () => void
}

// Return a lightened/brightened version of a hex color by mixing with white
function brightenColor(hex: string, amount = 0.55): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const nr = Math.min(255, Math.round(r + (255 - r) * amount))
  const ng = Math.min(255, Math.round(g + (255 - g) * amount))
  const nb = Math.min(255, Math.round(b + (255 - b) * amount))
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

export function CalculatorTower({ lat, lon, sci, maxSci, color, label, selectionIndex, onSelect }: Props) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  const isSelected = selectionIndex >= 0

  // Normalized height: 0.04 (min) → 0.50 (max)
  const height = maxSci > 0 ? 0.04 + (sci / maxSci) * 0.46 : 0.04
  const width   = isSelected ? 0.052 : 0.032

  const { position, quaternion } = useMemo(() => {
    // Surface normal vector (radius=1)
    const surfacePos = latLonToVector3(lat, lon, 1.0)
    const normal     = surfacePos.clone().normalize()
    // Place tower center at surface + outward by half-height + tiny gap
    const pos = normal.clone().multiplyScalar(1.0 + height / 2 + 0.005)
    // Rotate so BoxGeometry's Y-axis (height axis) aligns with the surface normal
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normal
    )
    return { position: pos, quaternion: quat }
  }, [lat, lon, height])

  const displayColor   = isSelected ? brightenColor(color) : color
  const emissiveColor  = useMemo(() => new THREE.Color(displayColor), [displayColor])

  return (
    <group position={position} quaternion={quaternion}>
      {/* Main tower */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[width, height, width]} />
        <meshPhongMaterial
          color={displayColor}
          emissive={isSelected || hovered ? emissiveColor : undefined}
          emissiveIntensity={isSelected ? 0.9 : hovered ? 0.3 : 0}
          shininess={80}
        />
      </mesh>

      {/* Hover / selected tooltip */}
      {(hovered || isSelected) && (
        <Html
          position={[0, height / 2 + 0.06, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(10,10,10,0.92)',
            border: `1px solid ${displayColor}`,
            borderRadius: 4,
            padding: '5px 10px',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11,
            color: '#fff',
            boxShadow: `0 0 12px ${displayColor}88`,
          }}>
            {isSelected && (
              <div style={{ fontSize: 9, fontWeight: 700, color: displayColor, marginBottom: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {selectionIndex === 0 ? '① Selected' : '② Selected'}
              </div>
            )}
            <div style={{ fontWeight: 700, color: displayColor, marginBottom: 2 }}>{label}</div>
            <div style={{ color: '#aaa' }}>{sci.toFixed(2)} µgCO₂/tok</div>
          </div>
        </Html>
      )}

      {/* Invisible larger hit target for easier clicking */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.1, height + 0.06, 0.1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── Exported height calculator (for beam connector) ───────────────────────────
export function towerHeight(sci: number, maxSci: number): number {
  return maxSci > 0 ? 0.04 + (sci / maxSci) * 0.46 : 0.04
}
