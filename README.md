# BharatTrack - College Bus Tracking System

BharatTrack is a comprehensive real-time college bus fleet management and tracking application. It provides distinct interfaces for students, drivers, and administrators to ensure safe, efficient, and transparent transportation.

## 🚀 Key Features

* **Real-time Live Tracking**: Pinpoint accuracy using device GPS capabilities, tracking the exact location of buses in transit.
* **Intelligent Routing**: Map visuals utilize Open Source Routing Machine (OSRM) integration to trace the physical road paths rather than straight lines.
* **Directional Context**: Dynamic route updates depending on whether a bus is traveling **"Towards College"** or **"From College"**, automatically reversing stop sequences.
* **Push Notifications**: Students receive native device notifications when their assigned bus begins or concludes a trip.
* **Self-Healing Sync**: Built-in safeguards that instantly clear out "ghost buses" if a driver's app crashes or is abruptly closed.

## 👥 Dashboards & Roles

### 1. Student Dashboard
* View assigned bus, route, and driver details.
* See the live location of the bus on a map with the physical road route drawn out.
* Get estimated time of arrivals (ETA) for their specific stop.
* Receive toast and native push notifications when their bus starts the trip.

### 2. Driver Console
* One-click "Start Trip" and "End Trip" actions.
* Easily toggle the current trip direction ("To College" / "From College").
* Transmits background location updates via secure Geolocation API.
* Failsafe mechanism prevents premature logouts while a trip is active.

### 3. Admin Dashboard
* **Fleet Management**: Add, edit, or remove buses and manage their operational statuses (Active, Maintenance, Inactive).
* **Live Fleet Tracking**: Monitor the live locations of all active buses simultaneously on a master map.
* **Trip History**: View detailed logs of all completed trips, including timestamps, assigned drivers, and travel directions.
* **Analytics**: High-level statistical cards outlining total buses, total students, and maintenance alerts.

## 🛠 Tech Stack

* **Frontend Framework**: React.js powered by Vite
* **Styling**: Tailwind CSS & Lucide Icons
* **Database & Auth**: Firebase Firestore & Firebase Authentication
* **Maps & Routing**: React-Leaflet, OpenStreetMap (OSM), and OSRM API
* **PWA**: Vite PWA Plugin for Progressive Web App capabilities and service workers

## 📦 Local Setup & Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Firebase Configuration**
   Ensure you have a `.env.local` file in the root directory with your Firebase configuration variables:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *Note: The project uses the `@vitejs/plugin-basic-ssl` plugin to serve the local environment over HTTPS. This is required because modern mobile browsers block access to the Geolocation API on insecure (HTTP) origins.*

4. **Testing on Mobile**
   When accessing the app on your phone via the local IP (e.g., `https://192.168.x.x:5173`), your browser will warn you about a self-signed certificate. Simply click "Advanced" and "Proceed" to allow the Geolocation features to function properly.
