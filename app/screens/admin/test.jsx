// app/screens/admin/Deliveries.tsx (completed)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
//zustand
import useStore from '../../../utils/useStore';

const AdminDeliveries = () => {
  const ordersStored = useStore(state => state.ordersStored);
  useEffect(() => { 
    console.log('Orders stored:', ordersStored);
  }, [ordersStored]);
  const [activeTab, setActiveTab] = useState('all');
  
  interface DeliveryItem {
    id: string;
    orderNumber: string;
    customer: string;
    address: string;
    deliveryPerson: string;
    status: string;
    estimatedDelivery: string;
  }
  
  // 1) Remove the static deliveriesData array…

  // 2) Map your store data into the DeliveryItem shape
  const formatDeliveriesData = (): DeliveryItem[] => {
    return ordersStored.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customerInfo.name,
      address: order.customerInfo.address,
      deliveryPerson: 'Unassigned',       // default – you can extend your store to include this
      status: order.status,               // e.g. 'processing', 'pending', etc.
      estimatedDelivery: 'N/A',           // stub until you add ETA to your store
    }));
  };
  
  // 3) Use the mapped data for filtering
  const getFilteredDeliveries = (): DeliveryItem[] => {
    const data = formatDeliveriesData();
    if (activeTab === 'all') return data;
    return data.filter(d => d.status === activeTab);
  };
  
  const renderDeliveryItem = ({ item }: { item: DeliveryItem }) => (
    <TouchableOpacity style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
const AdminDeliveries = () => {
  const ordersStored = useStore(state => state.ordersStored);
  useEffect(() => { 
    console.log('Orders stored:', ordersStored);
  }, [ordersStored]);
  const [activeTab, setActiveTab] = useState('all');
  
  const getFilteredDeliveries = () => {
    if (activeTab === 'all') return deliveriesData;
    return deliveriesData.filter(delivery => delivery.status === activeTab);
  };
  
  interface DeliveryItem {
    id: string;
    orderNumber: string;
    customer: string;
    address: string;
    deliveryPerson: string;
    status: string;
    estimatedDelivery: string;
  }
  
  const renderDeliveryItem = ({ item }: { item: DeliveryItem }) => (
    <TouchableOpacity style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'pending' ? styles.statusPending : 
          item.status === 'in-transit' ? styles.statusInTransit :
          item.status === 'unassigned' ? styles.statusUnassigned :
          styles.statusDelivered
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'pending' ? 'Pending' : 
             item.status === 'in-transit' ? 'In Transit' :
             item.status === 'unassigned' ? 'Unassigned' :
             'Delivered'}
          </Text>
        </View>
      </View>
      
      <View style={styles.deliveryContent}>
        <View style={styles.deliveryDetail}>
          <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>Customer: {item.customer}</Text>
        </View>
        
        <View style={styles.deliveryDetail}>
          <Ionicons name="location-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
        
        <View style={styles.deliveryDetail}>
          <Ionicons name="bicycle-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>Delivery: {item.deliveryPerson}</Text>
        </View>
        
        <View style={styles.deliveryDetail}>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.detailText}>ETA: {item.estimatedDelivery}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {item.status === 'unassigned' ? 'Assign Delivery' : 
             item.status === 'pending' || item.status === 'in-transit' ? 'Track' : 
             'View Receipt'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deliveries</Text>
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
          style={[styles.tab, activeTab === 'unassigned' && styles.activeTab]}
          onPress={() => setActiveTab('unassigned')}
        >
          <Text style={[styles.tabText, activeTab === 'unassigned' && styles.activeTabText]}>
            Unassigned
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'in-transit' && styles.activeTab]}
          onPress={() => setActiveTab('in-transit')}
        >
          <Text style={[styles.tabText, activeTab === 'in-transit' && styles.activeTabText]}>
            In Transit
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
        data={getFilteredDeliveries()}
        renderItem={renderDeliveryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.deliveryList}
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
  deliveryList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deliveryCard: {
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
  deliveryHeader: {
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
  statusPending: {
    backgroundColor: '#fff3e0',
  },
  statusInTransit: {
    backgroundColor: '#e3f2fd',
  },
  statusUnassigned: {
    backgroundColor: '#ffebee',
  },
  statusDelivered: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deliveryContent: {
    marginBottom: 15,
  },
  deliveryDetail: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 0.48,
    alignItems: 'center',
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
    flex: 0.48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a6da7',
  },
  secondaryButtonText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default AdminDeliveries;