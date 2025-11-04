// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/*
        DO NOT add Stack.Screen for "login" or "signup" here
        if login.tsx and signup.tsx are direct files in the (auth) directory.
        Expo Router discovers them automatically.

        You can add specific options for them if needed, like this:
        <Stack.Screen name="login" options={{ title: "Log In" }} />
        <Stack.Screen name="signup" options={{ title: "Sign Up" }} />

        But if you just want default behavior (which "headerShown: false" implies),
        you can often leave this section empty.
      */}
    </Stack>
  );
}