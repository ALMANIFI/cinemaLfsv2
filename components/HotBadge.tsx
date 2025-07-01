import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface HotBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

export default function HotBadge({ size = 'medium', style }: HotBadgeProps) {
  return (
    <View style={[
      styles.badge,
      size === 'small' ? styles.badgeSmall : 
      size === 'large' ? styles.badgeLarge : styles.badgeMedium,
      style
    ]}>
      <ThemedText style={[
        styles.text,
        size === 'small' ? styles.textSmall : 
        size === 'large' ? styles.textLarge : styles.textMedium
      ]}>
        🔥 Selling Fast
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});
