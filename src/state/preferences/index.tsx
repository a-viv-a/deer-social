import type React from 'react'

import {Provider as AltTextRequiredProvider} from './alt-text-required'
import {Provider as AutoplayProvider} from './autoplay'
import {Provider as ConstellationProvider} from './constellation-enabled'
import {Provider as DirectFetchRecordsProvider} from './direct-fetch-records'
import {Provider as DisableHapticsProvider} from './disable-haptics'
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'
import {Provider as GoLinksProvider} from './go-links-enabled'
import {Provider as HiddenPostsProvider} from './hidden-posts'
import {Provider as InAppBrowserProvider} from './in-app-browser'
import {Provider as KawaiiProvider} from './kawaii'
import {Provider as LanguagesProvider} from './languages'
import {Provider as LargeAltBadgeProvider} from './large-alt-badge'
import {Provider as NoAppLabelersProvider} from './no-app-labelers'
import {Provider as RepostCarouselProvider} from './repost-carousel-enabled'
import {Provider as SubtitlesProvider} from './subtitles'
import {Provider as TrendingSettingsProvider} from './trending'
import {Provider as UsedStarterPacksProvider} from './used-starter-packs'

export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {useAutoplayDisabled, useSetAutoplayDisabled} from './autoplay'
export {useHapticsDisabled, useSetHapticsDisabled} from './disable-haptics'
export {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from './external-embeds-prefs'
export {useGoLinksEnabled, useSetGoLinksEnabled} from './go-links-enabled'
export * from './hidden-posts'
export {useLabelDefinitions} from './label-defs'
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {useSetSubtitlesEnabled, useSubtitlesEnabled} from './subtitles'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>
        <GoLinksProvider>
          <NoAppLabelersProvider>
            <DirectFetchRecordsProvider>
              <ConstellationProvider>
                <LargeAltBadgeProvider>
                  <ExternalEmbedsProvider>
                    <HiddenPostsProvider>
                      <InAppBrowserProvider>
                        <DisableHapticsProvider>
                          <AutoplayProvider>
                            <UsedStarterPacksProvider>
                              <SubtitlesProvider>
                                <TrendingSettingsProvider>
                                  <RepostCarouselProvider>
                                    <KawaiiProvider>{children}</KawaiiProvider>
                                  </RepostCarouselProvider>
                              </TrendingSettingsProvider>
                              </SubtitlesProvider>
                            </UsedStarterPacksProvider>
                          </AutoplayProvider>
                        </DisableHapticsProvider>
                      </InAppBrowserProvider>
                    </HiddenPostsProvider>
                  </ExternalEmbedsProvider>
                </LargeAltBadgeProvider>
              </ConstellationProvider>
            </DirectFetchRecordsProvider>
          </NoAppLabelersProvider>
        </GoLinksProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
