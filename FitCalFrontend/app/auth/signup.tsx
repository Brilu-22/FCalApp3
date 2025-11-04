// FitzFrontend/app/signup.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colours';
import { auth, db } from '../../firebaseConfig'; // Import Firebase auth and db
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import firestore functions
import { router } from 'expo-router'; // For navigation

export default function SignUpScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      if (!email || !password || !name) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with name
      if (user) {
        await updateProfile(user, { displayName: name });

        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: email,
          createdAt: new Date().toISOString(),
          profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A020F0&color=FFFFFF&size=100`, // Default avatar
          targetWeight: null, // From your second file's logic
          currentWeight: null, // From your second file's logic
        });
      }

      Alert.alert('Success', 'Account created! Please log in.');
      router.replace('./login'); // Redirect to login after successful signup
    } catch (error: any) {
      console.error("Sign up error:", error);
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={Colors.secondaryText}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
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

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('./login')}>
          <Text style={styles.switchText}>Already have an account? Log In</Text>
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