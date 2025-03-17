
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';  
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View, Button } from 'react-native';  
import { Ionicons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; 
import { store, persistor } from './store';
import LoginScreen from './LoginScreen';
import CreateAccountScreen from './CreateAccountScreen';
import ProfileScreen from './ProfileScreen';
import AddProtestScreen from './AddProtestScreen';
import ProtestMapScreen from './MapScreen';
import ExploreScreen from './ExploreScreen';
import UpdateProtestStatusScreen from './UpdateProtestStatusScreen';
import ProtestDetailsScreen from './ProtestDetailScreen';
import UploadProtestImageScreen from './UploadProtestImageScreen';
import TrackProtestScreen from './TrackProtestScreen';
import ProtestMappingScreen from './ProtestMapping';
import SplashScreen from './SplashScreen';

const Stack = createStackNavigator(); 


const Tab = createBottomTabNavigator();


function HomeScreen({ navigation }) {
  return (
    <View style={styles.center}>
      <Text>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details')} 
      />
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.center}>
      <Text>Settings Screen</Text>
    </View>
  );
}

function DetailsScreen() {
  return (
    <View style={styles.center}>
      <Text>Details Screen</Text>
    </View>
  );
}

function TabNavigator() {
  return (
<Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;

      if (route.name === 'Map') {
        iconName = focused ? 'map' : 'map-outline'; 
      } else if (route.name === 'Explore') {
        iconName = focused ? 'compass' : 'compass-outline'; 
      } else if (route.name === 'Profile') {
        iconName = focused ? 'person' : 'person-outline'; 
      }

      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#ff6347', 
    tabBarInactiveTintColor: 'gray', 
    headerShown: false, 
  })}
>
  <Tab.Screen name="Map" component={ProtestMapScreen} />
  <Tab.Screen name="Explore" component={ExploreScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <NavigationContainer>
      <Stack.Navigator initialRouteName='splash'>
           <Stack.Screen
              name="Tabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateAccount"
              component={CreateAccountScreen}
              options={{ headerShown: false }}
            />
           <Stack.Screen
              name="addProtest"
              component={AddProtestScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="updateStatus"
              component={UpdateProtestStatusScreen}
              options={{ headerShown: false }}
            />
             <Stack.Screen name="openProtestDetails" component={ProtestDetailsScreen} />
             <Stack.Screen name="updateProtestImages" component={UploadProtestImageScreen} />
             <Stack.Screen name="TrackProtestScreen" component={TrackProtestScreen} />
             <Stack.Screen name="ProtestMappingScreen" component={ProtestMappingScreen} />
             <Stack.Screen name="splash" component={SplashScreen} options={{ headerShown: false }}/>
             
        </Stack.Navigator>
      </NavigationContainer>
    </PersistGate>
  </Provider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});