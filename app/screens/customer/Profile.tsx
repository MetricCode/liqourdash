// app/screens/customer/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../../FirebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import MapsSearchBar from "../shared/MapsSearchBar";
import useStore from "../../../utils/useStore";
const CustomerProfile = () => {
  const navigation = useNavigation();
  const auth = FIREBASE_AUTH;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  //fetch current location from store and set that as default address
  const currentLocation = useStore((state) => state.myStoredLocation);
  useEffect(() => {
    console.log("current location", currentLocation);
  }, [currentLocation]);

  const [userProfile, setUserProfile] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    position: {},
  });

  useEffect(() => {
    console.log("the user profile", userProfile);
  }, [userProfile]);

  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setUserProfile({
          name: user.displayName || data.name || "",
          email: user.email || data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          position: data.position || {},
        });
      } else {
        // If no profile exists, use what we have from user auth
        setUserProfile({
          name: user.displayName || "",
          email: user.email || "",
          phone: "",
          address: "",
          position: {},
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

  // Initial load of profile data
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

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
        address: userProfile.address,
        position: userProfile.position,
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
      // Navigation will be handled by App.tsx when auth state changes
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
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
     
      <FlatList
       data={["1"]}
       showsVerticalScrollIndicator={false}
       keyboardShouldPersistTaps="handled"
       contentContainerStyle={styles.content}
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
       renderItem={() => (
         <>
           <View style={styles.profileSection}>
             <View style={styles.avatarContainer}>
               <View style={styles.avatar}>
                 <Text style={styles.avatarText}>
                   {userProfile.name.charAt(0).toUpperCase()}
                 </Text>
               </View>
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

                 <View style={styles.formField}>
                   <Text style={styles.fieldLabel}>Delivery Address</Text>
                   <MapsSearchBar
                     stylesPasses={[styles.input, styles.addressInput]}
                     placeholderText={false}
                     onSelectFunction={(data, details) => {
                       setUserProfile({
                         ...userProfile,
                         address: data.description,
                         position: details.geometry.location,
                       });
                     }}
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
                     <Ionicons
                       name="location-outline"
                       size={20}
                       color="#4a6da7"
                     />
                   </View>
                   <View style={styles.infoContent}>
                     <Text style={styles.infoLabel}>Delivery Address</Text>
                     <Text style={styles.infoValue}>
                       {userProfile.address || "Not set"}
                     </Text>
                   </View>
                 </View>
               </View>
             )}
           </View>

           <View style={styles.menuSection}>
             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => navigation.navigate("Orders" as never)}
             >
               <View style={[styles.menuIcon, { backgroundColor: "#e3f2fd" }]}>
                 <Ionicons name="receipt-outline" size={22} color="#1976d2" />
               </View>
               <View style={styles.menuContent}>
                 <Text style={styles.menuText}>My Orders</Text>
                 <Ionicons name="chevron-forward" size={20} color="#ccc" />
               </View>
             </TouchableOpacity>

             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => navigation.navigate("Cart" as never)}
             >
               <View style={[styles.menuIcon, { backgroundColor: "#e8f5e9" }]}>
                 <Ionicons name="cart-outline" size={22} color="#388e3c" />
               </View>
               <View style={styles.menuContent}>
                 <Text style={styles.menuText}>My Cart</Text>
                 <Ionicons name="chevron-forward" size={20} color="#ccc" />
               </View>
             </TouchableOpacity>

             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => setPasswordModal(true)}
             >
               <View style={[styles.menuIcon, { backgroundColor: "#fff3e0" }]}>
                 <Ionicons
                   name="lock-closed-outline"
                   size={22}
                   color="#f57c00"
                 />
               </View>
               <View style={styles.menuContent}>
                 <Text style={styles.menuText}>Change Password</Text>
                 <Ionicons name="chevron-forward" size={20} color="#ccc" />
               </View>
             </TouchableOpacity>

             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => {
                 Alert.alert(
                   "Contact Support",
                   "Do you need help with your account?",
                   [
                     { text: "Cancel", style: "cancel" },
                     {
                       text: "Call Support",
                       onPress: () =>
                         Alert.alert(
                           "Support",
                           "Customer support: +254-XXX-XXX-XXX"
                         ),
                     },
                     {
                       text: "Send Email",
                       onPress: () =>
                         Alert.alert("Email", "support@liquordash.com"),
                     },
                   ]
                 );
               }}
             >
               <View style={[styles.menuIcon, { backgroundColor: "#e1f5fe" }]}>
                 <Ionicons
                   name="help-circle-outline"
                   size={22}
                   color="#0288d1"
                 />
               </View>
               <View style={styles.menuContent}>
                 <Text style={styles.menuText}>Help & Support</Text>
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
         </>
       )}
     ></FlatList>


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
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4a6da7",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a6da7",
    marginLeft: 5,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4a6da7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  formContainer: {
    marginBottom: 10,
  },
  formField: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  addressInput: {
    // minHeight: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    flex: 0.48,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 0.48,
    backgroundColor: "#4a6da7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  disabledButton: {
    opacity: 0.7,
  },
  menuSection: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 30,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f44336",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
  },
  changePasswordButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  changePasswordText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default CustomerProfile;
