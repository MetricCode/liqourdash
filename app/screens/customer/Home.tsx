// app/screens/customer/Home.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const featuredProducts = [
  { id: '1', name: 'Johnnie Walker Black Label', price: 45.99, image: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Hennessy V.S', price: 39.99, image: 'https://via.placeholder.com/150' },
  { id: '3', name: 'Grey Goose Vodka', price: 32.99, image: 'https://via.placeholder.com/150' },
  { id: '4', name: 'Don Julio Reposado', price: 54.99, image: 'https://via.placeholder.com/150' },
];

const CustomerHome = () => {
  interface FeaturedProduct {
    id: string;
    name: string;
    price: number;
    image: string;
  }
  
  const renderFeaturedItem = ({ item }: { item: FeaturedProduct }) => (
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
        <Text style={styles.headerTitle}>LiquorDash</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search for drinks...</Text>
      </View>
      
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Weekend Special</Text>
          <Text style={styles.bannerText}>Get 15% off on selected whiskeys</Text>
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
      
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
        contentContainerStyle={styles.featuredList}
      />
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoriesContainer}>
        <TouchableOpacity style={styles.categoryButton}>
          <View style={[styles.categoryIcon, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="wine" size={24} color="#FF4D4D" />
          </View>
          <Text style={styles.categoryText}>Wine</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryButton}>
          <View style={[styles.categoryIcon, { backgroundColor: '#FFF2E8' }]}>
            <Ionicons name="beer" size={24} color="#FF9D4D" />
          </View>
          <Text style={styles.categoryText}>Beer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryButton}>
          <View style={[styles.categoryIcon, { backgroundColor: '#E8F0FF' }]}>
            <Ionicons name="wine-outline" size={24} color="#4D79FF" />
          </View>
          <Text style={styles.categoryText}>Spirits</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryButton}>
          <View style={[styles.categoryIcon, { backgroundColor: '#E8FFF0' }]}>
            <Ionicons name="apps" size={24} color="#4DFF88" />
          </View>
          <Text style={styles.categoryText}>More</Text>
        </TouchableOpacity>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  banner: {
    backgroundColor: '#4a6da7',
    borderRadius: 15,
    padding: 20,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bannerText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#4a6da7',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#4a6da7',
    fontSize: 14,
  },
  featuredList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    width: 160,
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
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  categoryButton: {
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});

export default CustomerHome;