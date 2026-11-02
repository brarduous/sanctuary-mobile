import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { scrollItemIsVisible, type ScrollItemLayout } from '@/lib/scrollVisibility';

// The measured item must be a direct child of the ScrollView's content.
export default function useScrollItemVisibility() {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [visible, setVisible] = useState(false);
  const geometry = useRef({ item: null as ScrollItemLayout | null, offset: 0, viewport: 0 });
  const update = useCallback(() => {
    const { item, offset, viewport } = geometry.current;
    setVisible(scrollItemIsVisible(item, offset, viewport));
  }, []);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => listener.remove();
  }, []);
  const onItemLayout = useCallback((event: LayoutChangeEvent) => {
    geometry.current.item = event.nativeEvent.layout;
    update();
  }, [update]);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    geometry.current.viewport = event.nativeEvent.layout.height;
    update();
  }, [update]);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    geometry.current.offset = event.nativeEvent.contentOffset.y;
    geometry.current.viewport = event.nativeEvent.layoutMeasurement.height;
    update();
  }, [update]);
  return { visible: visible && focused && active, onItemLayout, onLayout, onScroll };
}
