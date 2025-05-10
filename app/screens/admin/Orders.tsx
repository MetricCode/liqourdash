// app/screens/admin/Orders.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
//zustand
import useStore from '../../../utils/useStore';

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type Order = {
  id: string;
  userId: string;
  orderNumber?: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Timestamp;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
  };
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  //fetch function from zustand
  const setOrdersStored = useStore((state) => state.setOrdersStored);
  useEffect(() => {
    // Fetch orders from Firestore
    const fetchOrders = () => {
      try {
        setLoading(true);
        const ordersRef = collection(FIREBASE_DB, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const ordersList: Order[] = [];
            snapshot.docs.forEach(doc => {
              try {
                const data = doc.data();
                if (!data.userId || !data.items) {
                  console.warn('Invalid order document:', doc.id);
                  return;
                }
                
                ordersList.push({
                  id: doc.id,
                  userId: data.userId,
                  orderNumber: doc.id.slice(-5).toUpperCase(),
                  items: data.items || [],
                  status: data.status || 'pending',
                  subtotal: data.subtotal || 0,
                  deliveryFee: data.deliveryFee || 0,
                  total: data.total || 0,
                  createdAt: data.createdAt,
                  customerInfo: data.customerInfo || {
                    name: 'Unknown',
                    address: 'No address',
                    phone: 'No phone'
                  }
                });
              } catch (error) {
                console.error('Error processing order document:', doc.id, error);
              }
            });
            
            setOrders(ordersList);
            setOrdersStored(ordersList);
            setLoading(false);
          },
          (error) => {
            console.error('Error in orders snapshot:', error);
            Alert.alert('Error', 'Failed to load orders. Please check your connection.');
            setLoading(false);
          }
        );
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up orders listener:', error);
        setLoading(false);
        return () => {};
      }
    };
    
    const unsubscribe = fetchOrders();
    return () => unsubscribe();
  }, []);
  
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    return orders.filter(order => order.status === activeTab);
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'delivered' | 'cancelled') => {
    try {
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      
      // Update the local state for immediate UI feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };
  
  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setDetailsVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber || item.id.slice(-5).toUpperCase()}</Text>
        <View style={[styles.orderStatus, 
          item.status === 'pending' ? styles.statusPending : 
          item.status === 'processing' ? styles.statusProcessing :
          item.status === 'delivered' ? styles.statusDelivered :
          styles.statusCancelled
        ]}>
          <Text style={[
            styles.orderStatusText,
            item.status === 'pending' ? styles.pendingText : 
            item.status === 'processing' ? styles.processingText :
            item.status === 'delivered' ? styles.deliveredText :
            styles.cancelledText
          ]}>
            {item.status === 'pending' ? 'Pending' : 
             item.status === 'processing' ? 'Processing' : 
             item.status === 'delivered' ? 'Delivered' :
             'Cancelled'}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <View style={styles.orderDetail}>
          <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.customerInfo.name}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Ionicons name="calendar-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.orderInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Items</Text>
            <Text style={styles.infoValue}>{item.items.length}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total</Text>
            <Text style={styles.infoValue}>${item.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedOrder(item);
            setDetailsVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        
        {item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => {
              if (item.status === 'pending') {
                updateOrderStatus(item.id, 'processing');
              } else if (item.status === 'processing') {
                updateOrderStatus(item.id, 'delivered');
              } else if (item.status === 'delivered') {
                // Here you could implement print functionality
                Alert.alert('Print', 'Receipt printing functionality would go here');
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>
              {item.status === 'pending' ? 'Process Order' : 
               item.status === 'processing' ? 'Mark as Delivered' : 
               'Print Receipt'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
  
  const renderOrderDetailsModal = () => (
    <Modal
      visible={detailsVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDetailsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setDetailsVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedOrder && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.orderHeaderLarge}>
                <Text style={styles.orderNumberLarge}>
                  Order #{selectedOrder.orderNumber || selectedOrder.id.slice(-5).toUpperCase()}
                </Text>
                <View style={[styles.orderStatusLarge, 
                  selectedOrder.status === 'pending' ? styles.statusPending : 
                  selectedOrder.status === 'processing' ? styles.statusProcessing :
                  selectedOrder.status === 'delivered' ? styles.statusDelivered :
                  styles.statusCancelled
                ]}>
                  <Text style={[
                    styles.orderStatusTextLarge,
                    selectedOrder.status === 'pending' ? styles.pendingText : 
                    selectedOrder.status === 'processing' ? styles.processingText :
                    selectedOrder.status === 'delivered' ? styles.deliveredText :
                    styles.cancelledText
                  ]}>
                    {selectedOrder.status === 'pending' ? 'Pending' : 
                     selectedOrder.status === 'processing' ? 'Processing' : 
                     selectedOrder.status === 'delivered' ? 'Delivered' :
                     'Cancelled'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.customerInfoCard}>
                <View style={styles.customerInfoRow}>
                  <Ionicons name="person" size={20} color="#666" style={styles.customerIcon} />
                  <View style={styles.customerInfoContent}>
                    <Text style={styles.customerInfoLabel}>Name</Text>
                    <Text style={styles.customerInfoValue}>{selectedOrder.customerInfo.name}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.customerInfoRow}>
                  <Ionicons name="call" size={20} color="#666" style={styles.customerIcon} />
                  <View style={styles.customerInfoContent}>
                    <Text style={styles.customerInfoLabel}>Phone</Text>
                    <Text style={styles.customerInfoValue}>{selectedOrder.customerInfo.phone}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.customerInfoRow}>
                  <Ionicons name="location" size={20} color="#666" style={styles.customerIcon} />
                  <View style={styles.customerInfoContent}>
                    <Text style={styles.customerInfoLabel}>Address</Text>
                    <Text style={styles.customerInfoValue}>{selectedOrder.customerInfo.address}</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>Order Items</Text>
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.orderItemCard}>
                  <View style={styles.orderItemHeader}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
                  </View>
                  
                  <View style={styles.orderItemPricing}>
                    <Text style={styles.orderItemPriceLabel}>Price per item:</Text>
                    <Text style={styles.orderItemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.orderItemTotal}>
                    <Text style={styles.orderItemTotalLabel}>Subtotal:</Text>
                    <Text style={styles.orderItemTotalValue}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
              
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${selectedOrder.subtotal.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>${selectedOrder.deliveryFee.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${selectedOrder.total.toFixed(2)}</Text>
                </View>
              </View>
              
              <Text style={styles.sectionTitle}>Update Order Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity 
                  style={[
                    styles.statusButton,
                    selectedOrder.status === 'pending' ? styles.activeStatusButton : null
                  ]}
                  onPress={() => updateOrderStatus(selectedOrder.id, 'pending')}
                >
                  <Text style={styles.statusButtonText}>Pending</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.statusButton,
                    selectedOrder.status === 'processing' ? styles.activeStatusButton : null
                  ]}
                  onPress={() => updateOrderStatus(selectedOrder.id, 'processing')}
                >
                  <Text style={styles.statusButtonText}>Processing</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.statusButton,
                    selectedOrder.status === 'delivered' ? styles.activeStatusButton : null
                  ]}
                  onPress={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                >
                  <Text style={styles.statusButtonText}>Delivered</Text>
                </TouchableOpacity>
              </View>
              
              {selectedOrder.status !== 'cancelled' && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    Alert.alert(
                      'Cancel Order',
                      'Are you sure you want to cancel this order?',
                      [
                        { text: 'No', style: 'cancel' },
                        { 
                          text: 'Yes', 
                          style: 'destructive',
                          onPress: () => {
                            updateOrderStatus(selectedOrder.id, 'cancelled');
                            setDetailsVisible(false);
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loaderText}>Loading orders...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#4a6da7" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          {activeTab !== 'all' && orders.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{orders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
          {activeTab !== 'pending' && orders.filter(o => o.status === 'pending').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {orders.filter(o => o.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'processing' && styles.activeTab]}
          onPress={() => setActiveTab('processing')}
        >
          <Text style={[styles.tabText, activeTab === 'processing' && styles.activeTabText]}>
            Processing
          </Text>
          {activeTab !== 'processing' && orders.filter(o => o.status === 'processing').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {orders.filter(o => o.status === 'processing').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'delivered' && styles.activeTab]}
          onPress={() => setActiveTab('delivered')}
        >
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.activeTabText]}>
            Delivered
          </Text>
          {activeTab !== 'delivered' && orders.filter(o => o.status === 'delivered').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {orders.filter(o => o.status === 'delivered').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getFilteredOrders()}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'all'
                ? 'There are no orders yet'
                : `There are no ${activeTab} orders at the moment`}
            </Text>
          </View>
        }
      />
      
      {renderOrderDetailsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#4a6da7',
    marginLeft: 5,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#4a6da7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    position: 'absolute',
    top: 5,
    right: 12,
    backgroundColor: '#f44336',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  statusPending: {
    backgroundColor: '#fff3e0',
  },
  statusProcessing: {
    backgroundColor: '#e3f2fd',
  },
  statusDelivered: {
    backgroundColor: '#e8f5e9',
  },
  statusCancelled: {
    backgroundColor: '#ffebee',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingText: {
    color: '#f57c00',
  },
  processingText: {
    color: '#2196f3',
  },
  deliveredText: {
    color: '#4caf50',
  },
  cancelledText: {
    color: '#f44336',
  },
  orderContent: {
    marginBottom: 15,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a6da7',
  },
  secondaryButtonText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  orderHeaderLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderNumberLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatusLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderStatusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
    marginBottom: 10,
    marginTop: 20,
  },
  customerInfoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 5,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  customerIcon: {
    marginRight: 15,
  },
  customerInfoContent: {
    flex: 1,
  },
  customerInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  customerInfoValue: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
  },
  orderItemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  orderItemPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderItemPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#333',
  },
  orderItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
    marginTop: 5,
  },
  orderItemTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  orderItemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a6da7',
    backgroundColor: 'white',
  },
  activeStatusButton: {
    backgroundColor: '#4a6da7',
  },
  statusButtonText: {
    color: '#4a6da7',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  cancelButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AdminOrders;