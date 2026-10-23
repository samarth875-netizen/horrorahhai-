import * as THREE from 'https://unpkg.com/three@0.166.1/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.166.1/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.166.1/examples/jsm/geometries/RoundedBoxGeometry.js'

const INK = 0x0b0a08
const PAPER = 0xf4efe0
const BRAND = 0xff7a00
const DULL = 0x22211c
const BODY_GRAY = 0xdcdcdc

let scene, camera, renderer, controls, group, screenMesh
let canvas, ctx, texture
let buttons = []
let pumpkins = []
let conversation = ''
let draft = ''
let scrollOffset = 0
let followLatest = true
let isSending = false

const ROWS = [
  ['sin(', 'cos(', 'tan(', 'π'],
  ['log', 'ln', '√', 'x²'],
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
]

function wrapText(text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawScreen() {
  ctx.fillStyle = '#0b0a08'
  ctx.fillRect(0, 0, 640, 960)

  // thin black boundary around the screen
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 10
  ctx.strokeRect(5, 5, 630, 950)

  ctx.fillStyle = '#ff7a00'
  ctx.font = '40px monospace'
  ctx.textBaseline = 'top'
  const lineHeight = 52
  const contentTop = 40
  const historyLines = conversation
    .split('\n')
    .filter(Boolean)
    .flatMap(line => wrapText(line, 540))
  const inputLines = wrapText(`> ${draft}${isSending ? '' : '|'}`, 540)
  const inputTop = contentTop + historyLines.length * lineHeight + 32
  const contentBottom = inputTop + inputLines.length * lineHeight
  const maxScroll = Math.max(0, contentBottom - 920)
  if (followLatest) {
    scrollOffset = maxScroll
  } else {
    scrollOffset = Math.max(0, Math.min(scrollOffset, maxScroll))
    if (scrollOffset === maxScroll) followLatest = true
  }

  historyLines.forEach((line, index) => {
    const y = contentTop + index * lineHeight - scrollOffset
    if (y + lineHeight > contentTop && y < 920) ctx.fillText(line, 40, y)
  })

  const separatorY = contentTop + historyLines.length * lineHeight + 8 - scrollOffset
  if (separatorY >= contentTop - 2 && separatorY <= 920) {
    ctx.strokeStyle = '#7a4a20'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(40, separatorY)
    ctx.lineTo(600, separatorY)
    ctx.stroke()
  }

  inputLines.forEach((line, index) => {
    const y = inputTop + index * lineHeight - scrollOffset
    if (y + lineHeight > contentTop && y < 920) ctx.fillText(line, 40, y)
  })
  texture.needsUpdate = true
}

async function send() {
  const q = draft.trim()
  if (!q || isSending) return

  const key = window.GROQ_API_KEY
  const model = window.CALC_MODEL
  conversation += `${conversation ? '\n' : ''}You: ${q}\n`
  draft = ''
  followLatest = true
  if (!key || !model) {
    conversation += '[set GROQ_API_KEY and CALC_MODEL]\n'
    drawScreen()
    return
  }

  isSending = true
  drawScreen()

  try {
    const res = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: q }],
        }),
      }
    )
    if (!res.ok) {
      let detail = ''
      try {
        const data = await res.json()
        detail = data.error?.message || ''
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error
      }
      if (key) detail = detail.replaceAll(key, '[redacted]')
      conversation += `[api error ${res.status}${detail ? `: ${detail}` : ''}]\n`
      return
    }
    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content || '[no answer]'
    conversation += `Assistant: ${answer}\n`
  } catch (error) {
    conversation += '[could not reach Groq]\n'
  } finally {
    isSending = false
    drawScreen()
  }
}

function createPumpkin(x, y, z) {
  const g = new THREE.Group()
  g.position.set(x, y, z)

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6600 })
  )
  body.scale.set(1, 0.82, 1)
  g.add(body)

  const stem = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
  )
  stem.position.set(0, 0.5, 0)
  stem.rotation.x = Math.PI / 2
  g.add(stem)

  // eyes
  const eyeGeo = new THREE.SphereGeometry(0.055, 8, 8)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const lEye = new THREE.Mesh(eyeGeo, eyeMat)
  lEye.position.set(-0.13, 0.08, 0.41)
  const rEye = new THREE.Mesh(eyeGeo, eyeMat)
  rEye.position.set(0.13, 0.08, 0.41)
  g.add(lEye)
  g.add(rEye)

  // eyebrows
  const browGeo = new THREE.BoxGeometry(0.16, 0.025, 0.02)
  const browMat = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const lBrow = new THREE.Mesh(browGeo, browMat)
  lBrow.position.set(-0.17, 0.16, 0.425)
  lBrow.rotation.z = -0.15
  const rBrow = new THREE.Mesh(browGeo, browMat)
  rBrow.position.set(0.17, 0.16, 0.425)
  rBrow.rotation.z = 0.15
  g.add(lBrow)
  g.add(rBrow)

  // nose
  const noseGeo = new THREE.ConeGeometry(0.05, 0.14, 4)
  noseGeo.rotateX(Math.PI / 2)
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const nose = new THREE.Mesh(noseGeo, noseMat)
  nose.position.set(0, -0.02, 0.425)
  g.add(nose)

  // mouth
  const mouthGeo = new THREE.ConeGeometry(0.11, 0.18, 3)
  mouthGeo.rotateX(-Math.PI / 2)
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const mouth = new THREE.Mesh(mouthGeo, mouthMat)
  mouth.position.set(0, -0.16, 0.425)
  g.add(mouth)

  // teeth
  const toothGeo = new THREE.BoxGeometry(0.04, 0.05, 0.02)
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const lTooth = new THREE.Mesh(toothGeo, toothMat)
  lTooth.position.set(-0.04, -0.26, 0.43)
  const rTooth = new THREE.Mesh(toothGeo, toothMat)
  rTooth.position.set(0.04, -0.26, 0.43)
  g.add(lTooth)
  g.add(rTooth)

  pumpkins.push({ group: g, mouth, baseY: y, offset: Math.random() * Math.PI * 2 })
  scene.add(g)
}

