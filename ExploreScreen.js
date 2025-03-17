import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,  // Import RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from './axiosService';
import { useNavigation } from '@react-navigation/native';
import { format, subDays, addDays, isToday, isTomorrow, isYesterday } from 'date-fns';  // date-fns

const ExploreScreen = () => {
  const navigation = useNavigation();
  const [protestsToday, setProtestsToday] = useState([]);
  const [protestsTomorrow, setProtestsTomorrow] = useState([]);
  const [protestsYesterday, setProtestsYesterday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state

  useEffect(() => {
    fetchProtests();
  }, []);

  const fetchProtests = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const todayFormatted = format(today, 'yyyy-MM-dd');
      const tomorrowFormatted = format(addDays(today, 1), 'yyyy-MM-dd');
      const yesterdayFormatted = format(subDays(today, 1), 'yyyy-MM-dd');

      const [todayResponse, tomorrowResponse, yesterdayResponse] = await Promise.all([
        axiosInstance.get(`/protests?date=${todayFormatted}`),
        axiosInstance.get(`/protests?date=${tomorrowFormatted}`),
        axiosInstance.get(`/protests?date=${yesterdayFormatted}`),
      ]);

      if (todayResponse.status === 200) {
        setProtestsToday(todayResponse.data);
      }
      if (tomorrowResponse.status === 200) {
        setProtestsTomorrow(tomorrowResponse.data);
      }
      if (yesterdayResponse.status === 200) {
        setProtestsYesterday(yesterdayResponse.data);
      }
    } catch (e) {
      console.error('Error fetching protests:', e);
      setError('An error occurred while loading protests.');
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop refreshing after data is fetched
    }
  };

  const navigateToDetails = (protestId) => {
    navigation.navigate('openProtestDetails', { protestId: protestId });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigateToDetails(item.id)}>
      {item.images.length > 0 ? (
        <Image
          style={styles.cardImage}
          source={{ uri: item.images[0].image_url }}
        />
      ) : (
        <View style={styles.insteadCard}>
          <Ionicons name="megaphone-outline" size={44} color="white" />
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardText}>{item.explanation}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardLocation}>{item.location_name}, {item.county}</Text>
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title, data) => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data && data.length>0 ?(
           <FlatList
             data={data}
             renderItem={renderItem}
             keyExtractor={(item) => item.id.toString()}
             horizontal // Make it horizontal
             showsHorizontalScrollIndicator={false} // Hide scroll indicator
           />
        ):
        <Text>No protests in this day</Text>}
      </View>
    );
  };

    const onRefresh = useCallback(() => {  // useCallback
        setRefreshing(true);
        fetchProtests();
    }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5998" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.push('addProtest')}>
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={  // Add RefreshControl
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B5998"  // Customize the loading indicator color
          />
        }
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#3B5998" />
        ) : (
          <>
            {renderSection("Protests Today", protestsToday)}
            {renderSection("Protests Tomorrow", protestsTomorrow)}
            {renderSection("Protests Yesterday", protestsYesterday)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    backgroundColor: '#3B5998',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 10,
  },
  addButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 50,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 999,
  },
  errorText: {
    color: '#FF5733',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    width: 200, // Fixed card width
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  insteadCard: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'tomato',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 10,
    color: '#777',
  },
  cardDate: {
    fontSize: 10,
    color: '#777',
  },
});

export default ExploreScreen;