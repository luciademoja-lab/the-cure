import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MIN_AGE, useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';

export function SignInScreen() {
  const theme = useTheme();
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    setNotice('');
    const cleanEmail = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) return setError('Inserisci un’email valida.');
    if (password.length < 8) return setError('La password deve avere almeno 8 caratteri.');
    if (mode === 'register') {
      if (nickname.trim().length < 2) return setError('Scrivi come vuoi essere chiamata o chiamato.');
      const years = Number(age);
      if (!Number.isInteger(years) || years < MIN_AGE || years > 120) {
        return setError(`Per usare Elayra devi avere almeno ${MIN_AGE} anni.`);
      }
    }
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(cleanEmail, password);
      } else if (await signUp(cleanEmail, password, nickname.trim())) {
        setNotice('Ci siamo quasi. Ti abbiamo mandato un’email: apri il link per attivare il tuo account, poi accedi.');
        setMode('login');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Qualcosa non ha funzionato. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>
              Elayra
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.title}>
              Non devi sapere cosa scrivere. Inizia da come ti senti.
            </ThemedText>

            {mode === 'register' && (
              <>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Come ti chiami"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Nome"
                  maxLength={60}
                  style={inputStyle}
                />
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Età"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Età"
                  keyboardType="number-pad"
                  maxLength={3}
                  style={inputStyle}
                />
              </>
            )}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={inputStyle}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Password"
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={inputStyle}
            />

            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
            {notice ? <ThemedText themeColor="textSecondary">{notice}</ThemedText> : null}

            <Pressable
              onPress={submit}
              disabled={isSubmitting}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.text },
                (pressed || isSubmitting) && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {mode === 'login' ? 'Accedi' : 'Crea account'}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              accessibilityRole="button">
              <ThemedText type="linkPrimary" style={styles.title}>
                {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: { textAlign: 'center' },
  input: { minHeight: 48, borderRadius: Spacing.three, paddingHorizontal: Spacing.three, fontSize: 16 },
  button: { minHeight: 48, borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#d9534f' },
  pressed: { opacity: 0.7 },
});
