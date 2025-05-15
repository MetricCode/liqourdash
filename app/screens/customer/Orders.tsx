// app/screens/customer/Orders.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import useStore from '../../../utils/useStore';

type Order = {
  id: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: any;
  total: number;
  items: Array<any>;
};

type RootStackParamList = {
  OrderDetails: { orderId: string };
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  //zustund
  const setCustomerOrders = useStore((state) => state.setCustomerOrders);
  
  const fetchOrders = useCallback(async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    
    if (!currentUser) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      const ordersRef = collection(FIREBASE_DB, 'orders');
      const q = query(
        ordersRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ordersList: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        setCustomerOrders(data);
        ordersList.push({
          id: doc.id,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          total: data.total || 0,
          items: data.items || []
        });

      });
      
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: '#f57c00', bg: '#fff3e0', icon: 'time-outline' };
      case 'processing':
        return { color: '#1976d2', bg: '#e3f2fd', icon: 'bicycle-outline' };
      case 'delivered':
        return { color: '#388e3c', bg: '#e8f5e9', icon: 'checkmark-circle-outline' };
      case 'cancelled':
        return { color: '#d32f2f', bg: '#ffebee', icon: 'close-circle-outline' };
      default:
        return { color: '#757575', bg: '#f5f5f5', icon: 'help-circle-outline' };
    }
  };
  
  const formatDate = (date: Date) => {
    if (!date) return '';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = getStatusColor(item.status);
    const orderNumber = item.id.slice(-5).toUpperCase();
    const itemCount = item.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumberText}>#{orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon as keyof typeof Ionicons.glyphMap} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{formatDate(item.createdAt)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.infoText}>${item.total.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.orderFooter}>
          <Text style={styles.viewDetailsText}>View Order Details</Text>
          <Ionicons name="chevron-forward" size={20} color="#4a6da7" />
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your order history will appear here</Text>
          
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('CustomerHome' as never)}
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a6da7']}
              tintColor={'#4a6da7'}
              title="Refreshing orders..."
              titleColor="#666"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  ordersList: {
    padding: 15,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumberContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  orderInfo: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6da7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 30,
    shadowColor: '#4a6da7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Orders;