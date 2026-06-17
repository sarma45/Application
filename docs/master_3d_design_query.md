# Master Prompt: Next-Generation 3D Scene Upgrade (React Three Fiber & Drei)

This prompt instructs an AI coding assistant to upgrade an existing basic React Three Fiber 3D scene (such as a simple floating node constellation or grid) into a next-generation interactive WebGL experience.

***

```markdown
You are an expert WebGL developer and creative technologist specializing in Three.js, React Three Fiber (R3F), and `@react-three/drei`.

Your task is to take our existing, basic 3D scene component (e.g. standard floating spheres and static lines) and upgrade it into a "New Era" interactive experience with high-end sci-fi visual aesthetics, smooth animations, and responsiveness.

Implement the following design enhancements step-by-step:

### 1. Unified Dynamic Agent Core (`AgentCore3D`)
- Replace the center of the scene with a complex nested 3D core structure:
  - **Inner Core**: A wireframe `Icosahedron` or `Octahedron` mesh with strong neon/emissive intensity to represent a neural grid/computational block.
  - **Outer Energy Wave Shield**: Wrap the inner core with a larger `Sphere` utilizing `@react-three/drei`'s `MeshDistortMaterial`. Apply noise distortion, clearcoat glow, metalness, and wave animations to create a fluid, shimmering glass shield.
  - **Categorized Orbit Paths**: Add thin glowing neon torus rings rotating at different angles and speeds around the core to represent computational tracks.

### 2. Interactive Cursor Magnetic Force Field
- Integrate pointer tracking via R3F `useThree()`.
- Implement smooth interpolation (`lerp`) inside the `useFrame` hook to make the elements subtly lean or drift towards the cursor position. 
- Ensure a spring-damping effect so the movement feels organic and alive rather than rigid.

### 3. Real-Time Data Flow Pulses (`DataPulse`)
- Along the connection lines between nodes, introduce animated "data packets":
  - Map connections using Bezier curves (`QuadraticBezierCurve3` or `CubicBezierCurve3`).
  - Render small emissive spheres (`0.04` radius) that travel along these curves from start to end points.
  - Randomize packet speeds slightly and pulsate their sizes to represent active data traffic.
  - Optimize: Only render pulses on a subset of paths (e.g., 50%) to ensure smooth rendering and prevent memory leaks.

### 4. Upgrade Node and Line Aesthetics
- Upgrade simple node spheres to detailed low-poly geometric figures (like `IcosahedronGeometry` with detail `1`).
- Give nodes a 30%–40% chance of being wireframes to add complexity.
- Increase line thickness slightly and reduce line opacities (`0.15`–`0.2`) to make the connections subtle but visible, letting the data pulses stand out.
- Wrap all materials with high-end physical characteristics: high metalness (`0.9`), low roughness (`0.1`), and high clearcoat (`1.0`).

### 5. Volumetric Lighting System
- Set up ambient lighting alongside multiple color-coded neon light sources:
  - Add a strong colored `pointLight` (e.g., violet/neon purple) to cast high-contrast specular highlights.
  - Add a cyan/teal fill light to create dual-tone metallic reflections.
  - Add a directed `spotLight` targeting the core to generate depth and focus.

Ensure all code is written in clean, modern TypeScript, fits seamlessly into the existing project configurations (Tailwind CSS, Next.js client component format), compiles error-free, and optimizes performance for high frame rates (use `dpr={[1, 1.5]}` and `powerPreference: "high-performance"` on the `<Canvas>`).
```
