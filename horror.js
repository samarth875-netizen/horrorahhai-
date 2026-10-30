import * as THREE from 'https://unpkg.com/three@0.166.1/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.166.1/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.166.1/examples/jsm/geometries/RoundedBoxGeometry.js'

const colors = {
  ink: 0x0b0a08,
  paper: 0xf4efe0,
  orange: 0xff7a00,
  dark: 0x22211c
}

const layout = [
  ['sin(', 'cos(', 'tan(', 'π'],
  ['log', 'ln', '√', 'x²'],
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+']
]

let scene
let camera
let renderer
let controls
let canvas
let context
let texture
let screen
let buttons = []
let conversation = ''
let draft = ''
let scroll = 0
let stickToBottom = true
let sending = false

function wrapLines(text, width) {
  const lines = []
  let current = ''

  for (const word of text.split(' ')) {
    const trial = current ? `${current} ${word}` : word
    if (context.measureText(trial).width > width && current) {
      lines.push(current)
      current = word
    } else {
      current = trial
    }
  }

  if (current) lines.push(current)
  return lines
}

function drawScreen() {
  context.fillStyle = '#0b0a08'
  context.fillRect(0, 0, 640, 960)
  context.strokeStyle = '#000'
  context.lineWidth = 10
  context.strokeRect(5, 5, 630, 950)
  context.fillStyle = '#ff7a00'
  context.font = '40px monospace'
  context.textBaseline = 'top'

  const lineHeight = 52
  const top = 40
  const history = conversation
    .split('\n')
    .filter(Boolean)
    .flatMap(line => wrapLines(line, 540))
  const input = wrapLines(`> ${draft}${sending ? '' : '|'}`, 540)
  const inputTop = top + history.length * lineHeight + 32
  const bottom = inputTop + input.length * lineHeight
  const maxScroll = Math.max(0, bottom - 920)

  if (stickToBottom) {
    scroll = maxScroll
  } else {
    scroll = Math.max(0, Math.min(scroll, maxScroll))
    if (scroll === maxScroll) stickToBottom = true
  }

  history.forEach((line, i) => {
    const y = top + i * lineHeight - scroll
    if (y + lineHeight > top && y < 920) context.fillText(line, 40, y)
  })

  const separator = top + history.length * lineHeight + 8 - scroll
  if (separator >= top - 2 && separator <= 920) {
    context.strokeStyle = '#7a4a20'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(40, separator)
    context.lineTo(600, separator)
    context.stroke()
  }

  input.forEach((line, i) => {
    const y = inputTop + i * lineHeight - scroll
    if (y + lineHeight > top && y < 920) context.fillText(line, 40, y)
  })

  texture.needsUpdate = true
}

async function sendQuestion() {
  const question = draft.trim()
  if (!question || sending) return

  conversation += `${conversation ? '\n' : ''}dumb ahh person: ${question}\n`
  draft = ''
  stickToBottom = true

  const key = window.GROQ_API_KEY
  const model = window.CALC_MODEL
  if (!key || !model) {
    conversation += 'API key or model is not set\n'
    drawScreen()
    return
  }

  sending = true
  drawScreen()

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: question }]
      })
    })

    const data = await response.json()
    if (!response.ok) {
      conversation += `API error ${response.status}: ${data.error?.message || 'unknown error'}\n`
    } else {
      conversation += `big teach: ${data.choices?.[0]?.message?.content || 'No answer'}\n`
    }
  } catch {
    conversation += 'Could not reach Groq\n'
  } finally {
    sending = false
    drawScreen()
  }
}

function buildCalculator() {
  const calculator = new THREE.Group()

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1, 2.6, 0.34, 0.14, 6),
    new THREE.MeshStandardMaterial({
      color: 0xdcdcdc,
      metalness: 0.1,
      roughness: 0.6
    })
  )
  calculator.add(body)

  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(0.86, 1.1, 0.341, 0.12, 6),
    new THREE.MeshStandardMaterial({ color: colors.paper })
  )
  bezel.position.set(0, 0.65, 0.171)
  calculator.add(bezel)

  canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 960
  context = canvas.getContext('2d')
  texture = new THREE.CanvasTexture(canvas)

  screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 1),
    new THREE.MeshBasicMaterial({ map: texture })
  )
  screen.position.set(0, 0.65, 0.343)
  calculator.add(screen)

  const buttonGeometry = new RoundedBoxGeometry(0.16, 0.16, 0.07, 0.04, 3)
  const buttonMaterial = new THREE.MeshStandardMaterial({ color: colors.dark })
  const equalsMaterial = new THREE.MeshStandardMaterial({ color: colors.orange })

  layout.forEach((row, rowIndex) => {
    row.forEach((label, columnIndex) => {
      const button = new THREE.Mesh(
        buttonGeometry,
        label === '=' ? equalsMaterial : buttonMaterial
      )
      button.position.set(
        -0.34 + columnIndex * 0.24,
        -0.25 - rowIndex * 0.18,
        0.171
      )
      button.userData.label = label
      calculator.add(button)
      buttons.push(button)
    })
  })

  scene.add(calculator)
}

export function mount(id) {
  const container = document.getElementById(id)
  if (!container) throw new Error(`Could not find #${id}`)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(colors.ink)

  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    40
  )
  camera.position.set(2.2, 1, 3.4)

  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(2, 4, 3)
  scene.add(light)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0.4, 0)

  buildCalculator()
  drawScreen()

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  container.addEventListener('pointerdown', event => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(pointer, camera)

    const hits = raycaster.intersectObjects(buttons)
    if (hits.length) {
      draft += hits[0].object.userData.label
      stickToBottom = true
      drawScreen()
    }
  })

  renderer.domElement.addEventListener('wheel', event => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.intersectObject(screen).length) return

    event.preventDefault()
    stickToBottom = false
    scroll += event.deltaY
    drawScreen()
  }, { passive: false })

  window.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      sendQuestion()
    } else if (event.key === 'Backspace') {
      draft = draft.slice(0, -1)
      stickToBottom = true
      drawScreen()
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      draft += event.key
      stickToBottom = true
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
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
}
