import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 

import SplashImage from './assets/splash.png'; 

const SplashScreen = () => {
  const navigation = useNavigation(); 

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Tabs'); 
    }, 3000);

    return () => clearTimeout(timeout);
  }, []); 

  return (
    <View style={styles.container}>
      <Image source={SplashImage} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'tomato', 
  },
  image: {
    width: 200, 
    height: 200, 
  },
});

export default SplashScreen;