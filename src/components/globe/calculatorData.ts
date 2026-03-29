export const CARBON_REGIONS = [
  { id: 'iceland',     name: 'Iceland (Landsnet)',   lat: 64.96,  lon: -19.02, intensity: 8   },
  { id: 'sweden',      name: 'Sweden (SvK)',          lat: 60.13,  lon: 18.64,  intensity: 12  },
  { id: 'norway',      name: 'Norway (Statnett)',     lat: 60.47,  lon: 8.47,   intensity: 15  },
  { id: 'france',      name: 'France (RTE)',          lat: 46.23,  lon: 2.21,   intensity: 55  },
  { id: 'brazil',      name: 'Brazil (ONS)',          lat: -14.24, lon: -51.93, intensity: 75  },
  { id: 'uk',          name: 'UK',                    lat: 54.37,  lon: -2.36,  intensity: 180 },
  { id: 'connecticut', name: 'Connecticut (ISO-NE)',  lat: 41.60,  lon: -72.69, intensity: 210 },
  { id: 'california',  name: 'California (CAISO)',    lat: 36.78,  lon: -119.42,intensity: 220 },
  { id: 'germany',     name: 'Germany',               lat: 51.17,  lon: 10.45,  intensity: 310 },
  { id: 'virginia',    name: 'Virginia (PJM)',        lat: 37.43,  lon: -78.66, intensity: 340 },
  { id: 'texas',       name: 'Texas (ERCOT)',         lat: 31.97,  lon: -99.90, intensity: 380 },
  { id: 'japan',       name: 'Japan (TEPCO)',         lat: 35.68,  lon: 139.69, intensity: 450 },
  { id: 'australia',   name: 'Australia (NEM)',       lat: -25.27, lon: 133.78, intensity: 530 },
  { id: 'china',       name: 'China (State Grid)',    lat: 35.86,  lon: 104.20, intensity: 580 },
  { id: 'poland',      name: 'Poland (PSE)',          lat: 51.92,  lon: 19.15,  intensity: 620 },
  { id: 'india',       name: 'India (National Grid)', lat: 20.59,  lon: 78.96,  intensity: 710 },
] as const

export type CarbonRegion = typeof CARBON_REGIONS[number]

export function intensityToColor(v: number): string {
  if (v < 100)  return '#5DB800'  // cyber green
  if (v < 300)  return '#D4860A'  // cyber amber
  if (v < 500)  return '#C8470A'  // cyber orange
  return '#E03030'                 // cyber red
}
