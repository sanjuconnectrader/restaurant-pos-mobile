import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  downloadAndInstallUpdate,
  latestVersionLabel,
  openUpdateRelease,
  useAppUpdate,
} from '../services/app-update-manager';
import { colors } from '../theme/colors';

export function AppUpdateModal() {
  const { dismiss, error, phase, progress, release } = useAppUpdate();
  const isBusy = phase === 'downloading' || phase === 'opening';
  const percent = Math.round(progress * 100);

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => { if (!isBusy) dismiss(); }}
      transparent
      visible={phase !== 'hidden'}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.badge}><Text style={styles.badgeText}>UPDATE</Text></View>
          <Text style={styles.title}>A new version is ready</Text>
          <Text style={styles.message}>
            ServeFlow POS {latestVersionLabel(release)} is available. Download it now to get the latest changes.
          </Text>

          {phase === 'downloading' && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Downloading update</Text>
                <Text style={styles.percent}>{percent}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%` }]} />
              </View>
            </View>
          )}

          {phase === 'opening' && (
            <View style={styles.opening}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.progressLabel}>Opening Android installer…</Text>
            </View>
          )}

          {phase === 'error' && <Text style={styles.error}>{error}</Text>}

          {!isBusy && (
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={dismiss} style={styles.laterButton}>
                <Text style={styles.laterText}>Later</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => { void downloadAndInstallUpdate(); }}
                style={styles.updateButton}
              >
                <Text style={styles.updateText}>{phase === 'error' ? 'Try again' : 'Update now'}</Text>
              </Pressable>
            </View>
          )}

          {phase === 'error' && (
            <Pressable accessibilityRole="link" onPress={() => { void openUpdateRelease(); }}>
              <Text style={styles.releaseLink}>Open GitHub release</Text>
            </Pressable>
          )}

          <Text style={styles.note}>Android will ask you to approve installation after the download.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13, 27, 22, 0.58)', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, backgroundColor: colors.surface, padding: 22, gap: 14 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  message: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  progressSection: { gap: 9, marginTop: 4 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  percent: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  track: { height: 10, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.accentSoft },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent },
  opening: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  laterButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  laterText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  updateButton: { flex: 1.4, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.accent },
  updateText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  releaseLink: { textAlign: 'center', color: colors.accent, fontSize: 14, fontWeight: '700' },
  note: { textAlign: 'center', color: colors.muted, fontSize: 12, lineHeight: 17 },
});
