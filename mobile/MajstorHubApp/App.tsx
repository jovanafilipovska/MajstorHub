import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { AuthProvider } from './src/contexts/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { WorkModeProvider } from './src/contexts/WorkModeContext';
import { DrawerProvider } from './src/contexts/DrawerContext';
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { LoadingView } from './src/components/LoadingView';
import { lightTheme, darkTheme } from './src/theme';

const { LightTheme: navLightTheme, DarkTheme: navDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
  materialLight: lightTheme,
  materialDark: darkTheme,
});

function AppShell() {
  const { mode, isLoading } = useThemeMode();
  const activeTheme = mode === 'dark' ? darkTheme : lightTheme;

  if (isLoading) {
    return (
      <PaperProvider theme={activeTheme}>
        <LoadingView fullScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={activeTheme}>
      <AuthProvider>
        <ChatProvider>
          <WorkModeProvider>
            <NavigationContainer ref={navigationRef} theme={mode === 'dark' ? navDarkTheme : navLightTheme}>
              <DrawerProvider>
                <RootNavigator />
              </DrawerProvider>
            </NavigationContainer>
          </WorkModeProvider>
        </ChatProvider>
      </AuthProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </PaperProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <LoadingView fullScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppShell />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
