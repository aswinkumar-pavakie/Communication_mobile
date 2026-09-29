import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

function TabHeaderTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  return (
    <View style={styles.headerTitleContainer}>
      <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
        {title}
      </ThemedText>
      <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {subtitle}
      </ThemedText>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.primary },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.onPrimary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopWidth: 0,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: () => <TabHeaderTitle title="Home" subtitle="Your daily overview" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          headerTitle: () => <TabHeaderTitle title="Activities" subtitle="Practice your speaking skills" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="mic" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          headerTitle: () => <TabHeaderTitle title="Practice" subtitle="Choose a mode to sharpen a skill" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerTitle: () => <TabHeaderTitle title="Progress" subtitle="Track your improvement" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: () => <TabHeaderTitle title="Profile" subtitle="Your account" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: { gap: 2 },
});
