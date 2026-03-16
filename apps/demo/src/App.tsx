/**
 * CSS-in-TS Demo App
 * 
 * This example demonstrates the cssints workflow:
 * 1. Import utility functions from cssints
 * 2. Generate atomic CSS classes
 * 3. Process with the postprocessor (shown in build output)
 */

import { 
  calc, min,
  rgb, hsl, oklch
} from 'cssints'
import { processCSS } from '@cssints/postprocessor'
import { Effect } from 'effect'
import { useEffect, useState } from 'react'

// Demo color values using the color functions
const _colors = {
  primary: rgb(59, 130, 246),
  secondary: hsl(30, 100, 50),
  accent: oklch(0.7, 0.2, 30),
}

// Demo responsive calculations
const _responsive = {
  container: calc('100vw', '-', '4rem'),
  halfWidth: calc('50%', '-', '1rem'),
  minConstraint: min('100vw', '1200px'),
}

function App() {
  const [generatedCSS, setGeneratedCSS] = useState('')

  useEffect(() => {
    const placeholderCSS = `
      @atomic padding 1rem { }
      @atomic margin 1rem { }
      @atomic margin 0.5rem { }
      @atomic display flex { }
      @atomic align-items center { }
      @atomic justify-content center { }
      @calc _a1b2c3 100vw - 4rem { }
      @calc _d4e5f6 50% - 1rem { }
      @calc _g7h8i9 min(100vw, 1200px) { }
    `

    // Process the CSS (in real app this happens at build time)
    void Effect.runPromise(processCSS(placeholderCSS, { minify: false })).then(result => {
      setGeneratedCSS(result.code)
    })
  }, [])

  return (
    <div className="demo-container">
      <h1>CSS-in-TS Demo</h1>
      <p>Type-safe CSS generation with compile-time macros</p>
      
      <div className="section">
        <h2>1. Type-Safe Utilities</h2>
        <pre>{`
import { calc, min, max } from 'cssints'

const width = calc('100vw', '-', '4rem')
const minWidth = min('100vw', '1200px')
const maxWidth = max('300px', '50vw')
        `}</pre>
      </div>

      <div className="section">
        <h2>2. Responsive Calculations</h2>
        <pre>{`
import { calc, min, max } from 'cssints'

// Explicit operators for clarity
const width = calc('100vw', '-', '4rem')
const minWidth = min('100vw', '1200px')
const clamped = calc('clamp(320px, 50vw, 1200px)')

// Type-safe: validates length units
        `}</pre>
      </div>

      <div className="section">
        <h2>3. Color Functions</h2>
        <pre>{`
import { rgb, hsl, oklch, hex } from 'cssints'

// RGB with validation (0-255)
const blue = rgb(59, 130, 246)

// HSL with percentage validation
const orange = hsl(30, 100, 50)

// Perceptually uniform colors
const purple = oklch(0.7, 0.2, 300)

// Hex validation
const red = hex('#ef4444')
        `}</pre>
        
        <div className="color-demos">
          <div className="color-box" style={{ background: '#3b82f6' }}>
            rgb(59, 130, 246)
          </div>
          <div className="color-box" style={{ background: 'hsl(30, 100%, 50%)' }}>
            hsl(30, 100%, 50%)
          </div>
          <div className="color-box" style={{ background: 'oklch(0.7 0.2 300)' }}>
            oklch(0.7, 0.2, 300)
          </div>
        </div>
      </div>

      <div className="section">
        <h2>4. Generated CSS (Post-Processor Output)</h2>
        <p>This is what the postprocessor produces from the placeholder CSS:</p>
        <pre className="css-output">{generatedCSS || 'Processing...'}</pre>
      </div>

      <div className="section">
        <h2>5. Key Features</h2>
        <ul className="feature-list">
          <li><strong>Zero Runtime:</strong> All CSS generated at build time</li>
          <li><strong>Type Safety:</strong> Catch CSS errors at compile time</li>
          <li><strong>Atomic CSS:</strong> Minimal bundle size, maximum reuse</li>
          <li><strong>CSS Layers:</strong> Predictable specificity with @layer</li>
          <li><strong>LightningCSS:</strong> Automatic optimization and prefixing</li>
        </ul>
      </div>
    </div>
  )
}

export default App