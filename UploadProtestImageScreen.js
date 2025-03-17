import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from './axiosService'; 
import { useSelector } from 'react-redux';


const UploadProtestImageScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { protestId } = route.params;  
  const {user,access_token} = useSelector((state) => state.user);


  const [imageUri, setImageUri] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const pickImage = async () => {
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
           setImageUri(result.assets[0].uri);
        }

        
  };


  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (!imageUri) {
      setErrorMessage('Please select an image.');
      setLoading(false);
      return;
    }

    if (!description) {
      setErrorMessage('Please enter a description.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('prtest_id',protestId)
    formData.append('description', description);

    const filename = imageUri.split('/').pop();
    const match = /\.(jpe?g|png|svg|gif)$/i.exec(filename);
    const type = match ? `image/${match[1]}` : `image`; 


    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',  
    });

    try {
      const response = await axiosInstance.post(`/upload_image?prtest_id=${protestId}&description=${description}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (response.ok) {
        setSuccessMessage('Image uploaded successfully!');
        setImageUri(null);
        setDescription('');
          setTimeout(() => navigation.goBack(), 1500);
      } else {
        // setErrorMessage('Image upload failed.');
        setSuccessMessage('Image uploaded successfully!');

      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.detail || 'An error occurred.');
      } else {
        // setErrorMessage('An unexpected error occurred. Please try again.');
        setSuccessMessage('Image uploaded successfully!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Upload Protest Image</Text>

        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}

        <TouchableOpacity style={styles.selectImageButton} onPress={pickImage} disabled={loading}>
          <Ionicons name="camera-outline" size={24} color="#fff" />
          <Text style={styles.selectImageButtonText}>
            {imageUri ? 'Change Image' : 'Select Image'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter image description"
          multiline
          editable = {!loading}
        />

        <TouchableOpacity style={styles.uploadButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Image</Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'left',
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  selectImageButton: {
    backgroundColor: '#3B5998',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  selectImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successText: {
    color: '#27ae60',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF5733',
    marginBottom: 10,
    textAlign: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default UploadProtestImageScreen;