function buildCalculator() {
  group = new THREE.Group()

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1.0, 2.6, 0.34, 0.14, 6),
    new THREE.MeshStandardMaterial({ color: BODY_GRAY, metalness: 0.1, roughness: 0.6 })
  )
  group.add(body)

  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(0.86, 1.1, 0.341, 0.12, 6),
    new THREE.MeshStandardMaterial({ color: PAPER })
  )
  bezel.position.set(0, 0.65, 0.171)
  group.add(bezel)

  canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 960
  ctx = canvas.getContext('2d')
  texture = new THREE.CanvasTexture(canvas)

  screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 1.0),
    new THREE.MeshBasicMaterial({ map: texture })
  )
  screenMesh.position.set(0, 0.65, 0.343)
  group.add(screenMesh)

  const grill = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.04, 0.02, 0.01, 2),
    new THREE.MeshStandardMaterial({ color: DULL })
  )
  grill.position.set(0, 1.2, 0.18)
  group.add(grill)

  // speaker dots below grill
  const dotGeo = new THREE.SphereGeometry(0.018, 8, 8)
  const dotMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  for (let i = -2; i <= 2; i++) {
    const d = new THREE.Mesh(dotGeo, dotMat)
    d.position.set(i * 0.14, 1.05, 0.181)
    group.add(d)
  }

  // front sensor dot above screen
  const sensorGeo = new THREE.SphereGeometry(0.02, 8, 8)
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  const sensor = new THREE.Mesh(sensorGeo, sensorMat)
  sensor.position.set(0, 1.28, 0.181)
  group.add(sensor)

  const btnGeo = new RoundedBoxGeometry(0.16, 0.16, 0.07, 0.04, 3)
  const btnMat = new THREE.MeshStandardMaterial({ color: DULL })
  const accMat = new THREE.MeshStandardMaterial({ color: BRAND })

  const startX = -0.34
  const startY = -0.25
  const stepX = 0.24
  const stepY = -0.18

  ROWS.forEach((row, r) => {
    row.forEach((label, c) => {
      const mat = label === '=' ? accMat : btnMat
      const b = new THREE.Mesh(btnGeo, mat)
      b.position.set(startX + c * stepX, startY + r * stepY, 0.171)
      b.userData.label = label
      group.add(b)
      buttons.push(b)
    })
  })

  scene.add(group)
}

export function mount(id) {
  const container = document.getElementById(id)
  if (!container) throw new Error(`mount: no element #${id}`)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(INK)

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 40)
  camera.position.set(2.2, 1.0, 3.4)

  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1)
  dir.position.set(2, 4, 3)
  scene.add(dir)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0.4, 0)

  buildCalculator()

  createPumpkin(-2.0, 0.05, 1.8)
  createPumpkin(2.0, 0.05, 1.8)
  createPumpkin(-2.0, 0.05, -1.8)
  createPumpkin(2.0, 0.05, -1.8)

  drawScreen()

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  container.addEventListener('pointerdown', (e) => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(buttons)
    if (hits.length > 0) {
      draft += hits[0].object.userData.label
      followLatest = true
      drawScreen()
    }
  })

  renderer.domElement.addEventListener('wheel', (e) => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.intersectObject(screenMesh).length) return
    e.preventDefault()
    e.stopImmediatePropagation()
    followLatest = false
    scrollOffset += e.deltaY
    drawScreen()
  }, { capture: true, passive: false })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { send(); return }
    if (e.key === 'Backspace') { draft = draft.slice(0, -1); followLatest = true; drawScreen(); return }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      draft += e.key
      followLatest = true
      drawScreen()
    }
  })

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })

  function animate() {
    requestAnimationFrame(animate)

    const t = performance.now() * 0.002
    pumpkins.forEach(p => {
      const phase = t + p.offset
      p.group.position.y = p.baseY + Math.sin(phase * 1.5) * 0.03
      p.group.rotation.z = Math.sin(phase * 0.4) * 0.04
      const eat = Math.abs(Math.sin(phase * 3))
      p.mouth.scale.y = 0.5 + eat * 0.5
    })

    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}