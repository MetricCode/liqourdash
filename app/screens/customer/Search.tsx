// Enhanced Search.tsx with improved UI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Product } from '../../types/Product';
import { addToCart } from '../../services/cartService';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  
  const navigation = useNavigation();

  // Load all products once when component mounts
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsRef = collection(FIREBASE_DB, 'products');
        const snapshot = await getDocs(productsRef);
        
        const loadedProducts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            price: data.price || 0,
            category: data.category || '',
            brand: data.brand || '',
            imageUrl: data.imageUrl || '',
            description: data.description || '',
            inStock: data.inStock ?? true,
            alcoholContent: data.alcoholContent || 0,
            volume: data.volume || '',
          };
        });
        
        setAllProducts(loadedProducts);
        
        // Extract unique categories for suggestions
        const categories = Array.from(new Set(loadedProducts.map(p => p.category)))
          .filter(c => c) // Remove empty categories
          .slice(0, 4); // Limit to 4 categories
        
        setSuggestedCategories(categories);
      } catch (error) {
        console.error('Error loading products:', error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      }
    };

    loadProducts();
    
    // Fade in animation for search results
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, []);

  const getCategoryIcon = (categoryId: string): {
    iconName: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
  } => {
    const categoryLower = categoryId.toLowerCase();
    
    const iconMapping: Record<string, { iconName: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
      wine: { iconName: 'wine', color: '#C62828', bgColor: '#FFEBEE' },
      beer: { iconName: 'beer', color: '#F57C00', bgColor: '#FFF3E0' },
      spirits: { iconName: 'flask', color: '#303F9F', bgColor: '#E8EAF6' },
      whiskey: { iconName: 'cafe', color: '#5D4037', bgColor: '#EFEBE9' },
      gin: { iconName: 'flower', color: '#7B1FA2', bgColor: '#F3E5F5' },
      rum: { iconName: 'flask', color: '#E65100', bgColor: '#FFF3E0' },
      tequila: { iconName: 'leaf', color: '#2E7D32', bgColor: '#E8F5E9' },
      vodka: { iconName: 'water', color: '#0277BD', bgColor: '#E1F5FE' }
    };
    
    return iconMapping[categoryLower] || { 
      iconName: 'grid', 
      color: '#455A64', 
      bgColor: '#ECEFF1' 
    };
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }
    
    setLoading(true);
    setSearchPerformed(true);
    
    try {
      const searchTerm = searchQuery.toLowerCase().trim();
      
      const searchResults = allProducts
        .filter(product => {
          // Check name, brand, and category (case insensitive)
          const nameMatch = (product.name || '').toLowerCase().includes(searchTerm);
          const brandMatch = (product.brand || '').toLowerCase().includes(searchTerm);
          const categoryMatch = (product.category || '').toLowerCase().includes(searchTerm);
          
          return nameMatch || brandMatch || categoryMatch;
        })
        .sort((a, b) => {
          // Sort first by whether the name starts with the search term
          const aStartsWithTerm = (a.name || '').toLowerCase().startsWith(searchTerm) ? 0 : 1;
          const bStartsWithTerm = (b.name || '').toLowerCase().startsWith(searchTerm) ? 0 : 1;
          
          if (aStartsWithTerm !== bStartsWithTerm) {
            return aStartsWithTerm - bStartsWithTerm;
          }
          
          // Then sort alphabetically
          return (a.name || '').localeCompare(b.name || '');
        });
      
      // Reset fade animation and start it again for new results
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
      
      setProducts(searchResults);
      
      // Add to recent searches if not already there
      if (!recentSearches.includes(searchQuery.trim()) && searchQuery.trim()) {
        const newRecentSearches = [searchQuery.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(newRecentSearches);
      }
      
      // Debugging logs
      console.log('Search term:', searchTerm);
      console.log('Total products:', allProducts.length);
      console.log('Matching products:', searchResults.length);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Error', 'Failed to search products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSearchQuery(category);
    handleSearch();
  };

  const handleRecentSearchSelect = (term: string) => {
    setSearchQuery(term);
    handleSearch();
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const iconInfo = getCategoryIcon(item.category);
    const accentColor = iconInfo.color;
    
    return (
      <TouchableOpacity style={styles.productCard}>
        <Image 
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.productImage} 
          resizeMode="cover"
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          {item.brand && <Text style={styles.productBrand}>{item.brand}</Text>}
          
          <View style={styles.productMeta}>
            <View style={[styles.categoryPill, { backgroundColor: iconInfo.bgColor }]}>
              <Ionicons name={iconInfo.iconName} size={12} color={iconInfo.color} style={styles.categoryIcon} />
              <Text style={[styles.categoryText, { color: iconInfo.color }]}>{item.category}</Text>
            </View>
            
            {(item.alcoholContent ?? 0) > 0 && (
              <View style={styles.alcoholBadge}>
                <Text style={styles.alcoholText}>{item.alcoholContent}%</Text>
              </View>
            )}
          </View>
          
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
        <Text style={styles.headerTitle}>Search Products</Text>
        <View style={{ width: 40 }}></View>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setProducts([]);
                setSearchPerformed(false);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {!searchPerformed && !loading && (
        <View style={styles.suggestionsContainer}>
          {recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.pillsContainer}>
                {recentSearches.map((term, index) => (
                  <TouchableOpacity 
                    key={`recent-${index}`}
                    style={styles.recentPill}
                    onPress={() => handleRecentSearchSelect(term)}
                  >
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.recentPillText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <View style={styles.categoriesGrid}>
              {suggestedCategories.map((category, index) => {
                const iconInfo = getCategoryIcon(category);
                return (
                  <TouchableOpacity 
                    key={`category-${index}`}
                    style={styles.categoryCard}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: iconInfo.bgColor }
                    ]}>
                      <Ionicons name={iconInfo.iconName} size={24} color={iconInfo.color} />
                    </View>
                    <Text style={styles.categoryName}>{category}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Searching products...</Text>
        </View>
      ) : (
        <>
          {searchPerformed && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {products.length === 0
                  ? 'No products found'
                  : `Found ${products.length} product${products.length === 1 ? '' : 's'}`}
              </Text>
              
              {products.length > 0 && (
                <TouchableOpacity style={styles.sortButton}>
                  <Ionicons name="filter-outline" size={16} color="#4a6da7" />
                  <Text style={styles.sortButtonText}>Sort</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <Animated.FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim }}
            ListEmptyComponent={
              searchPerformed ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search" size={70} color="#ddd" />
                  <Text style={styles.emptyTitle}>No Results Found</Text>
                  <Text style={styles.emptyText}>
                    We couldn't find any products matching "{searchQuery}"
                  </Text>
                  <View style={styles.emptyTips}>
                    <Text style={styles.tipsTitle}>Search Tips:</Text>
                    <Text style={styles.tipText}>• Try using fewer or different keywords</Text>
                    <Text style={styles.tipText}>• Check for spelling mistakes</Text>
                    <Text style={styles.tipText}>• Try searching by category or brand</Text>
                  </View>
                </View>
              ) : null
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginLeft: 10,
    height: 50,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 20,
  },
  recentSearches: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  recentPillText: {
    marginLeft: 6,
    color: '#333',
    fontSize: 14,
  },
  categoriesSection: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    marginLeft: 5,
    color: '#4a6da7',
    fontWeight: '500',
  },
  productsList: {
    padding: 15,
    paddingBottom: 30,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 12,
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
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  alcoholBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  alcoholText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
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
  emptyTips: {
    marginTop: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#777',
    marginBottom: 5,
  },
});

export default SearchScreen;