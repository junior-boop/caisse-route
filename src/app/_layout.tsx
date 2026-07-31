import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { InterFonts, interFontFamily } from "@/theme/fonts";
import { DatabaseProvider } from "@/contexts/database-context";
import { SessionNotificationBridge } from "@/components/session-notification-bridge";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts(InterFonts);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <DatabaseProvider>
      <SessionNotificationBridge />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </DatabaseProvider>
  );
}
