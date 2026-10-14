import { Redirect, router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAuth } from '../store/auth';
import { Icon } from '../ui/Icon';

const ownerImage = require('../../assets/restaurant_owner_illustration.png');
const teamImage = require('../../assets/team_member_illustration.png');
const heroImage = require('../../assets/welcome_food_hero.png');

function RoleCard({ title, description, image, owner, scale, onPress }: { title: string; description: string; image: number; owner?: boolean; scale: number; onPress: () => void }) {
  const imageSize = Math.round((owner ? 136 : 132) * scale);
  const arrowSize = Math.round(38 * scale);

  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${description}`}
    onPress={onPress}
    style={({ pressed }) => [styles.roleCard, owner ? styles.ownerCard : styles.teamCard, { minHeight: Math.round((owner ? 154 : 144) * scale), paddingLeft: Math.round(14 * scale), paddingRight: Math.round(14 * scale), paddingVertical: Math.round(8 * scale), borderRadius: Math.round(13 * scale) }, pressed && styles.pressed]}
  >
    <Image source={image} resizeMode="contain" style={{ width: imageSize, height: imageSize }} accessibilityLabel={`${title} illustration`} />
    <View style={[styles.roleCopy, { paddingLeft: Math.round(16 * scale), paddingRight: Math.round(7 * scale) }]}>
      <Text style={[styles.roleTitle, { fontSize: 18 * scale, lineHeight: 23 * scale }]}>{title}</Text>
      <Text style={[styles.roleDescription, { fontSize: 14.5 * scale, lineHeight: 19 * scale, marginTop: 7 * scale }]}>{description}</Text>
    </View>
    <View style={[styles.arrowCircle, !owner && styles.secondaryArrowCircle, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}>
      <Svg width={25 * scale} height={25 * scale} viewBox="0 0 24 24">
        <Path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke={owner ? '#FFFFFF' : colors.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  </Pressable>;
}

function WaveFooter({ height }: { height: number }) {
  return <View pointerEvents="none" style={[styles.waveFooter, { height }]}><Svg width="100%" height="100%" viewBox="0 0 400 105" preserveAspectRatio="none"><Path d="M0 25 C72 22 83 80 174 72 C258 64 291 4 400 14 L400 105 L0 105 Z" fill="#EDF7F4" /><Path d="M0 40 C76 36 90 90 180 83 C270 76 305 24 400 28" fill="none" stroke="#D3E9E3" strokeWidth="2" /><Path d="M0 49 C70 44 91 99 183 91 C276 84 309 37 400 42" fill="none" stroke="#B8DCD4" strokeWidth="1.2" /></Svg></View>;
}

export default function Entry() {
  const { ready, me } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 440);
  const scale = Math.min(1, contentWidth / 388, (height - insets.top) / 911);
  const size = (value: number) => Math.round(value * scale);
  if (!ready) return <View style={styles.loading} />;
  if (me) return <Redirect href="/(main)" />;
  return <View style={styles.screen}>
    <Image source={heroImage} resizeMode="cover" style={[styles.heroImage, { width, height: width * 1.5, top: -width * 0.3 }]} accessibilityIgnoresInvertColors />
    <View pointerEvents="none" style={[styles.heroFade, { height: size(390) }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="titleFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="82%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="48%" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#titleFade)" />
        <Rect width="100%" height="100%" fill="url(#bottomFade)" />
      </Svg>
    </View>
    <WaveFooter height={size(100)} />
    <View style={[styles.content, { width: contentWidth, paddingTop: insets.top + size(64) }]}>
      <View style={[styles.brandBlock, { paddingTop: size(4), paddingLeft: size(20), paddingBottom: size(33) }]}>
        <Svg width={size(50)} height={size(40)} viewBox="0 0 64 62" style={{ marginBottom: size(3) }}>
          <Path d="M14 42C7 39 4 34 4 27c0-10 9-17 19-16 3-7 10-11 18-10 8 1 13 6 15 13 6 2 9 7 9 14 0 7-4 12-10 15M15 42v10m40-10v10M22 58h27" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="27" cy="40" r="2.5" fill={colors.accent} /><Circle cx="42" cy="40" r="2.5" fill={colors.accent} />
        </Svg>
        <Text style={[styles.brandName, { fontSize: 38 * scale, lineHeight: 43 * scale }]}>ServeFlow</Text>
        <Text style={[styles.productName, { fontSize: 18 * scale, lineHeight: 23 * scale, marginTop: size(5) }]}>Restaurant POS</Text>
        <Text style={[styles.tagline, { fontSize: 16 * scale, lineHeight: 22 * scale, marginTop: size(12) }]}>Simple. Powerful. Made{`\n`}for your restaurant.</Text>
      </View>
      <View style={[styles.welcomeBlock, { paddingHorizontal: size(20), paddingBottom: size(17) }]}><Text style={[styles.welcomeTitle, { fontSize: 29 * scale, lineHeight: 34 * scale }]}>Welcome back</Text><Text style={[styles.welcomeSubtitle, { fontSize: 16 * scale, lineHeight: 22 * scale, marginTop: size(9) }]}>Choose how you work with your restaurant.</Text></View>
      <View style={[styles.cards, { gap: size(13) }]}><RoleCard owner title="Restaurant owner" description="Manage your restaurant, menus, staff, reports and more." image={ownerImage} scale={scale} onPress={() => router.push('/owner/login')} /><RoleCard title="Team member" description="Take orders, manage tables and help your team." image={teamImage} scale={scale} onPress={() => router.push('/employee/login')} /></View>
      <View style={[styles.divider, { gap: size(12), paddingHorizontal: size(14), paddingTop: size(29), paddingBottom: size(13) }]}><View style={styles.dividerLine} /><Text style={[styles.or, { fontSize: 16 * scale, lineHeight: 20 * scale }]}>OR</Text><View style={styles.dividerLine} /></View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/owner/register')} style={({ pressed }) => [styles.createCard, { minHeight: size(70), marginHorizontal: size(14), borderRadius: size(15), paddingHorizontal: size(16), gap: size(15) }, pressed && styles.pressed]}><View style={[styles.plusCircle, { width: size(27), height: size(27), borderRadius: size(14) }]}><Icon name="plus" size={size(20)} color={colors.accent} /></View><View style={[styles.createCopy, { width: size(205) }]}><Text numberOfLines={1} style={[styles.createTitle, { fontSize: 14.5 * scale, lineHeight: 19 * scale }]}>Create a restaurant account</Text><Text numberOfLines={1} style={[styles.createDescription, { fontSize: 10.5 * scale, lineHeight: 15 * scale, marginTop: size(3) }]}>Register a new restaurant and get started.</Text></View></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' }, loading: { flex: 1, backgroundColor: '#FFFFFF' }, heroImage: { position: 'absolute', left: 0 }, heroFade: { position: 'absolute', top: 0, left: 0, right: 0 }, content: { alignSelf: 'center', zIndex: 1 },
  brandBlock: {},
  brandName: { color: '#082B2A', fontWeight: '800', letterSpacing: -1.8 },
  productName: { color: '#758590', fontWeight: '600' },
  tagline: { color: '#758590' },
  welcomeBlock: {},
  welcomeTitle: { color: '#082B2A', fontWeight: '800', letterSpacing: -0.8 },
  welcomeSubtitle: { color: '#758590' },
  cards: {},
  roleCard: { minHeight: 144, borderRadius: 13, borderWidth: 1, borderColor: '#DDE5E5', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 14, paddingVertical: 8, overflow: 'hidden' },
  ownerCard: { minHeight: 154, backgroundColor: '#EAF7F3', borderColor: '#A6D9CE' },
  teamCard: { backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.76 },
  roleCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  roleTitle: { color: '#082B2A', fontWeight: '800' },
  roleDescription: { color: '#758590' },
  arrowCircle: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  secondaryArrowCircle: { backgroundColor: '#E3F3EF' },
  divider: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { height: 1, flex: 1, backgroundColor: '#D7DFDF' },
  or: { color: '#758590' },
  createCard: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  plusCircle: { borderWidth: 2.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  createCopy: { flexShrink: 1 },
  createTitle: { color: colors.accent, fontWeight: '800' },
  createDescription: { color: '#758590' },
  waveFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 0 },
});
