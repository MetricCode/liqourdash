import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';
import MapsSearchBar from '../shared/MapsSearchBar';

const { width } = Dimensions.get('window');

const StoreLocation = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [loading, setLoading] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [storeLocation, setStoreLocation] = useState({
    address: '',
    position: { lat: 0, lng: 0 }
  });
  
  // States for manual entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Create a data array for FlatList (just need a single item)
  const [contentData, setContentData] = useState<string[]>(['content']);

  useEffect(() => {
    fetchStoreLocation();
  }, []);
  
  // Debug logging for location state
  useEffect(() => {
    console.log("StoreLocation state updated:", JSON.stringify(storeLocation));
  }, [storeLocation]);

  // Function to handle location selection from MapsSearchBar
  const handleLocationSelect = (data: { description: string }, details: { geometry: { location: any } }) => {
    console.log("Location selected:", JSON.stringify(data));
    console.log("Location details:", JSON.stringify(details));
    
    if (data && data.description && details && details.geometry && details.geometry.location) {
      setStoreLocation({
        address: data.description,
        position: details.geometry.location
      });
      
      // Also update manual fields for reference
      setManualAddress(data.description);
      setManualLat(details.geometry.location.lat.toString());
      setManualLng(details.geometry.location.lng.toString());
    }
  };

  // Fetch store location from Firestore
  const fetchStoreLocation = async () => {
    try {
      setLoading(true);
      const user = FIREBASE_AUTH.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const storeRef = doc(FIREBASE_DB, "storeSettings", "location");
      const storeSnap = await getDoc(storeRef);
      
      if (storeSnap.exists()) {
        const data = storeSnap.data();
        setStoreLocation({
          address: data.address || '',
          position: data.position || { lat: 0, lng: 0 }
        });
        
        // Also set manual entry fields
        if (data.address) setManualAddress(data.address);
        if (data.position && data.position.lat) setManualLat(data.position.lat.toString());
        if (data.position && data.position.lng) setManualLng(data.position.lng.toString());
      } else {
        // Only try to create the document if you have write permissions
        try {
          await setDoc(storeRef, {
            address: '',
            position: { lat: 0, lng: 0 },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (writeError) {
          console.error("Error creating store location document:", writeError);
          // Just set default values without creating document
          setStoreLocation({
            address: '',
            position: { lat: 0, lng: 0 }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching store location:", error);
      // Set default values even if there's an error
      setStoreLocation({
        address: '',
        position: { lat: 0, lng: 0 }
      });
      
      // Don't show alert for permission errors in production
      if (process.env.NODE_ENV !== 'production') {
        Alert.alert(
          "Permissions Error", 
          "Your account doesn't have permission to access store location. Please contact your administrator."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this function to update orders with the new store location
  const updateOrdersWithStoreLocation = async (location: { address: string, position: { lat: number, lng: number } }) => {
    try {
      // Get all active orders (not delivered or cancelled)
      const ordersRef = collection(FIREBASE_DB, "orders");
      const q = query(
        ordersRef,
        where("status", "not-in", ["delivered", "cancelled"])
      );
      
      const querySnapshot = await getDocs(q);
      
      // Batch update all matching orders
      const batch = writeBatch(FIREBASE_DB);
      querySnapshot.forEach((doc) => {
        const orderRef = doc.ref;
        batch.update(orderRef, {
          storeLocation: location,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`Updated ${querySnapshot.size} orders with new store location`);
    } catch (error) {
      console.error("Error updating orders with store location:", error);
      // This is non-critical, so we don't show an alert to the user
    }
  };

  // Apply manual location input
  const applyManualLocation = () => {
    if (!manualAddress) {
      Alert.alert("Error", "Please enter an address");
      return;
    }
    
    const lat = parseFloat(manualLat || "0");
    const lng = parseFloat(manualLng || "0");
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Error", "Please enter valid coordinates (numbers only)");
      return;
    }
    
    setStoreLocation({
      address: manualAddress,
      position: { lat, lng }
    });
    
    setShowManualEntry(false);
  };

  // Handle save store location
  const handleSaveStoreLocation = async () => {
    if (!storeLocation.address) {
      Alert.alert("Error", "Please enter a store location");
      return;
    }

    try {
      setSavingLocation(true);
      
      const storeRef = doc(FIREBASE_DB, "storeSettings", "location");
      await setDoc(storeRef, {
        address: storeLocation.address,
        position: storeLocation.position,
        updatedAt: serverTimestamp(),
        updatedBy: FIREBASE_AUTH.currentUser?.uid || 'unknown'
      }, { merge: true });
      
      // Also update the location in all active orders
      await updateOrdersWithStoreLocation(storeLocation);
      
      Alert.alert(
        "Success", 
        "Store location has been updated",
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error("Error saving store location:", error);
      Alert.alert("Error", "Failed to update store location");
    } finally {
      setSavingLocation(false);
    }
  };

  // Render content for FlatList
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading store location...</Text>
        </View>
      );
    }
    
    return (
      <>
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Set Store Location</Text>
          <Text style={styles.description}>
            This location will be used for customer deliveries and displayed to customers when they place an order.
          </Text>
          
          {!showManualEntry ? (
            // Google Places search (may not work reliably)
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Store Address</Text>
              
              <View style={{ zIndex: 1000 }}>
                <MapsSearchBar
                  stylesPasses={[styles.input, styles.addressInput]}
                  inputContainerStyle={{}}
                  placeholderText="Search for store address"
                  onSelectFunction={(
                    data: { description: string },
                    details: { geometry: { location: any } }
                  ) => {
                    handleLocationSelect(data, details);
                  }}
                  Icon={Ionicons}
                  iconName="location-outline"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.manualEntryButton}
                onPress={() => setShowManualEntry(true)}
              >
                <Text style={styles.manualEntryText}>
                  <Ionicons name="create-outline" size={16} color="#4a6da7" /> Enter Address Manually
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Manual entry form
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Manual Address Entry</Text>
              
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                value={manualAddress}
                onChangeText={setManualAddress}
                placeholder="Enter complete address"
                multiline
              />
              
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                value={manualLat}
                onChangeText={setManualLat}
                placeholder="Enter latitude (e.g., 37.7749)"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                value={manualLng}
                onChangeText={setManualLng}
                placeholder="Enter longitude (e.g., -122.4194)"
                keyboardType="numeric"
              />
              
              <View style={styles.manualButtonRow}>
                <TouchableOpacity 
                  style={styles.cancelManualButton}
                  onPress={() => setShowManualEntry(false)}
                >
                  <Text style={styles.cancelManualText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyManualButton}
                  onPress={applyManualLocation}
                >
                  <Text style={styles.applyManualText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {storeLocation.address ? (
            <View style={styles.selectedLocationContainer}>
              <Ionicons name="location" size={20} color="#4a6da7" />
              <View style={styles.selectedLocationContent}>
                <Text style={styles.selectedLocationText}>{storeLocation.address}</Text>
                <Text style={styles.coordinatesText}>
                  Lat: {storeLocation.position.lat.toFixed(6)}, Lng: {storeLocation.position.lng.toFixed(6)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={24} color="#999" />
              <Text style={styles.noLocationText}>No location set</Text>
              <Text style={styles.noLocationSubtext}>Search for your store address above or enter manually</Text>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (!storeLocation.address || savingLocation) && styles.disabledButton
            ]}
            onPress={handleSaveStoreLocation}
            disabled={!storeLocation.address || savingLocation}
          >
            {savingLocation ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4a6da7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Location</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Content with FlatList */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{flex: 1}}
      >
        <FlatList
          data={contentData}
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          renderItem={() => renderContent()}
          keyExtractor={() => 'store-location-content'}
        />
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  formField: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  addressInput: {
    textAlignVertical: 'top',
  },
  manualEntryButton: {
    alignSelf: 'center',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#eef5fd',
  },
  manualEntryText: {
    color: '#4a6da7',
    fontWeight: '500',
    fontSize: 14,
  },
  manualButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cancelManualButton: {
    flex: 0.48,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelManualText: {
    color: '#666',
    fontWeight: '500',
  },
  applyManualButton: {
    flex: 0.48,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyManualText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(74, 109, 167, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  selectedLocationContent: {
    flex: 1,
    marginLeft: 10,
  },
  selectedLocationText: {
    color: '#333',
    fontSize: 15,
    marginBottom: 4,
  },
  coordinatesText: {
    color: '#666',
    fontSize: 12,
  },
  noLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  noLocationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
  },
  noLocationSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 20,
  },
  cancelButton: {
    flex: 0.48,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 0.48,
    backgroundColor: '#4a6da7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default StoreLocation;