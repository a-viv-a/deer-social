import {useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  Star_Filled_Corner0_Rounded as FavoriteFilled,
  Star_Stroke2_Corner0_Rounded as FavoriteOutline,
} from '#/components/icons/Star'
import {useDialogControl} from '../Dialog'
import {Text} from '../Typography'
import {type BluemojiHoverCardProps} from './types'

// Actual hover card in index.web.tsx

export function BluemojiHoverCard(props: BluemojiHoverCardProps) {
  const infoDialogControl = useDialogControl()

  return (
    <>
      <Button
        onPress={() => infoDialogControl.open()}
        label={props.description}>
        {props.children}
      </Button>
      <MyDialog
        control={infoDialogControl}
        name={props.name}
        uri={props.uri}
        description={props.description}
      />
    </>
  )
}

function MyDialog({
  control,
  name,
  uri,
  description,
}: {
  control: Dialog.DialogControlProps
  name: string
  uri: string
  description: string
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`About Bluemoji`)}
        style={[{width: 'auto', maxWidth: 400, minWidth: 200}]}>
        <Inner
          name={name}
          uri={uri}
          description={description}
          hide={() => {}}
        />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({
  name,
  description,
}: {
  name: string
  uri: string
  description: string
  hide: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [isFavorited, setFavorited] = useState<Boolean>()

  const onPress = () => {
    setFavorited(!isFavorited)
  }

  return (
    <View style={[a.flex_col, a.justify_between]}>
      <View style={[a.flex_row, a.justify_between, a.align_start, a.pb_sm]}>
        <View style={[a.flex_col, a.align_start]}>
          <Text style={[a.text_lg, a.leading_snug, a.flex_wrap, t.atoms.text]}>
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
