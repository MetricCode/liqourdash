// app/screens/admin/Home.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminHome = () => {
  const [totalSales, setTotalSales] = useState(12580.45);
  const [totalOrders, setTotalOrders] = useState(156);
  const [pendingDeliveries, setPendingDeliveries] = useState(23);
  const [outOfStock, setOutOfStock] = useState(7);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.statValue}>${totalSales.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Ionicons name="cash-outline" size={24} color="#388e3c" style={styles.statIcon} />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Ionicons name="list-outline" size={24} color="#1976d2" style={styles.statIcon} />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={styles.statValue}>{pendingDeliveries}</Text>
            <Text style={styles.statLabel}>Pending Deliveries</Text>
            <Ionicons name="car-outline" size={24} color="#f57c00" style={styles.statIcon} />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.statValue}>{outOfStock}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
            <Ionicons name="alert-circle-outline" size={24} color="#c62828" style={styles.statIcon} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#1976d2" />
            </View>
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="create-outline" size={24} color="#388e3c" />
            </View>
            <Text style={styles.actionText}>Update Inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="people-outline" size={24} color="#f57c00" />
            </View>
            <Text style={styles.actionText}>Manage Staff</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#e8eaf6' }]}>
              <Ionicons name="bar-chart-outline" size={24} color="#3949ab" />
            </View>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Orders</Text>
        
        <View style={styles.ordersContainer}>
          {[1, 2, 3].map((order) => (
            <View key={order} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>Order #{order + 10342}</Text>
                <View style={[styles.orderStatus, 
                  order === 1 ? styles.statusPending : 
                  order === 2 ? styles.statusProcessing : 
                  styles.statusCompleted
                ]}>
                  <Text style={styles.orderStatusText}>
                    {order === 1 ? 'Pending' : 
                     order === 2 ? 'Processing' : 
                     'Completed'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetail}>Customer: John Doe</Text>
                <Text style={styles.orderDetail}>Total: $89.99</Text>
                <Text style={styles.orderDetail}>Items: 3</Text>
                <Text style={styles.orderDetail}>Date: May 2, 2025</Text>
              </View>
              
              <View style={styles.orderActions}>
                <TouchableOpacity style={styles.orderActionButton}>
                  <Text style={styles.orderActionText}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.orderActionButton, styles.orderActionButtonSecondary]}>
                  <Text style={styles.orderActionTextSecondary}>Update Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Orders</Text>
            <Ionicons name="arrow-forward" size={18} color="#4a6da7" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ordersContainer: {
    marginBottom: 20,
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
  statusCompleted: {
    backgroundColor: '#e8f5e9',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDetails: {
    marginBottom: 15,
  },
  orderDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderActionButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  orderActionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a6da7',
  },
  orderActionText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  orderActionTextSecondary: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewAllText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
    marginRight: 5,
  },
});

export default AdminHome;
