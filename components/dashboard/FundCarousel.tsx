import { useState } from 'react';
import { FlatList, StyleSheet, View, ViewToken } from 'react-native';

import { FundCard } from '@/components/dashboard/FundCard';
import { colors, spacing } from '@/constants/theme';
import { FundId } from '@/types/finance';

export type FundCardData = {
  id: FundId;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ComponentProps<typeof FundCard>['icon'];
  balance: number;
  target?: number;
  footerLine?: string;
};

type Props = {
  cards: FundCardData[];
  containerWidth: number;
};

const SIDE_PADDING = 24;
const GAP = 12;

export function FundCarousel({ cards, containerWidth }: Props) {
  const cardWidth = containerWidth - SIDE_PADDING * 2;
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  };

  return (
    <View>
      <FlatList
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FundCard
            width={cardWidth}
            fundId={item.id}
            title={item.title}
            subtitle={item.subtitle}
            color={item.color}
            icon={item.icon}
            balance={item.balance}
            target={item.target}
            footerLine={item.footerLine}
          />
        )}
      />
      <View style={styles.dots}>
        {cards.map((c, i) => (
          <View
            key={c.id}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: SIDE_PADDING,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: {
    backgroundColor: colors.text.primary,
    width: 18,
  },
});
