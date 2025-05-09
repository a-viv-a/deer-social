import React from 'react'
import {
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {type Image as RNImage} from 'react-native-image-crop-picker'
import {
  type MeasuredDimensions,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated'
import {Image} from 'expo-image'
import {type ModerationUI} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {measureHandle, useHandleRef} from '#/lib/hooks/useHandleRef'
import {usePalette} from '#/lib/hooks/usePalette'
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {colors} from '#/lib/styles'
import {useTheme} from '#/lib/ThemeContext'
import {logger} from '#/logger'
import {isAndroid, isNative} from '#/platform/detection'
import {useLightboxControls} from '#/state/lightbox'
import {
  maybeModifyHighQualityImage,
  useHighQualityImages,
} from '#/state/preferences/high-quality-images'
import {EventStopper} from '#/view/com/util/EventStopper'
import {tokens, useTheme as useAlfTheme} from '#/alf'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilled,
  Camera_Stroke2_Corner0_Rounded as Camera,
} from '#/components/icons/Camera'
import {StreamingLive_Stroke2_Corner0_Rounded as Library} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {openCamera, openCropper, openPicker} from '../../../lib/media/picker'

export function UserBanner({
  type,
  banner,
  moderation,
  onSelectNewBanner,
}: {
  type?: 'labeler' | 'default'
  banner?: string | null
  moderation?: ModerationUI
  onSelectNewBanner?: (img: RNImage | null) => void
}) {
  const pal = usePalette('default')
  const theme = useTheme()
  const t = useAlfTheme()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const {openLightbox} = useLightboxControls()
  const highQualityImages = useHighQualityImages()

  const bannerRef = useHandleRef()

  const onOpenCamera = React.useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }
    onSelectNewBanner?.(
      await openCamera({
        width: 3000,
        height: 1000,
      }),
    )
  }, [onSelectNewBanner, requestCameraAccessIfNeeded])

  const onOpenLibrary = React.useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await sheetWrapper(openPicker())
    if (!items[0]) {
      return
    }

    try {
      onSelectNewBanner?.(
        await openCropper({
          mediaType: 'photo',
          path: items[0].path,
          width: 3000,
          height: 1000,
          webAspectRatio: 3,
        }),
      )
    } catch (e: any) {
      if (!String(e).includes('Canceled')) {
        logger.error('Failed to crop banner', {error: e})
      }
    }
  }, [onSelectNewBanner, requestPhotoAccessIfNeeded, sheetWrapper])

  const onRemoveBanner = React.useCallback(() => {
    onSelectNewBanner?.(null)
  }, [onSelectNewBanner])

  const _openLightbox = React.useCallback(
    (uri: string, thumbRect: MeasuredDimensions | null) => {
      openLightbox({
        images: [
          {
            uri: maybeModifyHighQualityImage(uri, highQualityImages),
            thumbUri: maybeModifyHighQualityImage(uri, highQualityImages),
            thumbRect,
            dimensions: thumbRect,
            thumbDimensions: null,
            type: 'image',
          },
        ],
        index: 0,
      })
    },
    [openLightbox, highQualityImages],
  )

  const onPressBanner = React.useCallback(() => {
    if (banner && !(moderation?.blur && moderation?.noOverride)) {
      const bannerHandle = bannerRef.current
      runOnUI(() => {
        'worklet'
        const rect = measureHandle(bannerHandle)
        runOnJS(_openLightbox)(banner, rect)
      })()
    }
  }, [banner, moderation, _openLightbox, bannerRef])

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <EventStopper onKeyDown={true}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Edit avatar`)}>
          {({props}) => (
            <Pressable {...props} testID="changeBannerBtn">
              {banner ? (
                <Image
                  testID="userBannerImage"
                  style={styles.bannerImage}
                  source={{
                    uri: maybeModifyHighQualityImage(banner, highQualityImages),
                  }}
                  accessible={true}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  testID="userBannerFallback"
                  style={[styles.bannerImage, t.atoms.bg_contrast_25]}
                />
              )}
              <View style={[styles.editButtonContainer, pal.btn]}>
                <CameraFilled height={14} width={14} style={t.atoms.text} />
              </View>
            </Pressable>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            {isNative && (
              <Menu.Item
                testID="changeBannerCameraBtn"
                label={_(msg`Upload from Camera`)}
                onPress={onOpenCamera}>
                <Menu.ItemText>
                  <Trans>Upload from Camera</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={Camera} />
              </Menu.Item>
            )}

            <Menu.Item
              testID="changeBannerLibraryBtn"
              label={_(msg`Upload from Library`)}
              onPress={onOpenLibrary}>
              <Menu.ItemText>
                {isNative ? (
                  <Trans>Upload from Library</Trans>
                ) : (
                  <Trans>Upload from Files</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon icon={Library} />
            </Menu.Item>
          </Menu.Group>
          {!!banner && (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  testID="changeBannerRemoveBtn"
                  label={_(msg`Remove Banner`)}
                  onPress={onRemoveBanner}>
                  <Menu.ItemText>
                    <Trans>Remove Banner</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={Trash} />
                </Menu.Item>
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : banner &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <TouchableWithoutFeedback
      testID="profileHeaderAviButton"
      onPress={onPressBanner}
      accessibilityRole="image"
      accessibilityLabel={_(msg`View profile banner`)}
      accessibilityHint="">
      <Image
        testID="userBannerImage"
        style={[
          styles.bannerImage,
          {backgroundColor: theme.palette.default.backgroundLight},
        ]}
        contentFit="cover"
        source={{uri: maybeModifyHighQualityImage(banner, highQualityImages)}}
        blurRadius={moderation?.blur ? 100 : 0}
        accessible={true}
        accessibilityIgnoresInvertColors
      />
    </TouchableWithoutFeedback>
  ) : (
    <View
      testID="userBannerFallback"
      style={[
        styles.bannerImage,
        type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 8,
    right: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray5,
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  labelerBanner: {
    backgroundColor: tokens.color.temp_purple,
  },
})
