// app/screens/delivery/History.tsx
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
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { NavigationProp, useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface DeliveryRecord {
  id: string;
  date: string;
  orders: number;
  totalRevenue: number;
  status: string;
  areas: string[];
  distance: number;
}

const DeliveryHistory = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryRecord[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'all'
  
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

  // Fetch delivery history
  const fetchDeliveryHistory = useCallback(async () => {
    setLoading(true);
    try {
      const userId = FIREBASE_AUTH.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Get date range for filter
      let startDate = new Date();
      if (timeFilter === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeFilter === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate = new Date(2000, 0, 1);
      }

      // Query orders in two steps to avoid composite index requirement
      const ordersRef = collection(FIREBASE_DB, 'orders');
      
      // First filter by status only
      const statusQuery = query(
        ordersRef,
        where('status', '==', `assigned to ${userId}`)
      );
      
      const snapshot = await getDocs(statusQuery);
      const historyData: DeliveryRecord[] = [];
      const deliveryDays = new Set<string>();

      // Then filter by date in memory
      snapshot.forEach(doc => {
        const data = doc.data();
        const assignedDate = data.assignedAt?.toDate();
        
        // Skip if no assigned date or outside time filter
        if (!assignedDate || assignedDate < startDate) return;

        const dateKey = assignedDate.toLocaleDateString();
        deliveryDays.add(dateKey);

        // Rest of your aggregation logic...
        const existingDayIndex = historyData.findIndex(item => item.date === dateKey);
        
        if (existingDayIndex >= 0) {
          const existing = historyData[existingDayIndex];
          historyData[existingDayIndex] = {
            ...existing,
            orders: existing.orders + 1,
            totalRevenue: existing.totalRevenue + (data.total || 0),
            areas: [...new Set([...existing.areas, ...(data.deliveryAreas || [])])],
            distance: existing.distance + (data.distance || 0)
          };
        } else {
          historyData.push({
            id: doc.id,
            date: dateKey,
            orders: 1,
            totalRevenue: data.total || 0,
            status: 'completed',
            areas: data.deliveryAreas || [],
            distance: data.distance || 0
          });
        }
      });

      // Sort by date descending
      historyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setDeliveryHistory(historyData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      Alert.alert('Error', 'Failed to load delivery history');
      setLoading(false);
    }
  }, [timeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDeliveryHistory();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDeliveryHistory]);

  useEffect(() => {
    fetchDeliveryHistory();
  }, [fetchDeliveryHistory, timeFilter, isFocused]);

  const formatCurrency = (amount: number) => {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    // Calculate from the actual deliveryHistory state
    const totalDeliveries = deliveryHistory.length;
    const totalOrders = deliveryHistory.reduce((sum, record) => sum + record.orders, 0);
    const totalRevenue = deliveryHistory.reduce((sum, record) => sum + record.totalRevenue, 0);
    const totalDistance = deliveryHistory.reduce((sum, record) => sum + record.distance, 0);
    
    return {
      deliveries: totalDeliveries,
      orders: totalOrders,
      revenue: totalRevenue,
      distance: totalDistance.toFixed(1)
    };
  };

  const summary = getSummaryStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery History</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchDeliveryHistory}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === 'week' && styles.activeFilterButton
            ]}
            onPress={() => setTimeFilter('week')}
          >
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === 'week' && styles.activeFilterButtonText
              ]}
            >
              Last 7 Days
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === 'month' && styles.activeFilterButton
            ]}
            onPress={() => setTimeFilter('month')}
          >
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === 'month' && styles.activeFilterButtonText
              ]}
            >
              Last 30 Days
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => setTimeFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === 'all' && styles.activeFilterButtonText
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading delivery history...</Text>
        </View>
      ) : deliveryHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={80} color="#ddd" />
          <Text style={styles.emptyText}>No delivery history found</Text>
          <Text style={styles.emptySubtext}>
            {timeFilter === 'week' 
              ? "You haven't completed any deliveries this week" 
              : timeFilter === 'month' 
                ? "You haven't completed any deliveries this month" 
                : "You haven't completed any deliveries yet"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Animated.View 
            style={[
              styles.summarySection,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.summaryValue}>{summary.deliveries}</Text>
                <Text style={styles.summaryLabel}>Deliveries</Text>
                <Ionicons name="calendar-outline" size={24} color="#388e3c" style={styles.summaryIcon} />
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
                <Text style={styles.summaryValue}>{summary.orders}</Text>
                <Text style={styles.summaryLabel}>Orders</Text>
                <Ionicons name="cube-outline" size={24} color="#1976d2" style={styles.summaryIcon} />
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
                <Text style={styles.summaryValue}>{formatCurrency(summary.revenue)}</Text>
                <Text style={styles.summaryLabel}>Revenue</Text>
                <Ionicons name="cash-outline" size={24} color="#f57c00" style={styles.summaryIcon} />
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: '#f3e5f5' }]}>
                <Text style={styles.summaryValue}>{summary.distance} mi</Text>
                <Text style={styles.summaryLabel}>Distance</Text>
                <Ionicons name="speedometer-outline" size={24} color="#9c27b0" style={styles.summaryIcon} />
              </View>
            </View>
          </Animated.View>
          
          <Text style={styles.sectionTitle}>Delivery History</Text>
          
          {deliveryHistory.map((record, index) => (
            <Animated.View
              key={record.id}
              style={[
                styles.historyCard,
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                  marginBottom: index === deliveryHistory.length - 1 ? 20 : 15
                }
              ]}
            >
              <View style={styles.historyCardHeader}>
                <Text style={styles.historyDate}>{record.date}</Text>
                <View 
                  style={[
                    styles.historyStatus,
                    { 
                      backgroundColor: record.status === 'completed' ? '#e8f5e9' : 
                                      record.status === 'partial' ? '#fff3e0' : '#ffebee'
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.historyStatusText,
                      { 
                        color: record.status === 'completed' ? '#388e3c' : 
                              record.status === 'partial' ? '#f57c00' : '#d32f2f'
                      }
                    ]}
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.historyDetails}>
                <View style={styles.historyDetailItem}>
                  <Ionicons name="cube" size={20} color="#666" />
                  <Text style={styles.historyDetailText}>{record.orders} Orders</Text>
                </View>
                
                <View style={styles.historyDetailItem}>
                  <Ionicons name="cash" size={20} color="#666" />
                  <Text style={styles.historyDetailText}>{formatCurrency(record.totalRevenue)}</Text>
                </View>
                
                <View style={styles.historyDetailItem}>
                  <Ionicons name="speedometer" size={20} color="#666" />
                  <Text style={styles.historyDetailText}>{record.distance} mi</Text>
                </View>
              </View>
              
              <View style={styles.areasContainer}>
                <Text style={styles.areasLabel}>Delivery Areas:</Text>
                <View style={styles.areasList}>
                  {record.areas.map((area, idx) => (
                    <View key={idx} style={styles.areaTag}>
                      <Text style={styles.areaTagText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => navigation.navigate('HistoryDetails', { recordId: record.id })}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#4a6da7" />
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  timeFilterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  activeFilterButton: {
    backgroundColor: '#4a6da7',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
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
  summarySection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  historyCard: {
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
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  historyStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  historyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDetailText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  areasContainer: {
    marginBottom: 15,
  },
  areasLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  areasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  areaTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  areaTagText: {
    fontSize: 12,
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6da7',
    marginRight: 5,
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

export default DeliveryHistory;