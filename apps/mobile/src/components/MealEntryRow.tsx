import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { borderWidths, minTouchTarget, opacities, spacing } from "@boccone/design-tokens";
import { GlassIconButton, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

import { useI18n } from "../i18n/context";

export function MealEntryRow({
  name,
  detail,
  calories,
  onEdit,
  onRemove,
}: {
  name: string;
  detail: string;
  calories: string;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const { copy } = useI18n();
  const colors = useThemeColors();
  const content = (
    <Stack gap="xs" style={styles.copy}>
      <Text variant="headingSm" numberOfLines={2}>
        {name}
      </Text>
      <Text variant="bodySm" tone="secondary" numberOfLines={1}>
        {detail}
      </Text>
    </Stack>
  );

  return (
    <View style={[styles.row, { borderBottomColor: colors.border.subtle }]}>
      {onEdit ? (
        <Pressable
          accessibilityLabel={copy.food.editEntry}
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      <Stack align="end" gap="xs">
        <Text variant="label">{calories}</Text>
        {onRemove ? (
          <GlassIconButton
            accessibilityLabel={copy.food.remove}
            icon={
              <MaterialCommunityIcons
                color={colors.status.danger}
                name="trash-can-outline"
                size={20}
              />
            }
            onPress={onRemove}
          />
        ) : null}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: minTouchTarget,
    borderBottomWidth: borderWidths.hairline,
    paddingVertical: spacing[2],
  },
  edit: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: spacing[2],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: opacities.pressed,
  },
});
