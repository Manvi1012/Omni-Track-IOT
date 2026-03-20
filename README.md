<div align="center">

# 📍 LocationShare MVP

**A production-ready, ultra-smooth Real-Time Multi-User Location Tracker built for iOS and Android.**

[![Expo](https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)](https://leafletjs.com/)

</div>

---

## 🌟 Overview

**LocationShare MVP** is a lightning-fast application capable of synchronizing multiple users' GPS coordinates on a live map in real-time. Whether organizing a convoy, keeping track of friends on a trip, or coordinating a massive event, simply enter a **Group ID** and watch everyone glide across the map simultaneously.

### 🚀 Key Features

*   **Real-Time Synchronization**: Backend powered entirely by Firebase Firestore WebSockets, ensuring sub-second location updates across all connected devices.
*   **Silky Smooth Gliding**: By offloading interpolation physics natively using CSS transitions (`transform 1.2s linear`), markers glide fluidly rather than jumping rigidly across tiles.
*   **Auto-Cleanup Architecture**: Active listeners aggressively purge disconnected or stale users (>10s inactivity) from the DOM to maintain absolute screen clarity.
*   **Intelligent Cross-Platform Rendering**:
    *   **iOS**: Utilizes natively-accelerated Apple Maps via `react-native-maps`.
    *   **Android (Expo Go 51+)**: Completely bypasses the notorious Expo SDK 51 missing Google Maps API Key block by injecting a hyper-optimized **OpenStreetMap Leaflet Engine** via a fullscreen WebView.

---

## 📸 Interface

* Modern Glassmorphic Top Card
* Real-time active users counter
* Floating pill controls for **Center Me 🎯** and **Leave Group 🚪**

---

## 🛠️ Architecture & Tech Stack

*   **Framework**: React Native with Expo SDK 51
*   **Map Engines**: `react-native-maps` / `react-native-webview` + Leaflet.js
*   **Database**: Firebase Firestore (`firebase` web SDK)
*   **Telemetry**: `expo-location`

---

## 📦 Getting Started

### 1. Prerequisites
You must have [Node.js](https://nodejs.org/) and [Expo CLI](https://docs.expo.dev/) installed.

### 2. Installation
Clone this repository and install the dependencies:
\`\`\`bash
git clone https://github.com/YourUsername/LocationShare.git
cd LocationShare
npm install
\`\`\`

### 3. Environment Configuration
For security, Firebase API keys are **not** committed to this repository.
Create a local `.env` file at the root of the project using the structure found in `.env.example`:

\`\`\`env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

### 4. Run the Servers
Boot up the Expo bundler:
\`\`\`bash
npx expo start --lan --clear
\`\`\`
1. Download the **Expo Go** application on your physical iOS or Android device.
2. Scan the QR code appearing in your terminal.
3. Start tracking!

---

## 📝 License
Distributed under the MIT License.
