import {useEffect, useState} from 'react'
import {type TextStyle, View} from 'react-native'
import {Image as SvgImage, Svg} from 'react-native-svg'
import {type $Typed, type AppBskyRichtextFacet} from '@atproto/api'
import {type SelfLabels} from '@atproto/api/dist/client/types/com/atproto/label/defs'
import LottieView from 'lottie-react-native'

import {resolvePdsServiceUrl} from '#/state/queries/resolve-identity'
import {useAgent} from '#/state/session'
import {BluemojiHoverCard} from './BluemojiHoverCard'

interface BluemojiFormats {
  $type?: 'blue.moji.richtext.facet#formats_v0'
  png_128?: string // cid
  webp_128?: string // cid
  gif_128?: string // cid
  apng_128?: boolean
  lottie?: boolean
}

interface LegacyBluemojiFeature {
  $type?: 'blue.moji.richtext.facet#bluemoji'
  uri: string
  name: string
  alt: string
}

interface BluemojiFeature {
  $type?: 'blue.moji.richtext.facet'
  name: string
  alt: string
  did: string
  adultOnly?: boolean
  labels: SelfLabels
  formats: BluemojiFormats
}

export type ExtendedFacet =
  | AppBskyRichtextFacet.Main
  | {
      features: ($Typed<LegacyBluemojiFeature> | $Typed<BluemojiFeature>)[]
    }

interface BluemojiRecord {
  $type?: 'blue.moji.collection.item'
  name: string
  alt: string
  createdAt: string
  formats: {
    $type?: 'blue.moji.collection.item#formats_v0'
    lottie?: Uint8Array
    apng?: Uint8Array
    // Plus other formats that don't matter for our purposes
  }
}

export function containsBluemoji(facet: ExtendedFacet) {
  if (!facet) return false
  return (
    facet.features.find(e => e.$type === 'blue.moji.richtext.facet') !==
    undefined
  )
}

function findBluemoji(facet: ExtendedFacet): BluemojiFeature | undefined {
  if (!facet) return undefined
  return facet.features.find(e => e.$type === 'blue.moji.richtext.facet') as
    | BluemojiFeature
    | undefined
}

function BluemojiPlaceholder({
  style,
  name,
  alt,
}: {
  style: TextStyle
  name: string
  alt: string
}) {
  return (
    <Svg
      viewBox="0 0 100 100"
      style={{userSelect: 'text', cursor: 'auto'}}
      width={((style.fontSize ?? 16) * 23.5) / 20}
      height={((style.fontSize ?? 16) * 23.5) / 20}
      translateY={((style.fontSize ?? 16) * 5) / 20}
      title={name}
      accessible
      accessibilityLabel={name}
      accessibilityHint={alt}>
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gradient)">
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="translate"
          dur="1s"
          values="0 -50;0 50;0 -50"
          calcMode="spline"
          keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
          repeatCount="indefinite"
        />
      </rect>
    </Svg>
  )
}

function toImageUri(pds: string, did: string, cid: string) {
  return `${pds}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`
}

function BluemojiStaticInner({
  style,
  emoji,
}: {
  emoji: BluemojiFeature
  style: TextStyle
}) {
  const [emojiUri, setEmojiUri] = useState<string>()
  const [isLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    async function fetchEmojiUri() {
      const pds = await resolvePdsServiceUrl(emoji.did as `did:${string}`)

      let uri
      // Render in this order
      if (emoji.formats.png_128) {
        uri = toImageUri(pds, emoji.did, emoji.formats.png_128)
      } else if (emoji.formats.webp_128) {
        uri = toImageUri(pds, emoji.did, emoji.formats.webp_128)
      } else if (emoji.formats.gif_128) {
        // GIFs in this case are NOT animated
        uri = toImageUri(pds, emoji.did, emoji.formats.gif_128)
      }

      setEmojiUri(uri)
    }

    fetchEmojiUri()
  }, [emoji])

  // Abusing an SVG in this way is not in any way ideal, but
  // AFAIK, <Image> doesn't let you inline it. So this will have to suffice
  return (
    <BluemojiHoverCard
      name={emoji.name}
      uri={emojiUri!}
      description={emoji.alt}>
      <>
        <Svg
          viewBox="0 0 14 14"
          style={{
            userSelect: 'text',
            cursor: 'auto',
            display: isLoaded ? undefined : 'none',
          }}
          width={((style.fontSize ?? 16) * 23.5) / 20}
          height={((style.fontSize ?? 16) * 23.5) / 20}
          translateY={((style.fontSize ?? 16) * 5) / 20}
          title={emoji.name}
          accessible
          accessibilityLabel={emoji.name}
          accessibilityHint={emoji.alt}>
          <SvgImage
            href={emojiUri}
            width="14"
            height="14"
            onLoad={() => setLoaded(true)}
          />
        </Svg>
        {!isLoaded && (
          <BluemojiPlaceholder
            style={style}
            name={emoji.name}
            alt={emoji.alt}
          />
        )}
      </>
    </BluemojiHoverCard>
  )
}

