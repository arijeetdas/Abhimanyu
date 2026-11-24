import type { Metadata } from 'expo-router/server';

import { OnboardingFlow } from '@/features/onboarding/onboarding-flow';

export function generateMetadata(): Metadata {
  return { title: 'Set up · Abhimanyu' };
}

export default function OnboardingScreen() {
  return <OnboardingFlow />;
}
