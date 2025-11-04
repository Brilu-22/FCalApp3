import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../constants/Colours'; // Import your custom colors

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; // Allows overriding/extending styles
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12, // Rounded corners
    padding: 16,      // Internal spacing
    marginVertical: 8, // Vertical spacing between cards
    marginHorizontal: 16, // Horizontal spacing from screen edges
  },
});

export default Card;