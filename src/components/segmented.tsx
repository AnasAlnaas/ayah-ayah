import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, useTheme } from '@/theme';
import { ROW } from '@/utils/rtl';

type Option<T extends string> = { value: T; label: string; accessibilityLabel?: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** A row of mutually exclusive choices, first option on the right. */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const palette = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.group, { backgroundColor: palette.bg, borderColor: palette.line }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={[
              styles.option,
              selected && { backgroundColor: palette.surface, borderColor: palette.gold },
            ]}>
            <Text
              style={[
                styles.label,
                { color: selected ? palette.goldDeep : palette.chrome },
                selected && { fontFamily: fonts.uiBold },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: ROW,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  option: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 14,
  },
});
