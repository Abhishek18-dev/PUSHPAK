import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppNavigator } from './navigation/AppNavigator';
import { colors } from './theme';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
