// app/screens/admin/Sales.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
  Animated,
  Platform,
  Share,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB } from '../../../FirebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const { width } = Dimensions.get('window');

interface SalesSummary {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  topSellingProducts: { id: string; name: string; count: number; revenue: number }[];
  topCategories: { id: string; category: string; count: number; revenue: number }[];
  salesByDay: { date: string; sales: number; orders: number }[];
}

interface TimeFilterOption {
  label: string;
  value: string;
  days: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const timeFilterOptions: TimeFilterOption[] = [
  { label: 'Last 7 Days', value: '7days', days: 7 },
  { label: 'Last 30 Days', value: '30days', days: 30 },
  { label: 'Last 3 Months', value: '90days', days: 90 },
  { label: 'All Time', value: 'all', days: 0 }
];

const AdminSales = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesData, setSalesData] = useState<SalesSummary>({
    totalSales: 0,
    orderCount: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
    topCategories: [],
    salesByDay: []
  });
  const [timeFilter, setTimeFilter] = useState<string>('30days');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.97));
  const [categories, setCategories] = useState<{[key: string]: Category}>({});
  
  const isFocused = useIsFocused();

  // Handle animations
  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Reset animations when screen loses focus
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.97);
    }
  }, [isFocused, fadeAnim, scaleAnim]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
      await fetchSalesData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesRef = collection(FIREBASE_DB, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      
      const categoriesData: {[key: string]: Category} = {};
      
      categoriesSnapshot.forEach(doc => {
        const categoryData = doc.data() as Category;
        categoriesData[doc.id] = {
          id: doc.id,
          name: categoryData.name || 'Unknown',
          description: categoryData.description
        };
      });
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const selectedFilter = timeFilterOptions.find(option => option.value === timeFilter);
      
      // Calculate the start date based on the selected filter
      let startTimestamp = null;
      if (selectedFilter && selectedFilter.days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedFilter.days);
        startDate.setHours(0, 0, 0, 0);
        startTimestamp = Timestamp.fromDate(startDate);
      }
      
      // Query orders collection
      const ordersRef = collection(FIREBASE_DB, 'orders');
      let ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
      
      // Apply date filter if needed
      if (startTimestamp) {
        ordersQuery = query(ordersRef, 
          where('createdAt', '>=', startTimestamp),
          orderBy('createdAt', 'desc')
        );
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      let totalSales = 0;
      let orderCount = 0;
      const productSales: { [key: string]: { name: string; count: number; revenue: number } } = {};
      const categorySales: { [key: string]: { count: number; revenue: number } } = {};
      const dailySales: { [key: string]: { sales: number; orders: number } } = {};
      
      // Process each order
      ordersSnapshot.forEach(doc => {
        const orderData = doc.data();
        
        // Skip cancelled orders
        if (orderData.status?.toLowerCase() === 'cancelled') {
          return;
        }
        
        // Add to total sales
        if (orderData.total) {
          totalSales += orderData.total;
          orderCount++;
          
          // Add to daily sales
          const orderDate = orderData.createdAt ? 
            new Date(orderData.createdAt.toDate()) : new Date();
          const dateString = orderDate.toISOString().split('T')[0];
          
          if (!dailySales[dateString]) {
            dailySales[dateString] = { sales: 0, orders: 0 };
          }
          dailySales[dateString].sales += orderData.total;
          dailySales[dateString].orders += 1;
          
          // Process products in the order
          if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach((item: any) => {
              if (!item.id || !item.name) return;
              
              // Add to product sales
              if (!productSales[item.id]) {
                productSales[item.id] = { 
                  name: item.name, 
                  count: 0, 
                  revenue: 0 
                };
              }
              productSales[item.id].count += item.quantity || 1;
              productSales[item.id].revenue += (item.price || 0) * (item.quantity || 1);
              
              // Add to category sales
              const categoryId = item.categoryId || 'unknown';
              if (!categorySales[categoryId]) {
                categorySales[categoryId] = { count: 0, revenue: 0 };
              }
              categorySales[categoryId].count += item.quantity || 1;
              categorySales[categoryId].revenue += (item.price || 0) * (item.quantity || 1);
            });
          }
        }
      });
      
      // Calculate average order value
      const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
      
      // Convert daily sales to array and sort by date
      const salesByDayArray = Object.keys(dailySales).map(date => ({
        date,
        sales: dailySales[date].sales,
        orders: dailySales[date].orders
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      // Convert product sales to array and sort by revenue
      const topSellingProducts = Object.keys(productSales).map(id => ({
        id,
        name: productSales[id].name,
        count: productSales[id].count,
        revenue: productSales[id].revenue
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      
      // Convert category sales to array and sort by revenue
      const topCategories = Object.keys(categorySales).map(id => ({
        id,
        category: categories[id]?.name || id,
        count: categorySales[id].count,
        revenue: categorySales[id].revenue
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      
      // Update state with all the processed data
      setSalesData({
        totalSales,
        orderCount,
        averageOrderValue,
        topSellingProducts,
        topCategories,
        salesByDay: salesByDayArray
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load sales data. Please try again.');
    }
  }, [timeFilter, categories]);

  useEffect(() => {
    if (Object.keys(categories).length > 0 || isFocused) {
      fetchSalesData();
    }
  }, [fetchSalesData, timeFilter, isFocused, categories]);

  const formatCurrency = (amount: number) => {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };
  
  const getChartData = () => {
    const chartLabels = salesData.salesByDay.slice(-7).map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const chartData = salesData.salesByDay.slice(-7).map(item => item.sales);
    
    return {
      labels: chartLabels,
      datasets: [
        {
          data: chartData.length ? chartData : [0],
          color: (opacity = 1) => `rgba(74, 109, 167, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };
  };

  // Generate CSV and export report
  const exportSalesReport = async () => {
    try {
      // Create header row
      let csvContent = "Date,Orders,Sales\n";
      
      // Add data rows for daily sales
      salesData.salesByDay.forEach(item => {
        csvContent += `${item.date},${item.orders},${item.sales.toFixed(2)}\n`;
      });
      
      // Add a separator and top products section
      csvContent += "\nTop Selling Products\n";
      csvContent += "Rank,Product,Units Sold,Revenue\n";
      
      // Add product data
      salesData.topSellingProducts.forEach((product, index) => {
        csvContent += `${index + 1},"${product.name}",${product.count},${product.revenue.toFixed(2)}\n`;
      });
            
      // Add category data
      salesData.topCategories.forEach((category, index) => {
        csvContent += `${index + 1},"${category.category}",${category.count},${category.revenue.toFixed(2)}\n`;
      });
      
      // Add summary section
      csvContent += "\nSummary\n";
      csvContent += `Total Revenue,${salesData.totalSales.toFixed(2)}\n`;
      csvContent += `Total Orders,${salesData.orderCount}\n`;
      csvContent += `Average Order Value,${salesData.averageOrderValue.toFixed(2)}\n`;
      
      // Get current date for filename
      const date = new Date();
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `sales_report_${formattedDate}.csv`;
      
      // Create temporary file
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      // Share the file
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(filePath);
      } else if (Platform.OS === 'android') {
        // For Android, we need to save to an external directory
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'text/csv'
          );
          
          await FileSystem.writeAsStringAsync(destinationUri, csvContent);
          Alert.alert('Success', `Report saved as ${fileName}`);
        } else {
          // Fallback to sharing
          await Sharing.shareAsync(filePath);
        }
      } else {
        // Web or other platforms
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export sales report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Analytics</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchSalesData}
        >
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {timeFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                timeFilter === option.value && styles.activeFilterButton
              ]}
              onPress={() => setTimeFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  timeFilter === option.value && styles.activeFilterButtonText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a6da7']}
              tintColor="#4a6da7"
              title="Refreshing sales data..."
              titleColor="#666"
            />
          }
        >
          <Animated.View 
            style={[
              styles.overviewSection,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Sales Overview</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.statValue}>{formatCurrency(salesData.totalSales)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <Ionicons name="cash-outline" size={24} color="#388e3c" style={styles.statIcon} />
              </View>
              
              <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                <Text style={styles.statValue}>{salesData.orderCount}</Text>
                <Text style={styles.statLabel}>Orders</Text>
                <Ionicons name="cart-outline" size={24} color="#1976d2" style={styles.statIcon} />
              </View>
              
              <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                <Text style={styles.statValue}>{formatCurrency(salesData.averageOrderValue)}</Text>
                <Text style={styles.statLabel}>Avg. Order Value</Text>
                <Ionicons name="trending-up" size={24} color="#f57c00" style={styles.statIcon} />
              </View>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Sales Trend</Text>
            {salesData.salesByDay.length > 0 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={getChartData()}
                  width={width - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(74, 109, 167, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#4a6da7'
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
                <Text style={styles.chartCaption}>Last 7 Days Sales</Text>
              </View>
            ) : (
              <View style={styles.emptyChartContainer}>
                <Ionicons name="bar-chart-outline" size={50} color="#ddd" />
                <Text style={styles.emptyChartText}>No sales data available for the selected period</Text>
              </View>
            )}
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
            {salesData.topSellingProducts.length > 0 ? (
              <View style={styles.productsContainer}>
                {salesData.topSellingProducts.map((product, index) => (
                  <View key={product.id} style={styles.productItem}>
                    <View style={styles.productRank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <View style={styles.productStats}>
                        <Text style={styles.productCount}>{product.count} units</Text>
                        <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={50} color="#ddd" />
                <Text style={styles.emptyText}>No product data available</Text>
              </View>
            )}
          </Animated.View>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={exportSalesReport}
            >
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={styles.exportButtonText}>Export Report</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// Helper function to get color for category item
const getCategoryColor = (index: number) => {
  const colors = [
    '#e3f2fd', // Light Blue
    '#e8f5e9', // Light Green
    '#fff3e0', // Light Orange
    '#f3e5f5', // Light Purple
    '#e0f7fa', // Light Cyan
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    fontSize: 18,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  timeFilterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  activeFilterButton: {
    backgroundColor: '#4a6da7',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overviewSection: {
    marginBottom: 25,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '32%',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statIcon: {
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartCaption: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyChartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  productsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6da7',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  categoryRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6da7',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  footer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default AdminSales;