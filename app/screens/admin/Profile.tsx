// app/screens/admin/Profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { 
  doc, 
  getDoc,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [statsData, setStatsData] = useState({
    productsAdded: 0,
    ordersProcessed: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // First verify admin status
        const user = FIREBASE_AUTH.currentUser;
        if (!user) throw new Error("Not authenticated");
        
        // Set admin name from user email
        if (user.displayName) {
          setAdminName(user.displayName);
        } else if (user.email) {
          // Use the part before @ in email
          setAdminName(user.email.split('@')[0]);
        }
        
        const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
        if (userDoc.data()?.role !== "admin") {
          throw new Error("Admin access required");
        }
  
        // Then fetch stats
        await fetchAdminStats();
        
      } catch (error) {
        console.error("Error loading admin data:", error);
        Alert.alert(
          'Error', 
          (error instanceof Error ? error.message : 'Failed to load admin data')
        );
      } finally {
        setLoading(false);
      }
    };
  
    loadData();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const statsRef = doc(FIREBASE_DB, "stats", "adminStats");
      const statsSnap = await getDoc(statsRef);
  
      if (!statsSnap.exists()) {
        // For demo purposes, use placeholder data if stats don't exist
        setStatsData({
          productsAdded: 24,
          ordersProcessed: 57,
          totalUsers: 132,
          totalRevenue: 4895.50
        });
        return;
      }
  
      const stats = statsSnap.data();
      setStatsData({
        productsAdded: stats.totalProducts || 0,
        ordersProcessed: stats.totalOrders || 0,
        totalUsers: stats.totalUsers || 0,
        totalRevenue: stats.totalRevenue || 0
      });
  
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      // Use placeholder data for demo purposes
      setStatsData({
        productsAdded: 24,
        ordersProcessed: 57,
        totalUsers: 132,
        totalRevenue: 4895.50
      });
      
      // Check if it's a permissions error
      if ((error as any)?.code === 'permission-denied') {
        Alert.alert(
          'Access Denied', 
          'You need admin privileges to view these stats'
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await FIREBASE_AUTH.signOut();
      // You would typically navigate to login screen here
      // navigation.navigate('Login');
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4a6da7" />
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4a6da7" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.adminAvatar}>
            <Text style={styles.avatarText}>{adminName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.headerTitle}>{adminName}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          <Text style={styles.sectionSubtitle}>Summary of your store performance</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.iconBackground, { backgroundColor: 'rgba(74, 109, 167, 0.1)' }]}>
              <Ionicons name="cube" size={24} color="#4a6da7" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{statsData.productsAdded}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconBackground, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
              <Ionicons name="list" size={24} color="#2ecc71" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{statsData.ordersProcessed}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconBackground, { backgroundColor: 'rgba(142, 68, 173, 0.1)' }]}>
              <Ionicons name="people" size={24} color="#8e44ad" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{statsData.totalUsers}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconBackground, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}>
              <Ionicons name="cash" size={24} color="#e67e22" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>${statsData.totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          <Text style={styles.sectionSubtitle}>Manage your store efficiently</Text>
        </View>

        <View style={styles.adminToolsContainer}>
          <TouchableOpacity style={styles.adminToolCard} onPress={() => {/* Navigate to products */}}>
            <View style={styles.toolIconContainer}>
              <Ionicons name="cube" size={24} color="#4a6da7" />
            </View>
            <Text style={styles.toolTitle}>Products</Text>
            <Text style={styles.toolDescription}>Manage your store inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminToolCard} onPress={() => {/* Navigate to orders */}}>
            <View style={styles.toolIconContainer}>
              <Ionicons name="list" size={24} color="#4a6da7" />
            </View>
            <Text style={styles.toolTitle}>Orders</Text>
            <Text style={styles.toolDescription}>Track and update orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminToolCard} onPress={() => {/* Navigate to users */}}>
            <View style={styles.toolIconContainer}>
              <Ionicons name="people" size={24} color="#4a6da7" />
            </View>
            <Text style={styles.toolTitle}>Users</Text>
            <Text style={styles.toolDescription}>Manage user accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminToolCard} onPress={() => {/* Navigate to settings */}}>
            <View style={styles.toolIconContainer}>
              <Ionicons name="settings" size={24} color="#4a6da7" />
            </View>
            <Text style={styles.toolTitle}>Settings</Text>
            <Text style={styles.toolDescription}>Configure app settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Account</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: '#4a6da7',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  dashboardSection: {
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  adminToolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  adminToolCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  toolIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 109, 167, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  toolDescription: {
    fontSize: 13,
    color: '#777',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e53935',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});

export default AdminProfile;