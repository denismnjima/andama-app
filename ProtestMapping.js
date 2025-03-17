import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import axiosInstance from './axiosService';

const { width, height } = Dimensions.get('window');

const ProtestMappingScreen = () => {
  const route = useRoute();
  const { protestId } = route.params;
  const [protest, setProtest] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null); // Store the interval ID

  const fetchProtestDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/protests/${protestId}`);
      if (response.status === 200) {
        setProtest(response.data);
      } else {
        setError('Failed to load protest details.');
      }
    } catch (e) {
      console.error('Error fetching protest details:', e);
      setError('An error occurred while fetching protest details.');
    }
  }, [protestId]);

  const fetchDirectionMappings = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/direction_mapping?protest_id=${protestId}`);
      if (response.status === 200) {
        setMappings(response.data);
      } else {
        setError('Failed to load direction mappings.');
      }
    } catch (e) {
      console.error('Error fetching direction mappings:', e);
      setError('An error occurred while fetching direction mappings.');
    } finally {
        setLoading(false); // Set loading to false after fetching is complete
    }
  }, [protestId]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        setError('');
        await fetchProtestDetails();
        await fetchDirectionMappings();
        setLoading(false);
    };
    fetchData();

    intervalRef.current = setInterval(() => {
      fetchDirectionMappings();
    }, 10000);

    return () => clearInterval(intervalRef.current); // Clear interval on unmount
  }, [fetchProtestDetails, fetchDirectionMappings]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B5998" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!protest) {
    return (
      <View style={styles.container}>
        <Text>Protest not found.</Text>
      </View>
    );
  }

  const protestCoordinates = {
    latitude: protest.latitude,
    longitude: protest.longitude,
  };

  const mappingCoordinates = mappings.map((mapping) => ({
    latitude: mapping.latitude,
    longitude: mapping.longitude,
  }));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: protest.latitude,
          longitude: protest.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Protest Start Location Marker */}
        <Marker coordinate={protestCoordinates} pinColor="green" title="Protest Start" />

        {/* Mapping Points */}
        {mappingCoordinates.map((coord, index) => (
          <Marker
            key={index}
            coordinate={coord}
            pinColor="orange" // Orange dots for mappings
          />
        ))}

        {/* Polyline to Show Direction */}
        {mappingCoordinates.length > 1 && (
          <Polyline
            coordinates={mappingCoordinates}
            strokeColor="#000" // Black color for the line
            strokeWidth={3}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: height,
  },
  errorText: {
    color: '#FF5733',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ProtestMappingScreen;