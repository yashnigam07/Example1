import { Canvas, useFrame, extend, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Sparkles, shaderMaterial } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import gsap from 'gsap'
import Stats from 'stats.js'
import React from 'react'

// Error Boundary Component
class CanvasErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Rendering Error</h1>
            <p className="text-sm">{this.state.error?.message || 'An error occurred in the 3D scene.'}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Custom shader for galaxy core
const GalaxyMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorInner: new THREE.Color('#ffffff'),
    uColorOuter: new THREE.Color('#8899ff'),
    uDensity: 1.0,
    uSpiral: 0.5,
  },
  // Vertex Shader
  `
    varying vec3 vPosition;
    varying vec3 vColor;
    attribute vec3 color;
    void main() {
      vPosition = position;
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 0.5 * (1.0 + 100.0 / gl_Position.w);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColorInner;
    uniform vec3 uColorOuter;
    uniform float uDensity;
    uniform float uSpiral;
    varying vec3 vPosition;
    varying vec3 vColor;
    void main() {
      float dist = length(vPosition);
      float spiral = sin(atan(vPosition.z, vPosition.x) * uSpiral + dist * 0.1 + uTime * 0.2);
      float density = pow(uDensity, 2.0) * (1.0 - dist / 60.0) * spiral;
      vec3 color = mix(uColorInner, uColorOuter, dist / 60.0);
      gl_FragColor = vec4(color * density, density * 0.5);
    }
  `
)
extend({ GalaxyMaterial })

function GalaxyCore({ density, spiral }) {
  const materialRef = useRef()
  const geometry = useMemo(() => {
    const positions = []
    const colors = []
    const centerColor = new THREE.Color('#ffffff')
    const outerColor = new THREE.Color('#8899ff')

    for (let i = 0; i < 30000; i++) { // Reduced for performance
      const radius = Math.random() * 60
      const angle = Math.random() * 2 * Math.PI
      const spin = radius * (0.3 + Math.random() * 0.2)

      const x = Math.cos(angle + spin) * radius
      const y = (Math.random() - 0.5) * 8 * (1 - radius / 60)
      const z = Math.sin(angle + spin) * radius

      positions.push(x, y, z)
      const mixedColor = centerColor.clone().lerp(outerColor, radius / 60)
      colors.push(mixedColor.r, mixedColor.g, mixedColor.b)
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geom
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime()
      materialRef.current.uDensity = density
      materialRef.current.uSpiral = spiral
    }
  })

  return (
    <points geometry={geometry}>
      <galaxyMaterial ref={materialRef} blending={THREE.AdditiveBlending} depthWrite={false} transparent={true} />
    </points>
  )
}

