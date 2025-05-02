// app/screens/admin/Orders.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'delivered';
};

const ordersData: Order[] = [
  {
    id: '1',
    orderNumber: '10345',
    customer: 'John Smith',
    date: '2025-05-02',
    items: 4,
    total: 78.99,
    status: 'pending',
  },
  {
    id: '2',
    orderNumber: '10344',
    customer: 'Mary Johnson',
    date: '2025-05-02',
    items: 2,
    total: 45.50,
    status: 'processing',
  },
  {
    id: '3',
    orderNumber: '10342',
    customer: 'Robert Brown',
    date: '2025-05-01',
    items: 6,
    total: 112.75,
    status: 'processing',
  },
  {
    id: '4',
    orderNumber: '10339',
    customer: 'Sarah Davis',
    date: '2025-04-30',
    items: 3,
    total: 65.25,
    status: 'delivered',
  },
  {
    id: '5',
    orderNumber: '10336',
    customer: 'Michael Wilson',
    date: '2025-04-29',
    items: 5,
    total: 95.80,
    status: 'delivered',
  },
];

const AdminOrders = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  const getFilteredOrders = () => {
    if (activeTab === 'all') return ordersData;
    return ordersData.filter(order => order.status === activeTab);
  };
  
  type Order = {
    id: string;
    orderNumber: string;
    customer: string;
    date: string;
    items: number;
    total: number;
    status: 'pending' | 'processing' | 'delivered';
  };
  
  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
        <View style={[styles.orderStatus, 
          item.status === 'pending' ? styles.statusPending : 
          item.status === 'processing' ? styles.statusProcessing : 
          styles.statusDelivered
        ]}>
          <Text style={styles.orderStatusText}>
            {item.status === 'pending' ? 'Pending' : 
             item.status === 'processing' ? 'Processing' : 
             'Delivered'}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <View style={styles.orderDetail}>
          <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.customer}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Ionicons name="calendar-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        
        <View style={styles.orderInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Items</Text>
            <Text style={styles.infoValue}>{item.items}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total</Text>
            <Text style={styles.infoValue}>${item.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>
            {item.status === 'pending' ? 'Process Order' : 
             item.status === 'processing' ? 'Mark as Delivered' : 
             'Print Receipt'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#4a6da7" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'processing' && styles.activeTab]}
          onPress={() => setActiveTab('processing')}
        >
          <Text style={[styles.tabText, activeTab === 'processing' && styles.activeTabText]}>
            Processing
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'delivered' && styles.activeTab]}
          onPress={() => setActiveTab('delivered')}
        >
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.activeTabText]}>
            Delivered
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getFilteredOrders()}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.ordersList}
      />
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#4a6da7',
    marginLeft: 5,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4a6da7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: '#fff3e0',
  },
  statusProcessing: {
    backgroundColor: '#e3f2fd',
  },
  statusDelivered: {
    backgroundColor: '#e8f5e9',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderContent: {
    marginBottom: 15,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a6da7',
  },
  secondaryButtonText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default AdminOrders;