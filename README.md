# Hand-Runner

A web-based 3D endless runner game inspired by *Subway Surfers*, built using **Three.js** for rendering and **MediaPipe Hands** for real-time webcam gesture controls.

## 🎮 About the Game

**Hand-Runner** lets players dodge obstacles, jump over hurdles, duck under archways, and collect coins in a 3D environment. You can control the player either using physical hand gestures captured by your computer's webcam or with standard keyboard controls.

### Key Features

* **3D Graphics Engine**: Built with Three.js featuring continuous track generation, dynamic lighting, shadow maps, and particle effects for coin pickups and collisions.

* **AI-Powered Hand Tracking**: Real-time hand tracking via MediaPipe Hands with zero server-side processing.

* **Dual Controls**: Seamlessly switch between hand gestures and keyboard controls.

* **Synthesized Audio Effects**: Custom sound effects for jumping, sliding, coin collecting, and crashing generated via the Web Audio API without external audio files.

* **Live Video PIP Overlay**: On-screen webcam feed displaying real-time hand landmark tracking and gesture status feedback.

* **Persistence**: High scores and coin totals are saved locally in your browser's local storage.

## 🛠️ Tech Stack

* **Frontend & Rendering**: [Three.js](https://threejs.org/) (r128) for 3D graphics, camera positioning, and geometry generation.

* **Computer Vision & AI**: [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html) for hand landmark detection and real-time gesture recognition.

* **Styling**: [Tailwind CSS](https://tailwindcss.com/) CDN for responsive Glassmorphism UI components.

* **Icons**: [Font Awesome 6](https://fontawesome.com/) for UI icons.

* **Audio Engine**: Native **Web Audio API** for synthesized sound effects.

## 🖐️ Controls Guide

### Hand Gestures (Webcam)

Ensure your webcam is enabled and your hand is clearly visible within the frame.

| Action | Gesture Description | 
| ----- | ----- | 
| **Move Left** | Move your wrist to the left side of the camera frame (< 38% width). | 
| **Move Right** | Move your wrist to the right side of the camera frame (> 62% width). | 
| **Jump** | Raise your hand into the top portion of the frame or quickly swipe upward. | 
| **Duck / Slide** | Lower your hand into the bottom portion of the frame or quickly swipe downward. | 

### Keyboard Controls

* **Move Left**: `A` or `Left Arrow`

* **Move Right**: `D` or `Right Arrow`

* **Jump**: `W` or `Up Arrow`

* **Duck / Slide**: `S` or `Down Arrow`

## 🚀 How to Run the Project

Because the application is fully self-contained within a single static file using CDN dependencies, running it is simple:

### Option 1: Direct File Launch

1. Clone or download this repository.

2. Double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Brave, or Firefox recommended).

### Option 2: Live Server (Recommended for Webcam Permissions)

To prevent web browsers from restricting webcam access due to `file://` protocol restrictions:

1. Open the project folder in VS Code.

2. Use an extension like **Live Server** to host the file at `http://127.0.0.1:5500`.

3. Open the hosted URL in your browser and allow webcam permissions when prompted.