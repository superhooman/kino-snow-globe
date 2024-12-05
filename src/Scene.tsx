import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, GroupProps, MeshProps } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { useMask, useGLTF, Float, Instance, Instances, CameraControls, Sphere as SphereObject, Cylinder, Box } from '@react-three/drei'
import { Lightformer, Environment, RandomizedLight, AccumulativeShadows, MeshTransmissionMaterial } from '@react-three/drei'
import { AdditiveBlending, ExtrudeGeometry, Group, MathUtils, Mesh, Points } from 'three'

type SphereConfig = [
  number, string, number, [number, number, number]
];

export const Scene: React.FC<{ spheres: SphereConfig[] }> = ({ spheres }) => {
  return (
    <Canvas shadows camera={{ position: [30, 0, -3], fov: 35, near: 1, far: 50 }}>
      <color attach="background" args={['#E343A7']} />
      <Aquarium position={[0, 0.25, 0]}>
        <Float rotationIntensity={2} floatIntensity={2} speed={2}>
          <Kino position={[0, -0.5, 2.3]} rotation={[0, Math.PI / 2, 0]} scale={0.008} />
        </Float>
        <Cylinder args={[4, 4, 1, 16]} position={[0, -2.8, 0]}>
          <meshBasicMaterial color="white" />
        </Cylinder>
        <ClapperBoardBox />
        <PopcornBox />
        <Tree />
        <CustomGeometryParticles />
        <Instances renderOrder={-1000}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshBasicMaterial depthTest={false} />
          {spheres.map(([scale, color, speed, position], index) => (
            <Sphere key={index} scale={scale} color={color} speed={speed} position={position} />
          ))}
        </Instances>
      </Aquarium>
      <Cylinder castShadow args={[3, 4, 2, 32]} position={[0, -4, 0]}>
        <meshStandardMaterial color="#8F46FE" metalness={0.5} roughness={0.2} />
      </Cylinder>
      {/** Soft shadows */}
      <AccumulativeShadows temporal frames={100} color="black" colorBlend={2} opacity={0.7} scale={60} position={[0, -5, 0]}>
        <RandomizedLight amount={8} radius={15} ambient={0.5} intensity={1} position={[-5, 10, -5]} size={20} />
      </AccumulativeShadows>

      {/** Custom environment map */}
      <Environment resolution={1024}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          {[2, 0, 2, 0].map((x, i) => (
            <Lightformer key={i} form="circle" intensity={4} rotation={[Math.PI / 2, 0, 0]} position={[x, 4, i * 4]} scale={[4, 1, 1]} />
          ))}
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[50, 2, 1]} />
        </group>
      </Environment>
      <CameraControls truckSpeed={0} dollySpeed={0} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  )
}

const CustomGeometryParticles = ({ count = 1000 }: { count?: number }) => {
  const radius = 4;

  // This reference gives us direct access to our points
  const points = useRef<Points>(null);

  // Generate our positions attributes array
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const distance = Math.sqrt(Math.random()) * radius;
      const theta = MathUtils.randFloatSpread(360);
      const phi = MathUtils.randFloatSpread(360);

      let x = distance * Math.sin(theta) * Math.cos(phi)
      let y = distance * Math.sin(theta) * Math.sin(phi);
      let z = distance * Math.cos(theta);

      positions.set([x, y, z], i * 3);
    }

    return positions;
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: {
      value: 0.0
    },
    uRadius: {
      value: radius
    }
  }), [])

  useFrame((state) => {
    if (!points.current) return;

    const { clock } = state;
    points.current.material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={(
          `
          varying float vDistance;

          void main() {
            vec3 color = vec3(1, 1, 1);
            float strength = distance(gl_PointCoord, vec2(0.5));
            strength = 1.0 - strength;
            strength = pow(strength, 3.0);

            color = mix(color, vec3(1, 1, 1), vDistance * 0.5);
            color = mix(vec3(0.0), color, strength);
            gl_FragColor = vec4(color, strength);
          }

          `
        )}
        vertexShader={(
          `
uniform float uTime;
uniform float uRadius;

varying float vDistance;

// Source: https://github.com/dmnsgn/glsl-rotate/blob/main/rotation-3d-y.glsl.js
mat3 rotation3dY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

void main() {
  float distanceFactor = pow(uRadius - distance(position, vec3(0.0)), 1.5);
  float size = 200.0;

  // Apply rotation and downward motion
  vec3 particlePosition = position * rotation3dY(uTime * 0.3 * distanceFactor);
  particlePosition.y -= uTime * 0.05; // Slowly move particles downward

  vDistance = distanceFactor;

  vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  gl_PointSize = size;
  // Size attenuation
  gl_PointSize *= (1.0 / -viewPosition.z);
}
          `
        )}
        uniforms={uniforms}
      />
    </points>
  );
};

