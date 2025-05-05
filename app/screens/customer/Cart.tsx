// app/screens/customer/Cart.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshControl,
  StatusBar,
  Platform,
  AccessibilityInfo
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
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation param list type
type RootStackParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Checkout: { 
    cartItems: CartItem[], 
    subtotal: number 
  };
  OrderDetails: { 
    orderId: string 
  };
};

// Define the CartItem type
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

const Cart = () => {
  // State declarations
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  
  // Navigation
  type NavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;
  const navigation = useNavigation<NavigationProp>();
  
  // Fetch cart items from Firestore
  const fetchCartItems = useCallback(async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Direct document access using user's ID
      const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
      const cartSnap = await getDoc(cartRef);
      
      if (!cartSnap.exists()) {
        setCartItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Extract and format cart items
      const cartData = cartSnap.data();
      
      if (cartData.items && Array.isArray(cartData.items)) {
        setCartItems(cartData.items.map((item: any) => ({
          ...item,
          id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`, // Ensure unique IDs
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
      Alert.alert(
        'Error', 
        'Failed to load your cart. Pull down to refresh.',
        [{ text: 'OK' }]
      );
    }
  }, []);
  
  // Real-time listener for cart changes
  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // Set up real-time listener to the cart document
    const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
    
    const unsubscribe = onSnapshot(
      cartRef, 
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
            id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
          })));
        } else {
          setCartItems([]);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error in cart snapshot listener:', error);
        setLoading(false);
        Alert.alert(
          'Error', 
          'Failed to sync your cart. Pull down to refresh.',
          [{ text: 'OK' }]
        );
      }
    );
    
    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);
  
  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCartItems();
  }, [fetchCartItems]);
  
  // Update item quantity in cart
  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1 || operationInProgress) return;
    
    try {
      setOperationInProgress(true);
      
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setOperationInProgress(false);
        return;
      }
      
      // Update local state first for responsive UI
      const updatedItems = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      
      // Update Firestore document
      const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
      
      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });
      
      // Provide accessibility feedback
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(`Quantity updated to ${newQuantity}`);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert(
        'Error', 
        'Failed to update quantity. Please try again.',
        [{ text: 'OK' }]
      );
      // Refresh to ensure UI matches database state
      fetchCartItems();
    } finally {
      setOperationInProgress(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (id: string, itemName: string) => {
    if (operationInProgress) return;
    
    // Confirm removal with alert
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove "${itemName}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setOperationInProgress(true);
              
              const currentUser = FIREBASE_AUTH.currentUser;
              if (!currentUser) {
                setOperationInProgress(false);
                return;
              }
              
              // Find the exact index of the item to remove
              const itemIndex = cartItems.findIndex(item => item.id === id);
              if (itemIndex === -1) {
                setOperationInProgress(false);
                return;
              }
              
              // Create new array without the removed item
              const updatedItems = [...cartItems];
              updatedItems.splice(itemIndex, 1);
              
              // Update local state for immediate UI feedback
              setCartItems(updatedItems);
              
              // Update Firestore
              const cartRef = doc(FIREBASE_DB, 'carts', currentUser.uid);
              const cartSnap = await getDoc(cartRef);
              
              if (cartSnap.exists()) {
                if (updatedItems.length === 0) {
                  // Delete the cart document if empty
                  await deleteDoc(cartRef);
                } else {
                  // Update with the new items array
                  await updateDoc(cartRef, {
                    items: updatedItems,
                    updatedAt: serverTimestamp()
                  });
                }
              }
              
              // Provide accessibility feedback
              if (Platform.OS === 'ios') {
                AccessibilityInfo.announceForAccessibility(`${itemName} removed from cart`);
              }
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert(
                'Error', 
                'Failed to remove item. Please try again.',
                [{ text: 'OK' }]
              );
              // Refresh to ensure UI matches database state
              fetchCartItems();
            } finally {
              setOperationInProgress(false);
            }
          }
        }
      ]
    );
  };
  
  // Calculate cart totals using memoization for performance
  const { subtotal, deliveryFee, total } = useMemo(() => {
    const calculatedSubtotal = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    const fixedDeliveryFee = 3.50;
    
    return {
      subtotal: calculatedSubtotal,
      deliveryFee: fixedDeliveryFee,
      total: calculatedSubtotal + fixedDeliveryFee
    };
  }, [cartItems]);
  
  // Handle checkout process
  const handleCheckout = async () => {
    if (operationInProgress) return;
    
    try {
      setOperationInProgress(true);
      
      const currentUser = FIREBASE_AUTH.currentUser;
      
      if (!currentUser) {
        Alert.alert(
          'Sign In Required', 
          'Please sign in to proceed with checkout',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => {
                // Navigate to sign-in screen
                navigation.navigate('Login' as never);
              }
            }
          ]
        );
        setOperationInProgress(false);
        return;
      }
      
      if (cartItems.length === 0) {
        Alert.alert(
          'Empty Cart', 
          'Please add items to your cart before checkout',
          [{ text: 'OK' }]
        );
        setOperationInProgress(false);
        return;
      }
      
      // Use CommonActions to navigate to Checkout within the stack
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Checkout',
          params: { 
            cartItems, 
            subtotal 
          }
        })
      );
      
    } catch (error) {
      console.error('Error processing checkout:', error);
      Alert.alert(
        'Error', 
        'Failed to proceed to checkout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setOperationInProgress(false);
    }
  };
  
  // Render each cart item
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View 
      style={styles.cartItem}
      accessible={true}
      accessibilityLabel={`${item.name}, ${item.quantity} items, ${item.price.toFixed(2)} dollars each`}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
        style={styles.itemImage}
        defaultSource={{ uri: 'https://via.placeholder.com/150' }} 
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
            accessibilityLabel={`Decrease quantity, current quantity is ${item.quantity}`}
            disabled={operationInProgress}
          >
            <Ionicons name="remove" size={18} color="#4a6da7" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
            accessibilityLabel={`Increase quantity, current quantity is ${item.quantity}`}
            disabled={operationInProgress}
          >
            <Ionicons name="add" size={18} color="#4a6da7" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item.id, item.name)}
        accessibilityLabel={`Remove ${item.name} from cart`}
        disabled={operationInProgress}
      >
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );
  
  // Show loading indicator while initializing
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render the main component
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.itemCountContainer}>
          <Text style={styles.itemCount}>{cartItems.length} items</Text>
        </View>
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
                title="Refreshing cart..."
                titleColor="#666"
              />
            }
            ListFooterComponent={<View style={{ height: 20 }} />}
            showsVerticalScrollIndicator={false}
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
                operationInProgress && styles.disabledButton
              ]}
              onPress={handleCheckout}
              accessibilityLabel={`Proceed to checkout. Total amount ${total.toFixed(2)} dollars`}
              disabled={operationInProgress}
            >
              {operationInProgress ? (
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
          
          <View style={styles.emptyActionsContainer}>
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => {
                // Try to go back, if not possible navigate to Home
                try {
                  navigation.goBack();
                } catch (error) {
                  navigation.dispatch(
                    CommonActions.navigate({ name: 'Home' })
                  );
                }
              }}
              accessibilityLabel="Browse products"
            >
              <Text style={styles.shopButtonText}>Browse Products</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.shopButton, styles.categoriesButton]}
              onPress={() => navigation.dispatch(
                CommonActions.navigate({ name: 'Categories' })
              )}
              accessibilityLabel="View categories"
            >
              <Text style={styles.shopButtonText}>View Categories</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  itemCountContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemCount: {
    fontSize: 16,
    color: '#666',
  },
  cartList: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 120, // Extra space for the summary container
    minHeight: '100%', // Ensures pull-to-refresh works correctly
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
    backgroundColor: '#f0f0f0', // Placeholder background
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
    lineHeight: 22,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
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
  emptyActionsContainer: {
    width: '100%',
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
    marginBottom: 10,
  },
  categoriesButton: {
    backgroundColor: '#5d7eb8',
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Cart;