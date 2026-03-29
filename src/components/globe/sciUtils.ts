import * as THREE from 'three'

export const REGIONS = [
  { id: 'eu-north', name: 'EU North',      sub: 'Sweden · eu-north-1',        lat: 59.3,  lon: 18.1,   sci: 22  },
  { id: 'eu-west',  name: 'EU West',       sub: 'Ireland · eu-west-1',        lat: 53.3,  lon: -6.3,   sci: 38  },
  { id: 'us-west',  name: 'US West',       sub: 'Oregon · us-west-2',         lat: 45.5,  lon: -122.7, sci: 55  },
  { id: 'sa-east',  name: 'SA East',       sub: 'São Paulo · sa-east-1',      lat: -23.5, lon: -46.6,  sci: 61  },
  { id: 'ap-au',    name: 'AP Australia',  sub: 'Sydney · ap-southeast-2',    lat: -33.9, lon: 151.2,  sci: 74  },
  { id: 'us-east',  name: 'US East',       sub: 'Virginia · us-east-1',       lat: 38.9,  lon: -77.0,  sci: 89  },
  { id: 'ap-ne',    name: 'AP Northeast',  sub: 'Tokyo · ap-northeast-1',     lat: 35.7,  lon: 139.7,  sci: 112 },
  { id: 'ap-se',    name: 'AP Southeast',  sub: 'Singapore · ap-southeast-1', lat: 1.35,  lon: 103.8,  sci: 148 },
] as const

export type Region = typeof REGIONS[number]

export function sciToColor(sci: number): string {
  if (sci < 50)  return '#1D9E75'  // green
  if (sci < 80)  return '#EF9F27'  // amber
  if (sci < 110) return '#D85A30'  // orange
  return '#E24B4A'                  // red
}

export function latLonToVector3(lat: number, lon: number, radius = 1.05): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
      (radius * Math.cos(phi)),
      (radius * Math.sin(phi) * Math.sin(theta))
  )
}

export type TaskType = 'code' | 'reason' | 'summ'

export const MODELS: Record<TaskType, { name: string; sci: number; note: string; best: boolean }[]> = {
  code: [
    { name: 'Qwen-SCI-7B', sci: 38, note: 'Baseline · lowest SCI', best: true  },
    { name: 'Qwen-72B',    sci: 52, note: 'High quality',           best: false },
    { name: 'Claude 3.5',  sci: 78, note: 'Balanced',               best: false },
    { name: 'GPT-4o',      sci: 91, note: 'Quality-first',          best: false },
  ],
  reason: [
    { name: 'Qwen-72B',    sci: 52, note: 'Best quality/SCI',       best: true  },
    { name: 'Qwen-SCI-7B', sci: 38, note: 'Baseline',               best: false },
    { name: 'Claude 3.5',  sci: 78, note: 'Strong reasoning',       best: false },
    { name: 'GPT-4o',      sci: 91, note: 'Quality-first',          best: false },
  ],
  summ: [
    { name: 'Qwen-SCI-7B', sci: 38, note: 'Best efficiency',        best: true  },
    { name: 'Qwen-7B',     sci: 41, note: 'Fast',                   best: false },
    { name: 'Claude 3.5',  sci: 78, note: 'Good quality',           best: false },
    { name: 'GPT-4o',      sci: 91, note: 'Overkill',               best: false },
  ],
}
