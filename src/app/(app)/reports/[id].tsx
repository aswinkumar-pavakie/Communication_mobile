import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { fetchReport } from '@/api/reports';
import { ThemedText } from '@/components/themed-text';
import { apiErrorMessage, ErrorState } from '@/components/ui/error-state';
import { HeroCard, HeroPill, HeroScore } from '@/components/ui/hero-card';
import { Chip, SectionHeader, type IconName } from '@/components/ui/list-row';
import { LoadingState } from '@/components/ui/loading-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/hooks/use-theme';
import { humanize, readinessText, scoreTone, shortDate } from '@/lib/format';

function BulletList({ items, icon, color }: { items: string[]; icon: IconName; color: string }) {
  return (
    <>
      {items.map((item, i) => (
        <View key={i} style={styles.bullet}>
          <MaterialCommunityIcons name={icon} size={18} color={color} style={styles.bulletIcon} />
          <ThemedText type="small" style={styles.flex}>
            {item}
          </ThemedText>
        </View>
      ))}
    </>
  );
}

export default function ReportDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: report, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['report', id],
    queryFn: () => fetchReport(id),
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading report..." />
      </ScreenContainer>
    );
  }

  if (isError || !report) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const panel = [styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }];
  const improvements = Object.entries(report.improvement ?? {}).filter(([, delta]) => typeof delta === 'number');
  const skills = [...report.skillBreakdown].sort((a, b) => b.currentScore - a.currentScore);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <HeroCard>
        <View style={styles.heroRow}>
          <HeroScore score={report.overallScore} />
          <View style={styles.heroText}>
            <ThemedText style={[styles.heroTitle, { color: theme.onPrimary }]}>Placement readiness</ThemedText>
            <ThemedText style={[styles.heroCaption, { color: theme.onPrimary }]}>
              {shortDate(report.periodStart)} – {shortDate(report.periodEnd)}
            </ThemedText>
            <HeroPill label={readinessText(report.interviewReadiness.label)} />
          </View>
        </View>
        <View style={styles.readiness}>
          <View style={styles.readinessLabels}>
            <ThemedText style={[styles.heroCaption, { color: theme.onPrimary }]}>Interview readiness</ThemedText>
            <ThemedText style={[styles.heroCaption, styles.bold, { color: theme.onPrimary }]}>
              {Math.round(report.interviewReadiness.score)}%
            </ThemedText>
          </View>
          <ProgressBar
            value={report.interviewReadiness.score}
            color={theme.onPrimary}
            trackColor="rgba(255,255,255,0.25)"
          />
        </View>
      </HeroCard>

      {improvements.length > 0 ? (
        <>
          <SectionHeader title="Change this period" />
          <View style={styles.chips}>
            {improvements.map(([skill, delta]) => (
              <Chip
                key={skill}
                label={`${delta > 0 ? '+' : ''}${Math.round(delta)} ${humanize(skill)}`}
                color={delta > 0 ? theme.success : delta < 0 ? theme.danger : theme.textSecondary}
                icon={delta > 0 ? 'trending-up' : delta < 0 ? 'trending-down' : 'minus'}
              />
            ))}
          </View>
        </>
      ) : null}

      {skills.length > 0 ? (
        <>
          <SectionHeader title="Skill breakdown" />
          <View style={panel}>
            {skills.map((skill) => (
              <View key={skill.skillCode} style={styles.skill}>
                <View style={styles.skillTop}>
                  <ThemedText type="small" style={styles.flex} numberOfLines={1}>
                    {skill.skillName}
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor={scoreTone(skill.currentScore)}>
                    {Math.round(skill.currentScore)}
                  </ThemedText>
                </View>
                <ProgressBar value={skill.currentScore} color={theme[scoreTone(skill.currentScore)]} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {report.strengths.length > 0 ? (
        <>
          <SectionHeader title="Strengths" />
          <View style={panel}>
            <BulletList items={report.strengths} icon="check-circle-outline" color={theme.success} />
          </View>
        </>
      ) : null}

      {report.weaknesses.length > 0 ? (
        <>
          <SectionHeader title="Focus areas" />
          <View style={panel}>
            <BulletList items={report.weaknesses} icon="alert-circle-outline" color={theme.warning} />
          </View>
        </>
      ) : null}

      {report.recommendedActions.length > 0 ? (
        <>
          <SectionHeader title="Your action plan" />
          <View style={panel}>
            {report.recommendedActions.map((action, i) => (
              <View key={i} style={styles.bullet}>
                <View style={[styles.step, { backgroundColor: theme.primary }]}>
                  <ThemedText style={[styles.stepText, { color: theme.onPrimary }]}>{i + 1}</ThemedText>
                </View>
                <ThemedText type="small" style={styles.flex}>
                  {action}
                </ThemedText>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  heroCaption: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  readiness: { gap: 6 },
  readinessLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panel: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  skill: { gap: 6, paddingVertical: 2 },
  skillTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletIcon: { marginTop: 1 },
  step: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 12, fontWeight: '800' },
});