// https://stackoverflow.com/a/66046176/16255372
async function bufferToBase64(buffer: Uint8Array) {
  // use a FileReader to generate a base64 data URI:
  const base64url = await new Promise<string>(r => {
    const reader = new FileReader()
    reader.onload = () => r(reader.result as string)
    reader.readAsDataURL(new Blob([buffer]))
  })
  // remove the `data:...;base64,` part from the start
  return base64url.slice(base64url.indexOf(',') + 1)
}

function BluemojiLottieInner({
  style,
  emoji,
}: {
  emoji: BluemojiFeature
  style: TextStyle
}) {
  const agent = useAgent()
  const [emojiSource, setEmojiSource] = useState<string>()
  const [isLoaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    async function fetchEmojiSource() {
      const emojiRecord = await agent.com.atproto.repo.getRecord({
        repo: emoji.did,
        collection: 'blue.moji.collection.item',
        rkey: emoji.name.slice(1, -1),
      })

      console.log(emojiRecord)
      const bytes = (emojiRecord.data.value as any as BluemojiRecord).formats
        .lottie!
      // https://stackoverflow.com/questions/13950865/javascript-render-png-stored-as-uint8array-onto-canvas-element-without-data-uri
      const source =
        'data:video/lottie+json;base64,' +
        encodeURIComponent(await bufferToBase64(bytes))

      setEmojiSource(source)
    }

    fetchEmojiSource()
  }, [emoji, agent])

  return (
    <BluemojiHoverCard
      name={emoji.name}
      uri={emojiSource!}
      description={emoji.alt}>
      <View
        style={{
          width: ((style.fontSize ?? 16) * 23.5) / 20,
          height: ((style.fontSize ?? 16) * 23.5) / 20,
        }}>
        {emojiSource && (
          <View
            style={{
              width: '100%',
              height: '100%',
              transform: `translateY(${((style.fontSize ?? 16) * 5) / 20}px)`,
            }}>
            <LottieView
              source={emojiSource}
              autoPlay
              loop
              onAnimationLoaded={() => setLoaded(true)}
            />
          </View>
        )}
        {!isLoaded && (
          <BluemojiPlaceholder
            style={style}
            name={emoji.name}
            alt={emoji.alt}
          />
        )}
      </View>
    </BluemojiHoverCard>
  )
}

export function BluemojiEmoji({
  facet,
  style,
}: {
  style: TextStyle
  facet: ExtendedFacet
}) {
  const emoji: BluemojiFeature | undefined = findBluemoji(facet)
  if (!emoji) return <></>

  // Note: For some reason, ALL emojis get a lottie field, valid or otherwise
  // for pngs and webps etc., this is just set to a base64 encoded version of the png
  // So, to check if an emoji is truly in lottie format, we have to check if it NOT a png/webp
  // which is just as simple as checking for if any of those fields are set

  // Render static image
  if (
    emoji.formats.png_128 ||
    emoji.formats.webp_128 ||
    emoji.formats.gif_128
  ) {
    return <BluemojiStaticInner style={style} emoji={emoji} />
  } else if (emoji.formats.lottie) {
    return <BluemojiLottieInner style={style} emoji={emoji} />
  } else {
    return <></>
  }
}
