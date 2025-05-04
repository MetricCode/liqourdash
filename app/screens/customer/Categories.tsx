// app/screens/customer/Categories.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  SafeAreaView, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { Product } from '../../types/Product';
// Add this import at the top of the file
import { addToCart } from '../../services/cartService';

const { width } = Dimensions.get('window');
const SPACING = 12;
const CATEGORY_WIDTH = 90;

const Categories = () => {
  const [categories, setCategories] = useState<{id: string, name: string, icon: string, color: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Animation values
  const scrollY = new Animated.Value(0);
  const opacityAnim = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });
  
  const scaleAnim = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp'
  });

  const categoryIcons: Record<string, any> = {
    whiskey: { icon: 'cafe-outline', color: '#8D6E63' },
    beer: { icon: 'beer-outline', color: '#FFA000' },
    rum: { icon: 'flask-outline', color: '#795548' },
    tequila: { icon: 'leaf-outline', color: '#43A047' },
    gin: { icon: 'flower-outline', color: '#5E35B1' },
    wine: { icon: 'wine-outline', color: '#C62828' },
    vodka: { icon: 'water-outline', color: '#1E88E5' },
    spirits: { icon: 'wine-outline', color: '#6D4C41' },
    // Fallback for unknown categories
    default: { icon: 'grid-outline', color: '#607D8B' }
  };

  useEffect(() => {
    // Fetch categories from Firestore
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(FIREBASE_DB, 'categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        
        const loadedCategories = categoriesSnapshot.docs.map(doc => {
          const categoryData = doc.data();
          const categoryId = doc.id;
          const categoryLower = categoryId.toLowerCase();
          
          // Get the name from the document data, or format the ID if name doesn't exist
          const displayName = categoryData.name || 
                            (categoryId.charAt(0).toUpperCase() + categoryId.slice(1));
          
          // Use the defined icon or fallback to default
          const iconInfo = categoryIcons[categoryLower] || categoryIcons.default;
          
          return {
            id: categoryId,
            name: displayName,
            icon: iconInfo.icon,
            color: iconInfo.color
          };
        });

        // Sort categories alphabetically by name
        loadedCategories.sort((a, b) => a.name.localeCompare(b.name));
        
        setCategories(loadedCategories);
        
        if (loadedCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(loadedCategories[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    setLoadingProducts(true);
    
    try {
      // Fetch products for the selected category
      const productsRef = collection(FIREBASE_DB, 'products');
      const q = query(productsRef, where('category', '==', selectedCategory));

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const productsList: Product[] = [];
          snapshot.docs.forEach(doc => {
            const product = doc.data() as Product;
            product.id = doc.id;
            productsList.push(product);
          });
          
          // Sort products by name
          productsList.sort((a, b) => a.name.localeCompare(b.name));
          
          setProducts(productsList);
          setLoadingProducts(false);
        },
        (error) => {
          console.error('Error fetching products:', error);
          setLoadingProducts(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up product listener:', error);
      setLoadingProducts(false);
    }
  }, [selectedCategory]);

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => {
    const isSelected = selectedCategory === item.id;
    
    // Ensure icon name is valid by providing a fallback
    let iconName = item.icon as keyof typeof Ionicons.glyphMap;
    if (!Ionicons.glyphMap[iconName]) {
      // Fallback to a default icon if the specified one isn't available
      iconName = 'grid-outline' as keyof typeof Ionicons.glyphMap;
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.categoryItem, 
          isSelected && styles.selectedCategoryItem,
          { borderColor: item.color, borderWidth: isSelected ? 0 : 1 }
        ]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <View style={[
          styles.categoryIconContainer,
          isSelected ? { backgroundColor: item.color } : { backgroundColor: 'rgba(0,0,0,0.03)' }
        ]}>
          <Ionicons 
            name={iconName} 
            size={24} 
            color={isSelected ? 'white' : item.color} 
          />
        </View>
        <Text 
          style={[
            styles.categoryName,
            isSelected && styles.selectedCategoryName,
            { color: isSelected ? 'white' : '#555' }
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item, index }: { item: Product, index: number }) => {
    // Find the category to use its color for accents
    const category = categories.find(cat => cat.id === item.category);
    const accentColor = category?.color || '#4a6da7';
    
    // Alternate left and right alignment for staggered effect
    const isLeftItem = index % 2 === 0;
    
    return (
      <Animated.View 
        style={[
          styles.productCardContainer,
          { 
            width: (width - (SPACING * 3)) / 2,
            marginLeft: isLeftItem ? SPACING : SPACING/2,
            marginRight: isLeftItem ? SPACING/2 : SPACING,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.productCard}>
          <View style={styles.productImageContainer}>
            <Image 
              source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
              style={styles.productImage} 
              resizeMode="cover"
            />
            {item.alcoholContent && (
              <View style={[styles.productBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.productBadgeText}>{item.alcoholContent}%</Text>
              </View>
            )}
          </View>
          
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            {item.brand && <Text style={styles.productBrand} numberOfLines={1}>{item.brand}</Text>}
            
            {item.volume && (
              <Text style={styles.productSpec}>{item.volume}</Text>
            )}
            
            <View style={styles.productFooter}>
              <Text style={[styles.productPrice, { color: accentColor }]}>${item.price.toFixed(2)}</Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: accentColor }]}
                onPress={async () => {
                  try {
                    await addToCart(item);
                    Alert.alert('Success', `${item.name} added to cart`);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to add item to cart');
                  }
                }}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          ListEmptyComponent={
            <View style={styles.emptyCategoryContainer}>
              <Text style={styles.emptyText}>No categories available</Text>
            </View>
          }
        />
      </View>
      
      <View style={styles.productsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {categories.find(cat => cat.id === selectedCategory)?.name || 'Products'}
          </Text>
          <Text style={styles.productCount}>
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        
        {loadingProducts ? (
          <View style={styles.productLoaderContainer}>
            <ActivityIndicator size="small" color="#4a6da7" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="wine-outline" size={70} color="#ddd" />
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptyText}>
                  We couldn't find any products in this category
                </Text>
              </View>
            }
          />
        )}
      </View>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoriesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 15,
    backgroundColor: 'white',
    width: CATEGORY_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedCategoryItem: {
    backgroundColor: '#4a6da7',
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  selectedCategoryName: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  productCount: {
    fontSize: 14,
    color: '#888',
  },
  productsContainer: {
    flex: 1,
  },
  productsList: {
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: SPACING / 2,
  },
  productCardContainer: {
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productSpec: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCategoryContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyText: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default Categories;