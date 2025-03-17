import React, { useState } from 'react';
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
  Modal,  // Import Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from './axiosService'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

const CreateAccountScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');  // New state for email error
  const [passwordError, setPasswordError] = useState(''); // New state for password error
  const [confirmPasswordError, setConfirmPasswordError] = useState(''); // New state for confirm password error

  const [loading, setLoading] = useState(false);

  // Modal visibility state
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const logoScale = useState(new Animated.Value(0))[0];
  const inputTranslateY = useState(new Animated.Value(50))[0];
  const buttonOpacity = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
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

  const handleCreateAccount = async () => {
    // Clear all errors
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Check for empty fields
    let hasErrors = false;
    if (!email.trim()) {
      setEmailError('Email is required.');
      hasErrors = true;
    }
    if (!password.trim()) {
      setPasswordError('Password is required.');
      hasErrors = true;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Confirm Password is required.');
      hasErrors = true;
    }

    if (hasErrors) {
      return;  // Don't proceed if there are empty fields
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/create_account', {
        email: email,
        password: password,
      });

      if (response.status === 201) {
        // Show the success modal instead of an alert
        setModalVisible(true);
      } else {
        setError('Account creation failed.');
      }
    } catch (e) {
      console.error('Create account error:', e);
      if (e.response && e.response.data) {
        setError(e.response.data.detail || 'An error occurred.'); // Display backend validation errors
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
          <Text style={styles.logoText}>Create Account</Text>
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
              onBlur={() => !email.trim() ? setEmailError('Email is required.') : setEmailError('')}
            />
          </View>
          {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              onBlur={() => !password.trim() ? setPasswordError('Password is required.') : setPasswordError('')}

            />
          </View>
          {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => !confirmPassword.trim() ? setConfirmPasswordError('Confirm Password is required.') : setConfirmPasswordError('')}

            />
          </View>
           {confirmPasswordError ? <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text> : null}
        </Animated.View>

        <Animated.View style={{ opacity: buttonOpacity,width:'100%' }}>
          <TouchableOpacity style={styles.button} onPress={handleCreateAccount} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

       {/* Login Suggestion Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Account Created!</Text>
              <Text style={styles.modalText}>Your account has been created successfully. Please log in.</Text>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => {
                  setModalVisible(!modalVisible);
                  navigation.push('Login');
                }}
              >
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    marginBottom: 5,
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
    minWidth: 250,
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
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldErrorText: {
    color: 'white',
    marginBottom: 5,
    marginTop:0,
    textAlign: 'left',
    width: '100%'
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
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
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  }
});

export default CreateAccountScreen;