function NebulaClouds() {
  const pointsRef = useRef()
  const geometry = useMemo(() => {
    const positions = []
    const colors = []
    const nebulaColor = new THREE.Color('#ff88cc')

    for (let i = 0; i < 5000; i++) { // Reduced for performance
      const radius = 40 + Math.random() * 20
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions.push(x, y, z)
      colors.push(nebulaColor.r, nebulaColor.g, nebulaColor.b)
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geom
  }, [])

  return (
    <points ref={pointsRef}>
      <pointsMaterial
        size={0.8}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent={true}
        opacity={0.3}
      />
    </points>
  )
}

function AnimatedGalaxy() {
  const groupRef = useRef()
  const lightRef = useRef()
  const { camera } = useThree()

  const {
    starCount,
    sparkleCount,
    sparkleSize,
    lightIntensity,
    rotateSpeed,
    lightColor,
    sparkleSpeed,
    density,
    spiral,
    bloomIntensity,
  } = useControls({
    starCount: { value: 30000, min: 1000, max: 50000, step: 1000 },
    sparkleCount: { value: 800, min: 0, max: 2000, step: 10 },
    sparkleSize: { value: 2, min: 0.1, max: 5, step: 0.1 },
    sparkleSpeed: { value: 0.8, min: 0.1, max: 2, step: 0.1 },
    lightIntensity: { value: 3, min: 0, max: 10, step: 0.1 },
    rotateSpeed: { value: 0.02, min: 0.001, max: 0.1, step: 0.001 },
    lightColor: '#ffccff',
    density: { value: 1.5, min: 0.1, max: 3, step: 0.1 },
    spiral: { value: 0.6, min: 0.1, max: 2, step: 0.1 },
    bloomIntensity: { value: 1.5, min: 0, max: 3, step: 0.1 },
  })

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotateSpeed
    }
  })

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    tl.to(lightRef.current.position, {
      x: 8,
      y: 5,
      z: 4,
      duration: 8,
      ease: 'power2.inOut',
    }).to(lightRef.current.position, {
      x: -8,
      y: 3,
      z: -4,
      duration: 8,
      ease: 'power2.inOut',
    })

    // Cinematic camera animation
    const cameraTl = gsap.timeline({ repeat: -1 })
    cameraTl
      .to(camera.position, {
        x: 30,
        y: 20,
        z: 30,
        duration: 20,
        ease: 'sine.inOut',
        onUpdate: () => camera.lookAt(0, 0, 0),
      })
      .to(camera.position, {
        x: -20,
        y: 10,
        z: 40,
        duration: 20,
        ease: 'sine.inOut',
        onUpdate: () => camera.lookAt(0, 0, 0),
      })
  }, [camera])

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      <pointLight ref={lightRef} intensity={lightIntensity} position={[0, 2, 0]} color={lightColor} />
      <Stars radius={600} depth={150} count={starCount} factor={8} saturation={0.5} fade speed={1.2} />
      <Sparkles count={sparkleCount} size={sparkleSize} scale={150} speed={sparkleSpeed} />
      <GalaxyCore density={density} spiral={spiral} />
      <NebulaClouds />
    </group>
  )
}

function StatsMonitor() {
  useEffect(() => {
    const stats = new Stats()
    stats.showPanel(0)
    stats.dom.style.position = 'absolute'
    stats.dom.style.top = '10px'
    stats.dom.style.right = '10px'
    document.body.appendChild(stats.dom)

    const animate = () => {
      stats.begin()
      stats.end()
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    return () => {
      document.body.removeChild(stats.dom)
    }
  }, [])

  return null
}

export default function App() {
  useEffect(() => {
    // Handle WebGL context loss
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      const handleContextLost = (event) => {
        event.preventDefault()
        console.warn('WebGL context lost. Attempting to restore...')
      }
      const handleContextRestored = () => {
        console.log('WebGL context restored.')
      }
      gl.canvas.addEventListener('webglcontextlost', handleContextLost)
      gl.canvas.addEventListener('webglcontextrestored', handleContextRestored)
      return () => {
        gl.canvas.removeEventListener('webglcontextlost', handleContextLost)
        gl.canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      }
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-black via-indigo-950 to-black text-white overflow-hidden">
      <CanvasErrorBoundary>
        <Canvas camera={{ position: [0, 0, 30], fov: 75 }} gl={{ alpha: true, antialias: true }} shadows>
          <AnimatedGalaxy />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            maxDistance={100}
            minDistance={10}
            enableDamping
            dampingFactor={0.05}
          />
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
            {/* GodRays disabled to avoid error; re-enable after fixing light source */}
            {/* <GodRays sun={lightRef.current} decay={0.92} weight={0.4} exposure={0.6} clampMax={1.0} samples={60} /> */}
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
      <StatsMonitor />
      <Leva collapsed={false} position={{ x: 10, y: 100 }} />
      <div className="absolute top-5 left-5 bg-black/70 px-8 py-6 rounded-xl shadow-2xl backdrop-blur-lg border border-indigo-500/30">
        <h1 className="text-2xl font-bold tracking-widest text-indigo-200">🌌 Interstellar Cosmos</h1>
        <p className="text-sm opacity-80 text-indigo-300">
          A cinematic galaxy simulation powered by Three.js, Drei, GSAP, and Tailwind
        </p>
        <p className="text-xs mt-2 opacity-60">
          Tip: Use Leva controls to tweak the galaxy's appearance
        </p>
      </div>
      <div className="absolute bottom-5 right-5 bg-black/70 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-lg border border-indigo-500/30">
        <p className="text-sm opacity-80 text-indigo-300">
          Controls: Drag to rotate, scroll to zoom
        </p>
      </div>
    </div>
  )
}