import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['highQualityImages']
type SetContext = (v: persisted.Schema['highQualityImages']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.highQualityImages,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['highQualityImages']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('highQualityImages'))

  const setStateWrapped = React.useCallback(
    (highQualityImages: persisted.Schema['highQualityImages']) => {
      setState(highQualityImages)
      persisted.write('highQualityImages', highQualityImages)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('highQualityImages', nextHighQualityImages => {
      setState(nextHighQualityImages)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useHighQualityImages() {
  return React.useContext(stateContext)
}

export function useSetHighQualityImages() {
  return React.useContext(setContext)
}

// This is a little weird to have here imo but it works I guess
function modifyHighQualityImage(src: string) {
  try {
    const url = new URL(src)
    if (url.hostname === 'cdn.bsky.app' && url.pathname.endsWith('@jpeg')) {
      url.pathname = url.pathname.replace(/@jpeg$/, '@png')
      return url.toString()
    }
  } catch {
    // ignored, in case the URL is somehow malformed
  }

  return null
}

// Like `hackModifyThumbnailPath`, it's easier to just pipe the src into a function like this
export function maybeModifyHighQualityImage(src: string, isEnabled?: boolean) {
  if (isEnabled) {
    return modifyHighQualityImage(src) ?? src
  } else {
    return src
  }
}
