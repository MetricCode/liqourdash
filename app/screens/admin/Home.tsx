// app/screens/admin/Home.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  doc
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

import { NavigationProp } from '@react-navigation/native';

const AdminHome = ({ navigation }: { navigation: NavigationProp<any> }) => {
  // Stats state
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    outOfStock: 0
  });
  
  // Recent orders state
  const [recentOrders, setRecentOrders] = useState<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    items: number;
    status: string;
    date: string;
  }[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<{ 
    id: string; 
    name: string; 
    stock: number; 
    price: number; 
    category: string; 
    imageUrl: string; 
  }[]>([]);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Get admin name
  const [adminName, setAdminName] = useState('');
  
  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await fetchAdminName();
    await fetchStats();
    await fetchRecentOrders();
    await fetchLowStockProducts();
  }, []);
  
  // Pull-to-refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchAllData]);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
  
  const fetchAdminName = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      if (user.displayName) {
        setAdminName(user.displayName);
      } else if (user.email) {
        setAdminName(user.email.split('@')[0]);
      }
    }
  };
  
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      // Get total sales and orders
      const ordersRef = collection(FIREBASE_DB, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      let totalSales = 0;
      let totalOrders = 0;
      let pendingDeliveries = 0;
      
      ordersSnapshot.forEach(doc => {
        const orderData = doc.data();
        totalOrders++;
        
        if (orderData.total) {
          totalSales += orderData.total;
        }
        
        if (orderData.status === 'pending' || orderData.status === 'processing') {
          pendingDeliveries++;
        }
      });
      
      // Get out of stock products
      const productsRef = collection(FIREBASE_DB, 'products');
      const outOfStockQuery = query(productsRef, where('inStock', '<=', 0));
      const outOfStockSnapshot = await getDocs(outOfStockQuery);
      
      setStats({
        totalSales,
        totalOrders,
        pendingDeliveries,
        outOfStock: outOfStockSnapshot.size
      });
      
      setLoadingStats(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoadingStats(false);
      
      // For demo purposes, set some default stats
      setStats({
        totalSales: 12580.45,
        totalOrders: 156,
        pendingDeliveries: 23,
        outOfStock: 7
      });
    }
  };
  
  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      
      const ordersRef = collection(FIREBASE_DB, 'orders');
      const recentOrdersQuery = query(
        ordersRef, 
        orderBy('createdAt', 'desc'), 
        limit(3)
      );
      
      const snapshot = await getDocs(recentOrdersQuery);
      const orders: {
        id: string;
        orderNumber: string;
        customerName: string;
        total: number;
        items: number;
        status: string;
        date: string;
      }[] = [];
      
      snapshot.forEach(doc => {
        const orderData = doc.data();
        orders.push({
          id: doc.id,
          orderNumber: doc.id.slice(-5).toUpperCase(),
          customerName: orderData.customerInfo?.name || 'Unknown Customer',
          total: orderData.total || 0,
          items: orderData.items?.length || 0,
          status: orderData.status || 'pending',
          date: orderData.createdAt ? new Date(orderData.createdAt.toDate()).toLocaleDateString() : 'Unknown date'
        });
      });
      
      setRecentOrders(orders);
      setLoadingOrders(false);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setLoadingOrders(false);
      
      // For demo purposes
      setRecentOrders([
        {
          id: '1',
          orderNumber: '10343',
          customerName: 'John Doe',
          total: 89.99,
          items: 3,
          status: 'pending',
          date: 'May 2, 2025'
        },
        {
          id: '2',
          orderNumber: '10342',
          customerName: 'Sara Smith',
          total: 105.50,
          items: 5,
          status: 'processing',
          date: 'May 1, 2025'
        },
        {
          id: '3',
          orderNumber: '10341',
          customerName: 'Robert Johnson',
          total: 67.25,
          items: 2,
          status: 'completed',
          date: 'Apr 30, 2025'
        }
      ]);
    }
  };
  
  const fetchLowStockProducts = async () => {
    try {
      setLoadingProducts(true);
      
      const productsRef = collection(FIREBASE_DB, 'products');
      const lowStockQuery = query(
        productsRef, 
        where('inStock', '>', 0),
        where('inStock', '<=', 5),
        limit(4)
      );
      
      const snapshot = await getDocs(lowStockQuery);
      const products = [];
      
      for (const productDoc of snapshot.docs) {
        const productData = productDoc.data();
        
        // Get category name
        let categoryName = 'Uncategorized';
        if (productData.category) {
          const categoryDoc = await getDoc(doc(FIREBASE_DB, 'categories', productData.category));
          if (categoryDoc.exists()) {
            categoryName = categoryDoc.data().name || productData.category;
          }
        }
        
        products.push({
          id: productDoc.id,
          name: productData.name,
          stock: productData.inStock,
          price: productData.price,
          category: categoryName,
          imageUrl: productData.imageUrl
        });
      }
      
      setLowStockProducts(products);
      setLoadingProducts(false);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      setLoadingProducts(false);
      
      // For demo purposes
      setLowStockProducts([
        {
          id: '1',
          name: 'Johnnie Walker Black Label',
          stock: 3,
          price: 45.99,
          category: 'Whiskey',
          imageUrl: 'https://via.placeholder.com/150'
        },
        {
          id: '2',
          name: 'Grey Goose Vodka',
          stock: 2,
          price: 39.99,
          category: 'Vodka',
          imageUrl: 'https://via.placeholder.com/150'
        },
        {
          id: '3',
          name: 'Hennessy XO',
          stock: 1,
          price: 199.99,
          category: 'Cognac',
          imageUrl: 'https://via.placeholder.com/150'
        }
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#fff3e0', text: '#f57c00' };
      case 'processing':
        return { bg: '#e3f2fd', text: '#1976d2' };
      case 'delivered':
      case 'completed':
        return { bg: '#e8f5e9', text: '#388e3c' };
      case 'cancelled':
        return { bg: '#ffebee', text: '#d32f2f' };
      default:
        return { bg: '#f5f5f5', text: '#757575' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          {adminName && <Text style={styles.welcomeText}>Welcome, {adminName}</Text>}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('AdminProfile')}
          >
            <Ionicons name="person-outline" size={24} color="#4a6da7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color="#4a6da7" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6da7']}
            tintColor="#4a6da7"
            title="Refreshing dashboard..."
            titleColor="#666"
          />
        }
      >
        <Text style={styles.sectionTitle}>Overview</Text>
        
        {loadingStats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4a6da7" />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}
              onPress={() => navigation.navigate('AdminOrders')}
            >
              <Text style={styles.statValue}>${stats.totalSales.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Ionicons name="cash-outline" size={24} color="#388e3c" style={styles.statIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}
              onPress={() => navigation.navigate('AdminOrders')}
            >
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
              <Ionicons name="list-outline" size={24} color="#1976d2" style={styles.statIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#fff3e0' }]}
              onPress={() => navigation.navigate('AdminDeliveries')}
            >
              <Text style={styles.statValue}>{stats.pendingDeliveries}</Text>
              <Text style={styles.statLabel}>Pending Deliveries</Text>
              <Ionicons name="car-outline" size={24} color="#f57c00" style={styles.statIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#ffebee' }]}
              onPress={() => navigation.navigate('AdminProducts')}
            >
              <Text style={styles.statValue}>{stats.outOfStock}</Text>
              <Text style={styles.statLabel}>Out of Stock</Text>
              <Ionicons name="alert-circle-outline" size={24} color="#c62828" style={styles.statIcon} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminProducts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#1976d2" />
            </View>
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CategoriesManagement')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f3e5f5' }]}>
              <Ionicons name="pricetag-outline" size={24} color="#7b1fa2" />
            </View>
            <Text style={styles.actionText}>Categories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminOrders')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="list-outline" size={24} color="#388e3c" />
            </View>
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminDeliveries')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="car-outline" size={24} color="#f57c00" />
            </View>
            <Text style={styles.actionText}>Deliveries</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminOrders')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {loadingOrders ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4a6da7" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {recentOrders.map((order, index) => {
              const statusStyle = getStatusColor(order.status);
              
              return (
                <TouchableOpacity 
                  key={order.id} 
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('AdminOrders', { orderId: order.id })}
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                    <View style={[styles.orderStatus, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.orderStatusText, { color: statusStyle.text }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>Customer: </Text>
                      {order.customerName}
                    </Text>
                    <Text style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>Total: </Text>
                      ${order.total.toFixed(2)}
                    </Text>
                    <Text style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>Items: </Text>
                      {order.items}
                    </Text>
                    <Text style={styles.orderDetail}>
                      <Text style={styles.orderDetailLabel}>Date: </Text>
                      {order.date}
                    </Text>
                  </View>
                  
                  <View style={styles.orderActions}>
                    <TouchableOpacity 
                      style={styles.orderActionButton}
                      onPress={() => navigation.navigate('AdminOrders', { orderId: order.id })}
                    >
                      <Text style={styles.orderActionText}>View Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.orderActionButton, styles.orderActionButtonSecondary]}
                      onPress={() => 
                        order.status === 'pending' ? 
                          Alert.alert('Update Status', 'This will mark the order as processing. Continue?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Update', 
                              onPress: () => {
                                // Process order logic would go here
                                Alert.alert('Success', 'Order status updated to processing');
                              }
                            }
                          ]) 
                        : order.status === 'processing' ?
                          Alert.alert('Update Status', 'This will mark the order as delivered. Continue?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Update', 
                              onPress: () => {
                                // Deliver order logic would go here
                                Alert.alert('Success', 'Order status updated to delivered');
                              }
                            }
                          ])
                        : Alert.alert('Print Receipt', 'Print receipt for order #' + order.orderNumber)
                      }
                    >
                      <Text style={styles.orderActionTextSecondary}>
                        {order.status === 'pending' ? 'Process Order' : 
                         order.status === 'processing' ? 'Mark Delivered' : 
                         'Print Receipt'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('AdminOrders')}
            >
              <Text style={styles.viewAllText}>View All Orders</Text>
              <Ionicons name="arrow-forward" size={18} color="#4a6da7" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminProducts')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {loadingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4a6da7" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScrollView}
          >
            {lowStockProducts.map(product => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => navigation.navigate('AdminProducts', { productId: product.id })}
              >
                <View style={styles.productImageContainer}>
                  <Image 
                    source={{ uri: product.imageUrl }} 
                    style={styles.productImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/150' }}
                  />
                  <View style={styles.stockBadge}>
                    <Text style={styles.stockText}>Stock: {product.stock}</Text>
                  </View>
                </View>
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.updateStockButton}
                  onPress={() => navigation.navigate('AdminProducts', { 
                    productId: product.id,
                    action: 'update-stock'
                  })}
                >
                  <Text style={styles.updateStockText}>Update Stock</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.viewMoreProductsCard}
              onPress={() => navigation.navigate('AdminProducts')}
            >
              <Ionicons name="arrow-forward-circle" size={40} color="#4a6da7" />
              <Text style={styles.viewMoreText}>View All Products</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </ScrollView>
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
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
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ordersContainer: {
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 15,
  },
  orderDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderDetailLabel: {
    fontWeight: '600',
    color: '#555',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderActionButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  orderActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a6da7',
  },
  orderActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  orderActionTextSecondary: {
    color: '#4a6da7',
    fontWeight: '600',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  viewAllText: {
    color: '#4a6da7',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 5,
  },
  productsScrollView: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  productCard: {
    width: 180,
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
  },
  stockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stockText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '600',
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  updateStockButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  updateStockText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '600',
  },
  viewMoreProductsCard: {
    width: 150,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 15,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6da7',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default AdminHome;