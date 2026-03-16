/**
 * CSS-in-TS Demo App
 * 
 * This example shows how to use the CSS-in-TS library with Vite.
 * Note: In a real implementation, the macros would be processed at build time.
 */

import './App.css'

function App() {
  return (
    <div className="container">
      <h1>CSS-in-TS Demo</h1>
      <p>This demonstrates the CSS-in-TS workflow.</p>
      
      <div className="card">
        <h2>Features</h2>
        <ul>
          <li>Type-safe CSS generation</li>
          <li>Atomic CSS utilities</li>
          <li>CSS calc() functions</li>
          <li>CSS layers for specificity</li>
        </ul>
      </div>
      
      <div className="button-group">
        <button className="btn-primary">Primary Button</button>
        <button className="btn-secondary">Secondary Button</button>
      </div>
    </div>
  )
}

export default App
