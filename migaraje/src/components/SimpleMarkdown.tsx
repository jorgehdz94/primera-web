import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

function Inline({ text, variant = 'body' }: { text: string; variant?: 'body' | 'subheading' }) {
  const parts = text.split('**');
  return (
    <AppText variant={variant}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <AppText key={i} variant={variant === 'body' ? 'bodyStrong' : variant}>
            {part}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

/** Muestra texto con formato básico de Markdown (títulos, viñetas y negritas). */
export function SimpleMarkdown({ text }: { text: string }) {
  const theme = useTheme();
  const lines = text.split('\n');
  return (
    <View style={styles.root}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} style={styles.gap} />;
        const heading = /^#{1,6}\s+(.*)$/.exec(line.trim());
        if (heading) return <Inline key={i} text={heading[1]} variant="subheading" />;
        const bullet = /^(\s*)([-*•]|\d+\.)\s+(.*)$/.exec(line);
        if (bullet) {
          const indent = bullet[1].length >= 2 ? 16 : 0;
          const marker = /\d+\./.test(bullet[2]) ? bullet[2] : '•';
          return (
            <View key={i} style={[styles.bullet, { paddingLeft: indent }]}>
              <AppText color={theme.primary} style={styles.marker}>
                {marker}
              </AppText>
              <View style={styles.flex}>
                <Inline text={bullet[3]} />
              </View>
            </View>
          );
        }
        return <Inline key={i} text={line.trim()} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4 },
  gap: { height: 6 },
  bullet: { flexDirection: 'row', gap: 8 },
  marker: { fontWeight: '700', minWidth: 14 },
  flex: { flex: 1 },
});
