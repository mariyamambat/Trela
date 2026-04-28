# Trela AI

Trela AI is a smart travel planning web application built with React. It helps users generate an AI-assisted trip plan, explore attractions, check weather, estimate travel budget in INR, and save trips to their account for later access.

This project was created as an end-term submission for **Building Web Applications with React** and is designed as a practical, real-world application rather than a basic demo UI.

## Problem Statement
Planning a trip usually requires switching between multiple apps for itinerary ideas, attractions, weather, travel distance, and budget estimation. This process is time-consuming and confusing, especially for users who want a quick but useful plan before booking anything.

**Trela AI** solves this problem by bringing the planning workflow into one place:
- users enter a starting location, destination, and number of days
- the app generates an itinerary with AI
- it fetches real attractions and route insights
- it shows weather and forecast data
- it provides an estimated budget in rupees
- it lets authenticated users save trips for later viewing

## Who Is the User?
- Students and young travelers planning budget-conscious trips
- Working professionals who want a quick first draft of a trip
- Anyone comparing destinations before finalizing travel plans

## Why This Problem Matters
- Trip planning involves fragmented information
- Budget and weather strongly affect travel decisions
- Users need fast, personalized suggestions instead of generic travel articles
- Saving plans makes the app useful beyond a single session

## Core Features
- **Authentication**
  - Email/password signup and login using Firebase Authentication
  - Logged-in state is persisted across sessions

- **AI itinerary generation**
  - Generates a day-wise travel itinerary
  - Includes trip overview and budget estimate
  - Falls back to a code-generated plan if the AI API fails or rate-limits

- **Location intelligence**
  - Destination search suggestions with Geoapify
  - Distance, travel time, and best transport recommendation
  - Top sightseeing attractions for the selected destination

- **Weather insights**
  - Current weather conditions
  - Multi-day forecast using OpenWeather

- **Trip saving**
  - Saves generated trips to Firestore under the logged-in user
  - Dedicated **Saved Trips** page to review stored plans

- **Responsive UI**
  - Dark themed hero-first interface
  - Loading, empty, and error states
  - Works across desktop and smaller screens

## React Concepts Used

### Core React
- Functional components
- Props and composition
- `useState`
- `useEffect`
- Conditional rendering
- Lists and keys

### Intermediate React
- Controlled components for form inputs
- Routing with `react-router-dom`
- Shared utility/state flow across screens

### Advanced React
- `useMemo` for derived state such as save eligibility
- `useRef` for debounced destination search
- Async data fetching with coordinated `Promise.all`
- Fallback logic and defensive state handling for API failures

## Tech Stack
- **Frontend:** React, Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Authentication & Database:** Firebase Auth, Firestore
- **External APIs:**
  - Gemini API for itinerary generation
  - Geoapify for city search, attractions, and routing
  - OpenWeather for current weather and forecast

## Project Structure

```text
src/
  api/
    ai.js
    geoapify.js
    savedTrips.js
    weather.js
  pages/
    SavedTrips.jsx
  services/
    firebase.js
  utils/
    authStorage.js
  App.jsx
  main.jsx
  index.css
```

## Routes
- `/` - Home page, planner, authentication modal, trip results
- `/saved-trips` - Saved trips page for authenticated users

## Database Design
Trips are stored in Firestore using the authenticated user's ID:

```text
users/{uid}/trips/{tripId}
```

Each trip document can include:
- `startingLocation`
- `destination`
- `days`
- `overview`
- `tripPlan`
- `weather`
- `forecast`
- `places`
- `createdAt`

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd travel-planner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

Add the following environment variables:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEOAPIFY_API_KEY=your_geoapify_api_key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

### 4. Configure Firestore Rules

Make sure your Firestore rules allow each authenticated user to read and write only their own trips:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/trips/{tripId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run the development server

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

## Features Checklist
- [x] Authentication system
- [x] Main dashboard/home screen
- [x] Multiple core travel-planning features
- [x] Persistent storage with Firestore
- [x] Create and read saved trip data
- [x] Routing
- [x] Responsive UI
- [x] Error handling and loading states

## Code Quality Highlights
- External API logic is separated into dedicated modules
- Firebase setup is isolated in a service file
- Reusable local-storage helpers are extracted into `utils/authStorage.js`
- Firestore saves are sanitized to remove `undefined` values before writes
- The codebase was cleaned to remove unreachable legacy files

## Known Limitations
- Saved trips currently support **create** and **read** flows, but not full edit/delete from the UI
- Authentication is enforced through UI flow and data ownership rules rather than a dedicated protected-route wrapper
- Gemini API limits can affect itinerary generation, though the fallback planner prevents a blank result

## Future Improvements
- Add edit and delete actions for saved trips
- Add detailed trip view pages
- Add document uploads for tickets and bookings
- Add lazy loading / code splitting to reduce the main bundle size
- Add charts or spending analytics for budget tracking

## Evaluation Alignment

### Problem Statement & Idea
The app addresses a genuine travel-planning problem by combining itinerary generation, destination intelligence, weather, and storage in one workflow.

### React Fundamentals
The project uses hooks, controlled inputs, routing, conditional rendering, lists, state-driven UI, and effect-based data fetching.

### Backend Integration
Firebase Authentication and Firestore are integrated for user accounts and persistent saved trips.

### UI/UX
The interface is responsive, visually consistent, and includes loading/error feedback.

### Code Quality
The project follows a modular structure with separate API, service, page, and utility layers.

## Demo Video Talking Points
For the required 3-5 minute demo, explain:
1. The travel-planning problem being solved
2. How the user signs up / logs in
3. How trip generation works
4. How attractions, weather, and budget are added
5. How trips are saved and retrieved from Firestore
6. Key React and backend decisions

## Final Note
Trela AI is intended to be more than a classroom demo. It is a portfolio-style React application that combines frontend engineering, external API integration, backend persistence, and user-focused product thinking in one project.
