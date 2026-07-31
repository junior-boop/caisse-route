import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

import { interFontFamily } from "@/theme/fonts";

function withInter(style: TextProps["style"]) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) return flat;
  // fontWeight/fontStyle are consumed here: each Inter face is registered under its
  // own family name, so leaving them set would trigger synthetic bold/oblique on top.
  const { fontWeight, fontStyle, ...rest } = flat ?? {};
  return { ...rest, fontFamily: interFontFamily(flat) };
}

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={withInter(style)} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput {...props} style={withInter(style)} />;
}
