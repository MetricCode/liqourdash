import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../../FirebaseConfig';
import { doc, getDoc,setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const DeliveryProfile = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const auth = FIREBASE_AUTH;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // User profile state
  type UserProfile = {
    name: string;
    email: string;
    phone: string;
    address: string;
    position: object;
    isAvailable: boolean;
    currentOrders: any[]; // You can replace 'any' with a more specific type if you know the structure
    maxConcurrentOrders: number;
    joinDate: string;
    photoURL: string | null;
  };

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    position: {},
    isAvailable: false,         // New field for availability status
    currentOrders: [],          // New field for tracking active deliveries
    maxConcurrentOrders: 3,     // New field for order capacity
    joinDate: "N/A",            // Add joinDate to fix type error
    photoURL: null              // Add photoURL for consistency
  });

  // Availability settings
  const [isAvailable, setIsAvailable] = useState(false);
  const [maxConcurrentOrders, setMaxConcurrentOrders] = useState('3');
  
  // Performance stats
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalDistance: 0,
    avgRating: 4.8,
    completionRate: 98
  });

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const profileRef = doc(FIREBASE_DB, "userProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
      // Create new profile document with delivery-specific fields
      await setDoc(profileRef, {
        name: user.displayName || "",
        email: user.email || "",
        phone: "",
        address: "",
        position: {},
        isAvailable: false,
        currentOrders: [],
        maxConcurrentOrders: 3,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: "delivery" // Add role identification
      });
      
      setUserProfile({
        name: user.displayName || "",
        email: user.email || "",
        phone: "",
        address: "",
        position: {},
        isAvailable: false,
        currentOrders: [],
        maxConcurrentOrders: 3,
        joinDate: "N/A",
        photoURL: null
      });
      } else {
        const data = profileSnap.data();
        setUserProfile({
          name: user.displayName || data.name || "",
          email: user.email || data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          position: data.position || {},
          isAvailable: typeof data.isAvailable === "boolean" ? data.isAvailable : false,
          currentOrders: Array.isArray(data.currentOrders) ? data.currentOrders : [],
          maxConcurrentOrders: typeof data.maxConcurrentOrders === "number" ? data.maxConcurrentOrders : 3,
          joinDate: data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
            : "N/A",
          photoURL: data.photoURL || null
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load profile information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial load and refresh of profile data
  useEffect(() => {
    if (isFocused) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, isFocused]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Handle saving profile
  const handleSaveProfile = async () => {
    if (!user) return;

    if (!userProfile.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    try {
      setSavingProfile(true);

      // Update Firestore profile
      const profileRef = doc(FIREBASE_DB, "userProfiles", user.uid);
      await updateDoc(profileRef, {
        name: userProfile.name,
        phone: userProfile.phone,
        updatedAt: serverTimestamp(),
      });

      // Update Auth display name if changed
      if (user.displayName !== userProfile.name) {
        await updateProfile(user, {
          displayName: userProfile.name,
        });
      }

      setEditMode(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile information");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle saving availability settings
  const handleSaveSettings = async () => {
    if (!user) return;
    
    try {
      setSavingSettings(true);

      // Parse max concurrent orders to a number
      const maxOrders = parseInt(maxConcurrentOrders, 10) || 3;
      
      // Update both profile collections for consistency
      const userRef = doc(FIREBASE_DB, 'users', user.uid);
      await updateDoc(userRef, {
        isAvailable: isAvailable,
        maxConcurrentOrders: maxOrders,
        lastUpdated: serverTimestamp()
      });
      
      // Also update the shared userProfiles collection
      const profileRef = doc(FIREBASE_DB, "userProfiles", user.uid);
      await updateDoc(profileRef, {
        isAvailable: isAvailable,
        maxConcurrentOrders: maxOrders,
        lastUpdated: serverTimestamp()
      });

      Alert.alert('Success', 'Your availability settings have been updated');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!user || !user.email) return;

    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    if (!newPassword) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      setChangingPassword(true);

      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert("Success", "Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);

      if ((error as { code: string }).code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect");
      } else {
        Alert.alert("Error", "Failed to change password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigation will be handled by App.tsx onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!editMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create-outline" size={22} color="#4a6da7" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        style={{ flex: 1 }} // Add this line
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4a6da7"]}
            tintColor={"#4a6da7"}
            title="Refreshing profile..."
            titleColor="#666"
          />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userProfile.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>
          </View>

          <View style={styles.divider} />

          {editMode ? (
            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={userProfile.name}
                  onChangeText={(text) =>
                    setUserProfile({ ...userProfile, name: text })
                  }
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={userProfile.phone}
                  onChangeText={(text) =>
                    setUserProfile({ ...userProfile, phone: text })
                  }
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditMode(false)}
                  disabled={savingProfile}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    savingProfile && styles.disabledButton,
                  ]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call-outline" size={20} color="#4a6da7" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>
                    {userProfile.phone || "Not set"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar-outline" size={20} color="#4a6da7" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{userProfile.joinDate}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Performance Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Performance Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
              <Ionicons name="bicycle-outline" size={24} color="#388e3c" style={styles.statIcon} />
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
              <Text style={styles.statValue}>{stats.totalDistance} mi</Text>
              <Text style={styles.statLabel}>Distance</Text>
              <Ionicons name="speedometer-outline" size={24} color="#1976d2" style={styles.statIcon} />
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
              <Text style={styles.statValue}>{stats.avgRating}★</Text>
              <Text style={styles.statLabel}>Rating</Text>
              <Ionicons name="star-outline" size={24} color="#f57c00" style={styles.statIcon} />
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
              <Text style={styles.statValue}>{stats.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
              <Ionicons name="checkmark-circle-outline" size={24} color="#9c27b0" style={styles.statIcon} />
            </View>
          </View>
        </View>

        {/* Availability Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Availability Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="person-outline" size={20} color="#4a6da7" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Available for Deliveries</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#d1d1d1', true: '#b3d2ea' }}
              thumbColor={isAvailable ? '#4a6da7' : '#f4f3f4'}
              ios_backgroundColor="#d1d1d1"
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="layers-outline" size={20} color="#4a6da7" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Max Concurrent Orders</Text>
            </View>
            <View style={styles.orderCountContainer}>
              <TouchableOpacity 
                style={styles.orderCountButton}
                onPress={() => {
                  const currentValue = parseInt(maxConcurrentOrders, 10) || 1;
                  if (currentValue > 1) {
                    setMaxConcurrentOrders((currentValue - 1).toString());
                  }
                }}
              >
                <Ionicons name="remove" size={18} color="#4a6da7" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.orderCountInput}
                value={maxConcurrentOrders}
                onChangeText={text => {
                  // Allow only numbers
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setMaxConcurrentOrders(numericValue);
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              
              <TouchableOpacity 
                style={styles.orderCountButton}
                onPress={() => {
                  const currentValue = parseInt(maxConcurrentOrders, 10) || 0;
                  setMaxConcurrentOrders((currentValue + 1).toString());
                }}
              >
                <Ionicons name="add" size={18} color="#4a6da7" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, savingSettings && styles.disabledButton]}
            onPress={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Account Actions */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Routes' as never)}>
            <View style={[styles.menuIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="map-outline" size={22} color="#1976d2" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>My Routes</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History' as never)}>
            <View style={[styles.menuIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="time-outline" size={22} color="#388e3c" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Delivery History</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setPasswordModal(true)}>
            <View style={[styles.menuIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#f57c00" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert("Logout", "Are you sure you want to logout?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Logout",
                style: "destructive",
                onPress: handleLogout,
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={changingPassword}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  changingPassword && styles.disabledButton,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.changePasswordText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 12,
  },
  editButtonText: {
    color: '#4a6da7',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flexGrow: 1, // Add this to allow content to expand
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  formContainer: {
    marginTop: 8,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafbfc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  settingsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  orderCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderCountButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  orderCountInput: {
    width: 40,
    height: 36,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  actionsSection: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  actionArrow: {
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  version: {
    fontSize: 14,
    color: '#999',
  },
  // Added missing styles below
  menuSection: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    marginTop: 8,
  },
  changePasswordButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  changePasswordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeliveryProfile;