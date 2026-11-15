import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getChatHistory, saveChatAsEntry, streamChat, type ChatMessage } from '@/lib/api';

type Bubble = ChatMessage & { key: string; kind?: 'error' | 'note' };

const GREETING = 'Sono qui. Come stai, adesso?';
let counter = 0;
const nextKey = () => `local-${++counter}`;

export function ChatScreen() {
  const theme = useTheme();
  const listRef = useRef<FlatList<Bubble>>(null);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getChatHistory()
      .then((history) => {
        if (!active) return;
        setMessages(
          history.length > 0
            ? history.map((m) => ({ ...m, key: m.id || nextKey() }))
            : [{ key: nextKey(), role: 'assistant', content: GREETING }]
        );
      })
      .catch((e: unknown) => {
        if (!active) return;
        setMessages([{ key: nextKey(), role: 'assistant', kind: 'error', content: errorText(e) }]);
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const busy = isLoadingHistory || isReplying || isSaving;
  const hasUserMessages = messages.some((m) => m.role === 'user');

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    const replyKey = nextKey();
    setInput('');
    setIsReplying(true);
    setMessages((prev) => [
      ...prev.filter((m) => m.kind !== 'error'),
      { key: nextKey(), role: 'user', content },
      { key: replyKey, role: 'assistant', content: '' },
    ]);
    try {
      await streamChat(content, (text) => {
        setMessages((prev) => prev.map((m) => (m.key === replyKey ? { ...m, content: m.content + text } : m)));
      });
    } catch (e) {
      setMessages((prev) => [
        ...prev.filter((m) => !(m.key === replyKey && !m.content)),
        { key: nextKey(), role: 'assistant', kind: 'error', content: errorText(e) },
      ]);
    } finally {
      setIsReplying(false);
    }
  };

  const finish = async () => {
    if (!hasUserMessages || busy) return;
    setIsSaving(true);
    try {
      await saveChatAsEntry();
      setMessages((prev) => [
        ...prev.filter((m) => m.kind !== 'error'),
        { key: nextKey(), role: 'assistant', kind: 'note', content: 'Salvato nel tuo diario. Ci torniamo quando vuoi.' },
      ]);
    } catch (e) {
      setMessages((prev) => [...prev, { key: nextKey(), role: 'assistant', kind: 'error', content: errorText(e) }]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Elayra</ThemedText>
            <Pressable
              onPress={finish}
              disabled={busy || !hasUserMessages}
              accessibilityRole="button"
              style={({ pressed }) => [(busy || !hasUserMessages) && styles.disabled, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">{isSaving ? 'Sto salvando…' : 'Termina e salva'}</ThemedText>
            </Pressable>
          </View>

          {isLoadingHistory ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.key}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => <MessageBubble message={item} />}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Scrivi senza sistemare. Anche una sola frase va bene."
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Scrivi a Elayra"
              multiline
              maxLength={4000}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable
              onPress={send}
              disabled={busy || !input.trim()}
              accessibilityRole="button"
              accessibilityLabel="Invia"
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: theme.text },
                (busy || !input.trim()) && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Invia
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            Elayra è un&apos;intelligenza artificiale, non una terapeuta. In caso di emergenza chiama il 112.
          </ThemedText>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function MessageBubble({ message }: { message: Bubble }) {
  const isUser = message.role === 'user';
  if (message.kind === 'note') {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {message.content}
      </ThemedText>
    );
  }
  return (
    <ThemedView
      type={isUser ? 'backgroundSelected' : 'backgroundElement'}
      style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleElayra, message.kind === 'error' && styles.bubbleError]}>
      {message.content ? <ThemedText selectable>{message.content}</ThemedText> : <ActivityIndicator size="small" />}
    </ThemedView>
  );
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : 'Qualcosa non ha funzionato. Riprova tra poco.';
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, paddingBottom: BottomTabInset },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  list: { padding: Spacing.three, gap: Spacing.two },
  bubble: {
    maxWidth: '86%',
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  bubbleUser: { alignSelf: 'flex-end' },
  bubbleElayra: { alignSelf: 'flex-start' },
  bubbleError: { borderWidth: 1, borderColor: '#d9534f' },
  note: { alignSelf: 'center', textAlign: 'center', paddingVertical: Spacing.two },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, paddingHorizontal: Spacing.three },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 16,
  },
  sendButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: { textAlign: 'center', padding: Spacing.two, fontSize: 11, lineHeight: 15 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
