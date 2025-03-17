import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setUser } from './userSlice'; 
import axiosInstance from './axiosService'; 

const { width, height } = Dimensions.get('window'); 

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Animation values
  const logoScale = useState(new Animated.Value(0))[0];
  const inputTranslateY = useState(new Animated.Value(50))[0];
  const buttonOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Sequential animations
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(inputTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError(''); // Clear previous errors
    setLoading(true);

    try {
      const response = await axiosInstance.post('/login', {
        email: email,
        password: password,
      });

      if (response.status === 200) {
        const { access_token, refresh_token, email: userEmail } = response.data;
        dispatch(
          setUser({
            access_token: access_token,
            refresh_token: refresh_token,
            email: userEmail,
            longitude: null, 
            latitude: null,
          })
        );

        
        navigation.navigate('Tabs');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (e) {
      console.error('Login error:', e);
      if (e.response && e.response.data && e.response.data.detail) {
        setError(e.response.data.detail); 
      } else {
        setError('An unexpected error occurred. Please try again.');
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
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          <Ionicons name="map" size={80} color="#fff" />
          <Text style={styles.logoText}>ProtestApp</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: inputTranslateY }] }}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={24} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: buttonOpacity,width:'100%' }}>
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'tomato', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400, 
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#3B5998', 
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5733',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default LoginScreen;