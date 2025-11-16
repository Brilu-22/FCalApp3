// app/debug.tsx - TEMPORARY TEST FILE
import { View, Text, StyleSheet } from 'react-native';

export default function DebugScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🚀 App is working!</Text>
      <Text style={styles.subtext}>If you can see this, routing works</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
  },
  text: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
  },
});