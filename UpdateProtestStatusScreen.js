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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { useSelector } from 'react-redux'; 
import axiosInstance from './axiosService';
import { ProtestNatureType } from './constants'; 

const UpdateProtestStatusScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();  
  const { protestId } = route.params; 

  const user = useSelector((state) => state.user);
  const [nature, setNature] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setLoading(true);

    if (!nature) {
      setErrorMessage('Please select a protest nature.');
      setLoading(false);
      return;
    }

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedTime = format(time, 'HH:mm:ss');

      const response = await axiosInstance.post(`/protest_nature?protest_id=${protestId}`, {
        nature: nature,
        date: formattedDate,
        time: formattedTime,
      });

      if (response.status === 201) {
        setSuccessMessage('Protest nature submitted successfully!');
        // Optionally, navigate back or clear the form
        setTimeout(() => navigation.goBack(), 1500); // Go back after 1.5 seconds
      } else {
        setErrorMessage('Failed to submit protest nature.');
      }
    } catch (e) {
      console.error('Error submitting protest nature:', e);
      if (e.response && e.response.data) {
        setErrorMessage(e.response.data.detail || 'An error occurred.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
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

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios'); // Close the picker on iOS
    if (selectedTime) {
      setTime(selectedTime);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Update Protest Status</Text>

        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Text style={styles.label}>Protest Nature:</Text>
        <View style={styles.natureButtonsContainer}>
           {Object.values(ProtestNatureType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.natureButton,
                  nature === type && styles.natureButtonSelected,
                ]}
                onPress={() => setNature(type)}
              >
                <Text style={[
                  styles.natureButtonText,
                  nature === type && styles.natureButtonTextSelected,
                ]}>
                  {type.replace(/_/g, ' ')}  {/* Replace underscores with spaces for display */}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

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
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateText}>
              Time: {format(time, 'h:mm a')}
            </Text>
          </TouchableOpacity>
           {showTimePicker && (
            <DateTimePicker
              testID="timePicker"
              value={time}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onChangeTime}
            />
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
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
   label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  natureButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  natureButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  natureButtonSelected: {
    backgroundColor: '#27ae60',
  },
  natureButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  natureButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#3B5998',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
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
   inputIcon: {
    marginRight: 10,
  },
});

export default UpdateProtestStatusScreen;