import { Pressable, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@boccone/design-tokens";
import { Text } from "@boccone/ui-mobile";

import { useI18n } from "../i18n/context";
import { supportedLocales, type Locale } from "../i18n/translations";

export function LanguageSelector() {
  const { locale, copy, setLocale } = useI18n();
  const labels: Record<Locale, string> = {
    en: copy.language.english,
    it: copy.language.italian,
  };

  return (
    <View
      accessibilityLabel={copy.language.label}
      accessibilityRole="radiogroup"
      style={styles.container}
    >
      {supportedLocales.map((option) => {
        const selected = option === locale;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => void setLocale(option)}
            style={[styles.option, selected && styles.selectedOption]}
          >
            <TextLabel selected={selected}>{labels[option]}</TextLabel>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextLabel({ children, selected }: { children: string; selected: boolean }) {
  return (
    <Text variant="label" tone={selected ? "accent" : "secondary"}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background.secondary,
  },
  option: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
  selectedOption: {
    backgroundColor: colors.background.elevated,
  },
});
