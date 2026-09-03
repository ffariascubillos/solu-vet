import { useWindowDimensions } from "react-native";

const TABLET_BREAKPOINT = 600;

export function useIsTablet() {
  const { width } = useWindowDimensions();

  return width >= TABLET_BREAKPOINT;
}
