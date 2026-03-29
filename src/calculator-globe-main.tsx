import React from 'react'
import { createRoot } from 'react-dom/client'
import { CalculatorGlobeScene } from './components/globe/CalculatorGlobeScene'

createRoot(document.getElementById('calculator-globe-root')!).render(
  <React.StrictMode>
    <CalculatorGlobeScene />
  </React.StrictMode>
)
