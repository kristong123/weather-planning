# Weather Planner

A React-based weather planning application that helps you schedule events based on weather conditions. Plan your outdoor activities, meetings, and events with confidence by checking the weather forecast and getting personalized recommendations.

Created by: Kris Tong, Ethan Chen, Emily Kim

## Features

- **Weather-Based Event Planning**: Schedule events based on preferred weather conditions
- **User Authentication**: Secure login/signup with Firebase Authentication
- **Real-time Weather Data**: Powered by OpenMeteo API for accurate weather forecasts
- **Multiple Calendar Views**: Week and month view options
- **Smart Event Recommendations**: Automatic suggestions for optimal event timing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Event Management**: Create, modify, and delete events with ease
- **Location-based Forecasts**: Automatic location detection or manual location search

## Technologies Used

- **Frontend**: React 19, JavaScript/JSX
- **Styling**: Tailwind CSS, Bootstrap
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Weather API**: OpenMeteo API
- **Build Tool**: Vite
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Firebase account for authentication and database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd weather-planning-1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase configuration

4. Create environment variables (if needed):
   - Add your Firebase configuration to `src/config/`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── Calendar.jsx     # Calendar component
│   ├── Login.jsx        # Authentication component
│   ├── NewEvent.jsx     # Event creation form
│   ├── PlannedEvents.jsx # Event list display
│   └── ...
├── context/             # React Context providers
│   ├── AuthContext.jsx  # Authentication state
│   └── EventsContext.jsx # Events state management
├── services/            # External service integrations
│   ├── authService.js   # Firebase auth wrapper
│   └── databaseService.js # Firebase database operations
├── utils/               # Utility functions
│   └── weatherService.js # Weather API integration
├── config/              # Configuration files
└── App.jsx              # Main application component
```

## Key Features Details

### Weather Integration
- Real-time weather data from OpenMeteo API
- Support for temperature preferences (cold, cool, warm, hot)
- Weather condition filtering (sunny, cloudy, rainy, snowy, etc.)
- Automatic location detection with manual override option

### Event Management
- Create events with weather preferences
- Automatic optimal date/time suggestions
- Modify existing events
- View events in calendar format
- Filter events by various criteria

### User Experience
- Responsive design for all device sizes
- Loading states and error handling
- Protected routes for authenticated users
- Intuitive calendar navigation

## Deployment

The application is configured for Firebase Hosting:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenMeteo API for weather data
- Firebase for authentication and database services
- React and Vite for the development framework
