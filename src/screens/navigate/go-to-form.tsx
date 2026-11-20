import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getSurah, SURAH_COUNT } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import { fonts, useTheme } from '@/theme';
import { ayahCountLabel, formatNumber, type Numerals, toWesternDigits } from '@/utils/arabic';
import { ALIGN_START } from '@/utils/rtl';

type Props = {
  position: Position;
  numerals: Numerals;
  onGo: (position: Position) => void;
};

function parse(value: string): number | null {
  const digits = toWesternDigits(value.trim());
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

export function GoToForm({ position, numerals, onGo }: Props) {
  const palette = useTheme();
  const [surahText, setSurahText] = useState(formatNumber(position.s, numerals));
  const [ayahText, setAyahText] = useState('');

  const s = parse(surahText);
  const surah = s !== null && s >= 1 && s <= SURAH_COUNT ? getSurah(s) : null;
  const a = ayahText.trim() === '' ? 1 : parse(ayahText);
  const ayahValid = surah !== null && a !== null && a >= 1 && a <= surah.ayahs.length;

  let error = '';
  if (surahText.trim() !== '' && !surah) error = `رقم السورة من ${formatNumber(1, numerals)} إلى ${formatNumber(SURAH_COUNT, numerals)}`;
  else if (surah && !ayahValid)
    error = `سورة ${surah.name} فيها ${ayahCountLabel(surah.ayahs.length, numerals)}`;

  const submit = () => {
    if (surah && ayahValid && a !== null) onGo({ s: surah.n, a: ayahText.trim() === '' ? 0 : a });
  };

  const inputStyle = [styles.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.bg }];

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.chrome }]}>رقم السورة</Text>
        <TextInput
          value={surahText}
          onChangeText={setSurahText}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={3}
          selectTextOnFocus
          returnKeyType="next"
          accessibilityLabel="رقم السورة"
          style={inputStyle}
        />
        <Text style={[styles.preview, { color: surah ? palette.goldDeep : palette.muted }]}>
          {surah ? `سورة ${surah.name}، ${ayahCountLabel(surah.ayahs.length, numerals)}` : ' '}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.chrome }]}>رقم الآية</Text>
        <TextInput
          value={ayahText}
          onChangeText={setAyahText}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={3}
          placeholder={surah ? `${formatNumber(1, numerals)}–${formatNumber(surah.ayahs.length, numerals)}` : ''}
          placeholderTextColor={palette.muted}
          returnKeyType="go"
          onSubmitEditing={submit}
          accessibilityLabel="رقم الآية، اتركه فارغًا لبداية السورة"
          style={inputStyle}
        />
        <Text style={[styles.help, { color: palette.muted }]}>اتركه فارغًا للانتقال إلى بداية السورة</Text>
      </View>

      <Text accessibilityLiveRegion="polite" style={[styles.error, { color: palette.goldDeep }]}>
        {error}
      </Text>

      <Pressable
        onPress={submit}
        disabled={!ayahValid}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ayahValid }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.goldDeep, opacity: ayahValid ? (pressed ? 0.85 : 1) : 0.4 },
        ]}>
        <Text style={[styles.buttonText, { color: palette.bg }]}>انتقال</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 18,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.ui,
    fontSize: 20,
    textAlign: 'center',
  },
  preview: {
    fontFamily: fonts.ui,
    fontSize: 14,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  help: {
    fontFamily: fonts.ui,
    fontSize: 12,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  error: {
    minHeight: 20,
    fontFamily: fonts.ui,
    fontSize: 13,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
  },
});
