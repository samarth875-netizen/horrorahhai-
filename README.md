# HorrorAHH AI

Hi, I'm Samarth. This is my Halloween-themed AI calculator and chat assistant, made during the 3am hackathon.

It looks like a strange calculator or feature phone, but its screen can answer questions through Groq. The scene is dark, creepy, and fully interactive.

## Live demo

[View the live project](LIVE_PROJECT_URL)

## Demo

<p align="center">
  <img src="screenshots/demo-menu.png" alt="A dark view of the project menu and device" width="49%">
  <img src="screenshots/ai-chat.png" alt="The AI chat screen inside the 3D calculator" width="49%">
</p>

<p align="center">
  <img src="screenshots/close-view.png" alt="Close view of the 3D horror calculator" width="49%">
  <img src="screenshots/full-view.png" alt="Full view of the calculator in its horror scene" width="49%">
</p>

## Features

- 3D horror-themed calculator made with Three.js
- AI chat powered by Groq
- Keyboard and on-screen button interactions
- Colored lighting and an animated ASCII-art background
- Close camera views, a terminal-style chat screen, and orbit controls
- Separate Node.js API route for chat requests

## Run locally

1. Install Node.js 20 or newer.
2. Clone this repository and run `npm install`.
3. Create a `.env` file in the project root:

   ```env
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=openai/gpt-oss-120b
   ```

4. Start the app with:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000`.

## Deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Add `GROQ_API_KEY` under Project Settings > Environment Variables.
3. Optionally add `GROQ_MODEL`.
4. Redeploy the project.

## Built with

- HTML and CSS
- JavaScript and Node.js
- [Three.js](https://threejs.org/)
- [Groq](https://groq.com/)

## Credits

ASCII background created with help from [Jassi](https://jascii.jassi.dev/).
