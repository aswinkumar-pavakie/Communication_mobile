import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/ui/loading-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useAuth } from '@/context/auth-context';

export default function RootIndex() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingState label="Getting things ready..." />
      </ScreenContainer>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/home' : '/(auth)/login'} />;
}
