// app/screens/customer/Categories.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const categoriesData = [
  { id: '1', name: 'Wine', icon: 'wine', color: '#FF4D4D', backgroundColor: '#FFE8E8' },
  { id: '2', name: 'Beer', icon: 'beer', color: '#FF9D4D', backgroundColor: '#FFF2E8' },
  { id: '3', name: 'Spirits', icon: 'wine-outline', color: '#4D79FF', backgroundColor: '#E8F0FF' },
  { id: '4', name: 'Whiskey', icon: 'cafe', color: '#AA6A3C', backgroundColor: '#F7EBE0' },
  { id: '5', name: 'Vodka', icon: 'water', color: '#4DACFF', backgroundColor: '#E8F5FF' },
  { id: '6', name: 'Rum', icon: 'flask', color: '#FF6B4D', backgroundColor: '#FFEDE8' },
  { id: '7', name: 'Tequila', icon: 'leaf', color: '#4DFF88', backgroundColor: '#E8FFF0' },
  { id: '8', name: 'Gin', icon: 'flower', color: '#C44DFF', backgroundColor: '#F4E8FF' },
];

const productsData = [
  { id: '1', name: 'Red Wine Selection', price: 45.99, image: 'https://via.placeholder.com/150', category: '1' },
  { id: '2', name: 'Craft Beer Pack', price: 35.99, image: 'https://via.placeholder.com/150', category: '2' },
  { id: '3', name: 'Premium Vodka', price: 39.99, image: 'https://via.placeholder.com/150', category: '5' },
  { id: '4', name: 'Single Malt Whiskey', price: 75.99, image: 'https://via.placeholder.com/150', category: '4' },
  { id: '5', name: 'Jamaican Rum', price: 42.99, image: 'https://via.placeholder.com/150', category: '6' },
  { id: '6', name: 'London Dry Gin', price: 38.99, image: 'https://via.placeholder.com/150', category: '8' },
];

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState('1');
  
  const filteredProducts = productsData.filter(
    product => product.category === selectedCategory
  );

  interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    backgroundColor: string;
  }

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem, 
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <View 
        style={[
          styles.categoryIcon, 
          { backgroundColor: item.backgroundColor }
        ]}
      >
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text 
        style={[
          styles.categoryName,
          selectedCategory === item.id && styles.selectedCategoryName
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  }
  
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={categoriesData}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />
      
      <View style={styles.productsContainer}>
        <Text style={styles.sectionTitle}>
          {categoriesData.find(cat => cat.id === selectedCategory)?.name || 'Products'}
        </Text>
        
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.productsRow}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wine" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  categoriesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'transparent',
    width: 80,
  },
  selectedCategoryItem: {
    backgroundColor: '#4a6da7',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: 'white',
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  productsList: {
    paddingBottom: 20,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6da7',
    marginBottom: 5,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#4a6da7',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});

export default Categories;