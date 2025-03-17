import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector,useDispatch } from 'react-redux'; 
import { useNavigation } from '@react-navigation/native'; 
import { clearUser } from './userSlice';

const ProfileScreen = () => {
  const navigation = useNavigation(); 
  const user = useSelector((state) => state.user); 
  const isLoggedIn = !!user.access_token; 
  const dispatch = useDispatch();

  useEffect(() => {

  }, []);

  const handleLogin = () => {
    navigation.navigate('Login'); 
  };

  const handleCreateAccount = () => {
    navigation.navigate('CreateAccount'); 
  };
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => dispatch(clearUser()) },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5998" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
      </View>

      {isLoggedIn ? (
        // Logged-in User Profile
        <View style={styles.profileContainer}>
          <Image
            style={styles.profileImage}
            source={{ uri: 'https://cdn-icons-png.flaticon.com/128/1814/1814218.png' }} 
          />
          <Text style={styles.userName}>{user.email}</Text>
          <Text style={styles.userBio}>
            Welcome back! Ready to contribute and make a difference?
          </Text>

          {/* <View style={styles.detailContainer}>
            <Ionicons name="location-outline" size={20} color="#888" />
            <Text style={styles.detailText}>Location: [User Location]</Text>
          </View>

          <View style={styles.detailContainer}>
            <Ionicons name="calendar-outline" size={20} color="#888" />
            <Text style={styles.detailText}>Member Since: [Join Date]</Text>
          </View> */}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Guest User Profile with Suggestions
        <View style={styles.guestContainer}>
          <Ionicons name="person-outline" size={60} color="#888" />
          <Text style={styles.guestTitle}>Join the Community!</Text>
          <Text style={styles.guestMessage}>
            Create an account or log in to contribute to protest mapping, report incidents, and help make our community
            safer.
          </Text>
          <Text style={styles.safetyMessage}>
            Your identity is encrypted and safe. Contribute with peace of mind.
          </Text>

          <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3B5998',
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userBio: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#888',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestContainer: {
    alignItems: 'center',
    padding: 20,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  guestMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  safetyMessage: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  createAccountButton: {
    backgroundColor: '#3B5998',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#748DA6',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;