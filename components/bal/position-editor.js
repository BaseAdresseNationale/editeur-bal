import React from 'react'
import PropTypes from 'prop-types'
import {Strong, Pane, SelectField, Heading, Icon, Small, TrashIcon, MapMarkerIcon, IconButton, Button, AddIcon} from 'evergreen-ui'

import {positionsTypesList} from '../../lib/positions-types-list'

function PositionEditor({markers, enableMarkers, isToponyme}) {
  const handleAddMarker = () => {
    enableMarkers([...markers, {type: 'entrée'}])
  }

  const handleChange = (e, idx) => {
    e.preventDefault()
    markers[idx] = {
      ...markers[idx],
      type: e.target.value
    }

    enableMarkers(markers)
  }

  const deletePosition = (e, idx) => {
    e.preventDefault()
    const markersCopy = markers.filter(marker => marker !== markers[idx])

    enableMarkers(markersCopy)
  }

  return (
    <>
      <Pane display='grid' gridTemplateColumns='1.4fr 32px 1fr 1fr 32px'>
        <Strong fontWeight={400}>Type</Strong>
        <Strong />
        <Strong fontWeight={400}>Latitude</Strong>
        <Strong fontWeight={400}>Longitude</Strong>
        <Strong />

        {markers.map((marker, idx) => (
          <>
            <SelectField
              defaultValue={marker.type}
              marginBottom={8}
              height={32}
              onChange={e => handleChange(e, idx)}
            >
              {positionsTypesList.map(positionType => (
                <option key={positionType.value} value={positionType.value} selected={marker.type === positionType.value}>{positionType.name}</option>
              ))}
            </SelectField>
            <Icon icon={MapMarkerIcon} size={22} margin='auto' />
            <Heading size={100} marginY='auto'>
              <Small>{marker.latitude}</Small>
            </Heading>
            <Heading size={100} marginY='auto'>
              <Small>{marker.longitude}</Small>
            </Heading>
            <IconButton
              disabled={markers.length === 1}
              appearance='default'
              iconSize={15}
              icon={TrashIcon}
              intent='danger'
              onClick={e => deletePosition(e, idx)}
            />
          </>
        ))}

      </Pane>
      {!isToponyme && (
        <Button
          type='button'
          iconBefore={AddIcon}
          appearance='primary'
          intent='success'
          width='100%'
          marginBottom={16}
          display='flex'
          justifyContent='center'
          onClick={handleAddMarker}
        >
          Ajouter une position au numéro
        </Button>
      )}
    </>
  )
}

PositionEditor.propTypes = {
  markers: PropTypes.arrayOf({
    _id: PropTypes.number,
    latitude: PropTypes.number,
    longitude: PropTypes.number
  }).isRequired,
  enableMarkers: PropTypes.func.isRequired,
  isToponyme: PropTypes.bool
}

PositionEditor.defaultProps = {
  isToponyme: false
}

export default PositionEditor
