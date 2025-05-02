// app/screens/delivery/Orders.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ordersData = [
  {
    id: '1',
    orderNumber: '10345',
    customer: 'John Smith',
    address: '123 Oak Street, Nairobi',
    items: 4,
    total: 78.99,
    status: 'assigned',
    time: '1:45 PM',
  },
  {
    id: '2',
    orderNumber: '10346',
    customer: 'Emily Johnson',
    address: '456 Maple Avenue, Nairobi',
    items: 2,
    total: 45.50,
    status: 'assigned',
    time: '2:30 PM',
  },
  {
    id: '3',
    orderNumber: '10338',
    customer: 'Michael Brown',
    address: '789 Pine Road, Nairobi',
    items: 3,
    total: 62.75,
    status: 'delivered',
    time: '11:15 AM',
  },
  {
    id: '4',
    orderNumber: '10335',
    customer: 'Sarah Davis',
    address: '234 Cedar Lane, Nairobi',
    items: 1,
    total: 32.25,
    status: 'delivered',
    time: '10:45 AM',
  },
];

const DeliveryOrders = () => {
  const [activeTab, setActiveTab] = useState('assigned');
  
  const filteredOrders = ordersData.filter(order => 
    order.status === activeTab
  );
  
  type Order = {
    id: string;
    orderNumber: string;
    customer: string;
    address: string;
    items: number;
    total: number;
    status: string;
    time: string;
  };
  
  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'assigned' ? styles.statusAssigned : 
          styles.statusDelivered
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'assigned' ? 'Assigned' : 'Delivered'}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <View style={styles.orderDetail}>
          <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.customer}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Ionicons name="location-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
        
        <View style={styles.orderDetail}>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>Delivery Time: {item.time}</Text>
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
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {item.status === 'assigned' ? 'Start Navigation' : 'View Details'}
          </Text>
        </TouchableOpacity>
        
        {item.status === 'assigned' && (
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'assigned' && styles.activeTab]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
            Assigned
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
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No {activeTab} orders</Text>
          </View>
        }
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusAssigned: {
    backgroundColor: '#e3f2fd',
  },
  statusDelivered: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a6da7',
  },
  secondaryButtonText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});

export default DeliveryOrders;