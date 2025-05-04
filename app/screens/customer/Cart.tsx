// app/screens/customer/Cart.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc 
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
  addedAt: Date;
};

type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  customerInfo: {
    name: string;
    address: string;
    phone: string;
  };
};

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const navigation = useNavigation();
  
  const fetchCartItems = useCallback(async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Direct access using user ID as document ID
      const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      
      if (!cartSnap.exists()) {
        setCartItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Extract data from the document
      const cartData = cartSnap.data();
      
      if (cartData.items && Array.isArray(cartData.items)) {
        setCartItems(cartData.items.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(), // Ensure we have an id
        })));
      } else {
        setCartItems([]);
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'Failed to load your cart. Pull down to refresh.');
    }
  }, []);
  
  // Change this useEffect to directly listen to the user's cart document
  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // Direct access using user ID as document ID for real-time updates
    const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
    
    // Use onSnapshot to get real-time updates on the document
    const unsubscribe = onSnapshot(cartRef, 
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          setCartItems([]);
          setLoading(false);
          return;
        }
        
        const cartData = docSnapshot.data();
        
        if (cartData.items && Array.isArray(cartData.items)) {
          setCartItems(cartData.items.map((item: any) => ({
            ...item,
            id: item.id || Math.random().toString(), // Ensure we have an id
          })));
        } else {
          setCartItems([]);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error in cart snapshot listener:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to sync your cart. Pull down to refresh.');
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCartItems();
  }, [fetchCartItems]);
  
  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) return;
      
      // Update local state first for UI responsiveness
      const updatedItems = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      
      // Update Firestore - direct access to the document
      const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
      
      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
      // Refresh to ensure UI is in sync with database
      fetchCartItems();
    }
  };
  
  // Partial update for Cart.tsx - removeItem function fix
  const removeItem = async (id: string) => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) return;
      
      // Find the exact index of the item we want to remove
      const itemIndex = cartItems.findIndex(item => item.id === id);
      if (itemIndex === -1) return;
      
      // Create a new array with the specific item removed
      const updatedItems = [...cartItems];
      updatedItems.splice(itemIndex, 1);
      
      // Update local state for immediate UI feedback
      setCartItems(updatedItems);
      
      // Update Firestore
      const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        if (updatedItems.length === 0) {
          // If cart is empty, delete the cart document
          await deleteDoc(cartRef);
        } else {
          // Otherwise update the items array with the new array
          // that has the specific item removed
          await updateDoc(cartRef, {
            items: updatedItems,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item. Please try again.');
      // Refresh to ensure UI is in sync with database
      fetchCartItems();
    }
  };
  
  const getSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
  };
  
  const handleCheckout = async () => {
    try {
      setProcessingOrder(true);
      const currentUser = FIREBASE_AUTH.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to place an order');
        setProcessingOrder(false);
        return;
      }
      
      if (cartItems.length === 0) {
        Alert.alert('Error', 'Your cart is empty');
        setProcessingOrder(false);
        return;
      }
      
      // Get user profile for delivery details
      const userProfileRef = doc(FIREBASE_DB, 'userProfiles', currentUser.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (!userProfileSnap.exists()) {
        Alert.alert('Missing Information', 'Please complete your profile with delivery address');
        setProcessingOrder(false);
        // Navigate to profile screen
        // navigation.navigate('Profile');
        return;
      }
      
      const userProfile = userProfileSnap.data();
      
      const subtotal = getSubtotal();
      const deliveryFee = 5.99;
      const total = subtotal + deliveryFee;
      
      // Create new order
      const order = {
        userId: currentUser.uid,
        items: cartItems,
        status: 'pending',
        subtotal,
        deliveryFee,
        total,
        createdAt: serverTimestamp(),
        customerInfo: {
          name: userProfile.name || currentUser.displayName || 'Customer',
          address: userProfile.address || 'No address provided',
          phone: userProfile.phone || 'No phone provided'
        }
      };
      
      const orderRef = await addDoc(collection(FIREBASE_DB, 'orders'), order);
      
      // Clear cart - direct document reference
      await deleteDoc(doc(FIREBASE_DB, 'carts', currentUser.uid));
      
      setCartItems([]);
      setProcessingOrder(false);
      
      Alert.alert(
        'Order Placed',
        'Your order has been placed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to orders screen
              // navigation.navigate('Orders');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing checkout:', error);
      setProcessingOrder(false);
      Alert.alert('Error', 'Failed to place your order. Please try again.');
    }
  };
  
  const deliveryFee = 3.50;
  const subtotal = getSubtotal();
  const total = subtotal + deliveryFee;
  
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.itemImage} 
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={18} color="#4a6da7" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Ionicons name="add" size={18} color="#4a6da7" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.itemCount}>{cartItems.length} items</Text>
      </View>
      
      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.cartList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4a6da7']}
                tintColor={'#4a6da7'}
              />
            }
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.checkoutButton,
                processingOrder && styles.disabledButton
              ]}
              onPress={handleCheckout}
              disabled={processingOrder}
            >
              {processingOrder ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some drinks to get started</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.goBack()}  
          >
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  itemCount: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartList: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    minHeight: '100%', // This helps ensure the pull-to-refresh works when list is short
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f0f0f0', // Placeholder background color
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6da7',
    marginBottom: 15,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 20,
    alignSelf: 'flex-start',
    padding: 5,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 5,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 20,
    marginTop: 5,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  checkoutButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4a6da7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#9cb2d6',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Cart;