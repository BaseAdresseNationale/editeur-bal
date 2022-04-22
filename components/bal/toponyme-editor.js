import {useState, useMemo, useContext, useCallback, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Button, Alert} from 'evergreen-ui'

import MarkersContext from '@/contexts/markers'
import ParcellesContext from '@/contexts/parcelles'

import {useInput} from '@/hooks/input'
import useKeyEvent from '@/hooks/key-event'

import AssistedTextField from '@/components/assisted-text-field'
import Form from '@/components/form'
import FormInput from '@/components/form-input'
import PositionEditor from '@/components/bal/position-editor'
import SelectParcelles from '@/components/bal/numero-editor/select-parcelles'

function ToponymeEditor({initialValue, onSubmit, onCancel}) {
  const {markers, addMarker, disableMarkers} = useContext(MarkersContext)
  const {selectedParcelles, setSelectedParcelles, setIsParcelleSelectionEnabled} = useContext(ParcellesContext)

  const [isLoading, setIsLoading] = useState(false)
  const [nom, onNomChange, resetNom] = useInput(initialValue?.nom || '')
  const [error, setError] = useState()

  const onFormSubmit = useCallback(async e => {
    e.preventDefault()

    setIsLoading(true)

    const body = {
      nom,
      positions: [],
      parcelles: selectedParcelles
    }

    if (markers) {
      markers.forEach(marker => {
        body.positions.push(
          {
            point: {
              type: 'Point',
              coordinates: [marker.longitude, marker.latitude]
            },
            type: marker.type
          }
        )
      })
    }

    try {
      await onSubmit(body)
    } catch (error) {
      setIsLoading(false)
      setError(error.message)
    }
  }, [nom, markers, onSubmit, selectedParcelles])

  const onFormCancel = useCallback(e => {
    e.preventDefault()

    disableMarkers()
    onCancel()
  }, [onCancel, disableMarkers])

  const submitLabel = useMemo(() => {
    if (isLoading) {
      return 'En cours…'
    }

    return 'Enregistrer'
  }, [isLoading])

  useKeyEvent(({key}) => {
    if (key === 'Escape') {
      disableMarkers()
      onCancel()
    }
  }, [onCancel], 'keyup')

  useEffect(() => {
    const {nom, parcelles} = initialValue || {}
    resetNom(nom || '')
    setSelectedParcelles(parcelles || [])
    setError(null)
  }, [resetNom, setError, setSelectedParcelles, initialValue])

  useEffect(() => {
    if (initialValue) {
      const positions = initialValue.positions.map(position => (
        {
          longitude: position.point.coordinates[0],
          latitude: position.point.coordinates[1],
          type: position.type
        }
      ))

      positions.forEach(position => addMarker(position))
    } else {
      addMarker({type: 'segment'})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsParcelleSelectionEnabled(true)

    // Disable edition on component unmount
    return () => {
      onCancel()
      setIsParcelleSelectionEnabled(false)
      disableMarkers()
    }
  }, [onCancel, disableMarkers, setIsParcelleSelectionEnabled])

  return (
    <Form onFormSubmit={onFormSubmit}>
      <FormInput>
        <AssistedTextField
          isFocus
          dsiabled={isLoading}
          label='Nom du toponyme'
          placeholder='Nom du toponyme'
          value={nom}
          onChange={onNomChange}
        />
      </FormInput>

      <FormInput>
        <PositionEditor isToponyme />
      </FormInput>

      <FormInput>
        <SelectParcelles isToponyme />
      </FormInput>

      {error && (
        <Alert marginBottom={16} intent='danger' title='Erreur'>
          {error}
        </Alert>
      )}

      <Button isLoading={isLoading} type='submit' appearance='primary' intent='success'>
        {submitLabel}
      </Button>

      {onCancel && (
        <Button
          disabled={isLoading}
          appearance='minimal'
          marginLeft={8}
          display='inline-flex'
          onClick={onFormCancel}
        >
          Annuler
        </Button>
      )}
    </Form>
  )
}

ToponymeEditor.propTypes = {
  initialValue: PropTypes.shape({
    nom: PropTypes.string,
    typeNumerotation: PropTypes.string,
    parcelles: PropTypes.array.isRequired,
    positions: PropTypes.array.isRequired
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

ToponymeEditor.defaultProps = {
  initialValue: null,
  onCancel: null
}

export default ToponymeEditor
