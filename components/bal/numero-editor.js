import React, {useState, useMemo, useCallback, useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Pane, SelectField, TextInput, Button, Alert} from 'evergreen-ui'
import {sortBy} from 'lodash'

import {normalizeSort} from '../../lib/normalize'

import MarkersContext from '../../contexts/markers'
import BalDataContext from '../../contexts/bal-data'

import {useInput} from '../../hooks/input'
import useFocus from '../../hooks/focus'
import useKeyEvent from '../../hooks/key-event'

import Comment from '../comment'
import PositionEditor from './position-editor'

function NumeroEditor({initialVoie, initialToponyme, initialValue, onSubmit, onCancel}) {
  const {voies, toponymes} = useContext(BalDataContext)

  const [voie, setVoie] = useState(initialVoie || (initialValue && initialValue.voie) || null)
  const [toponyme, setToponyme] = useState(initialToponyme || (initialValue && initialValue.toponyme) || null)

  const [isLoading, setIsLoading] = useState(false)
  const [numero, onNumeroChange, resetNumero] = useInput(initialValue ? initialValue.numero : '')
  const [suffixe, onSuffixeChange, resetSuffixe] = useInput(initialValue ? initialValue.suffixe : '')
  const [comment, onCommentChange, resetComment] = useInput(initialValue ? initialValue.comment : '')
  const [error, setError] = useState()
  const focusRef = useFocus()

  const {
    markers,
    addMarker,
    disableMarkers,
    suggestedNumero,
    setOverrideText
  } = useContext(MarkersContext)

  const onFormSubmit = useCallback(async e => {
    e.preventDefault()

    setIsLoading(true)

    const body = {
      numero: Number(numero),
      voie: voie._id || null,
      toponyme: toponyme ? toponyme._id : null,
      suffixe: suffixe.length > 0 ? suffixe.toLowerCase().trim() : null,
      comment: comment.length > 0 ? comment : null
    }

    if (markers.length > 0) {
      const positions = []
      markers.forEach(marker => {
        positions.push(
          {
            point: {
              type: 'Point',
              coordinates: [marker.longitude, marker.latitude]
            },
            type: marker.type
          }
        )
      })

      body.positions = positions
    }

    try {
      await onSubmit(body)
      disableMarkers()
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }, [numero, voie, toponyme, suffixe, comment, markers, onSubmit, disableMarkers])

  const onFormCancel = useCallback(e => {
    e.preventDefault()

    disableMarkers()
    onCancel()
  }, [disableMarkers, onCancel])

  const submitLabel = useMemo(() => {
    if (isLoading) {
      return 'En cours…'
    }

    return 'Enregistrer'
  }, [isLoading])

  const handleChange = event => {
    const {value} = event.target
    const voie = voies.find(({_id}) => _id === value)

    setVoie(voie)
  }

  const handleToponymeChange = e => {
    const {value} = e.target

    setToponyme(toponymes.find(({_id}) => _id === value))
  }

  useKeyEvent('keyup', ({key}) => {
    if (key === 'Escape') {
      disableMarkers()
      onCancel()
    }
  }, [onCancel])

  useEffect(() => {
    const {numero, suffixe, comment} = initialValue || {}
    resetNumero(numero)
    resetSuffixe(suffixe ? suffixe : '')
    resetComment(comment ? comment : '')
    setError(null)
  }, [resetNumero, resetSuffixe, resetComment, setError, initialValue])

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
      addMarker({type: 'entrée'})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOverrideText(numero || null)
  }, [setOverrideText, numero])

  return (
    <Pane is='form' onSubmit={onFormSubmit}>
      <Pane display='flex'>
        <SelectField
          required
          label='Voie'
          flex={1}
          marginBottom={16}
          onChange={handleChange}
        >
          <option value={null}>- Choisir une voie -</option>
          {sortBy(voies, v => normalizeSort(v.nom)).map(({_id, nom}) => (
            <option
              key={_id}
              selected={(initialVoie && _id === initialVoie._id) || (initialValue && _id === initialValue.voie._id)}
              value={_id}
            >
              {nom}
            </option>
          ))}
        </SelectField>
      </Pane>

      <Pane display='flex'>
        <SelectField
          label='Toponyme'
          flex={1}
          marginBottom={16}
          onChange={handleToponymeChange}
        >
          <option value={null}>{(initialToponyme || initialValue?.toponyme) ? 'Aucun toponyme' : '- Choisir un toponyme -'}</option>
          {sortBy(toponymes, t => normalizeSort(t.nom)).map(({_id, nom}) => (
            <option
              key={_id}
              selected={(initialToponyme && _id === initialToponyme._id) || (initialValue && _id === initialValue.toponyme)}
              value={_id}
            >
              {nom}
            </option>
          ))}
        </SelectField>
      </Pane>

      <Pane display='flex'>
        <TextInput
          ref={focusRef}
          required
          display='block'
          type='number'
          disabled={isLoading}
          width='100%'
          maxWidth={300}
          flex={2}
          min={0}
          max={9999}
          value={numero}
          marginBottom={8}
          placeholder={`Numéro${suggestedNumero ? ` recommandé : ${suggestedNumero}` : ''}`}
          onChange={onNumeroChange}
        />

        <TextInput
          style={{textTransform: 'lowercase'}}
          display='block'
          marginLeft={8}
          disabled={isLoading}
          width='100%'
          flex={1}
          minWidth={59}
          value={suffixe}
          maxLength={10}
          marginBottom={8}
          placeholder='Suffixe'
          onChange={onSuffixeChange}
        />
      </Pane>

      {markers.length > 0 && (
        <PositionEditor />
      )}

      {alert && (
        <Alert marginBottom={16}>
          {initialValue && markers.length > 1 ?
            'Déplacer les marqueurs sur la carte pour modifier les positions' :
            initialValue && markers.length === 1 ?
              'Déplacer le marqueur sur la carte pour déplacer le numéro.' :
              'Déplacer le marqueur sur la carte pour placer le numéro.'
          }
        </Alert>
      )}

      <Comment input={comment} onChange={onCommentChange} />

      {error && (
        <Alert marginBottom={16} intent='danger' title='Erreur'>
          {error}
        </Alert>
      )}

      <Button isLoading={isLoading} type='submit' appearance='primary' intent='success' marginTop={16}>
        {submitLabel}
      </Button>

      {onCancel && (
        <Button
          disabled={isLoading}
          appearance='minimal'
          marginLeft={8}
          marginTop={16}
          display='inline-flex'
          onClick={onFormCancel}
        >
          Annuler
        </Button>
      )}
    </Pane>
  )
}

NumeroEditor.propTypes = {
  initialVoie: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    trace: PropTypes.object
  }),
  initialToponyme: PropTypes.shape({
    _id: PropTypes.string,
    commune: PropTypes.string,
    nom: PropTypes.string,
    positions: PropTypes.array
  }),
  initialValue: PropTypes.shape({
    numero: PropTypes.number.isRequired,
    voie: PropTypes.string.isRequired,
    suffixe: PropTypes.string,
    comment: PropTypes.string,
    positions: PropTypes.array,
    toponyme: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

NumeroEditor.defaultProps = {
  initialValue: null,
  initialVoie: null,
  initialToponyme: null,
  onCancel: null
}

export default NumeroEditor
