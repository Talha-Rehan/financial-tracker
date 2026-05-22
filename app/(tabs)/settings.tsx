import {
  Canvas,
  Circle,
  Fill,
  FractalNoise,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmResetSheet } from '@/components/settings/ConfirmResetSheet';
import { EditAllocationsSheet } from '@/components/settings/EditAllocationsSheet';
import { EditNumberSheet } from '@/components/settings/EditNumberSheet';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { colors, spacing, typography } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Fractions } from '@/types/finance';

type SheetKey =
  | 'salary'
  | 'allocations'
  | 'emergencyTarget'
  | 'resetGoals'
  | 'resetActivity'
  | 'resetAll'
  | null;

function formatGrouped(n: number): string {
  const rounded = Math.max(0, Math.round(n));
  const s = rounded.toString();
  let out = '';
  for (let i = s.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) out = ',' + out;
    out = s[i] + out;
  }
  return out;
}

function fractionsSummary(f: Fractions): string {
  const segs = [
    f.d1,
    f.d2 - f.d1,
    f.d3 - f.d2,
    1 - f.d3,
  ];
  return segs.map((s) => Math.round(s * 100)).join('/');
}

export default function SettingsTab() {
  const { width, height } = useWindowDimensions();
  const [sheet, setSheet] = useState<SheetKey>(null);

  const salary = useFinanceStore((s) => s.salary);
  const fractions = useFinanceStore((s) => s.fractions);
  const emergencyTarget = useFinanceStore((s) => s.emergencyTarget);
  const goalsCount = useFinanceStore((s) => s.goals.length);
  const transactionsCount = useFinanceStore((s) => s.transactions.length);
  const investmentEntriesCount = useFinanceStore(
    (s) => s.investmentEntries.length
  );
  const monthsLogged = useFinanceStore((s) => s.monthsLogged);

  const updateSalary = useFinanceStore((s) => s.updateSalary);
  const updateFractions = useFinanceStore((s) => s.updateFractions);
  const updateEmergencyTarget = useFinanceStore(
    (s) => s.updateEmergencyTarget
  );
  const resetGoals = useFinanceStore((s) => s.resetGoals);
  const resetActivity = useFinanceStore((s) => s.resetActivity);
  const resetAllData = useFinanceStore((s) => s.resetAllData);

  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? '0.1.0';

  const close = () => setSheet(null);

  const handleResetAllConfirm = () => {
    resetAllData();
    // Send user back through onboarding so the new defaults are reflected.
    router.replace('/');
  };

  const activityCount =
    monthsLogged +
    transactionsCount +
    investmentEntriesCount;

  const blob1 = { cx: width * 0.85, cy: height * 0.18, r: width * 0.85 };
  const blob2 = { cx: width * 0.1, cy: height * 0.85, r: width * 0.7 };

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Fill color={colors.bg.base} />
        <Circle cx={blob1.cx} cy={blob1.cy} r={blob1.r}>
          <RadialGradient
            c={vec(blob1.cx, blob1.cy)}
            r={blob1.r}
            colors={[colors.mesh.purple, colors.mesh.fade]}
          />
        </Circle>
        <Circle cx={blob2.cx} cy={blob2.cy} r={blob2.r}>
          <RadialGradient
            c={vec(blob2.cx, blob2.cy)}
            r={blob2.r}
            colors={[colors.mesh.teal, colors.mesh.fade]}
          />
        </Circle>
        <Fill opacity={0.05} blendMode="overlay">
          <FractalNoise freqX={0.85} freqY={0.85} octaves={3} />
        </Fill>
      </Canvas>

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.title}>Preferences & data</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <SettingsSection
            title="Budget"
            footer={`Allocations sum to 100% of ₨ ${formatGrouped(
              salary
            )}/mo. The emergency target controls when the redirect kicks in.`}>
            <SettingsRow
              label="Monthly salary"
              value={`₨ ${formatGrouped(salary)}`}
              icon="wallet-outline"
              onPress={() => setSheet('salary')}
            />
            <SettingsRow
              label="Allocations"
              value={`${fractionsSummary(fractions)}%`}
              icon="pie-chart-outline"
              onPress={() => setSheet('allocations')}
            />
            <SettingsRow
              label="Emergency fund target"
              value={`₨ ${formatGrouped(emergencyTarget)}`}
              icon="shield-outline"
              onPress={() => setSheet('emergencyTarget')}
            />
          </SettingsSection>

          <SettingsSection
            title="Data"
            footer="Resets are local to this device. We don't sync data yet.">
            <SettingsRow
              label="Reset goals"
              description={
                goalsCount === 0
                  ? 'No goals currently'
                  : `Removes all ${goalsCount} goal${goalsCount > 1 ? 's' : ''}`
              }
              icon="flag-outline"
              onPress={goalsCount > 0 ? () => setSheet('resetGoals') : undefined}
            />
            <SettingsRow
              label="Reset activity"
              description={
                activityCount === 0
                  ? 'No activity to reset'
                  : `Wipes balances, ${monthsLogged} month${
                      monthsLogged === 1 ? '' : 's'
                    } logged, transactions, and investment entries`
              }
              icon="refresh-outline"
              onPress={
                activityCount > 0 ? () => setSheet('resetActivity') : undefined
              }
            />
            <SettingsRow
              label="Reset all data"
              description="Wipes everything and sends you back through onboarding"
              icon="trash-outline"
              destructive
              showChevron={false}
              onPress={() => setSheet('resetAll')}
            />
          </SettingsSection>

          <SettingsSection title="About">
            <SettingsRow
              label="App version"
              value={appVersion}
              icon="information-circle-outline"
              showChevron={false}
            />
            <SettingsRow
              label="Built"
              value="Made in Pakistan"
              icon="construct-outline"
              showChevron={false}
            />
          </SettingsSection>
        </ScrollView>
      </SafeAreaView>

      <EditNumberSheet
        visible={sheet === 'salary'}
        title="Monthly salary"
        subtitle="Your take-home, in PKR"
        initialValue={salary}
        onClose={close}
        onSave={updateSalary}
      />

      <EditAllocationsSheet
        visible={sheet === 'allocations'}
        salary={salary}
        initialFractions={fractions}
        onClose={close}
        onSave={updateFractions}
      />

      <EditNumberSheet
        visible={sheet === 'emergencyTarget'}
        title="Emergency fund target"
        subtitle="When the emergency fund hits this, future emergency allocations redirect to Investment."
        initialValue={emergencyTarget}
        onClose={close}
        onSave={updateEmergencyTarget}
      />

      <ConfirmResetSheet
        visible={sheet === 'resetGoals'}
        title="Reset goals?"
        description="All goals (active and purchased) will be removed. Fund balances and activity are unaffected."
        confirmLabel="Reset goals"
        onClose={close}
        onConfirm={resetGoals}
      />

      <ConfirmResetSheet
        visible={sheet === 'resetActivity'}
        title="Reset activity?"
        description="Wipes everything that has accumulated over time. Budget config and goals stay intact."
        bullets={[
          'Fund balances set to zero',
          'Months logged: 0',
          'All transactions cleared',
          'All investment entries cleared',
        ]}
        confirmLabel="Reset activity"
        onClose={close}
        onConfirm={resetActivity}
      />

      <ConfirmResetSheet
        visible={sheet === 'resetAll'}
        title="Reset everything?"
        description="This wipes all data and sends you back through onboarding."
        bullets={[
          'Salary, allocations, emergency target reset to defaults',
          'All goals removed',
          'All activity, transactions, and investments cleared',
        ]}
        confirmLabel="Reset everything"
        fullDestructive
        onClose={close}
        onConfirm={handleResetAllConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
