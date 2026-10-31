const { readFile } = require('node:fs/promises')
const path = require('node:path')

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).send('Method not allowed')
  }

  try {
    const html = await readFile(path.join(process.cwd(), 'public', 'index.html'), 'utf8')
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    return response.status(200).send(html)
  } catch {
    return response.status(404).send('Homepage not found')
  }
}
