// app/screens/customer/Home.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
  ImageBackground,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import { collection, onSnapshot, query, limit, where, getDocs } from 'firebase/firestore';
import { Product } from '../../types/Product';
// Add at the top of both files
import { addToCart } from '../../services/cartService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;
const SPACING = 15;

const CustomerHome = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, icon: string, bg: string, color: string}[]>([]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(FIREBASE_DB, 'categories');
        const snapshot = await getDocs(categoriesRef);
        
        const categoryIcons: Record<string, any> = {
          wine: { name: 'wine-outline', color: '#C62828', bg: '#FFEBEE' },
          beer: { name: 'beer-outline', color: '#F57C00', bg: '#FFF3E0' },
          spirits: { name: 'wine-outline', color: '#303F9F', bg: '#E8EAF6' },
          whiskey: { name: 'cafe-outline', color: '#5D4037', bg: '#EFEBE9' },
          gin: { name: 'flower-outline', color: '#7B1FA2', bg: '#F3E5F5' },
          rum: { name: 'flask-outline', color: '#E65100', bg: '#FFF3E0' },
          tequila: { name: 'leaf-outline', color: '#2E7D32', bg: '#E8F5E9' },
          vodka: { name: 'water-outline', color: '#0277BD', bg: '#E1F5FE' }
        };
        
        const loadedCategories = snapshot.docs.map(doc => {
          const categoryData = doc.data();
          const categoryId = doc.id;
          const categoryLower = categoryId.toLowerCase();
          
          // Get the name from the document data, or format the ID if name doesn't exist
          const displayName = categoryData.name || 
                            (categoryId.charAt(0).toUpperCase() + categoryId.slice(1));
          
          // Ensure we have a valid icon or use default
          let iconInfo = categoryIcons[categoryLower];
          if (!iconInfo) {
            // Default for unknown categories
            iconInfo = { name: 'grid-outline', color: '#455A64', bg: '#ECEFF1' };
          }
          
          return {
            id: categoryId,
            name: displayName,
            icon: iconInfo.name,
            color: iconInfo.color,
            bg: iconInfo.bg
          };
        });
        
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Load products
  useEffect(() => {
    try {
      setLoading(true);
      const productsRef = collection(FIREBASE_DB, 'products');
      let q;
      
      if (activeCategory !== 'all') {
        // Simple query without compound index requirements
        q = query(productsRef, where('category', '==', activeCategory), limit(6));
      } else {
        // Simple query for all products
        q = query(productsRef, limit(8));
      }
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const productsList: Product[] = [];
          snapshot.docs.forEach(doc => {
            const product = doc.data() as Product;
            product.id = doc.id;
            productsList.push(product);
          });
          
          // If we have product creation timestamps, sort by them
          if (productsList.length > 0 && productsList[0].createdAt) {
            productsList.sort((a, b) => 
              (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
            );
          }
          
          setFeaturedProducts(productsList.slice(0, 6)); // Take only the first 6
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching products:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up product listener:', error);
      setLoading(false);
    }
  }, [activeCategory]);

  const renderFeaturedItem = ({ item, index }: { item: Product, index: number }) => {
    // Find the category to use its color
    const category = categories.find(cat => cat.id === item.category);
    const accentColor = category?.color || '#4a6da7';
    
    return (
      <TouchableOpacity 
        style={[
          styles.productCard,
          { marginLeft: index === 0 ? SPACING : SPACING/2 }
        ]}
      >
        {/* Add back all the product card content */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
            style={styles.productImage} 
            resizeMode="cover"
          />
          {item.alcoholContent && (
            <View style={[styles.badgeContainer, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{item.alcoholContent}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          {item.brand && <Text style={styles.productBrand} numberOfLines={1}>{item.brand}</Text>}
          
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
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading your spirits...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>LiquorDash</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
            style={styles.bannerImage}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.bannerOverlay}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Weekend Special</Text>
                <Text style={styles.bannerText}>Get 15% off on selected whiskeys</Text>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>
        
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.length > 0 ? (
              categories.map((category, index) => {
                // Make sure we have a valid icon name for Ionicons
                let iconName = category.icon as keyof typeof Ionicons.glyphMap;
                if (!Ionicons.glyphMap[iconName]) {
                  iconName = 'grid-outline' as keyof typeof Ionicons.glyphMap;
                }
                
                return (
                  <TouchableOpacity 
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      activeCategory === category.id && styles.activeCategoryButton
                    ]}
                    onPress={() => setActiveCategory(category.id)}
                  >
                    <View style={[
                      styles.categoryIcon, 
                      { backgroundColor: category.bg }
                    ]}>
                      <Ionicons name={iconName} size={24} color={category.color} />
                    </View>
                    <Text 
                      style={[
                        styles.categoryText,
                        activeCategory === category.id && { color: category.color, fontWeight: '600' }
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyProductsContainer}>
                <Text style={styles.emptyText}>No categories available</Text>
              </View>
            )}
          </ScrollView>
        </View>
        
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={featuredProducts}
            renderItem={renderFeaturedItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.featuredList,
              featuredProducts.length === 0 && styles.emptyListContainer
            ]}
            ListEmptyComponent={
              <View style={styles.emptyProductsContainer}>
                <Ionicons name="wine-outline" size={50} color="#ddd" />
                <Text style={styles.emptyTextLarge}>No products available</Text>
                <Text style={styles.emptyText}>Check back later for our featured items</Text>
              </View>
            }
          />
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#f9f9f9',
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6da7',
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
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerContainer: {
    paddingHorizontal: SPACING,
    marginBottom: 25,
  },
  bannerImage: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
  },
  bannerContent: {
    paddingHorizontal: 25,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.9,
  },
  bannerButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 25,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bannerButtonText: {
    color: '#4a6da7',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#4a6da7',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 25,
  },
  categoriesContainer: {
    paddingLeft: SPACING,
    paddingRight: SPACING/2,
  },
  categoryButton: {
    alignItems: 'center',
    marginRight: SPACING,
    width: 80,
  },
  activeCategoryButton: {
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
  featuredSection: {
    marginBottom: 25,
  },
  featuredList: {
    paddingRight: SPACING/2,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: SPACING,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 170,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  popularSection: {
    marginBottom: 25,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING,
  },
  brandCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  brandIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  emptyProductsContainer: {
    width: CARD_WIDTH,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    marginLeft: SPACING,
  },
  emptyListContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  emptyTextLarge: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 10,
  },
  bottomPadding: {
    height: 80,
  },
});

export default CustomerHome;