const Aquarium = ({ children, ...props }: React.PropsWithChildren<GroupProps>) => {
  const ref = useRef<Group>(null);

  const stencil = useMask(1, false);

  useLayoutEffect(() => {
    // @ts-expect-error - wrong types
    ref.current?.traverse((child) => 'material' in child && Object.assign(child.material, { ...stencil }))
  }, [stencil])

  return (
    <group {...props} dispose={null}>
      <SphereObject castShadow args={[5, 32, 32]}>
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={3}
          chromaticAberration={0.025}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.2}
          // @ts-expect-error - wrong types
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
        />
      </SphereObject>
      <group ref={ref}>{children}</group>
    </group>
  )
}

interface SphereProps extends Pick<MeshProps, 'position' | 'scale'> {
  speed?: number;
  color?: string;
}

const Sphere: React.FC<SphereProps> = ({ position, scale = 1, speed = 0.1, color = 'white' }) => {
  return (
    <Float rotationIntensity={40} floatIntensity={20} speed={speed / 2}>
      <Instance position={position} scale={scale} color={color} />
    </Float>
  )
}

const ClapperBoardBox = () => {
  const texture = useLoader(TextureLoader, '/clapboard.jpg')
  const meshRef = useRef<Mesh>(null);

  return (
    <Box args={[1, 1, 0.1]} ref={meshRef} scale={1} position={[-2, -2, 1]} rotation={[-Math.PI / 16, Math.PI / 2, 0]}>
      <meshBasicMaterial map={texture} attach="material" />
    </Box>
  )
}

const PopcornBox = () => {
  const { scene } = useGLTF('/pop.glb');
  return (
    <group scale={[0.5, 0.5, 0.5]} position={[1, -2.5, 1]} rotation={[Math.PI / 12, -Math.PI / 12, -Math.PI / 12]}>
      <primitive object={scene} />
    </group>
  )
};

const Tree = () => {
  const { scene } = useGLTF('/tree.glb');
  return (
    <group scale={[0.8, 0.8, 0.8]} position={[-1, -2.3, -1]} rotation={[-Math.PI / 24, 0, Math.PI / 24]}>
      <primitive object={scene} />
    </group>
  )
};

// const Kino: React.FC<MeshProps> = (props) => {
//   const ref = useRef<Mesh>(null);
//   const { nodes } = useGLTF('/untitled.glb');

//   useFrame((state) => {
//     if (ref.current) {
//       ref.current.rotation.x = Math.sin(state.clock.elapsedTime / 4) / 2
//     }
//   });

//   return (
//     <mesh ref={ref} geometry={(nodes.Shape_0 as unknown as { geometry: BufferGeometry }).geometry} {...props}>
//       <meshStandardMaterial color="#00f000" metalness={0.2} roughness={0} />
//     </mesh>
//   )
// }

// Your SVG path
const pathData = "M280.389 174.862C264.628 235.315 208.832 280 142.42 280C63.7635 280 0 217.32 0 140C0 62.6801 63.7635 0 142.42 0C208.832 0 264.628 44.6851 280.389 105.138C296.15 44.6851 351.946 0 418.358 0C497.014 0 560.778 62.6801 560.778 140C560.778 217.32 497.014 280 418.358 280C351.946 280 296.15 235.315 280.389 174.862Z";

const Kino: React.FC<MeshProps> = (props) => {
  const shapre = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}" /></svg>`);

    const [path] = svgData.paths;

    const [shape] = path.toShapes(true);

    const extrudeSettings = {
      curveSegments: 16,
      steps: 2,
      depth: 32,
      bevelEnabled: true,
      bevelThickness: 3,
      bevelSize: 3,
      bevelOffset: 0,
      bevelSegments: 1,
    };

    const geometry = new ExtrudeGeometry(shape, extrudeSettings);

    return geometry;
  }, []);

  return (
    <mesh geometry={shapre} {...props}>
      <meshStandardMaterial color="#00f000" metalness={0.2} roughness={0} />
    </mesh>
  );
};