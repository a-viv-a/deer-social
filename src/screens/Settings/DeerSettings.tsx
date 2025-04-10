import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {usePalette} from '#/lib/hooks/usePalette'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {type Gate} from '#/lib/statsig/gates'
import {
  resetDeerGateCache,
  useDangerousSetGate,
  useGatesCache,
} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {setGeolocation, useGeolocation} from '#/state/geolocation'
import {useGoLinksEnabled, useSetGoLinksEnabled} from '#/state/preferences'
import {
  useConstellationEnabled,
  useSetConstellationEnabled,
} from '#/state/preferences/constellation-enabled'
import {
  useDirectFetchRecords,
  useSetDirectFetchRecords,
} from '#/state/preferences/direct-fetch-records'
import {
  useNoAppLabelers,
  useSetNoAppLabelers,
} from '#/state/preferences/no-app-labelers'
import {
  useRepostCarouselEnabled,
  useSetRepostCarouselEnabled,
} from '#/state/preferences/repost-carousel-enabled'
import {TextInput} from '#/view/com/modals/util'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Atom_Stroke2_Corner0_Rounded as DeerIcon} from '#/components/icons/Atom'
import {Eye_Stroke2_Corner0_Rounded as VisibilityIcon} from '#/components/icons/Eye'
import {Earth_Stroke2_Corner2_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Lab_Stroke2_Corner0_Rounded as BeakerIcon} from '#/components/icons/Lab'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {RaisingHand4Finger_Stroke2_Corner0_Rounded as RaisingHandIcon} from '#/components/icons/RaisingHand'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams>

function GeolocationSettingsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {_} = useLingui()

  const [hasChanged, setHasChanged] = useState(false)
  const [countryCode, setCountryCode] = useState('')

  const submit = () => {
    setGeolocation({countryCode})
    control.close()
  }

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Geolocation ISO 3166-1 Code`)}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Geolocation ISO 3166-1 Code</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <TextInput
            accessibilityLabel="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            value={countryCode}
            onChangeText={value => {
              setCountryCode(value.toUpperCase())
              setHasChanged(true)
            }}
            maxLength={2}
            placeholder="BR"
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={submit}
            accessibilityHint={_(
              msg`Input 2 letter ISO 3166-1 country code to use as location`,
            )}
          />

          <View style={isWeb && [a.flex_row, a.justify_end]}>
            <Button
              label={hasChanged ? _(msg`Save location`) : _(msg`Done`)}
              size="large"
              onPress={submit}
              variant="solid"
              color="primary">
              <ButtonText>
                {hasChanged ? <Trans>Save</Trans> : <Trans>Done</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function DeerSettingsScreen({}: Props) {
  const {_} = useLingui()

  const goLinksEnabled = useGoLinksEnabled()
  const setGoLinksEnabled = useSetGoLinksEnabled()

  const constellationEnabled = useConstellationEnabled()
  const setConstellationEnabled = useSetConstellationEnabled()

  const directFetchRecords = useDirectFetchRecords()
  const setDirectFetchRecords = useSetDirectFetchRecords()

  const noAppLabelers = useNoAppLabelers()
  const setNoAppLabelers = useSetNoAppLabelers()

  const location = useGeolocation()
  const setLocationControl = Dialog.useDialogControl()

  const repostCarouselEnabled = useRepostCarouselEnabled()
  const setRepostCarouselEnabled = useSetRepostCarouselEnabled()

  const [gates, setGatesView] = useState(Object.fromEntries(useGatesCache()))
  const dangerousSetGate = useDangerousSetGate()
  const setGate = (gate: Gate, value: boolean) => {
    dangerousSetGate(gate, value)
    setGatesView({
      ...gates,
      [gate]: value,
    })
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Deer</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={DeerIcon} />
            <SettingsList.ItemText>
              <Trans>Redirects</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="use_go_links"
              label={_(msg`Redirect through go.bsky.app`)}
              value={goLinksEnabled ?? false}
              onChange={value => setGoLinksEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Redirect through go.bsky.app</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={VisibilityIcon} />
            <SettingsList.ItemText>
              <Trans>Visibility</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="direct_fetch_records"
              label={_(
                msg`Fetch records directly from PDS to see through quote blocks`,
              )}
              value={directFetchRecords}
              onChange={value => setDirectFetchRecords(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  Fetch records directly from PDS to see contents of blocked and
                  detatched quotes
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="constellation_fallback"
              label={_(
                msg`Fall back to constellation api to find blocked replies`,
              )}
              disabled={true}
              value={constellationEnabled}
              onChange={value => setConstellationEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  TODO: Fall back to constellation api to find blocked replies
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Item>
            <SettingsList.ItemIcon icon={GlobeIcon} />
            <SettingsList.ItemText>
              <Trans>{`ISO 3166-1 Location (currently ${
                location.geolocation?.countryCode ?? '?'
              })`}</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeButton
              label={_(msg`Change`)}
              onPress={() => setLocationControl.open()}
            />
          </SettingsList.Item>
          <SettingsList.Item>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                Geolocation country code informs required regional app labelers
                and currency behavior.
              </Trans>
            </Admonition>
          </SettingsList.Item>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={RaisingHandIcon} />
            <SettingsList.ItemText>
              <Trans>Labelers</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="no_app_labelers"
              label={_(msg`Do not declare any app labelers`)}
              value={noAppLabelers}
              onChange={value => setNoAppLabelers(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Do not declare any default app labelers</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>Restart app after changing this setting.</Trans>
            </Admonition>
            <Admonition type="tip" style={[a.flex_1]}>
              <Trans>
                Some appviews will default to using an app labeler if you have
                no labelers, so consider subscribing to at least one labeler.
              </Trans>
            </Admonition>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                App labelers are mandatory top-level labelers that can perform
                "takedowns". This setting does not influence geolocation based
                labelers.
              </Trans>
            </Admonition>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={PaintRollerIcon} />
            <SettingsList.ItemText>
              <Trans>Tweaks</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="repost_carousel"
              label={_(msg`Combine reposts into a horizontal carousel`)}
              value={repostCarouselEnabled}
              onChange={value => setRepostCarouselEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Combine reposts into a horizontal carousel</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="under construction"
              label={_(msg`🚧 under construction...`)}
              value={false}
              onChange={() => {}}
              disabled={true}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>🚧 under construction...</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <SettingsList.ItemText>
              <Trans>Gates</Trans>
            </SettingsList.ItemText>
            {Object.entries(gates).map(([gate, status]) => (
              <Toggle.Item
                key={gate}
                name={gate}
                label={gate}
                value={status}
                onChange={value => setGate(gate as Gate, value)}
                style={[a.w_full]}>
                <Toggle.LabelText style={[a.flex_1]}>{gate}</Toggle.LabelText>
                <Toggle.Platform />
              </Toggle.Item>
            ))}
            <SettingsList.BadgeButton
              label={_(msg`Reset gates`)}
              onPress={() => {
                resetDeerGateCache()
                setGatesView({})
              }}
            />
          </SettingsList.Group>

          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>
                These settings might summon nasel demons! Restart the app after
                changing if anything breaks.
              </Trans>
            </Admonition>
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
      <GeolocationSettingsDialog control={setLocationControl} />
    </Layout.Screen>
  )
}

const styles = {
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
}
