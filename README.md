markdown# LiquorDash

A React Native mobile application with Firebase authentication for managing and ordering liquor products with role-based functionality.

## Project Overview

LiquorDash is a mobile application built with React Native and Firebase that provides a comprehensive platform for browsing, ordering, and managing liquor products. The app features a clean authentication system with role-based access control (customer, admin, delivery personnel), allowing for a tailored experience based on the user's role in the system.

## Features

- **Secure Authentication**
  - Email and password login
  - New user registration with role selection
  - Automatic state persistence
  - Sign out functionality
  - User profile management

- **Role-Based Navigation**
  - Customer: Home, Categories, Cart, Profile
  - Admin: Home, Orders, Deliveries, Profile
  - Delivery Personnel: Home, Orders, Profile

- **Customer Features**
  - Product browsing by categories
  - Shopping cart functionality
  - Order history and tracking
  - Multiple delivery addresses
  - Payment methods management

- **Admin Features**
  - Dashboard with sales analytics
  - Order management and processing
  - Delivery assignment and tracking
  - Inventory management
  - Staff management

- **Delivery Personnel Features**
  - Order pickup and delivery
  - Navigation to delivery locations
  - Delivery status updates
  - Earnings tracking
  - Performance metrics

- **User Interface**
  - Clean, modern UI design
  - Responsive layouts for various device sizes
  - Intuitive navigation
  - Form validation with helpful error messages
  - Dark mode support

## Technologies Used

- **Frontend**
  - React Native (Expo)
  - React Navigation (Stack & Bottom Tab navigators)
  - Native Base components
  - Ionicons
  
- **Backend & Database**
  - Firebase Authentication
  - Firebase Firestore
  - Firebase Cloud Functions (future implementation)
  
- **Development Tools**
  - TypeScript
  - Expo CLI
  - Android/iOS simulators

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:
git clone https://github.com/yourusername/liquordash.git
cd liquordash

2. Install dependencies:
npm install

3. Install additional required packages:
npm install @react-navigation/bottom-tabs @react-native-picker/picker firebase react-native-vector-icons

4. Set up your Firebase project:
   - Create a project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase config

5. Update Firebase configuration:
   - Open `FirebaseConfig.ts`
   - Replace the configuration with your Firebase project details

6. Start the development server:
npx expo start

## Project Structure
liquordash/
├── app/
│   ├── screens/
│   │   ├── Login.tsx               # Authentication screen
│   │   ├── customer/               # Customer-specific screens
│   │   │   ├── Home.tsx            # Customer home screen
│   │   │   ├── Categories.tsx      # Product categories
│   │   │   ├── Cart.tsx            # Shopping cart
│   │   │   └── Profile.tsx         # Customer profile
│   │   ├── admin/                  # Admin-specific screens
│   │   │   ├── Home.tsx            # Admin dashboard
│   │   │   ├── Orders.tsx          # Order management
│   │   │   ├── Deliveries.tsx      # Delivery management
│   │   │   └── Profile.tsx         # Admin profile
│   │   ├── delivery/               # Delivery personnel screens
│   │   │   ├── Home.tsx            # Delivery dashboard
│   │   │   ├── Orders.tsx          # Assigned orders
│   │   │   └── Profile.tsx         # Delivery profile
│   │   └── shared/                 # Shared components
│   │       └── ProfileBase.tsx     # Base profile component
├── assets/                         # Images, fonts, etc.
├── FirebaseConfig.ts               # Firebase configuration
├── App.tsx                         # Main application component
├── metro.config.js                 # Metro bundler configuration
├── package.json                    # Project dependencies
└── README.md                       # Project documentation

## Authentication & Role-Based Flow

1. **Initial Load**: App checks if user is already authenticated
2. **Login/Register**: User can sign in with existing credentials or create a new account with a role (customer, admin, delivery)
3. **Role Detection**: App identifies user role from Firestore database
4. **Role-Based Navigation**: User is directed to the appropriate navigation stack based on their role
5. **Sign Out**: User can log out from any profile screen and return to the Login screen

## Current Status & Next Steps

The application currently has:
- Complete authentication system with role selection
- Role-based navigation infrastructure
- UI templates for all main screens
- Basic CRUD operations for user profiles

Next development steps include:
- Implementing complete cart functionality
- Adding payment processing
- Developing real-time order tracking
- Enhancing admin analytics dashboard
- Building notification system

## Debug Tips

- Check console logs for any errors
- Verify Firebase credentials are correct
- Ensure all required dependencies are installed
- Check user roles in Firestore if navigation issues occur
- Verify file naming consistency across imports

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
- [Ionicons](https://ionic.io/ionicons)