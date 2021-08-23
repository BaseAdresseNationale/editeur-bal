import React, {useState, useContext, useEffect, useCallback} from 'react'
import PropTypes from 'prop-types'

import MapContext from './map'

const ParcellesContext = React.createContext()

let LOAD = false

function getHoveredFeatureId(map, id) {
  const features = map.querySourceFeatures('cadastre', {
    sourceLayer: 'parcelles', filter: ['==', ['get', 'id'], id],
  })
  const [feature] = features
  return feature?.id
}

export function ParcellesContextProvider(props) {
  const {map} = useContext(MapContext)

  const [isParcelleSelectionEnabled, setIsParcelleSelectionEnabled] = useState(false)
  const [selectedParcelles, setSelectedParcelles] = useState([])
  const [hoveredParcelle, setHoveredParcelle] = useState(null)
  const [isLayerLoaded, setIsLayerLoaded] = useState(false)

  const handleParcelle = useCallback(parcelle => {
    if (isParcelleSelectionEnabled) {
      setSelectedParcelles(parcelles => {
        if (selectedParcelles.includes(parcelle)) {
          return selectedParcelles.filter(id => id !== parcelle)
        }

        return [...parcelles, parcelle]
      })
    }
  }, [selectedParcelles, isParcelleSelectionEnabled])

  const handleHoveredParcelle = useCallback(hovered => {
    if (map) {
      setHoveredParcelle(previous => {
        if (previous) {
          map.setFeatureState({source: 'cadastre', sourceLayer: 'parcelles', id: previous.featureId}, {hover: false})
        }

        if (hovered) {
          const featureId = hovered.featureId || getHoveredFeatureId(map, hovered.id)

          if (featureId) {
            map.setFeatureState({source: 'cadastre', sourceLayer: 'parcelles', id: featureId}, {hover: true})
          }

          return {id: hovered.id, featureId}
        }

        return null
      })
    }
  }, [map])

  const highlightParcelles = useCallback(parcelles => {
    if (map && isLayerLoaded) {
      const filters = isParcelleSelectionEnabled
        ? ['any', ...parcelles.map(id => ['==', ['get', 'id'], id])]
        : ['==', ['get', 'id'], '']
      map.setFilter('parcelle-highlighted', filters)
    }
  }, [map, isLayerLoaded, isParcelleSelectionEnabled])

  // Use state to know when parcelle-highlighted layer is loaded
  const handleLoad = useCallback(() => {
    const layer = map.getLayer('parcelle-highlighted')
    setIsLayerLoaded(Boolean(layer))
  }, [map, setIsLayerLoaded])

  // Clean hovered parcelle when selection is disabled
  useEffect(() => {
    if (!isParcelleSelectionEnabled && map) {
      setHoveredParcelle(previous => {
        if (previous) {
          map.setFeatureState({source: 'cadastre', sourceLayer: 'parcelles', id: previous.featureId}, {hover: false})
          return null
        }
      })
    }
  }, [map, isParcelleSelectionEnabled, hoveredParcelle])

  // Reset IsLayerLoaded when selection is disabled
  useEffect(() => {
    if (!isParcelleSelectionEnabled) {
      setSelectedParcelles([])
      setIsLayerLoaded(false)
    }
  }, [isParcelleSelectionEnabled])

  // Updates highlighted parcelles when parcelles changes
  // or when selection is enabled/disabled
  useEffect(() => {
    highlightParcelles(selectedParcelles)
  }, [isParcelleSelectionEnabled, isLayerLoaded, selectedParcelles, highlightParcelles])

  // Look styledata event
  // to know if parcelle-highlighted layer is loaded or not
  useEffect(() => {
    if (map && !LOAD) {
      LOAD = true
      map.on('styledata', handleLoad)
      map.on('styledataloading', handleLoad)
    }

    return () => {
      if (map) {
        map.off('styledata', handleLoad)
        map.off('styledataloading', handleLoad)
      }
    }
  }, [map, handleLoad])

  return (
    <ParcellesContext.Provider
      value={{
        selectedParcelles, setSelectedParcelles,
        isParcelleSelectionEnabled, setIsParcelleSelectionEnabled,
        handleParcelle,
        hoveredParcelle, handleHoveredParcelle,
      }}
      {...props}
    />
  )
}

ParcellesContextProvider.defaultProps = {
  codeCommune: null,
}

ParcellesContextProvider.propTypes = {
  codeCommune: PropTypes.string,
}

export default ParcellesContext
