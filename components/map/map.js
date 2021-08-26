import React, {useState, useMemo, useEffect, useCallback, useContext} from 'react'
import PropTypes from 'prop-types'
import {useRouter} from 'next/router'
import MapGl from 'react-map-gl'
import {fromJS} from 'immutable'
import {Pane, MapMarkerIcon, EyeOffIcon, EyeOpenIcon} from 'evergreen-ui'

import MapContext from '../../contexts/map'
import BalDataContext from '../../contexts/bal-data'
import TokenContext from '../../contexts/token'
import DrawContext from '../../contexts/draw'
import ParcellesContext from '../../contexts/parcelles'

import {addNumero, addToponyme, addVoie} from '../../lib/bal-api'

import AddressEditor from '../bal/address-editor'

import {vector, ortho} from './styles'

import NavControl from './nav-control'
import EditableMarker from './editable-marker'
import Control from './control'
import NumeroMarker from './numero-marker'
import ToponymeMarker from './toponyme-marker'
import Draw from './draw'
import StyleSelector from './style-selector'

import useBounds from './hooks/bounds'
import useSources from './hooks/sources'
import useLayers from './hooks/layers'
import useHovered from './hooks/hovered'

const settings = {
  maxZoom: 19
}

function getInteractionProps(enabled) {
  return {
    dragPan: enabled,
    dragRotate: enabled,
    scrollZoom: enabled,
    touchZoom: enabled,
    touchRotate: enabled,
    keyboard: enabled,
    doubleClickZoom: enabled
  }
}

function getBaseStyle(style) {
  switch (style) {
    case 'ortho':
      return ortho

    case 'vector':
      return vector

    default:
      return vector
  }
}

function generateNewStyle(style, sources, layers) {
  let baseStyle = getBaseStyle(style)

  for (const {name, data} of sources) {
    baseStyle = baseStyle.setIn(
      ['sources', name],
      fromJS({
        type: 'geojson',
        data
      })
    )
  }

  return baseStyle.updateIn(['layers'], arr => arr.push(...layers))
}

