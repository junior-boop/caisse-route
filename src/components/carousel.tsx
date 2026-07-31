import { Children, useEffect, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, View } from "react-native";

type CarouselProps = {
  children: React.ReactNode;
};

export function Carousel({ children }: CarouselProps) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [heights, setHeights] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const slides = Children.toArray(children);

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  function onSlideLayout(i: number, event: LayoutChangeEvent) {
    const height = event.nativeEvent.layout.height;
    setHeights((prev) => (prev[i] === height ? prev : [...prev.slice(0, i), height, ...prev.slice(i + 1)]));
  }

  function onMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <View onLayout={onLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={{ height: ready ? heights[index] : undefined }}
      >
        {slides.map((slide, i) => (
          <View key={i} style={{ width }} onLayout={(event) => onSlideLayout(i, event)}>
            {slide}
          </View>
        ))}
      </ScrollView>

      {slides.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? "#000000ce" : "#00000030",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
