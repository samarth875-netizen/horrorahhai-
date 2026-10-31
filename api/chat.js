module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.GROQ_API_KEY
  if (!key) {
    return response.status(500).json({ error: 'API key missing' })
  }

  const message = request.body?.message
  if (!message) {
    return response.status(400).json({ error: 'Message missing' })
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
    if (!groq.ok) {
      return response.status(502).json({ error: 'Groq request failed' })
    }

    return response.status(200).json({ message: answer || 'No answer' })
  } catch {
    return response.status(502).json({ error: 'Could not reach Groq' })
  }
}
