declare module "react-native-web" {
  import type * as React from "react";

  type AnyProps = Record<string, unknown> & {
    children?: React.ReactNode;
    style?: unknown;
    contentContainerStyle?: unknown;
    onPress?: () => void;
    onChangeText?: (value: string) => void;
  };

  export const View: React.ComponentType<AnyProps>;
  export const Text: React.ComponentType<AnyProps>;
  export const Pressable: React.ComponentType<AnyProps>;
  export const ScrollView: React.ComponentType<AnyProps>;
  export const TextInput: React.ComponentType<AnyProps>;
}
