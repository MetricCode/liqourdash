// app/screens/customer/OrderDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import useStore from '../../../utils/useStore';

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
};

type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  createdAt: any; // Firebase timestamp
  deliveryNote?: string;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
};

const OrderDetails = () => {
  const navigation = useNavigation();
  type OrderDetailsRouteProp = RouteProp<{ params: { orderId: string } }, 'params'>;
  const route = useRoute<OrderDetailsRouteProp>();
  const { orderId } = route.params || {};


  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const orderRef = doc(FIREBASE_DB, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          
          // Format timestamps and set order data
          setOrder({
            id: orderSnap.id,
            ...orderData,
            createdAt: orderData.createdAt?.toDate?.() || new Date()
          } as Order);
        } else {
          Alert.alert('Error', 'Order not found');
          navigation.goBack();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load order details. Please try again.');
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigation]);
  
  // Function to handle order cancellation
  const handleCancelOrder = async () => {
    if (!order || !orderId) return;
    
    try {
      setCancelling(true);
      
      // Update the order status in Firestore
      const orderRef = doc(FIREBASE_DB, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      
      // Update local state to reflect the change
      setOrder({
        ...order,
        status: 'cancelled'
      });
      
      setCancelling(false);
      Alert.alert('Order Cancelled', 'Your order has been cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      setCancelling(false);
      Alert.alert('Error', 'Failed to cancel your order. Please try again.');
    }
  };
  
  const getStatusColor = (status: string): { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap } => {
    switch (status) {
      case 'pending':
        return { bg: '#fff3e0', text: '#f57c00', icon: 'time-outline' };
      case 'processing':
        return { bg: '#e3f2fd', text: '#1976d2', icon: 'bicycle-outline' };
      case 'delivered':
        return { bg: '#e8f5e9', text: '#388e3c', icon: 'checkmark-circle-outline' };
      case 'cancelled':
        return { bg: '#ffebee', text: '#d32f2f', icon: 'close-circle-outline' };
      default:
        return { bg: '#f5f5f5', text: '#757575', icon: 'help-circle-outline' };
    }
  };
  
  const formatDate = (date: Date) => {
    if (!date) return 'Unknown date';
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };
  
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return 'cash-outline';
      case 'card':
        return 'card-outline';
      case 'mpesa':
        return 'phone-portrait-outline';
      default:
        return 'wallet-outline';
    }
  };
  
  const shareOrder = async () => {
    if (!order) return;
    
    try {
      const orderDate = formatDate(order.createdAt);
      const orderNumber = order.id.slice(-5).toUpperCase();
      
      const message = `My Order #${orderNumber} from LiquorDash\n` +
        `Status: ${order.status.toUpperCase()}\n` +
        `Placed on: ${orderDate}\n` +
        `Total: $${order.total.toFixed(2)}\n\n` +
        `Track your order status in the LiquorDash app!`;
      
      await Share.share({
        message,
        title: `LiquorDash Order #${orderNumber}`
      });
    } catch (error) {
      console.error('Error sharing order:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }
  
  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={70} color="#f44336" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorMessage}>The order details could not be loaded.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const statusInfo = getStatusColor(order.status);
  const orderNumber = order.id.slice(-5).toUpperCase();
  const orderDate = formatDate(order.createdAt);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={shareOrder}
        >
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.orderStatusCard} onPress={() => {
          console.log('Order status card pressed');
        }}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon as keyof typeof Ionicons.glyphMap} size={24} color={statusInfo.text} />
          </View>
          
          <View style={styles.orderStatusInfo}>
            <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
            <Text style={[styles.orderStatus, { color: statusInfo.text }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          
          <View style={styles.itemsContainer}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Image 
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/60' }} 
                  style={styles.itemImage}
                  defaultSource={{ uri: 'https://via.placeholder.com/60' }}
                />
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
                
                <View style={styles.itemQuantity}>
                  <Text style={styles.quantityValue}>x{item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${order.deliveryFee.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={getPaymentMethodIcon(order.paymentMethod)} size={20} color="#4a6da7" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>
                  {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 
                   order.paymentMethod === 'card' ? 'Credit/Debit Card' : 
                   order.paymentMethod === 'mpesa' ? 'M-Pesa' : 
                   'Unknown'}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="receipt-outline" size={20} color="#4a6da7" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <Text style={styles.detailValue}>
                  {order.status === 'delivered' ? 'Paid' : 
                   order.paymentMethod === 'cash' ? 'Pay on Delivery' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="person-outline" size={20} color="#4a6da7" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{order.customerInfo.name}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="call-outline" size={20} color="#4a6da7" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{order.customerInfo.phone}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location-outline" size={20} color="#4a6da7" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{order.customerInfo.address}</Text>
              </View>
            </View>
            
            {order.deliveryNote && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="information-circle-outline" size={20} color="#4a6da7" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Delivery Note</Text>
                  <Text style={styles.detailValue}>{order.deliveryNote}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.trackOrderButton}>
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => {
              Alert.alert(
                'Contact Support',
                'Do you need help with your order?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Call Support', 
                    onPress: () => {
                      // Handle call support action
                      Alert.alert('Support', 'Customer support: +254-XXX-XXX-XXX');
                    }
                  },
                  { text: 'Send Message', 
                    onPress: () => {
                      // Handle message support action
                      Alert.alert('Message Sent', 'Support team will contact you shortly');
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4a6da7" />
            <Text style={styles.supportButtonText}>Need Help?</Text>
          </TouchableOpacity>
          
          {(order.status === 'pending' || order.status === 'processing') && (
            <TouchableOpacity 
              style={[
                styles.cancelButton,
                cancelling && styles.disabledButton
              ]}
              onPress={() => {
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No', style: 'cancel' },
                    { 
                      text: 'Yes, Cancel', 
                      style: 'destructive',
                      onPress: handleCancelOrder
                    }
                  ]
                );
              }}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#f44336" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#f44336" />
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  orderStatusCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  orderStatusInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  itemsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 15,
    color: '#666',
  },
  itemQuantity: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderSummary: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  trackOrderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.48,
  },
  supportButtonText: {
    color: '#4a6da7',
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.48,
  },
  cancelButtonText: {
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  }
});

export default OrderDetails;