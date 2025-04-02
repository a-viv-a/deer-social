import React from 'react'
import {Dimensions, ScrollView, View} from 'react-native'
import {msg, Plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type FeedPostSlice} from '#/state/queries/post-feed'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {
  ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRight,
} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {PostFeedItem} from './PostFeedItem'

const CARD_WIDTH = 320
const CARD_INTERVAL = CARD_WIDTH + a.gap_md.gap

export function PostFeedItemCarousel({items}: {items: FeedPostSlice[]}) {
  const t = useTheme()
  const {_} = useLingui()
  const ref = React.useRef<ScrollView>(null)
  const [scrollX, setScrollX] = React.useState(0)

  const scrollTo = React.useCallback(
    (item: number) => {
      setScrollX(item)

      ref.current?.scrollTo({
        x: item * CARD_INTERVAL,
        y: 0,
        animated: true,
      })
    },
    [ref],
  )

  const scrollLeft = React.useCallback(() => {
    const newPos = scrollX > 0 ? scrollX - 1 : items.length - 1
    scrollTo(newPos)
  }, [scrollTo, scrollX, items.length])

  const scrollRight = React.useCallback(() => {
    const newPos = scrollX < items.length - 1 ? scrollX + 1 : 0
    scrollTo(newPos)
  }, [scrollTo, scrollX, items.length])

  return (
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      <View
        style={[
          a.py_lg,
          a.px_md,
          a.pb_xs,
          a.flex_row,
          a.align_center,
          a.justify_between,
        ]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
          {items.length}{' '}
          <Plural value={items.length} one="repost" other="reposts" />
        </Text>
        <View style={[a.gap_md, a.flex_row, a.align_end]}>
          <Button
            label={_(msg`Scroll carousel left`)}
            size="tiny"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={() => scrollLeft()}>
            <ButtonIcon icon={ChevronLeft} />
          </Button>
          <Button
            label={_(msg`Scroll carousel right`)}
            size="tiny"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={() => scrollRight()}>
            <ButtonIcon icon={ChevronRight} />
          </Button>
        </View>
      </View>
      <BlockDrawerGesture>
        <View>
          <ScrollView
            horizontal
            snapToInterval={CARD_INTERVAL}
            decelerationRate="fast"
            /* TODO: figure out how to not get this to break on the last item
            onScroll={e => {
              setScrollX(Math.floor(e.nativeEvent.contentOffset.x / CARD_INTERVAL))
            }}
*/
            ref={ref}>
            <View
              style={[
                a.px_md,
                a.pt_sm,
                a.pb_lg,
                a.flex_row,
                a.gap_md,
                a.align_start,
              ]}>
              {items.map(slice => {
                const item = slice.items[0]

                return (
                  <View
                    style={[
                      {
                        maxHeight: Dimensions.get('window').height * 0.65,
                        width: CARD_WIDTH,
                      },
                      a.rounded_md,
                      a.border,
                      t.atoms.bg,
                      t.atoms.border_contrast_low,
                      a.flex_shrink_0,
                      a.overflow_hidden,
                    ]}
                    key={item._reactKey}>
                    <PostFeedItem
                      post={item.post}
                      record={item.record}
                      reason={slice.reason}
                      feedContext={slice.feedContext}
                      moderation={item.moderation}
                      parentAuthor={item.parentAuthor}
                      isParentBlocked={item.isParentBlocked}
                      isParentNotFound={item.isParentNotFound}
                      hideTopBorder={true}
                      isCarouselItem={true}
                      rootPost={slice.items[0].post}
                      showReplyTo={false}
                    />
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </View>
      </BlockDrawerGesture>
    </View>
  )
}
