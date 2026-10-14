import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme/colors';
import { Icon } from '../ui/Icon';

const heroImage = require('../../assets/welcome_food_hero.png');

export function OwnerAuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return <View style={styles.screen}>
    <Image source={heroImage} resizeMode="cover" style={[styles.hero, { width, height: width * 1.3, top: -width * 0.45 }]} accessibilityIgnoresInvertColors />
    <View pointerEvents="none" style={styles.fade}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="authFadeSide" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </LinearGradient>
          <LinearGradient id="authFadeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#authFadeSide)" />
        <Rect width="100%" height="100%" fill="url(#authFadeBottom)" />
      </Svg>
    </View>
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 }]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
            <Icon name="back" size={23} color={colors.accent} />
          </Pressable>
          <View style={styles.wordmark}>
            <Svg width={30} height={29} viewBox="0 0 64 62">
              <Path d="M14 42C7 39 4 34 4 27c0-10 9-17 19-16 3-7 10-11 18-10 8 1 13 6 15 13 6 2 9 7 9 14 0 7-4 12-10 15M15 42v10m40-10v10M22 58h27" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="27" cy="40" r="2.5" fill={colors.accent} /><Circle cx="42" cy="40" r="2.5" fill={colors.accent} />
            </Svg>
            <Text style={styles.brand}>ServeFlow</Text>
          </View>
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </View>
    </KeyboardAwareScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { position: 'absolute', left: 0 },
  fade: { position: 'absolute', left: 0, right: 0, top: 0, height: 280 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 540, paddingHorizontal: 24 },
  topRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDF8F5', alignItems: 'center', justifyContent: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { color: '#082B2A', fontSize: 21, fontWeight: '800', letterSpacing: -0.8 },
  heading: { paddingTop: 30, paddingBottom: 22, gap: 8 },
  title: { color: '#082B2A', fontSize: 31, lineHeight: 37, fontWeight: '800', letterSpacing: -0.9 },
  subtitle: { color: '#758590', fontSize: 16, lineHeight: 23 },
});
