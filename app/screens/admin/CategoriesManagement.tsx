// app/screens/admin/CategoriesManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import { collection, addDoc, deleteDoc, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';

interface Category {
  id: string;
  name: string;
  productCount: number;
}

const { width } = Dimensions.get('window');

import { NavigationProp } from '@react-navigation/native';

const CategoriesManagement = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setRefreshing(true);
      const categoriesRef = collection(FIREBASE_DB, 'categories');
      const unsubscribe = onSnapshot(categoriesRef, async (snapshot) => {
        const categoriesData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            // Get product count for each category
            const productsQuery = query(
              collection(FIREBASE_DB, 'products'),
              where('category', '==', doc.id)
            );
            const productsSnapshot = await getDocs(productsQuery);
            
            return {
              id: doc.id,
              name: doc.data().name || doc.id, // Fallback to doc ID if name doesn't exist
              productCount: productsSnapshot.size
            };
          })
        );
        
        // Sort categories alphabetically by name
        categoriesData.sort((a, b) => a.name.localeCompare(b.name));
        
        setCategories(categoriesData);
        setLoading(false);
        setRefreshing(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    // Capitalize first letter of each word for better presentation
    const formattedCategory = newCategory.trim().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    const normalizedCategory = newCategory.trim().toLowerCase();
    
    if (categories.some(cat => cat.name.toLowerCase() === normalizedCategory)) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      setRefreshing(true);
      const categoriesRef = collection(FIREBASE_DB, 'categories');
      await addDoc(categoriesRef, {
        name: formattedCategory
      });
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
      setRefreshing(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, productCount: number) => {
    // If there are products in this category, warn the user
    const message = productCount > 0 
      ? `Are you sure you want to delete the "${categoryName}" category? There are ${productCount} products in this category that may be affected.`
      : `Are you sure you want to delete the "${categoryName}" category?`;
      
    Alert.alert(
      'Confirm Deletion',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setRefreshing(true);
              const categoryRef = doc(FIREBASE_DB, 'categories', categoryId);
              await deleteDoc(categoryRef);
              // Note: deletion will automatically trigger the onSnapshot listener to update the UI
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
              setRefreshing(false);
            }
          }
        }
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    // Calculate a background color based on the category name to give visual variety
    const colors = ['#E3F2FD', '#E8F5E9', '#FFF8E1', '#F3E5F5', '#E0F7FA', '#FFEBEE'];
    const colorIndex = Math.abs(item.name.charCodeAt(0)) % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <Animated.View style={[styles.categoryItem, { backgroundColor: bgColor }]}>
        <View style={styles.categoryContent}>
          <View style={styles.categoryIcon}>
            <Text style={styles.categoryInitial}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>
              {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            </Text>
            <View style={styles.productCountContainer}>
              <Ionicons name="cube-outline" size={14} color="#666" style={styles.productIcon} />
              <Text style={styles.productCount}>
                {item.productCount} {item.productCount === 1 ? 'product' : 'products'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item.id, item.name, item.productCount)}
        >
          <Ionicons name="trash-outline" size={20} color="#e53935" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4a6da7" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerInfo}>
          <Text style={styles.pageTitle}>Categories</Text>
          <Text style={styles.pageSubtitle}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} available
          </Text>
        </View>

        <View style={styles.addContainer}>
          <TextInput
            style={styles.input}
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder="Add new category (e.g., Whiskey)"
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={handleAddCategory}
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddCategory}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
            <Text style={styles.loaderText}>Loading categories...</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No categories found</Text>
                <Text style={styles.emptySubtext}>
                  Add a new category to organize your products
                </Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={fetchCategories}
          />
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#4a6da7',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerInfo: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  addContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
    paddingLeft: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 109, 167, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    marginRight: 4,
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
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
});

export default CategoriesManagement;