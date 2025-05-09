import React, {useState} from 'react'
import {View} from 'react-native'
import {flip, offset, shift, size} from '@floating-ui/dom'
import {useFloating} from '@floating-ui/react-dom'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isTouchDevice} from '#/lib/browser'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  Star_Filled_Corner0_Rounded as FavoriteFilled,
  Star_Stroke2_Corner0_Rounded as FavoriteOutline,
} from '#/components/icons/Star'
import {Portal} from '../Portal'
import {Text} from '../Typography'
import {type BluemojiHoverCardProps} from './types'

const floatingMiddlewares = [
  offset(4),
  flip({padding: 16}),
  shift({padding: 16}),
  size({
    padding: 16,
    apply({availableWidth, availableHeight, elements}) {
      Object.assign(elements.floating.style, {
        maxWidth: `${availableWidth}px`,
        maxHeight: `${availableHeight}px`,
      })
    },
  }),
]

type State =
  | {
      stage: 'hidden' | 'might-hide' | 'hiding'
      effect?: () => () => any
    }
  | {
      stage: 'might-show' | 'showing'
      effect?: () => () => any
      reason: 'hovered-target' | 'hovered-card'
    }

type Action =
  | 'pressed'
  | 'scrolled-while-showing'
  | 'hovered-target'
  | 'unhovered-target'
  | 'hovered-card'
  | 'unhovered-card'
  | 'hovered-long-enough'
  | 'unhovered-long-enough'
  | 'finished-animating-hide'

const SHOW_DELAY = 500
const SHOW_DURATION = 300
const HIDE_DELAY = 150
const HIDE_DURATION = 200

export function BluemojiHoverCard(props: BluemojiHoverCardProps) {
  if (isTouchDevice) {
    return props.children
  } else {
    return <BluemojiHoverCardInner {...props} />
  }
}

function BluemojiHoverCardInner(props: BluemojiHoverCardProps) {
  const {refs, floatingStyles} = useFloating({
    middleware: floatingMiddlewares,
  })

  const [currentState, dispatch] = React.useReducer(
    // Tip: console.log(state, action) when debugging.
    (state: State, action: Action): State => {
      // Pressing within a card should always hide it.
      // No matter which stage we're in.
      if (action === 'pressed') {
        return hidden()
      }

      // --- Hidden ---
      // In the beginning, the card is not displayed.
      function hidden(): State {
        return {stage: 'hidden'}
      }
      if (state.stage === 'hidden') {
        // The user can kick things off by hovering a target.
        if (action === 'hovered-target') {
          return mightShow({
            reason: action,
          })
        }
      }

      // --- Might Show ---
      // The card is not visible yet but we're considering showing it.
      function mightShow({
        waitMs = SHOW_DELAY,
        reason,
      }: {
        waitMs?: number
        reason: 'hovered-target' | 'hovered-card'
      }): State {
        return {
          stage: 'might-show',
          reason,
          effect() {
            const id = setTimeout(() => dispatch('hovered-long-enough'), waitMs)
            return () => {
              clearTimeout(id)
            }
          },
        }
      }
      if (state.stage === 'might-show') {
        // We'll make a decision at the end of a grace period timeout.
        if (action === 'unhovered-target' || action === 'unhovered-card') {
          return hidden()
        }
        if (action === 'hovered-long-enough') {
          return showing({
            reason: state.reason,
          })
        }
      }

      // --- Showing ---
      // The card is beginning to show up and then will remain visible.
      function showing({
        reason,
      }: {
        reason: 'hovered-target' | 'hovered-card'
      }): State {
        return {
          stage: 'showing',
          reason,
          effect() {
            function onScroll() {
              dispatch('scrolled-while-showing')
            }
            window.addEventListener('scroll', onScroll)
            return () => window.removeEventListener('scroll', onScroll)
          },
        }
      }
      if (state.stage === 'showing') {
        // If the user moves the pointer away, we'll begin to consider hiding it.
        if (action === 'unhovered-target' || action === 'unhovered-card') {
          return mightHide()
        }
        // Scrolling away if the hover is on the target instantly hides without a delay.
        // If the hover is already on the card, we won't this.
        if (
          state.reason === 'hovered-target' &&
          action === 'scrolled-while-showing'
        ) {
          return hiding()
        }
      }

      // --- Might Hide ---
      // The user has moved hover away from a visible card.
      function mightHide({waitMs = HIDE_DELAY}: {waitMs?: number} = {}): State {
        return {
          stage: 'might-hide',
          effect() {
            const id = setTimeout(
              () => dispatch('unhovered-long-enough'),
              waitMs,
            )
            return () => clearTimeout(id)
          },
        }
      }
      if (state.stage === 'might-hide') {
        // We'll make a decision based on whether it received hover again in time.
        if (action === 'hovered-target' || action === 'hovered-card') {
          return showing({
            reason: action,
          })
        }
        if (action === 'unhovered-long-enough') {
          return hiding()
        }
      }

      // --- Hiding ---
      // The user waited enough outside that we're hiding the card.
      function hiding({
        animationDurationMs = HIDE_DURATION,
      }: {
        animationDurationMs?: number
      } = {}): State {
        return {
          stage: 'hiding',
          effect() {
            const id = setTimeout(
              () => dispatch('finished-animating-hide'),
              animationDurationMs,
            )
            return () => clearTimeout(id)
          },
        }
      }
      if (state.stage === 'hiding') {
        // While hiding, we don't want to be interrupted by anything else.
        // When the animation finishes, we loop back to the initial hidden state.
        if (action === 'finished-animating-hide') {
          return hidden()
        }
      }

      return state
    },
    {stage: 'hidden'},
  )

  React.useEffect(() => {
    if (currentState.effect) {
      const effect = currentState.effect
      return effect()
    }
  }, [currentState])

  const didFireHover = React.useRef(false)
  const onPointerMoveTarget = React.useCallback(() => {
    // Conceptually we want something like onPointerEnter,
    // but we want to ignore entering only due to scrolling.
    // So instead we hover on the first onPointerMove.
    if (!didFireHover.current) {
      didFireHover.current = true
      dispatch('hovered-target')
    }
  }, [])

  const onPointerLeaveTarget = React.useCallback(() => {
    didFireHover.current = false
    dispatch('unhovered-target')
  }, [])

  const onPointerEnterCard = React.useCallback(() => {
    dispatch('hovered-card')
  }, [])

  const onPointerLeaveCard = React.useCallback(() => {
    dispatch('unhovered-card')
  }, [])

  const onPress = React.useCallback(() => {
    dispatch('pressed')
  }, [])

  const isVisible =
    currentState.stage === 'showing' ||
    currentState.stage === 'might-hide' ||
    currentState.stage === 'hiding'

  const animationStyle = {
    animation:
      currentState.stage === 'hiding'
        ? `fadeOut ${HIDE_DURATION}ms both`
        : `fadeIn ${SHOW_DURATION}ms both`,
  }

  return (
    <View
      // @ts-ignore View is being used as div
      ref={refs.setReference}
      onPointerMove={onPointerMoveTarget}
      onPointerLeave={onPointerLeaveTarget}
      onTouchStart={onPointerMoveTarget}
      // @ts-ignore web only prop
      onMouseUp={onPress}
      style={{flexShrink: 1}}>
      {props.children}
      {isVisible && (
        <Portal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            onPointerEnter={onPointerEnterCard}
            onPointerLeave={onPointerLeaveCard}>
            <div style={{willChange: 'transform', ...animationStyle}}>
              <Card
                name={props.name}
                uri={props.uri}
                description={props.description}
                hide={() => {}}
              />
            </div>
          </div>
        </Portal>
      )}
    </View>
  )
}

