import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';

const Home = () => {
  const auth = FIREBASE_AUTH;
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoHeader}>Your Account</Text>
          <Text style={styles.infoText}>
            User ID: {user?.uid ? user.uid.substring(0, 8) + '...' : 'Not available'}
          </Text>
          <Text style={styles.infoText}>
            Email verified: {user?.emailVerified ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoText}>
            Last login: {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Unknown'}
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Home;