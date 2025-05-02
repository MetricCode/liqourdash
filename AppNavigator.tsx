import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from './FirebaseConfig';
import { ActivityIndicator, View } from 'react-native';

// Import your screens
import Login from './app/screens/Login';
import Home from './app/screens/Home';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = FIREBASE_AUTH;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in
          <Stack.Screen name="Home" component={Home} />
        ) : (
          // User is not signed in
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;