let Card = (props: {
  name: string
  uri: string
  description: string
  hide: () => void
}): React.ReactNode => {
  const t = useTheme()

  return (
    <View
      style={[
        a.p_lg,
        a.border,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        t.atoms.shadow_lg,
        {
          width: 350,
        },
      ]}>
      <Inner {...props} />
    </View>
  )
}
Card = React.memo(Card)

function Inner({
  name,
  uri,
  description,
}: {
  name: string
  uri: string
  description: string
}) {
  const _uri = uri

  const t = useTheme()
  const {_} = useLingui()
  // const {currentAccount} = useSession()
  const [isFavorited, setFavorited] = useState<Boolean>()

  const onPress = () => {
    setFavorited(!isFavorited)
  }

  return (
    <View style={[a.flex_col]}>
      <View style={[a.flex_row, a.justify_between, a.align_start, a.pb_sm]}>
        <View style={[a.flex_col, a.align_start]}>
          <Text style={[a.text_md, a.leading_snug, a.flex_wrap, t.atoms.text]}>
            {name}
          </Text>
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              a.flex_wrap,
              t.atoms.text_contrast_medium,
            ]}>
            {_(msg`Bluemoji`)}
          </Text>
        </View>
        <Button
          size="small"
          color={isFavorited ? 'secondary' : 'primary'}
          variant="solid"
          label={isFavorited ? _(msg`Favorited`) : _(msg`Add to favorites`)}
          style={[a.rounded_full]}
          onPress={onPress}>
          <ButtonIcon
            position="left"
            icon={isFavorited ? FavoriteFilled : FavoriteOutline}
          />
          <ButtonText>
            {isFavorited ? _(msg`Favorited`) : _(msg`Add to favorites`)}
          </ButtonText>
        </Button>
      </View>
      <Text style={[a.text_sm, a.leading_snug]}>{description}</Text>
    </View>
  )
}
