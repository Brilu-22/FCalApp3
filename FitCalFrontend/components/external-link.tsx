import { openBrowserAsync } from 'expo-web-browser';
import { Text, TouchableOpacity, type TextProps } from 'react-native';

interface ExternalLinkProps extends TextProps {
  href: string;
}

export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  return (
    <TouchableOpacity
      onPress={() => openBrowserAsync(href)}
    >
      <Text {...rest}>{children}</Text>
    </TouchableOpacity>
  );
}