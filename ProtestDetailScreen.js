import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import axiosInstance from './axiosService';

const { width } = Dimensions.get('window');

const ProtestDetailsScreen = () => {
  const route = useRoute();
  const { protestId } = route.params;
  const navigation = useNavigation();

  const [protest, setProtest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getNatureColors = (nature) => {
    if (nature == 'Calm') {
      return 'green';
    } else if (nature == 'Violent') {
      return 'red';
    } else if (nature == 'Noisy but Non-Violent') {
      return 'yellow';
    } else if (nature == 'Theft and bulglary') {
      return 'purple';
    } else if (nature == 'Authorities violent') {
      return 'orange';
    }
    return 'black';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'verified':
        return 'blue';
      case 'not_verified':
        return 'gray';
      case 'flagged':
        return 'red';
      default:
        return 'black';
    }
  };

  const fetchProtestDetails = useCallback(async () => {
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  }, [protestId]);

  const fetchProtestImages = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/protest_images?protest_id=${protestId}`);
      if (response.status === 200) {
        setImages(response.data);
      } else {
        setError('Failed to load protest images.');
      }
    } catch (e) {
      console.error('Error fetching protest images:', e);
      setError('An error occurred while fetching protest images.');
    }
  }, [protestId]);

  useEffect(() => {
    fetchProtestDetails();
    fetchProtestImages();
  }, [fetchProtestDetails, fetchProtestImages]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProtestDetails();
    fetchProtestImages();
    setRefreshing(false);
  }, [fetchProtestDetails, fetchProtestImages]);

  const renderProtestNature = (nature) => {
    if (nature) {
      return `Nature: ${nature}`;
    } else {
      return "Protest nature not determined";
    }
  };

  const renderImageItem = ({ item }) => (
    <TouchableOpacity onPress={() => {
      setSelectedImage(item);
      setModalVisible(true);
    }}>
      <Image source={{ uri: item.image_url }} style={styles.imageItem} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B5998" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!protest) {
    return (
      <View style={styles.errorContainer}>
        <Text>Protest not found.</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View> */}
        {/* <Text style={styles.modalHeading}>Nature:</Text> */}
        <Text style={styles.modalTitle}>{protest.title}</Text>
        {images?
            <FlatList
               data={images}
               renderItem={renderImageItem}
               keyExtractor={(item) => item.id.toString()}
               horizontal={true}
               showsHorizontalScrollIndicator={false}
               style={styles.imageList}
               contentContainerStyle={{marginBottom: 10}}
             />
             :
             <View style={styles.protestCard}>
             <Ionicons name="megaphone-outline" size={44} color="white" />
           </View>
        }
 
        <Text style={[styles.modalText, { backgroundColor: getNatureColors(protest?.nature), textAlign: 'center' }]}>
          {renderProtestNature(protest.nature)}
        </Text>
        <Text style={styles.modalHeading}>Description:</Text>
        <Text style={styles.modalText}>{protest.explanation}</Text>

        <Text style={styles.modalHeading}>Location:</Text>
        <Text style={styles.modalText}>
          {protest.location_name}, {protest.county}, {protest.subcounty}
        </Text>

        <Text style={styles.modalHeading}>Date:</Text>
        <Text style={styles.modalText}>{protest.date}</Text>

        <Text style={styles.modalHeading}>Time:</Text>
        <Text style={styles.modalText}>
          {protest.starting_time} - {protest.ending_time}
        </Text>


        {/* <Text style={styles.modalHeading}>Images:</Text> */}
 

        {/* Image Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close-circle" size={30} color="#fff" />
              </TouchableOpacity>

              {selectedImage && (
                <>
                  <Image source={{ uri: selectedImage.image_url }} style={styles.modalImage} />
                  <Text style={styles.modalImageDescription}>{selectedImage.description}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedImage.status) }]}>
                    <Text style={styles.statusText}>{selectedImage.status}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scrollView: {
    flex: 1, 
  },
  scrollContentContainer: {
    paddingBottom: 50, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: '#3B5998',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  modalTitle: {
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "bold",
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
  protestImage: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
  },
  protestCard: {
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
  imageList: {
    marginTop: 10,
  },
  imageItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: width * 0.8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  modalImage: {
    width: width * 0.7,
    height: 250,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalImageDescription: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProtestDetailsScreen;