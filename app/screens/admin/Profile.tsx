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
  Dimensions,
  Image,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { 
  doc, 
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AdminProfile = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminJoinDate, setAdminJoinDate] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [statsData, setStatsData] = useState({
    productsAdded: 0,
    ordersProcessed: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<{
    type: string;
    title: string;
    timestamp: string;
    details: string;
  }[]>([]);

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
        
        if (user.email) {
          setAdminEmail(user.email);
        }
        
        // Set join date
        if (user.metadata?.creationTime) {
          const creationDate = new Date(user.metadata.creationTime);
          setAdminJoinDate(creationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }));
        }
        
        const userDoc = await getDoc(doc(FIREBASE_DB, "users", user.uid));
        if (userDoc.data()?.role !== "admin") {
          throw new Error("Admin access required");
        }
  
        // Then fetch stats and recent activity
        await Promise.all([
          fetchAdminStats(),
          fetchRecentActivity()
        ]);
        
        // Animate elements in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ]).start();
        
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
  }, [fadeAnim, scaleAnim]);

  const fetchAdminStats = async () => {
    try {
      // Get total products
      const productsRef = collection(FIREBASE_DB, "products");
      const productsSnap = await getDocs(productsRef);
      const totalProducts = productsSnap.size;
      
      // Get total orders
      const ordersRef = collection(FIREBASE_DB, "orders");
      const ordersSnap = await getDocs(ordersRef);
      const totalOrders = ordersSnap.size;
      
      // Calculate revenue
      let revenue = 0;
      ordersSnap.forEach(doc => {
        const orderData = doc.data();
        if (orderData.total) {
          revenue += orderData.total;
        }
      });
      
      // Get total users
      const usersRef = collection(FIREBASE_DB, "users");
      const usersSnap = await getDocs(usersRef);
      const totalUsers = usersSnap.size;
      
      setStatsData({
        productsAdded: totalProducts,
        ordersProcessed: totalOrders,
        totalUsers: totalUsers,
        totalRevenue: revenue
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
    }
  };
  
  const fetchRecentActivity = async () => {
    try {
      // Sample: Get recent orders
      const ordersRef = collection(FIREBASE_DB, "orders");
      const recentOrdersQuery = query(
        ordersRef, 
        orderBy("createdAt", "desc"),
        limit(3)
      );
      
      const recentOrdersSnap = await getDocs(recentOrdersQuery);
      const activities: {
        type: string;
        title: string;
        timestamp: string;
        details: string;
      }[] = [];
      
      recentOrdersSnap.forEach(doc => {
        const data = doc.data();
        const orderDate = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
        
        activities.push({
          type: "order",
          title: `Order #${doc.id.slice(-5).toUpperCase()}`,
          timestamp: orderDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          details: `$${data.total?.toFixed(2) || '0.00'} - ${data.customerInfo?.name || 'Unknown Customer'}`
        });
      });
      
      // Add sample product activity
      const productsRef = collection(FIREBASE_DB, "products");
      const recentProductsQuery = query(
        productsRef,
        orderBy("createdAt", "desc"),
        limit(2)
      );
      
      const recentProductsSnap = await getDocs(recentProductsQuery);
      
      recentProductsSnap.forEach(doc => {
        const data = doc.data();
        const productDate = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
        
        activities.push({
          type: "product",
          title: `Added ${data.name}`,
          timestamp: productDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          details: `$${data.price?.toFixed(2) || '0.00'} - ${data.category || 'Uncategorized'}`
        });
      });
      
      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setRecentActivity(activities.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      // Use sample data if real data fetch fails
      setRecentActivity([
        {
          type: "order",
          title: "Order #10345",
          timestamp: "May 4, 10:30 AM",
          details: "$125.99 - John Smith"
        },
        {
          type: "product",
          title: "Added Johnnie Walker Blue",
          timestamp: "May 3, 3:15 PM",
          details: "$189.99 - Whiskey"
        },
        {
          type: "order",
          title: "Order #10344",
          timestamp: "May 3, 1:20 PM",
          details: "$78.50 - Sarah Davis"
        }
      ]);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await FIREBASE_AUTH.signOut();
              // You would typically navigate to login screen here
              // navigation.navigate('Login');
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4a6da7" />
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading admin profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4a6da7" />
      
      {/* Header with profile info */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Profile</Text>
          <View style={styles.placeholderButton} />
        </View>
        
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{adminName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{adminName}</Text>
            <Text style={styles.profileEmail}>{adminEmail}</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="white" style={styles.adminIcon} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person" size={20} color="#4a6da7" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{adminName}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail" size={20} color="#4a6da7" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{adminEmail}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar" size={20} color="#4a6da7" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{adminJoinDate || 'Not available'}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Store Analytics</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cube" size={28} color="#1976D2" style={styles.statIcon} />
              <Text style={styles.statValue}>{statsData.productsAdded}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="list" size={28} color="#388E3C" style={styles.statIcon} />
              <Text style={styles.statValue}>{statsData.ordersProcessed}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people" size={28} color="#7B1FA2" style={styles.statIcon} />
              <Text style={styles.statValue}>{statsData.totalUsers}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="cash" size={28} color="#E65100" style={styles.statIcon} />
              <Text style={styles.statValue}>${statsData.totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivity.map((activity, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.activityCard}
              onPress={() => {
                if (activity.type === 'order') handleNavigate('AdminOrders');
                if (activity.type === 'product') handleNavigate('AdminProducts');
              }}
            >
              <View style={[
                styles.activityIconContainer, 
                activity.type === 'order' 
                  ? { backgroundColor: '#E3F2FD' } 
                  : { backgroundColor: '#FFF3E0' }
              ]}>
                <Ionicons 
                  name={activity.type === 'order' ? 'receipt' : 'cube'} 
                  size={20} 
                  color={activity.type === 'order' ? '#1976D2' : '#E65100'} 
                />
              </View>
              
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetails}>{activity.details}</Text>
              </View>
              
              <View style={styles.activityTime}>
                <Text style={styles.activityTimeText}>{activity.timestamp}</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sectionContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleNavigate('AdminProducts')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="cube" size={24} color="#1976D2" />
              </View>
              <Text style={styles.quickActionText}>Products</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleNavigate('AdminOrders')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="list" size={24} color="#388E3C" />
              </View>
              <Text style={styles.quickActionText}>Orders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleNavigate('CategoriesManagement')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="pricetag" size={24} color="#7B1FA2" />
              </View>
              <Text style={styles.quickActionText}>Categories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleNavigate('AdminDeliveries')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="car" size={24} color="#E65100" />
              </View>
              <Text style={styles.quickActionText}>Deliveries</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>LiquorDash Admin v1.0.0</Text>
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
    backgroundColor: '#4a6da7',
    paddingTop: Platform.OS === 'ios' ? 10 : 25,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminIcon: {
    marginRight: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4a6da7',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 109, 167, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
  },
  editProfileButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  editProfileText: {
    color: '#4a6da7',
    fontWeight: '600',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 13,
    color: '#666',
  },
  activityTime: {
    alignItems: 'flex-end',
  },
  activityTimeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e53935',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 15,
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
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 10,
  }
});

export default AdminProfile;