# Mimic The Emoji

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Play%20Now-brightgreen?style=for-the-badge&logo=github)](https://temamumtaza.github.io/MimicTheEmoji/)

## Overview
Mimic The Emoji is a web-based game that challenges players to mimic facial expressions shown on screen. Using computer vision technology through TensorFlow.js and face-api.js, the game detects the player's facial expressions in real-time via their webcam and matches them against the target emoji.

## Features
- Real-time webcam facial expression detection
- Random emoji challenges
- Timer-based gameplay (5 seconds per emoji)
- Score tracking
- Responsive design
- No backend required (runs entirely in the browser)

## Supported Expressions
- 😐 Neutral
- 😀 Happy
- 😢 Sad
- 😠 Angry
- 😮 Surprised

## How to Play
1. Allow webcam access when prompted
2. Click "Start Game" to begin
3. Wait for the "3, 2, 1" countdown
4. Mimic the emoji shown on screen
5. Successfully match 5 different facial expressions to win the game!

## Technical Implementation
This project uses:
- HTML, CSS, and JavaScript for the frontend
- TensorFlow.js for machine learning capabilities
- face-api.js for facial expression recognition
- Browser's navigator.mediaDevices API for webcam access

All processing happens directly in the browser - no server needed!

## Live Demo
Try the game instantly through our GitHub Pages hosted demo: [Play Mimic The Emoji](https://temamumtaza.github.io/MimicTheEmoji/)

Just click the link or the badge at the top of this README to play right in your browser without downloading anything!

## Setup Instructions (Local)
If you prefer to run it locally:
1. Clone or download this repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)
3. Allow camera access when prompted

Note: For proper face detection, ensure you have adequate lighting and are facing the camera directly.

## Privacy
This application processes all data locally in your browser. No images or data are sent to any server.

## Challenge Context
This project was created as part of the "7 App 7 Hari" (7 Apps in 7 Days) challenge - Day 2.
