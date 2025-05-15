// app/screens/shared/ProfileBase.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, SafeAreaView, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB  } from '../../../FirebaseConfig';

const ProfileBase = ({ userType = 'customer' }) => {
  const auth = FIREBASE_AUTH;
  const user = auth.currentUser;
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModal, setCurrentModal] = useState('');

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: handleSignOut, style: 'destructive' }
      ]
    );
  };
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Here you would actually update user preferences in Firestore
  };
  
  const toggleDarkMode = () => {
    setDarkModeEnabled(!darkModeEnabled);
    // Here you would actually update user preferences in Firestore and apply theme
  };
  
  const openModal = (modalType: string) => {
    setCurrentModal(modalType);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
  };
  
  const renderModalContent = () => {
    switch (currentModal) {
      case 'language':
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            
            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>English</Text>
              <Ionicons name="checkmark" size={22} color="#4a6da7" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Swahili</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>French</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'help':
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Help Center</Text>
            
            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="help-circle-outline" size={24} color="#4a6da7" style={styles.helpIcon} />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>FAQs</Text>
                <Text style={styles.helpDescription}>Frequently asked questions about using LiquorDash</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="book-outline" size={24} color="#4a6da7" style={styles.helpIcon} />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>User Guide</Text>
                <Text style={styles.helpDescription}>Learn how to use all features of the app</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpItem}>
              <Ionicons name="chatbubble-outline" size={24} color="#4a6da7" style={styles.helpIcon} />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Contact Support</Text>
                <Text style={styles.helpDescription}>Get help from our customer service team</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={styles.userType}>
            <Text style={styles.userTypeText}>
              {userType === 'customer' ? 'Customer Account' : 
               userType === 'admin' ? 'Admin Account' : 
               'Delivery Account'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          {userType === 'customer' && (
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="location-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Manage Addresses</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          
          {userType === 'customer' && (
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="card-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Payment Methods</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}

          {userType === 'delivery' && (
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="bicycle-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Delivery Preferences</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}

          {userType === 'admin' && (
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="people-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Manage Staff</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {userType === 'customer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orders</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="time-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Order History</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="star-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Reviews</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="cart-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Favorites</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        {userType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="time-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Delivery History</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="star-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Performance & Ratings</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="cash-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Earnings</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        {userType === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="bar-chart-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Analytics & Reports</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="cube-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Inventory Management</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="pricetag-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Promotions & Discounts</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Ionicons name="notifications-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: "#d9d9d9", true: "#a8c0e5" }}
              thumbColor={notificationsEnabled ? "#4a6da7" : "#f4f3f4"}
              ios_backgroundColor="#d9d9d9"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Ionicons name="moon-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
              <Text style={styles.menuText}>Dark Mode</Text>
            </View>
            <Switch
              trackColor={{ false: "#d9d9d9", true: "#a8c0e5" }}
              thumbColor={darkModeEnabled ? "#4a6da7" : "#f4f3f4"}
              ios_backgroundColor="#d9d9d9"
              onValueChange={toggleDarkMode}
              value={darkModeEnabled}
            />
          </View>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => openModal('language')}>
            <Ionicons name="language-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>Language</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => openModal('help')}>
            <Ionicons name="help-circle-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="call-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>Terms & Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={22} color="#4a6da7" style={styles.menuIcon} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={confirmSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#f44336" style={styles.signOutIcon} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>LiquorDash v1.0.0</Text>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4a6da7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f5f5f5',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  userType: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  userTypeText: {
    color: '#1976d2',
    fontWeight: '500',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutIcon: {
    marginRight: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpIcon: {
    marginRight: 15,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileBase;