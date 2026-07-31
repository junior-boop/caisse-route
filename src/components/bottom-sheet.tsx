import { useEffect, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import theme from "@/constantes/constant-style";

const SHEET_TRAVEL_DISTANCE = 300;

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  keyboardAvoiding?: boolean;
  sheetStyle?: ViewStyle;
};

export function BottomSheet({ visible, onClose, children, keyboardAvoiding = true, sheetStyle }: BottomSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_TRAVEL_DISTANCE);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 250 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      sheetTranslateY.value = withTiming(SHEET_TRAVEL_DISTANCE, { duration: 200 }, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!mounted) return null;

  const content = (
    <>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View style={[{ flex: 1, backgroundColor: "#00000066" }, backdropStyle]} />
      </Pressable>
      <Animated.View style={[{ backgroundColor: "white", borderTopLeftRadius: theme.radius, borderTopRightRadius: theme.radius }, sheetStyle, animatedSheetStyle]}>
        {children}
      </Animated.View>
    </>
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </Modal>
  );
}
