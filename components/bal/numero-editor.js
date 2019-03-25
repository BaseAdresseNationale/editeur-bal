import React, {useState, useMemo, useCallback, useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Pane, TextInput, Button, IconButton, Alert} from 'evergreen-ui'

import MarkerContext from '../../contexts/marker'

import {useInput} from '../../hooks/input'
import useFocus from '../../hooks/focus'
import useKeyEvent from '../../hooks/key-event'

import PositionEditor from './position-editor'

function NumeroEditor({initialValue, onSubmit, onCancel}) {
  const position = initialValue ? initialValue.positions[0] : null

  const [isLoading, setIsLoading] = useState(false)
  const [numero, onNumeroChange] = useInput(initialValue ? initialValue.numero : '')
  const [suffixe, onSuffixeChange] = useInput(initialValue ? initialValue.suffixe : '')
  const [type, onTypeChange] = useInput(position ? position.type : 'entrée')
  const [error, setError] = useState()
  const focusRef = useFocus()

  const {
    marker,
    enableMarker,
    disableMarker
  } = useContext(MarkerContext)

  const onFormSubmit = useCallback(async e => {
    e.preventDefault()

    setIsLoading(true)

    const body = {
      numero: Number(numero),
      suffixe
    }

    if (marker) {
      body.positions = [
        {
          point: {
            type: 'Point',
            coordinates: [marker.longitude, marker.latitude]
          },
          type
        }
      ]
    }

    try {
      await onSubmit(body)
      disableMarker()
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }, [onSubmit, numero, suffixe, marker, type])

  const onFormCancel = useCallback(e => {
    e.preventDefault()

    disableMarker()
    onCancel()
  }, [onCancel])

  const submitLabel = useMemo(() => {
    if (isLoading) {
      return 'En cours…'
    }

    return initialValue ? 'Modifier' : 'Ajouter'
  }, [initialValue, isLoading])

  useKeyEvent('keyup', ({key}) => {
    if (key === 'Escape') {
      onCancel()
    }
  }, [onCancel])

  const hasPositionEditor = useMemo(() => {
    return initialValue ? initialValue.positions.length < 2 : true
  }, [initialValue])

  useEffect(() => {
    if (hasPositionEditor) {
      enableMarker(position)
    } else {
      disableMarker()
    }
  }, [initialValue, hasPositionEditor])

  return (
    <Pane is='form' onSubmit={onFormSubmit}>
      <Pane display='flex'>
        <TextInput
          required
          display='block'
          type='number'
          disabled={isLoading}
          innerRef={focusRef}
          width='100%'
          maxWidth={300}
          min={0}
          max={9999}
          value={numero}
          marginBottom={16}
          placeholder='Numéro'
          onChange={onNumeroChange}
        />

        <TextInput
          display='block'
          marginLeft={8}
          disabled={isLoading}
          width='100%'
          flex={1}
          value={suffixe}
          maxLength={10}
          marginBottom={16}
          placeholder='Suffixe'
          onChange={onSuffixeChange}
        />
      </Pane>

      {marker && (
        <PositionEditor
          initialValue={initialValue ? initialValue.positions[0] : null}
          alert={
            initialValue ?
              'Déplacez le marqueur sur la carte pour déplacer le numéro.' :
              'Déplacez le marqueur sur la carte pour placer le numéro.'
          }
          marker={marker}
          type={type}
          onTypeChange={onTypeChange}
        />
      )}

      {error && (
        <Alert marginBottom={16} intent='danger' title='Erreur'>
          {error}
        </Alert>
      )}

      <Button isLoading={isLoading} type='submit' appearance='primary' intent='success'>
        {submitLabel}
      </Button>

      {onCancel && (
        <IconButton
          disabled={isLoading}
          icon='undo'
          appearance='minimal'
          marginLeft={8}
          display='inline-flex'
          onClick={onFormCancel}
        />
      )}
    </Pane>
  )
}

NumeroEditor.propTypes = {
  initialValue: PropTypes.shape({
    numero: PropTypes.number.isRequired,
    suffixe: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

export default NumeroEditor
