import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { getJournal, type JournalEntry } from '@/lib/api';

const moodSymbol = (mood: number) => (mood <= 3 ? '🌧️' : mood <= 5 ? '🌙' : mood <= 7 ? '☀️' : '✨');

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

export function JournalScreen() {
  const { signOut, nickname } = useSession();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Si ricarica ogni volta che si torna su questa scheda: una pagina appena salvata compare subito.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getJournal()
        .then((data) => {
          if (active) {
            setEntries(data);
            setError('');
          }
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e.message : 'Errore');
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const lightPoints = entries.reduce((sum, e) => sum + (e.lightPointsEarned || 0), 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle">Diario</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {nickname ? `${nickname} · ` : ''}
              {lightPoints} punti luce
            </ThemedText>
          </View>
          <Pressable onPress={signOut} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="linkPrimary">Esci</ThemedText>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {error || 'Ancora nessuna pagina. Parla con Elayra e poi tocca “Termina e salva”.'}
              </ThemedText>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">
                  {moodSymbol(item.mood)} {formatDate(item.timestamp)}
                </ThemedText>
                <ThemedText selectable>{item.content}</ThemedText>
                {item.sensation ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Corpo: {item.sensation}
                  </ThemedText>
                ) : null}
              </ThemedView>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  list: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  card: { padding: Spacing.three, borderRadius: Spacing.four, gap: Spacing.two },
  empty: { textAlign: 'center', paddingTop: Spacing.six },
  pressed: { opacity: 0.7 },
});
