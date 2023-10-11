import React, {useState} from 'react'
import Head from 'next/head'
import {Pane, Dialog, Paragraph} from 'evergreen-ui'

import 'maplibre-gl/dist/maplibre-gl.css'

import {LocalStorageContextProvider} from '@/contexts/local-storage'
import {HelpContextProvider} from '@/contexts/help'
import {TokenContextProvider} from '@/contexts/token'

import ErrorPage from './_error'

import Header from '@/components/header'
import IEWarning from '@/components/ie-warning'
import Help from '@/components/help'
import useMatomoTracker from '@/hooks/matomo-tracker'
import Editor from '@/layouts/editor'

interface _AppProps {
  Component: any;
  pageProps: any;
  error?: any;
  router: any;
}

function App(props: _AppProps) {
  const {Component, pageProps, error, router} = props
  const {query} = router

  const [isMobileWarningDisplayed, setIsMobileWarningDisplayed] = useState(false)

  useMatomoTracker({
    trackingEnabled: process.env.NODE_ENV === 'production',
    siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    trackerUrl: process.env.NEXT_PUBLIC_MATOMO_TRACKER_URL
  }, pageProps)

  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>mes-adresses.data.gouv.fr</title>
      </Head>

      <Pane>
        <Dialog
          isShown={isMobileWarningDisplayed}
          title='Attention'
          confirmLabel='Continuer'
          hasCancel={false}
          onCloseComplete={() => {
            setIsMobileWarningDisplayed(false)
          }}
        >
          <Paragraph marginTop='default'>
            Afin de profiter d’une meilleure expérience, il est recommandé d’utiliser cet outil sur un écran plus grand 🖥
          </Paragraph>
          <Paragraph marginTop='default'>
            Une version mobile est en cours de développement pour toujours avoir sa Base Adresse Locale à portée de main 💪🏻
          </Paragraph>
          <Paragraph marginTop='default'>
            Merci de votre patience 🙏
          </Paragraph>
        </Dialog>
      </Pane>

      <LocalStorageContextProvider>
        <TokenContextProvider balId={query.balId} _token={query.token}>
          <HelpContextProvider>

            <Help />

            <Pane height='100%' width='100%' display='flex' flexDirection='column'>
              <Header />
              {error ? (
                <ErrorPage statusCode={error.statusCode} />
              ) : (
                <>
                  <IEWarning />
                  {query.balId ? (
                    <Editor {...pageProps}>
                      <Component {...pageProps} />
                    </Editor>
                  ) : (
                    <Component {...pageProps} />
                  )}
                </>
              )}
            </Pane>
          </HelpContextProvider>
        </TokenContextProvider>
      </LocalStorageContextProvider>
      {/* ⚠️ This is needed to expand Evergreen’Tootip width
      It select all Tooltip components with 'appearance: card' propertie */}
      <style jsx global>{`
        div[id^="evergreen-tooltip"].ub-max-w_240px.ub-bg-clr_white.ub-box-szg_border-box {
          max-width: fit-content;
        }
      `}</style>
    </>
  )
}

export default App
