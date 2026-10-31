const http = require('node:http')
const { readFile } = require('node:fs/promises')
const { existsSync } = require('node:fs')

if (existsSync('.env')) process.loadEnvFile()

const key = process.env.GROQ_API_KEY
const port = 3000

function send(response, status, value, type = 'application/json') {
  response.writeHead(status, { 'Content-Type': type })
  response.end(typeof value === 'string' ? value : JSON.stringify(value))
}

const server = http.createServer(async (request, response) => {
  if (request.url === '/api/chat' && request.method === 'POST') {
    let body = ''
    request.on('data', part => body += part)

    request.on('end', async () => {
      let message

      try {
        message = JSON.parse(body).message
      } catch {
        send(response, 400, { error: 'Invalid JSON' })
        return
      }

      if (!message || !key) {
        send(response, 400, { error: message ? 'API key missing' : 'Message missing' })
        return
      }

      try {
        const groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: message }]
          })
        })

        const result = await groq.json()
        const answer = result.choices?.[0]?.message?.content
        send(response, groq.ok ? 200 : 502,
          groq.ok ? { message: answer || 'No answer' } : { error: 'Groq request failed' })
      } catch {
        send(response, 502, { error: 'Could not reach Groq' })
      }
    })
    return
  }

  const file = request.url === '/' ? 'index.html' : request.url.slice(1).split('?')[0]
  if (!['index.html', 'horror.js'].includes(file)) {
    send(response, 404, 'Not found', 'text/plain')
    return
  }

  try {
    const value = await readFile(file)
    const type = file.endsWith('.js') ? 'text/javascript' : 'text/html'
    send(response, 200, value, type)
  } catch {
    send(response, 404, 'Not found', 'text/plain')
  }
})

server.listen(port, () => console.log(`Open http://localhost:${port}`))
