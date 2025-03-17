import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  PermissionsAndroid,
  Platform,
  RefreshControl, 
  Image
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; //Import useFocusEffect
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from './axiosService';
import * as ImagePicker from 'expo-image-picker'; // For camera access
import * as BackgroundFetch from 'expo-background-fetch'; // For background location tracking
import * as TaskManager from 'expo-task-manager'; // For background tasks
import { format } from 'date-fns'; // For date formatting
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

// Define Background Task for Location Updates
const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Error in background location task:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const userId = store.getState().user.id;  
    const accessToken = store.getState().user.access_token;  

    if (userId && accessToken) {
      try {
        await axiosInstance.post('/direction_mapping', {
          longitude: locations[0].coords.longitude,
          latitude: locations[0].coords.latitude,
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm:ss'),
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Background location sent successfully');
      } catch (e) {
        console.error('Error sending background location:', e);
      }
    }
  }
});

const ProtestMapScreen = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state.user);  
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [protests, setProtests] = useState([]);
  const [selectedProtest, setSelectedProtest] = useState(null); 
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 

  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false);


  const kenyaRegion = {  //Focus on Kenya
    latitude: -0.0236,
    longitude: 37.9062,
    latitudeDelta: 6,
    longitudeDelta: 6,
  };

  // Protest Nature Color Mapping
  const natureColors = {
    calm: 'green',
    violent: 'red',
    noisy_but_non_violent: 'yellow',
    theft_and_bulglary: 'purple',
    authorities_violent: 'orange',
  };
  const getNatureColors = (nature) => {
    if(nature == 'Calm'){
      return 'green'
    }
    else if(nature == 'Violent'){
      return'red'
    }
    else if(nature == 'Noisy but Non-Violent'){
      return 'yellow'
    }
    else if(nature == 'Theft and bulglary'){
      return 'purple'
    }
    else if(nature == 'Authorities violent'){
      return 'orange'
    }
    return 'black'
  }

  const handleMapLongPress = (e) => {
    if (!user.access_token) {
       Alert.alert(
          "Login Required",
          "You need to be logged in to add a protest. Please log in or create an account.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );

      return;
    }

    const { latitude, longitude } = e.nativeEvent.coordinate;
    navigation.navigate('AddProtest', {
      initialLatitude: latitude,
      initialLongitude: longitude,
    });
  };

   const handleUpdateProtestStatus = () => {
    if (selectedProtest) {
      navigation.navigate('UpdateProtestStatus', { protestId: selectedProtest.id });
      setSelectedProtest(null); // Close bottom sheet
    }
  };

  const handleUploadImages = async () => {
    if (!selectedProtest) return;

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Handle uploading the image and description (you'll need to implement this)
      navigation.navigate('UploadProtestImages', { protestId: selectedProtest.id, imageUri: result.assets[0].uri }); //pass data to the upload page
      setSelectedProtest(null); // Close bottom sheet

    }
  };

  const startBackgroundLocationTracking = async () => {
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      setErrorMsg('Background location permission was denied');
      return;
    }

    // Check if the location services are enabled on the device.
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      setErrorMsg(
        'Location services are disabled on your device. Please enable them to use this feature.'
      );
      return;
    }


     if (Platform.OS === 'android') {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: "Background location permission",
          message:
            "We need access to your location to map your directions" +
            "so you can go back to the route any time.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
    }


    const isTaskRegistered = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskRegistered) {
       TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
         if (error) {
           console.error('Error in background location task:', error);
           return;
         }
         if (data) {
           const { locations } = data;
           const userId = store.getState().user.id; 
           const accessToken = store.getState().user.access_token;  

           if (userId && accessToken) {
             try {
               await axiosInstance.post('/direction_mapping', {
                 longitude: locations[0].coords.longitude,
                 latitude: locations[0].coords.latitude,
                 date: format(new Date(), 'yyyy-MM-dd'),
                 time: format(new Date(), 'HH:mm:ss'),
               }, {
                 headers: {
                   Authorization: `Bearer ${accessToken}`,
                   'Content-Type': 'application/json',
                 },
               });
               console.log('Background location sent successfully');
             } catch (e) {
               console.error('Error sending background location:', e);
             }
           }
         }
       });
     }


    await BackgroundFetch.registerTaskAsync(LOCATION_TASK_NAME, {
      minimumInterval: 2 * 60, 
      stopOnTerminate: false, 
      startOnBoot: true,
    });
    setIsTrackingLocation(true);
  };

  const stopBackgroundLocationTracking = async () => {
    if (await BackgroundFetch.isTaskRegisteredAsync(LOCATION_TASK_NAME)) {
      await BackgroundFetch.unregisterTaskAsync(LOCATION_TASK_NAME);
      setIsTrackingLocation(false);
    }
  };

  useEffect(() => {
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

  const fetchProtests = async () => {
    setRefreshing(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd'); 
      const response = await axiosInstance.get(`/protests?date=${formattedDate}`);
      if (response.status === 200) {
        setProtests(response.data);
      }
    } catch (error) {
      console.error('Error fetching protests:', error);
      setErrorMsg('Failed to load protests.');
    } finally {
      setRefreshing(false); 
    }
  };

  useEffect(() => {
    fetchProtests();
     const intervalId = setInterval(() => {
       fetchProtests();
    }, 10000);
     return () => clearInterval(intervalId);
  },[selectedDate]);

  useFocusEffect(
    React.useCallback(() => {
     
      fetchProtests();
    }, [])
  );

  const handleProtestPress = (protest) => {
    setSelectedProtest(protest);
  };

  let region = kenyaRegion;  
  if (location) {
    region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 6,
      longitudeDelta: 6,
    };
  }

  const openProtestDetails = (id) => {
    if (selectedProtest) {
      navigation.navigate('openProtestDetails', { protestId: id });
      setSelectedProtest(null);  // Close bottom sheet
    }
  };

  const renderProtestNature = (nature) => {
    if (nature) {
      return `Nature: ${nature}`;
    } else {
      return "Protest nature not determined";
    }
  };

    const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProtests(); // Fetch updated data
  }, []);

    const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleOpenTracker  = (id) => {
    setSelectedProtest(null)
    navigation.navigate('TrackProtestScreen',{protestId: id});
  }

  const handleOpenMapping  = (id) => {
    setSelectedProtest(null)
    navigation.navigate('ProtestMappingScreen',{protestId: id});
  }

  return (
    <View style={styles.container}>
         {/* Date Selection at the Top */}
      <View style={styles.dateSelection}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>
            {format(selectedDate, 'MMM dd, yyyy')}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="datePicker"
            value={selectedDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChangeDate}
          />
        )}
      </View>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={kenyaRegion}
        region = {region} 
        onLongPress={handleMapLongPress}
        showsUserLocation={true}
        onLayout={() => setMapLoaded(true)} 
          refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B5998" 
          />
        }
      >
        {protests.map((protest) => (
          <Marker
            key={protest.id}
            coordinate={{ latitude: protest.latitude, longitude: protest.longitude }}
            onPress={() => handleProtestPress(protest)}
          >
            <View style={[
              styles.protestCircle,
              { backgroundColor: protest.nature ? getNatureColors(protest?.nature) || 'gray' : 'skyblue' },
            ]}>
               <Ionicons
                name="megaphone-outline"  
                size={16}
                color="white"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRefresh}
          // disabled={!selectedProtest}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.actionButton}
          onPress={handleUploadImages}
          disabled={!selectedProtest}
        >
          <Ionicons name="camera-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Upload Images</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={isTrackingLocation ? stopBackgroundLocationTracking : startBackgroundLocationTracking}
          disabled={!user.access_token}
        >
          <Ionicons name={isTrackingLocation ? "pause-circle-outline" : "navigate-outline"} size={24} color="#fff" />
          <Text style={styles.actionButtonText}>{isTrackingLocation ? "Stop Tracking" : "Map My Protest"}</Text>
        </TouchableOpacity> */}
      </View>


      {/* Bottom Sheet - Protest Info */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedProtest !== null}
        onRequestClose={() => setSelectedProtest(null)}
      >
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheet}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedProtest(null)}>
              <Ionicons name="close-circle" size={30} color="#888" />
            </TouchableOpacity>

             <ScrollView style={styles.modalScrollView}>
                <Text style={styles.modalTitle}>{selectedProtest?.title}</Text>

                {/* {selectedProtest?.images.length>0 ?<Image
                  style={styles.protestImage}
                  source={{ uri: selectedProtest?.images && selectedProtest.images.length > 0 ? selectedProtest.images[0].image_url : 'https://via.placeholder.com/400' }}
                />
                : */}
                <View style={styles.protestCard} >
                    <Ionicons name='megaphone-outline' size={44} color="white"/>
                </View>

                <View style={styles.protestBtns}>
                  <TouchableOpacity style={styles.Protestbutton} onPress={()=>navigation.push('updateStatus',{protestId: selectedProtest?.id})}>
                      <View style={styles.protestBtnCircle}>
                         <Ionicons name="information-circle-outline" size={24} color="#12121d" />
                      </View>
                      <Text style={styles.protestbuttonText}>update status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.Protestbutton} onPress={()=>navigation.push('updateProtestImages',{protestId:selectedProtest?.id})} >
                      <View style={styles.protestBtnCircle}>
                         <Ionicons name="camera-outline" size={24} color="#12121d" />
                      </View>
                      <Text style={styles.protestbuttonText}>upload image</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.Protestbutton} onPress={()=>handleOpenTracker(selectedProtest?.id)} >
                      <View style={styles.protestBtnCircle}>
                         <Ionicons name="navigate-outline" size={24} color="#12121d" />
                      </View>
                      <Text style={styles.protestbuttonText}>track me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.Protestbutton} onPress={()=>handleOpenMapping(selectedProtest?.id)} >
                      <View style={styles.protestBtnCircle}>
                         <Ionicons name="map" size={24} color="#12121d" />
                      </View>
                      <Text style={styles.protestbuttonText}>direction</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalText,{backgroundColor:getNatureColors(selectedProtest?.nature),textAlign:'center'}]}>
                 {renderProtestNature(selectedProtest?.nature)}
                </Text>
                <Text style={styles.modalHeading}>Description:</Text>
                <Text style={styles.modalText}>{selectedProtest?.explanation}</Text>

                <Text style={styles.modalHeading}>Location:</Text>
                <Text style={styles.modalText}>
                  {selectedProtest?.location_name}, {selectedProtest?.county}, {selectedProtest?.subcounty}
                </Text>

                <Text style={styles.modalHeading}>Date:</Text>
                <Text style={styles.modalText}>{selectedProtest?.date}</Text>

                <Text style={styles.modalHeading}>Time:</Text>
                <Text style={styles.modalText}>
                  {selectedProtest?.starting_time} - {selectedProtest?.ending_time}
                </Text>
              </ScrollView>

             <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={()=>openProtestDetails(selectedProtest?.id)}
              >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
       {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  protestCircle: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%', 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold"
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'left',
    width: '100%',
  },
  modalText: {
    marginBottom: 5,
    textAlign: "left",
    fontSize: 15,
    padding: 5,
    borderRadius: 20,
  },
  modalScrollView: {
    width: '100%',
  },
   button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
   actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(59, 89, 152, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',  
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: height * 0.6,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
    protestImage: {
    width: '100%',
    height: 200, 
    marginBottom: 10,
    borderRadius: 8, 
  },
  protestCard:{
    width: '100%',
    height: 100, 
    backgroundColor: 'tomato',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5733',
    marginBottom: 10,
    textAlign: 'center',
  },
  protestBtns:{
    flexDirection: 'row', 
    justifyContent:'space-around', 
    marginBottom: 20,
    marginTop: 20,
  },
  Protestbutton: {
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  protestBtnCircle: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#e0e0e0', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8, 
  },
  protestbuttonText: {
    fontSize: 14, 
    color: '#12121d', 
    textAlign: 'center', 
  },
   dateSelection: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B5998',
  },
});

export default ProtestMapScreen;