import React, { useState } from 'react'
import { FIREBASE_AUTH } from '../../FirebaseConfig'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const auth = FIREBASE_AUTH

  const handleAuthentication = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    if (!isLogin && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
  
    setLoading(true);
    try {
      console.log(`Attempting to ${isLogin ? 'sign in' : 'create'} user with email: ${email}`);
      
      if (isLogin) {
        // Login user
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
        // No need for navigation - App.tsx will handle it based on auth state
      } else {
        // Create new user
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Account created successfully');
        // No need for navigation - App.tsx will handle it based on auth state
      }
    } catch (error) {
      console.log('Authentication error:', error);
      let errorMessage = 'An error occurred';

      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (firebaseError.message) {
        errorMessage = firebaseError.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subHeaderText}>
              {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
            </Text>
          </View>
    
          <View style={styles.formContainer}>
            <TextInput
              value={email}
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(text) => setEmail(text)}
            />
            
            <TextInput
              secureTextEntry={true}
              value={password}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              autoCapitalize="none"
              onChangeText={(text) => setPassword(text)}
            />
    
            {isLogin && (
              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
    
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAuthentication}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>
    
            <TouchableOpacity
              style={styles.switchModeContainer}
              onPress={toggleMode}
            >
              <Text style={styles.switchModeText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#4a6da7',
    fontSize: 14,
  },
  authButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeContainer: {
    alignItems: 'center',
  },
  switchModeText: {
    color: '#4a6da7',
    fontSize: 14,
  },
});

export default Login;