import {useState, useMemo} from 'react'
import PropTypes from 'prop-types'

import {SettingsContextProvider} from '@/contexts/settings'
import {DrawContextProvider} from '@/contexts/draw'
import {MarkersContextProvider} from '@/contexts/markers'
import {MapContextProvider} from '@/contexts/map'
import {BalDataContextProvider} from '@/contexts/bal-data'
import {ParcellesContextProvider} from '@/contexts/parcelles'

import Sidebar from '@/layouts/sidebar'

import SubHeader from '@/components/sub-header'
import Map from '@/components/map'
import WelcomeMessage from '@/components/welcome-message'
import CertificationMessage from '@/components/certification-message'
import Settings from '@/components/settings'
import AddressEditor from '@/components/bal/address-editor'

function Editor({baseLocale, commune, voie, toponyme, voies, toponymes, numeros, children}) {
  const [isHidden, setIsHidden] = useState(false)
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false)

  const leftOffset = useMemo(() => {
    return isHidden ? 0 : 500
  }, [isHidden])

  const topOffset = useMemo(() => {
    return baseLocale.status === 'demo' ? 166 : 116
  }, [baseLocale])

  return (
    <BalDataContextProvider
      initialBaseLocale={baseLocale}
      initialVoie={voie}
      initialToponyme={toponyme}
      initialVoies={voies}
      initialToponymes={toponymes}
      initialNumeros={numeros}
    >
      <MapContextProvider>
        <DrawContextProvider>
          <MarkersContextProvider>
            <ParcellesContextProvider>

              <SettingsContextProvider>
                <Settings />
                <SubHeader commune={commune} />
              </SettingsContextProvider>

              <Map
                top={116}
                left={leftOffset}
                commune={commune}
                isAddressFormOpen={isAddressFormOpen}
                handleAddressForm={setIsAddressFormOpen}
              />

              <Sidebar
                top={topOffset}
                isHidden={isHidden}
                size={500}
                elevation={2}
                background='tint2'
                display='flex'
                flexDirection='column'
                onToggle={setIsHidden}
              >
                <>
                  <WelcomeMessage />
                  {baseLocale.status === 'published' && (
                    <CertificationMessage balId={baseLocale._id} />
                  )}

                  {isAddressFormOpen ? (
                    <AddressEditor commune={commune} closeForm={() => setIsAddressFormOpen(false)} />
                  ) : (
                    children
                  )}
                </>
              </Sidebar>
            </ParcellesContextProvider>
          </MarkersContextProvider>
        </DrawContextProvider>
      </MapContextProvider>
    </BalDataContextProvider>
  )
}

Editor.propTypes = {
  baseLocale: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  commune: PropTypes.object.isRequired,
  voie: PropTypes.object,
  toponyme: PropTypes.object,
  voies: PropTypes.array,
  toponymes: PropTypes.array,
  numeros: PropTypes.array,
  children: PropTypes.node.isRequired
}

export default Editor
