# LiquorDash

A React Native mobile application with Firebase authentication for managing and ordering liquor products.

## Project Overview

LiquorDash is a mobile application built with React Native and Firebase that provides a streamlined platform for browsing, ordering, and managing liquor products. The app features a clean authentication system with email/password login and registration.

## Features

- **Secure Authentication**
  - Email and password login
  - New user registration
  - Automatic state persistence
  - Sign out functionality

- **User Interface**
  - Clean, modern UI design
  - Responsive layouts for various device sizes
  - Intuitive navigation
  - Form validation with helpful error messages

## Technologies Used

- **Frontend**
  - React Native (Expo)
  - React Navigation
  - Native Stack Navigator
  
- **Backend & Database**
  - Firebase Authentication
  - Firebase Firestore
  
- **Development Tools**
  - TypeScript
  - Expo CLI
  - Android/iOS simulators

## Getting Started

### Prerequisites

- Node.js (v12 or newer)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/liqourdash.git
cd liqourdash
```

2. Install dependencies:
```
npm install
```

3. Set up your Firebase project:
   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase config

4. Update Firebase configuration:
   - Open `FirebaseConfig.ts`
   - Replace the configuration with your Firebase project details

5. Start the development server:
```
npx expo start
```

## Project Structure

```
liqourdash/
├── app/
│   ├── screens/
│   │   ├── Login.tsx        # Authentication screen
│   │   └── Home.tsx         # Home screen for authenticated users
├── assets/                  # Images, fonts, etc.
├── FirebaseConfig.ts        # Firebase configuration
├── App.tsx                  # Main application component
├── metro.config.js          # Metro bundler configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## Authentication Flow

1. **Initial Load**: App checks if user is already authenticated
2. **Login/Register**: User can sign in with existing credentials or create a new account
3. **Home Screen**: After successful authentication, user is redirected to Home
4. **Sign Out**: User can log out and return to the Login screen

## Future Enhancements

- Add product browsing functionality
- Implement shopping cart
- Add user profile management
- Integrate payment processing
- Implement order tracking
- Add admin dashboard for inventory management



### Debug Tips

- Check console logs for any errors
- Verify Firebase credentials are correct
- Ensure all required dependencies are installed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)