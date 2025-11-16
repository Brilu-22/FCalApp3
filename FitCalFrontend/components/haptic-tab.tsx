import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

// Simple version without navigation types
export function HapticTab(props: TouchableOpacityProps) {
  return <TouchableOpacity {...props} />;
}