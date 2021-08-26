import React, {useState, useCallback, useContext, useEffect, useMemo} from 'react'
import PropTypes from 'prop-types'
import {Marker} from 'react-map-gl'
import {Pane, MapMarkerIcon, Text} from 'evergreen-ui'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import length from '@turf/length'
import lineSlice from '@turf/line-slice'

import MarkersContext from '../../contexts/markers'
import BalDataContext from '../../contexts/bal-data'

function EditableMarker({size, style, idVoie, isToponyme, viewport}) {
  const {markers, updateMarker, overrideText, suggestedNumero, setSuggestedNumero} =
    useContext(MarkersContext)
  const {geojson, isEditing} = useContext(BalDataContext)

  const [suggestedMarkerNumero, setSuggestedMarkerNumero] = useState(suggestedNumero)

  const numberToDisplay = !isToponyme && (overrideText || suggestedMarkerNumero)
  const voie = useMemo(() => {
    if (idVoie) {
      return geojson.features
        .filter(({geometry}) => geometry.type === 'LineString')
        .find(({properties}) => properties.idVoie === idVoie)
    }
  }, [idVoie, geojson])

  const isSuggestionNeeded = useMemo(() => {
    return !isToponyme && !overrideText && voie
  }, [isToponyme, overrideText, voie])

  const computeSuggestedNumero = useCallback(
    coordinates => {
      if (isSuggestionNeeded) {
        const {geometry} = voie
        const point = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates
          }
        }
        const from = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: geometry.coordinates[0]
          }
        }

        const to = nearestPointOnLine({type: 'Feature', geometry}, point, {
          units: 'kilometers'
        })
        const slicedLine = length(lineSlice(from, to, geometry)) * 1000

        return slicedLine.toFixed()
      }
    },
    [isSuggestionNeeded, voie]
  )

  const onDragEnd = useCallback(
    (event, idx) => {
      const [longitude, latitude] = event.lngLat
      const {_id, type} = markers[idx]

      setSuggestedNumero(suggestedMarkerNumero)
      updateMarker(_id, {longitude, latitude, type})
    },
    [markers, updateMarker, suggestedMarkerNumero, setSuggestedNumero]
  )

  const onDrag = useCallback(
    (event, idx) => {
      if (idx === 0) {
        const suggestion = computeSuggestedNumero(event.lngLat)
        setSuggestedMarkerNumero(suggestion)
      }
    },
    [setSuggestedMarkerNumero, computeSuggestedNumero]
  )

  useEffect(() => {
    if (isEditing && !overrideText) {
      const {longitude, latitude} = viewport
      const coordinates =
        markers.length > 0 ? [markers[0].longitude, markers[0].latitude] : [longitude, latitude]
      const suggestion = computeSuggestedNumero(coordinates)
      setSuggestedMarkerNumero(suggestion)
      setSuggestedNumero(suggestion)
    }
  }, [isEditing, markers, overrideText, viewport, setSuggestedNumero, computeSuggestedNumero])

  return markers.map((marker, idx) => (
    <Marker
      key={marker._id}
      {...marker}
      draggable
      onDrag={e => onDrag(e, idx)}
      onDragEnd={e => onDragEnd(e, idx)}
    >
      <Pane>
        <Text
          position='absolute'
          top={-62}
          transform='translate(-50%)'
          borderRadius={20}
          backgroundColor='rgba(0, 0, 0, 0.7)'
          color='white'
          paddingX={8}
          paddingY={1}
          fontSize={10}
          whiteSpace='nowrap'
        >
          {numberToDisplay ? `${numberToDisplay} - ${marker.type}` : `${marker.type}`}
        </Text>

        <MapMarkerIcon
          filter='drop-shadow(1px 2px 1px rgba(0, 0, 0, .3))'
          color={style === 'vector' ? 'info' : 'success'}
          transform='translate(-50%, -100%)'
          size={size}
        />
      </Pane>
    </Marker>
  ))
}

EditableMarker.propTypes = {
  size: PropTypes.number,
  style: PropTypes.string
}

EditableMarker.defaultProps = {
  size: 32,
  style: 'vector'
}

export default EditableMarker
