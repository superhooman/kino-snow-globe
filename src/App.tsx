import './index.css'
import { Scene } from './Scene'
import { Logo } from './Logo'

function Overlay() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <Logo style={{ position: 'absolute', bottom: 44, left: 40 }} size={20} />
      <a href="https://kino.kz/" style={{ position: 'absolute', bottom: 40, left: 90, fontSize: '13px' }}>
        kino.kz
        <br />
        Итоги года
      </a>
      <div style={{ position: 'absolute', top: 40, left: 40 }}>2024 —</div>
    </div>
  )
}

export const App = () => {
  return (
    <>
      <Scene
        spheres={[
          [1, 'orange', 0.05, [-4, -1, -1]],
          [0.75, 'hotpink', 0.1, [-4, 2, -2]],
          [1.25, 'aquamarine', 0.2, [4, -3, 2]],
          [1.5, 'lightblue', 0.3, [-4, -2, -3]],
          [2, 'pink', 0.3, [-4, 2, -4]],
          [2, 'skyblue', 0.3, [-4, 2, -4]],
          [1.5, 'orange', 0.05, [-4, -1, -1]],
          [2, 'hotpink', 0.1, [-4, 2, -2]],
          [1.5, 'aquamarine', 0.2, [4, -3, 2]],
          [1.25, 'lightblue', 0.3, [-4, -2, -3]],
          [1, 'pink', 0.3, [-4, 2, -4]],
          [1, 'skyblue', 0.3, [-4, 2, -4]]
        ]}
      />
      <Overlay /></>
  )
}