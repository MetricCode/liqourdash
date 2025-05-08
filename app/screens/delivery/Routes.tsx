// app/screens/delivery/Routes.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { NavigationProp, useIsFocused } from '@react-navigation/native';

const DeliveryRoutes = ({ navigation }: { navigation: NavigationProp<any> }) => {
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  interface Route {
    id: string;
    area: string;
    orders: number;
    estimatedTime: string;
    distance: string;
    status: string;
  }

  const [routes, setRoutes] = useState<Route[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  
  const isFocused = useIsFocused();

  // Handle animations
  useEffect(() => {
    if (isFocused) {
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
    } else {
      // Reset animations when screen loses focus
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [isFocused, fadeAnim, scaleAnim]);

  // Fetch delivery routes
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      // Here you would fetch delivery routes
      // This is a placeholder for your actual implementation
      
      // Example:
      /*
      const routesRef = collection(FIREBASE_DB, 'delivery_routes');
      const userQuery = query(
        routesRef,
        where('driverId', '==', currentUserId),
        where('status', 'in', ['pending', 'active']),
        orderBy('scheduledDate', 'asc')
      );
      
      const snapshot = await getDocs(userQuery);
      const routesData = [];
      
      snapshot.forEach(doc => {
        routesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRoutes(routesData);
      */
      
      // For demo, set mock data
      setRoutes([
        {
          id: '1',
          area: 'Downtown',
          orders: 5,
          estimatedTime: '1.5 hours',
          distance: '8.3 miles',
          status: 'active'
        },
        {
          id: '2',
          area: 'Suburbs North',
          orders: 3,
          estimatedTime: '2 hours',
          distance: '12.5 miles',
          status: 'pending'
        }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to load delivery routes');
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRoutes();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRoutes]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes, isFocused]);

  const handleStartRoute = (routeId: string) => {
    Alert.alert('Start Route', `Navigation would start for route ID: ${routeId}`);
    // You would implement navigation integration here
    navigation.navigate("MapView");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Routes</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchRoutes}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a6da7']}
              tintColor="#4a6da7"
              title="Refreshing routes..."
              titleColor="#666"
            />
          }
        >
          {routes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No delivery routes assigned</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new delivery assignments
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Your Delivery Routes</Text>
              
              {routes.map((route, index) => (
                <Animated.View
                  key={route.id}
                  style={[
                    styles.routeCard,
                    { 
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                      marginBottom: index === routes.length - 1 ? 20 : 15
                    }
                  ]}
                >
                  <View style={styles.routeCardHeader}>
                    <Text style={styles.routeArea}>{route.area}</Text>
                    <View 
                      style={[
                        styles.routeStatus,
                        { backgroundColor: route.status === 'active' ? '#e8f5e9' : '#fff3e0' }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.routeStatusText,
                          { color: route.status === 'active' ? '#388e3c' : '#f57c00' }
                        ]}
                      >
                        {route.status === 'active' ? 'Active' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.routeDetails}>
                    <View style={styles.routeDetailItem}>
                      <Ionicons name="cube" size={20} color="#666" />
                      <Text style={styles.routeDetailText}>{route.orders} Orders</Text>
                    </View>
                    
                    <View style={styles.routeDetailItem}>
                      <Ionicons name="time" size={20} color="#666" />
                      <Text style={styles.routeDetailText}>{route.estimatedTime}</Text>
                    </View>
                    
                    <View style={styles.routeDetailItem}>
                      <Ionicons name="speedometer" size={20} color="#666" />
                      <Text style={styles.routeDetailText}>{route.distance}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.routeActions}>
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => navigation.navigate('RouteDetails', { routeId: route.id })}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.actionButton,
                        { backgroundColor: route.status === 'active' ? '#4caf50' : '#ff9800' }
                      ]}
                      onPress={() => {
                        handleStartRoute(route.id)
                       
                       }}
                    >
                      <Ionicons 
                        name={route.status === 'active' ? 'navigate' : 'play'} 
                        size={18} 
                        color="white" 
                        style={styles.actionButtonIcon} 
                      />
                      
                      <Text style={styles.actionButtonText}>
                        {route.status === 'active' ? 'Continue Route' : 'Start Route'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeArea: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  routeStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetailText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a6da7',
    flex: 0.48,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#4a6da7',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#4a6da7',
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    marginRight: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default DeliveryRoutes;