function Map({interactive, commune, voie, toponyme}) {
  const router = useRouter()
  const {
    map,
    setMap,
    style,
    setStyle,
    defaultStyle,
    viewport,
    setViewport,
    showCadastre,
    setShowCadastre
  } = useContext(MapContext)
  const {isParcelleSelectionEnabled, handleParcelle} = useContext(ParcellesContext)

  const [showNumeros, setShowNumeros] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(null)
  const [editPrevStyle, setEditPrevSyle] = useState(defaultStyle)
  const [mapStyle, setMapStyle] = useState(getBaseStyle(defaultStyle))
  const [isToponyme, setIsToponyme] = useState(false)

  const {
    baseLocale,
    numeros,
    toponymes,
    editingId,
    setEditingId,
    setIsEditing,
    reloadVoies,
    reloadNumeros,
    isEditing
  } = useContext(BalDataContext)
  const {modeId} = useContext(DrawContext)
  const {token} = useContext(TokenContext)

  const [hovered, setHovered, handleHover] = useHovered()
  const sources = useSources(voie, toponyme, hovered, editingId)
  const bounds = useBounds(commune, voie, toponyme)
  const layers = useLayers(voie, sources, showCadastre, style)

  const mapRef = useCallback(
    ref => {
      if (ref) {
        setMap(ref.getMap())
      }
    },
    [setMap]
  )

  const interactiveLayerIds = useMemo(() => {
    const layers = []

    if (isParcelleSelectionEnabled && showCadastre) {
      return ['parcelles-fill']
    }

    if (sources.find(({name}) => name === 'voies')) {
      layers.push('voie-trace-line')
    }

    if (sources.find(({name}) => name === 'positions')) {
      layers.push('numeros-point', 'numeros-label')
    }

    if (!voie && sources.find(({name}) => name === 'voies')) {
      layers.push('voie-label')
    }

    return layers
  }, [isParcelleSelectionEnabled, sources, voie, showCadastre])

  const onShowNumeroChange = useCallback(value => {
    setShowNumeros(value)
  }, [])

  const onClick = useCallback(
    event => {
      const feature = event.features && event.features[0]

      if (feature && feature.source === 'cadastre') {
        handleParcelle(feature.properties.id)
      }

      if (feature && feature.properties.idVoie && !isEditing) {
        const {idVoie} = feature.properties
        if (feature.layer.id === 'voie-trace-line' && voie && idVoie === voie._id) {
          setEditingId(voie._id)
        } else {
          router.push(
            `/bal/voie?balId=${baseLocale._id}&codeCommune=${commune.code}&idVoie=${idVoie}`,
            `/bal/${baseLocale._id}/communes/${commune.code}/voies/${idVoie}`
          )
        }
      }

      setShowContextMenu(null)
    },
    [router, baseLocale, commune, setEditingId, isEditing, voie, handleParcelle]
  )

  const reloadView = useCallback(
    (idVoie, isVoiesList, isNumeroCreated) => {
      if (voie && voie._id === idVoie) {
        // Numéro créé sur la voie en cours
        reloadNumeros()
      } else if (isNumeroCreated) {
        // Numéro créé depuis la vue commune ou une autre voie
        router.push(
          `/bal/voie?balId=${baseLocale._id}&codeCommune=${commune.code}&idVoie=${idVoie}`,
          `/bal/${baseLocale._id}/communes/${commune.code}/voies/${idVoie}`
        )
      } else if (isVoiesList) {
        // Toponyme créé depuis la vue commune
        reloadVoies()
      } else {
        // Toponyme créé depuis la vue voie
        router.push(
          `/bal/commune?balId=${baseLocale._id}&codeCommune=${commune.code}`,
          `/bal/${baseLocale._id}/communes/${commune.code}`
        )
      }
    },
    [router, baseLocale._id, commune, voie, reloadNumeros, reloadVoies]
  )

  const onAddNumero = useCallback(
    async (voieData, numero) => {
      let editedVoie = voieData

      if (!editedVoie._id) {
        editedVoie = await addVoie(baseLocale._id, commune.code, editedVoie, token)
      }

      if (numero) {
        await addNumero(editedVoie._id, numero, token)
      }

      setOpenForm(false)
      reloadView(editedVoie._id, Boolean(!voie), Boolean(numero))
    },
    [baseLocale._id, commune, voie, token, reloadView]
  )

  const onAddToponyme = useCallback(
    async toponymeData => {
      const editedToponyme = await addToponyme(baseLocale._id, commune.code, toponymeData, token)

      setOpenForm(false)
      router.push(
        `/bal/toponyme?balId=${baseLocale._id}&codeCommune=${commune.code}&idToponyme=${editedToponyme._id}`,
        `/bal/${baseLocale._id}/communes/${commune.code}/toponymes/${editedToponyme._id}`
      )
    },
    [baseLocale._id, commune, token, router]
  )

  const handleCursor = useCallback(
    ({isHovering}) => {
      if (modeId === 'drawLineString') {
        return 'crosshair'
      }

      return isHovering ? 'pointer' : 'default'
    },
    [modeId]
  )

  useEffect(() => {
    if (sources.length > 0) {
      setMapStyle(generateNewStyle(style, sources, layers))
    } else {
      setMapStyle(getBaseStyle(interactive ? style : defaultStyle))
    }
  }, [interactive, sources, layers, style, defaultStyle])

  useEffect(() => {
    setStyle(prevStyle => {
      if (modeId) {
        setEditPrevSyle(prevStyle)
        return 'ortho'
      }

      return editPrevStyle
    })
  }, [modeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (map) {
      if (bounds === null) {
        setViewport(viewport => ({...viewport}))
      } else if (bounds !== false) {
        const camera = map.cameraForBounds(bounds, {
          padding: 100
        })

        if (camera) {
          setViewport(viewport => ({
            ...viewport,
            bearing: camera.bearing,
            longitude: camera.center.lng,
            latitude: camera.center.lat,
            zoom: camera.zoom
          }))
        }
      }
    }
  }, [map, bounds, setViewport])

  useEffect(() => {
    setIsEditing(openForm)
  }, [setIsEditing, openForm])

  return (
    <Pane display='flex' flexDirection='column' flex={1}>
      {interactive && (
        <StyleSelector
          isFormOpen={openForm}
          style={style}
          handleStyle={setStyle}
          showCadastre={showCadastre}
          handleCadastre={setShowCadastre}
        />
      )}

      <Pane
        position='absolute'
        className='mapboxgl-ctrl-group mapboxgl-ctrl'
        top={88}
        right={16}
        zIndex={2}
      >
        {(voie || (toponymes && toponymes.length > 0)) && (
          <Control
            icon={showNumeros ? EyeOffIcon : EyeOpenIcon}
            enabled={showNumeros}
            enabledHint={toponymes ? 'Masquer les toponymes' : 'Masquer les numéros'}
            disabledHint={toponymes ? 'Afficher les toponymes' : 'Afficher les numéros'}
            onChange={onShowNumeroChange}
          />
        )}

        {token && commune && (
          <Control
            icon={MapMarkerIcon}
            enabled={openForm}
            isDisabled={isEditing}
            enabledHint='Annuler'
            disabledHint='Créer une adresse'
            onChange={setOpenForm}
          />
        )}
      </Pane>

      <Pane display='flex' flex={1}>
        <MapGl
          ref={mapRef}
          reuseMap
          viewState={viewport}
          mapStyle={mapStyle}
          width='100%'
          height='100%'
          {...settings}
          {...getInteractionProps(interactive)}
          interactiveLayerIds={interactiveLayerIds}
          getCursor={handleCursor}
          onClick={onClick}
          onHover={handleHover}
          onMouseLeave={() => setHovered(null)}
          onViewportChange={setViewport}
        >
          {interactive && <NavControl onViewportChange={setViewport} />}

          {(voie || toponyme) &&
            !modeId &&
            numeros &&
            numeros
              .filter(({_id}) => _id !== editingId)
              .map(numero => (
                <NumeroMarker
                  key={numero._id}
                  numero={
                    toponyme
                      ? {
                          ...numero,
                          numeroComplet: `${numero.numero}${numero.suffixe || ''}`
                        }
                      : numero
                  }
                  colorSeed={toponyme ? numero.voie._id : voie._id}
                  showLabel={showNumeros}
                  showContextMenu={numero._id === showContextMenu}
                  setShowContextMenu={setShowContextMenu}
                />
              ))}

          {toponymes &&
            toponymes.map(toponyme => (
              <ToponymeMarker
                key={toponyme._id}
                initialToponyme={toponyme}
                showLabel={showNumeros}
                showContextMenu={toponyme._id === showContextMenu}
                setShowContextMenu={setShowContextMenu}
              />
            ))}

          {isEditing && (
            <EditableMarker
              style={style || defaultStyle}
              idVoie={voie ? voie._id : null}
              isToponyme={isToponyme}
              viewport={viewport}
            />
          )}

          <Draw />
        </MapGl>
      </Pane>

      {commune && openForm && (
        <Pane padding={20} background='white' height={400} overflowY='auto'>
          <AddressEditor
            isToponyme={isToponyme}
            setIsToponyme={setIsToponyme}
            onAddNumero={onAddNumero}
            onAddToponyme={onAddToponyme}
            onCancel={() => setOpenForm(false)}
          />
        </Pane>
      )}
    </Pane>
  )
}

Map.propTypes = {
  interactive: PropTypes.bool,
  commune: PropTypes.object,
  voie: PropTypes.object,
  toponyme: PropTypes.object
}

Map.defaultProps = {
  interactive: true,
  commune: null,
  voie: null,
  toponyme: null
}

export default Map
