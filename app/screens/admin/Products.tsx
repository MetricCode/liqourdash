// app/screens/admin/Products.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: number;
  alcoholContent?: number;
  volume?: number;
  brand?: string;
};

import { NavigationProp } from '@react-navigation/native';

const AdminProducts = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Form states
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState(''); 
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productAlcoholContent, setProductAlcoholContent] = useState('');
  const [productVolume, setProductVolume] = useState('');
  const [productBrand, setProductBrand] = useState('');

  // Categories
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Animation values
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [140, 80],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    // Fetch products
    const productsRef = collection(FIREBASE_DB, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, 
      (snapshot) => {
        const productsList: Product[] = [];
        snapshot.docs.forEach(doc => {
          const product = doc.data() as Product;
          product.id = doc.id;
          productsList.push(product);
        });
        // Sort products by name for better display
        productsList.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(productsList);
        setLoading(false);
      }, 
      (error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    );

    // Fetch categories
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesRef = collection(FIREBASE_DB, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const loadedCategories = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id
        }));
        
        // Sort categories alphabetically
        loadedCategories.sort((a, b) => a.name.localeCompare(b.name));
        
        const updatedCategories = [{id: 'all', name: 'All'}, ...loadedCategories];
        setCategories(updatedCategories);
        
        // Set default category for new products if available
        if (loadedCategories.length > 0) {
          setProductCategory(loadedCategories[0].id);
        }
        
        setLoadingCategories(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoadingCategories(false);
        Alert.alert('Error', 'Failed to load categories. Please check your connection.');
      }
    };
  
    fetchCategories();
  
    return () => {
      unsubscribeProducts();
    };
  }, []);

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(product => product.category === activeCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const validateProduct = () => {
    if (!productName.trim()) return 'Product name is required';
    if (!productCategory) return 'Category is required';
    if (!productPrice || isNaN(parseFloat(productPrice))) return 'Valid price is required';
    if (productAlcoholContent && isNaN(parseFloat(productAlcoholContent))) return 'Valid alcohol content required';
    if (productVolume && isNaN(parseFloat(productVolume))) return 'Valid volume required';
    return null;
  };

  const handleAddProduct = async () => {
    const validationError = validateProduct();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setLoading(true);
    
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      
      const productData = {
        name: productName.trim(),
        description: productDescription.trim(),
        price: parseFloat(productPrice),
        category: productCategory, // Keep the category ID as is
        imageUrl: productImageUrl || 'https://via.placeholder.com/150',
        inStock: parseInt(productStock) || 0,
        alcoholContent: productAlcoholContent ? parseFloat(productAlcoholContent) : null,
        volume: productVolume ? parseFloat(productVolume) : null,
        brand: productBrand.trim() || null,
        addedBy: currentUser ? currentUser.uid : 'unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("Adding product with category:", productCategory);
      const productsRef = collection(FIREBASE_DB, 'products');
      await addDoc(productsRef, productData);
      
      resetForm();
      setModalVisible(false);
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    }
    
    setLoading(false);
  };

  const handleUpdateProduct = async () => {
    const validationError = validateProduct();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    if (!currentProduct) return;

    setLoading(true);
    
    try {
      const productData = {
        name: productName.trim(),
        description: productDescription.trim(),
        price: parseFloat(productPrice),
        category: productCategory, // Keep the category ID as is
        imageUrl: productImageUrl || currentProduct.imageUrl,
        inStock: parseInt(productStock) || 0,
        alcoholContent: productAlcoholContent ? parseFloat(productAlcoholContent) : null,
        volume: productVolume ? parseFloat(productVolume) : null,
        brand: productBrand.trim() || null,
        updatedAt: serverTimestamp(),
      };

      console.log("Updating product with category:", productCategory);
      const productRef = doc(FIREBASE_DB, 'products', currentProduct.id);
      await updateDoc(productRef, productData);
      
      resetForm();
      setIsEditing(false);
      setModalVisible(false);
      Alert.alert('Success', 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImageUrl('');
    setProductStock('');
    setProductAlcoholContent('');
    setProductVolume('');
    setProductBrand('');
    
    // Reset product category to first available real category (not "all")
    const realCategories = categories.filter(c => c.id !== 'all');
    if (realCategories.length > 0) {
      setProductCategory(realCategories[0].id);
    } else {
      setProductCategory('');
    }
    
    setCurrentProduct(null);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const productRef = doc(FIREBASE_DB, 'products', productId);
              await deleteDoc(productRef);
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setProductName(product.name);
    setProductDescription(product.description);
    setProductPrice(product.price.toString());
    setProductCategory(product.category);
    setProductImageUrl(product.imageUrl);
    setProductStock(product.inStock.toString());
    setProductAlcoholContent(product.alcoholContent?.toString() || '');
    setProductVolume(product.volume?.toString() || '');
    setProductBrand(product.brand || '');
    setIsEditing(true);
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    
    // Check if categories are available
    const realCategories = categories.filter(c => c.id !== 'all');
    if (realCategories.length === 0) {
      Alert.alert(
        'No Categories', 
        'Please add categories before creating products',
        [
          { text: 'OK' }
        ]
      );
      return;
    }
    
    // Pre-select the first category for convenience
    setProductCategory(realCategories[0].id);
    setModalVisible(true);
  };
  
  const renderProductItem = ({ item }: { item: Product }) => {
    // Get category name for display
    const categoryItem = categories.find(c => c.id === item.category);
    const categoryName = categoryItem ? categoryItem.name : 'Uncategorized';
    
    // Calculate color based on category for a more visually pleasing UI
    const colors = ['#E3F2FD', '#FEFAE0', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const colorIndex = item.category ? Math.abs(item.category.charCodeAt(0)) % colors.length : 0;
    const cardColor = colors[colorIndex];
    
    return (
      <Animated.View style={[styles.productCard, { backgroundColor: cardColor }]}>
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.productImage}
            defaultSource={{ uri: 'https://via.placeholder.com/150' }}
          />
          {typeof item.inStock === 'number' && item.inStock <= 0 && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStock}>OUT OF STOCK</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productContent}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
          </View>
          
          {item.brand && (
            <Text style={styles.productBrand}>{item.brand}</Text>
          )}
          
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.productInfo}>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={12} color="#555" style={styles.categoryIcon} />
              <Text style={styles.categoryText}>
                {categoryName}
              </Text>
            </View>
            
            <View style={[styles.stockBadge, item.inStock > 0 ? styles.inStockBadge : styles.outOfStockBadge]}>
              <Ionicons 
                name={item.inStock > 0 ? "checkmark-circle" : "close-circle"} 
                size={12} 
                color={item.inStock > 0 ? "white" : "white"} 
                style={styles.stockIcon} 
              />
              <Text style={[styles.stockText, item.inStock > 0 ? styles.inStock : styles.outOfStock]}>
                {item.inStock > 0 ? `In Stock: ${item.inStock}` : 'Out of Stock'}
              </Text>
            </View>
          </View>
          
          <View style={styles.liquorDetails}>
            {item.alcoholContent && (
              <View style={styles.specBadge}>
                <Ionicons name="wine" size={12} color="#555" style={styles.specIcon} />
                <Text style={styles.specText}>
                  {item.alcoholContent}% ABV
                </Text>
              </View>
            )}
            {item.volume && (
              <View style={styles.specBadge}>
                <Ionicons name="flask" size={12} color="#555" style={styles.specIcon} />
                <Text style={styles.specText}>
                  {item.volume}ml
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.productActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="create-outline" size={16} color="#4a6da7" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteProduct(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={16} color="#e53935" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4a6da7" />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation?.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}> LiquorDash Products</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
      
      <View style={styles.mainContent}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.activeCategoryButton
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text style={[
                styles.categoryButtonText,
                activeCategory === category.id && styles.activeCategoryButtonText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
            <Text style={styles.loaderText}>Loading products...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={getFilteredProducts()}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="wine" size={80} color="#ddd" />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery || activeCategory !== 'all' 
                    ? 'Try changing your search criteria' 
                    : 'Add your first product using the button above'}
                </Text>
              </View>
            }
          />
        )}
      </View>
      
      {/* Add/Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g., Johnnie Walker Black Label"
                maxLength={100}
                placeholderTextColor="#aaa"
              />
              
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={productDescription}
                onChangeText={setProductDescription}
                placeholder="Enter product description"
                multiline
                numberOfLines={4}
                maxLength={500}
                placeholderTextColor="#aaa"
              />
              
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={productBrand}
                onChangeText={setProductBrand}
                placeholder="e.g., Johnnie Walker"
                placeholderTextColor="#aaa"
              />
              
              <Text style={styles.inputLabel}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                value={productPrice}
                onChangeText={setProductPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#aaa"
              />
              
              <Text style={styles.inputLabel}>Category *</Text>
              {loadingCategories ? (
                <View style={[styles.pickerContainer, { justifyContent: 'center', padding: 15 }]}>
                  <ActivityIndicator size="small" color="#4a6da7" />
                </View>
              ) : (
                <View style={styles.categorySelectionContainer}>
                  {categories
                    .filter(c => c.id !== 'all')
                    .map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          productCategory === category.id && styles.selectedCategoryOption
                        ]}
                        onPress={() => setProductCategory(category.id)}
                      >
                        <Text 
                          style={[
                            styles.categoryOptionText,
                            productCategory === category.id && styles.selectedCategoryOptionText
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
              
              <View style={styles.rowInputs}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Alcohol Content (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={productAlcoholContent}
                    onChangeText={setProductAlcoholContent}
                    placeholder="40"
                    keyboardType="numeric"
                    placeholderTextColor="#aaa"
                  />
                </View>
                
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Volume (ml)</Text>
                  <TextInput
                    style={styles.input}
                    value={productVolume}
                    onChangeText={setProductVolume}
                    placeholder="750"
                    keyboardType="numeric"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>
              
              <Text style={styles.inputLabel}>Stock Quantity *</Text>
              <TextInput
                style={styles.input}
                value={productStock}
                onChangeText={setProductStock}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor="#aaa"
              />
              
              <Text style={styles.inputLabel}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={productImageUrl}
                onChangeText={setProductImageUrl}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#aaa"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={isEditing ? handleUpdateProduct : handleAddProduct}
                >
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4a6da7',
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#444',
  },
  clearButton: {
    padding: 5,
  },
  mainContent: {
    flex: 1,
    paddingTop: 15,
  },
  categoriesContainer: {
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activeCategoryButton: {
    backgroundColor: '#4a6da7',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeCategoryButtonText: {
    color: 'white',
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 110,
    height: 150,
    resizeMode: 'cover',
  },
  productContent: {
    flex: 1,
    padding: 15,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 5,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  inStockBadge: {
    backgroundColor: '#4caf50',
  },
  outOfStockBadge: {
    backgroundColor: '#f44336',
  },
  stockIcon: {
    marginRight: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  inStock: {
    color: 'white',
  },
  outOfStock: {
    color: 'white',
  },
  liquorDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 5,
  },
  specIcon: {
    marginRight: 4,
  },
  specText: {
    fontSize: 12,
    color: '#555',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 0.48,
  },
  editButton: {
    backgroundColor: 'rgba(74, 109, 167, 0.15)',
  },
  deleteButton: {
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4a6da7',
    marginLeft: 5,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e53935',
    marginLeft: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: '#f5f5f5',
  },
  categorySelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  selectedCategoryOption: {
    backgroundColor: '#4a6da7',
    borderColor: '#4a6da7',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryOptionText: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#4a6da7',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AdminProducts;