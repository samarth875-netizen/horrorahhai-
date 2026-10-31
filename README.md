Also, hello guys, I'm Samarth, and I have made this project.
In this project, there is a Halloween-themed calculator, AI-agent, like a calculator. 
The theme was Halloween. This was made from 3am.hackclub.com, and we made this project.
There is a screen on which you type your question, and the Groq API answers it. That's what the project is all about.
It's about an agent that's turned into a horror-themed thing, so you can visit it at Halloween.
The object you see turns out to be like a calculator to me, but for someone else, it can also be like a feature phone, but that's a different thing.
## Project description

A Halloween-themed 3D calculator and chat assistant built with Three.js. It includes a textured calculator model, an ASCII-art background, colored lighting, button interaction, and keyboard chat input.

## Languages

- HTML
- CSS, written inline in `index.html`
- JavaScript for the frontend and Node.js backend

## Deployment

### Vercel

Vercel serves static files from the repository root and `/api/chat` from
`api/chat.js`. In the Vercel project settings, add `GROQ_API_KEY` as an
environment variable, optionally add `GROQ_MODEL`, and redeploy.

This project needs a Node.js web service because the `/api/chat` route runs in
`server.js`. It cannot run on a static-only host such as GitHub Pages.

For Render, Railway, or a similar platform:

1. Select the repository and use `npm start` as the start command.
2. Add `GROQ_API_KEY` in the platform's environment-variable settings.
3. Optionally add `GROQ_MODEL`.
4. Do not upload `.env`; the repository already ignores it.

## Web resources

- [Three.js](https://threejs.org/)
- [OrbitControls for Three.js](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [RoundedBoxGeometry for Three.js](https://threejs.org/docs/#examples/en/geometries/RoundedBoxGeometry)
- [Groq API](https://groq.com/)
- Three.js modules loaded through [unpkg](https://unpkg.com/)

## Credits

- ASCII background created with help from [Jassi](https://jascii.jassi.dev/)
