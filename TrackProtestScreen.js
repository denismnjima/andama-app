import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRoute, useNavigation } from '@react-navigation/native';
import axiosInstance from './axiosService';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import * as Permissions from 'expo-permissions';

const { width, height } = Dimensions.get('window');

const TrackProtestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { protestId } = route.params;
  const user = useSelector((state) => state.user);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const intervalRef = useRef(null); // Store the interval ID
   const [hasLocationPermission, setHasLocationPermission] = useState(false);

    const handleLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync(); // Request permission
        setHasLocationPermission(status === 'granted');

        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
        }
    };


  useEffect(() => {
    handleLocationPermission();  // Request permissions on component mount


    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);


    const sendLocation = async () => {
        if (!location || submitting) return;
        setSubmitting(true);

        try {
            const response = await axiosInstance.post(
                '/direction_mapping',
                {
                    longitude: location.coords.longitude,
                    latitude: location.coords.latitude,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    time: format(new Date(), 'HH:mm:ss'),
                    protest_id: protestId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,  // Add authorization header
                    },
                }
            );
            console.log('Location sent successfully');
        } catch (error) {
            console.error('Error sending location:', error);
            Alert.alert('Error', 'Failed to send location.');
        } finally {
            setSubmitting(false);
        }
    };

    const startTracking = async () => { // Added async
        if (!user.access_token) {
            Alert.alert(
                "Login Required",
                "You need to be logged in to track location. Please log in or create an account.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate('Login'),
                    },
                ]
            );
            return;
        }
      //  if (!hasLocationPermission) { // No need to re-check, already checked in useEffect
      //      Alert.alert('Location Permission Required', 'Please enable location permissions to track your location.');
      //      return;
      //  }
        if(errorMsg){
          Alert.alert('Location Permission Required', 'Please enable location permissions to track your location.');
          return;
        }

        setTracking(true);
        sendLocation(); // Send location immediately on start
        intervalRef.current = setInterval(sendLocation, 10000); // Every 10 seconds
    };


  const stopTracking = () => {
    setTracking(false);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, [protestId]);

  let region = {
    latitude: -0.0236,  // Default to Kenya
    longitude: 37.9062,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (location) {
    region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Your Protest</Text>
       {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {location && (
        <MapView
          style={styles.map}
          initialRegion={region}
          region={region}
          showsUserLocation={true}
        >
          <Marker coordinate={location.coords} title="Your Location" />
        </MapView>
      )}

      <TouchableOpacity
        style={[styles.button, tracking ? styles.stopButton : styles.startButton]}
        onPress={tracking ? stopTracking : startTracking}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{tracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  map: {
    width: width - 40,
    height: 300,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#27ae60',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default TrackProtestScreen;