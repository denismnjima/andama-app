import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  Animated, // For animating the map height
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import axiosInstance from './axiosService';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'; //Import for location check

const { width, height } = Dimensions.get('window');

const AddProtestScreen = ({ route }) => {
  const navigation = useNavigation();
   // Animation
  const [mapHeight, setMapHeight] = useState(new Animated.Value(200));  // Start with default height
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // State for map
  const [coordinate, setCoordinate] = useState(
    route.params?.initialLatitude && route.params?.initialLongitude
      ? {
          latitude: route.params.initialLatitude,
          longitude: route.params.initialLongitude,
        }
      : { latitude: -0.0236, longitude: 37.9062 } // Default to Kenya
  );

  //State for text inputs
  const [longitude, setLongitude] = useState(coordinate.longitude.toString());
  const [latitude, setLatitude] = useState(coordinate.latitude.toString());
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [explanation, setExplanation] = useState('');

  const [date, setDate] = useState(new Date()); // Default to today
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [startingTime, setStartingTime] = useState(new Date());
  const [showStartingTimePicker, setShowStartingTimePicker] = useState(false);

  const [endingTime, setEndingTime] = useState(new Date());
  const [showEndingTimePicker, setShowEndingTimePicker] = useState(false);

  const [county, setCounty] = useState('');
  const [subcounty, setSubcounty] = useState('');
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

   //State for GPS coordinate
    const [gpsCoordinate, setGPSCoordinate] = useState({
      latitude: -0.0236, // Default Latitude if location fails
      longitude: 37.9062, // Default Longitude if location fails
      latitudeDelta: 6,
      longitudeDelta: 6,
    });

   // State for individual field errors
   const [longitudeError, setLongitudeError] = useState('');
   const [latitudeError, setLatitudeError] = useState('');
   const [titleError, setTitleError] = useState('');
   const [courseError, setCourseError] = useState('');
   const [explanationError, setExplanationError] = useState('');
   const [countyError, setCountyError] = useState('');
   const [subcountyError, setSubcountyError] = useState('');
   const [locationNameError, setLocationNameError] = useState('');


    // Callback to update coordinate state when a new one is provided
  const onRegionChange = useCallback((newCoordinate) => {
      setCoordinate(newCoordinate);
      setLatitude(newCoordinate.latitude.toString());
      setLongitude(newCoordinate.longitude.toString());
    }, []);

  useEffect(() => {
    // Function to get the location
    const getGPSLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
        if (location?.coords) {
          const { latitude, longitude } = location.coords;
          setGPSCoordinate({ latitude, longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
          setCoordinate({ latitude, longitude });
          setLatitude(String(latitude));
          setLongitude(String(longitude));
        }
    };
    getGPSLocation();
  }, []);

  const handleAddProtest = async () => {
    // Clear all errors
    setError('');
    setLongitudeError('');
    setLatitudeError('');
    setTitleError('');
    setCourseError('');
    setExplanationError('');
    setCountyError('');
    setSubcountyError('');
    setLocationNameError('');

    // Basic validation checks
    let hasErrors = false;
    if (!longitude.trim()) {
      setLongitudeError('Longitude is required.');
      hasErrors = true;
    }
    if (!latitude.trim()) {
      setLatitudeError('Latitude is required.');
      hasErrors = true;
    }
    if (!title.trim()) {
      setTitleError('Title is required.');
      hasErrors = true;
    }
    if (!course.trim()) {
      setCourseError('Course is required.');
      hasErrors = true;
    }
    if (!explanation.trim()) {
      setExplanationError('Explanation is required.');
      hasErrors = true;
    }
    if (!county.trim()) {
      setCountyError('County is required.');
      hasErrors = true;
    }
    if (!subcounty.trim()) {
      setSubcountyError('Subcounty is required.');
      hasErrors = true;
    }
    if (!locationName.trim()) {
      setLocationNameError('Location Name is required.');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }


    setLoading(true);

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedStartingTime = format(startingTime, 'HH:mm:ss');
      const formattedEndingTime = format(endingTime, 'HH:mm:ss');

      const response = await axiosInstance.post('/protests', {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        title: title,
        course: course,
        explanation: explanation,
        date: formattedDate,
        starting_time: formattedStartingTime,
        ending_time: formattedEndingTime,
        county: county,
        subcounty: subcounty,
        location_name: locationName,
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Protest added successfully!',[
            {
              text: "OK",
              onPress: () => navigation.goBack(), // Go back to the previous screen
            },
          ]);
      } else {
        setError('Failed to add protest. Please try again.');
      }
    } catch (e) {
      console.error('Add protest error:', e);
      if (e.response && e.response.data) {
        setError(e.response.data.detail || 'An error occurred.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Close the picker on iOS
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeStartingTime = (event, selectedTime) => {
    setShowStartingTimePicker(Platform.OS === 'ios'); // Close the picker on iOS
    if (selectedTime) {
      setStartingTime(selectedTime);
    }
  };

   const onChangeEndingTime = (event, selectedTime) => {
    setShowEndingTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndingTime(selectedTime);
    }
  };
   const toggleMapSize = () => {
    Animated.timing(mapHeight, {
      toValue: isMapExpanded ? 200 : height * 0.5, // Adjust the expanded height as needed
      duration: 300, // Adjust duration
      easing: Easing.ease,
      useNativeDriver: false, // Required for height animation
    }).start();
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Add Protest</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Collapsible Map Component */}
        <TouchableOpacity style={styles.toggleButton} onPress={toggleMapSize}>
          <Text>{isMapExpanded ? 'Collapse Map' : 'Expand Map'}</Text>
        </TouchableOpacity>
        <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                 latitude: gpsCoordinate.latitude, // Start with GPS coordinates
                 longitude: gpsCoordinate.longitude,
                 latitudeDelta: 0.0922,
                 longitudeDelta: 0.0421,
              }}
              region={{
                 latitude: coordinate.latitude,
                 longitude: coordinate.longitude,
                 latitudeDelta: 0.0922,
                 longitudeDelta: 0.0421,
              }}
               onRegionChangeComplete={onRegionChange}  // Only update the `coordinate` state on drag release
            >
              <Marker
                 coordinate={coordinate}
                 draggable
               />
            </MapView>
        </Animated.View>

        {/* Coordinate Display */}
        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Longitude"
            keyboardType="numeric"
            value={longitude}
            onChangeText={setLongitude}
            onBlur={() => !longitude.trim() ? setLongitudeError('Longitude is required.') : setLongitudeError('')}
          />
        </View>
        {longitudeError ? <Text style={styles.fieldErrorText}>{longitudeError}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Latitude"
            keyboardType="numeric"
            value={latitude}
            onChangeText={setLatitude}
            onBlur={() => !latitude.trim() ? setLatitudeError('Latitude is required.') : setLatitudeError('')}
          />
        </View>
         {latitudeError ? <Text style={styles.fieldErrorText}>{latitudeError}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="text-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            onBlur={() => !title.trim() ? setTitleError('Title is required.') : setTitleError('')}
          />
        </View>
         {titleError ? <Text style={styles.fieldErrorText}>{titleError}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="flag-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Course"
            value={course}
            onChangeText={setCourse}
            onBlur={() => !course.trim() ? setCourseError('Course is required.') : setCourseError('')}
          />
        </View>
         {courseError ? <Text style={styles.fieldErrorText}>{courseError}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="document-text-outline" size={24} color="#aaa" style={{marginRight: 10}} />
          <TextInput
            style={styles.textArea}
            placeholder="Explanation"
            multiline={true}
            numberOfLines={4}
            value={explanation}
            onChangeText={setExplanation}
            onBlur={() => !explanation.trim() ? setExplanationError('Explanation is required.') : setExplanationError('')}
          />
        </View>
         {explanationError ? <Text style={styles.fieldErrorText}>{explanationError}</Text> : null}

        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>
              Date: {format(date, 'MMM dd, yyyy')}
            </Text>
          </TouchableOpacity>
           {showDatePicker && (
            <DateTimePicker
              testID="datePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeDate}
            />
          )}
        </View>

         <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartingTimePicker(true)}>
            <Text style={styles.dateText}>
              Starting Time: {format(startingTime, 'h:mm a')}
            </Text>
          </TouchableOpacity>
           {showStartingTimePicker && (
            <DateTimePicker
              testID="startingTimePicker"
              value={startingTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onChangeStartingTime}
            />
          )}
        </View>

        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndingTimePicker(true)}>
            <Text style={styles.dateText}>
              Ending Time: {format(endingTime, 'h:mm a')}
            </Text>
          </TouchableOpacity>
           {showEndingTimePicker && (
            <DateTimePicker
              testID="endingTimePicker"
              value={endingTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onChangeEndingTime}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="map-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="County"
            value={county}
            onChangeText={setCounty}
            onBlur={() => !county.trim() ? setCountyError('County is required.') : setCountyError('')}
          />
        </View>
         {countyError ? <Text style={styles.fieldErrorText}>{countyError}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="map-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Subcounty"
            value={subcounty}
            onChangeText={setSubcounty}
             onBlur={() => !subcounty.trim() ? setSubcountyError('Subcounty is required.') : setSubcountyError('')}
          />
        </View>
         {subcountyError ? <Text style={styles.fieldErrorText}>{subcountyError}</Text> : null}

        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={24} color="#aaa" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Location Name"
            value={locationName}
            onChangeText={setLocationName}
             onBlur={() => !locationName.trim() ? setLocationNameError('Location Name is required.') : setLocationNameError('')}
          />
        </View>
        {locationNameError ? <Text style={styles.fieldErrorText}>{locationNameError}</Text> : null}


        <TouchableOpacity style={styles.addButton} onPress={handleAddProtest} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Protest</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
   textArea: {
    flex: 1,
    height: 100,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',  //For Android to align text from top
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5733',
    marginBottom: 10,
    textAlign: 'center',
  },
   fieldErrorText: {
    color: '#FF5733',
    marginBottom: 5,
    textAlign: 'left',
    width: '100%'
  },
   mapContainer: {
    width: '100%',
    height: 200, // Default height
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    width: '100%',
    height: '100%',
  },
   toggleButton: {
    backgroundColor: '#ddd', // Style
    paddingVertical: 5,
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#333',
    fontSize: 14,
  },
});

export default AddProtestScreen;