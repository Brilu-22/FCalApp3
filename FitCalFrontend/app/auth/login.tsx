// FitzFrontend/app/login.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colours';
import { auth } from '../../firebaseConfig'; // Import Firebase auth
import { signInWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router'; // For navigation

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password.');
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      // Firebase auth state listener in _layout.tsx will handle navigation for persistent login
      Alert.alert('Success', 'Logged in successfully!');
      router.replace('/(tabs)'); // Redirect to home tabs after successful login
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.secondaryText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.secondaryText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth/signup'as any)}>
          <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: Colors.accent,
    marginTop: 20,
    fontSize: 16,
  },
});