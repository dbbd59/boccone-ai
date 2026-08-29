import { Pressable, StyleSheet } from "react-native";

import { radii, spacing } from "@boccone/design-tokens";
import { GlassSurface, Text, useThemeColors } from "@boccone/ui-mobile";

import { useI18n } from "../i18n/context";
import { supportedLocales, type Locale } from "../i18n/translations";
import { selectionFeedback } from "../lib/haptics";

export function LanguageSelector() {
  const { locale, copy, setLocale } = useI18n();
  const colors = useThemeColors();
  const labels: Record<Locale, string> = {
    en: copy.language.english,
    it: copy.language.italian,
  };

  return (
    <GlassSurface
      accessibilityLabel={copy.language.label}
      accessibilityRole="radiogroup"
      interactive
      style={styles.container}
    >
      {supportedLocales.map((option) => {
        const selected = option === locale;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) selectionFeedback();
              void setLocale(option);
            }}
            style={[styles.option, selected && { backgroundColor: colors.background.elevated }]}
          >
            <TextLabel selected={selected}>{labels[option]}</TextLabel>
          </Pressable>
        );
      })}
    </GlassSurface>
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
  },
  option: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
  },
});
