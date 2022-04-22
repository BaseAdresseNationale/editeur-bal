import {useState, useCallback, useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import {sortBy} from 'lodash'
import {Pane, SelectField, TextInput, Alert, TextInputField} from 'evergreen-ui'

import {normalizeSort} from '@/lib/normalize'
import {computeCompletNumero} from '@/lib/utils/numero'

import MarkersContext from '@/contexts/markers'
import BalDataContext from '@/contexts/bal-data'
import ParcellesContext from '@/contexts/parcelles'

import {useInput} from '@/hooks/input'
import useFocus from '@/hooks/focus'
import useKeyEvent from '@/hooks/key-event'

import Comment from '@/components/comment'
import Form from '@/components/form'
import FormInput from '@/components/form-input'
import CertificationButton from '@/components/certification-button'
import PositionEditor from '@/components/bal/position-editor'
import SelectParcelles from '@/components/bal/numero-editor/select-parcelles'
import NumeroVoieSelector from '@/components/bal/numero-editor/numero-voie-selector'
import AddressPreview from '@/components/bal/address-preview'

const REMOVE_TOPONYME_LABEL = 'Aucun toponyme'

function NumeroEditor({initialVoieId, initialValue, commune, hasPreview, onSubmit, onCancel}) {
  const {voies, toponymes} = useContext(BalDataContext)
  const {selectedParcelles, setSelectedParcelles, setIsParcelleSelectionEnabled} = useContext(ParcellesContext)

  const [voieId, setVoieId] = useState(initialVoieId || initialValue?.voie._id)
  const [selectedNomToponyme, setSelectedNomToponyme] = useState('')
  const [toponymeId, setToponymeId] = useState(initialValue?.toponyme)
  const [isLoading, setIsLoading] = useState(false)
  const [certifie, setCertifie] = useState(initialValue?.certifie || false)
  const [numero, onNumeroChange, resetNumero] = useInput(initialValue?.numero.toString() || '')
  const [nomVoie, onNomVoieChange] = useState('')
  const [selectedNomVoie, setSelectedNomVoie] = useState('')
  const [suffixe, onSuffixeChange, resetSuffixe] = useInput(initialValue?.suffixe || '')
  const [comment, onCommentChange, resetComment] = useInput(initialValue?.comment || '')
  const [error, setError] = useState()
  const [focusRef] = useFocus()

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

    const voie = nomVoie ? {nom: nomVoie} : {_id: voieId}
    const body = {
      toponyme: toponymeId,
      numero: Number(numero),
      suffixe: suffixe.length > 0 ? suffixe.toLowerCase().trim() : null,
      comment: comment.length > 0 ? comment : null,
      parcelles: selectedParcelles,
      certifie: certifie ?? (initialValue?.certifie || false)
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
      await onSubmit(voie, body)
    } catch (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }, [numero, nomVoie, voieId, toponymeId, suffixe, comment, markers, selectedParcelles, certifie, initialValue, onSubmit])

  const onFormCancel = useCallback(e => {
    e.preventDefault()

    disableMarkers()
    onCancel()
  }, [disableMarkers, onCancel])

  useKeyEvent(({key}) => {
    if (key === 'Escape') {
      disableMarkers()
      onCancel()
    }
  }, [onCancel], 'keyup')

  useEffect(() => {
    const {numero, suffixe, parcelles, comment} = initialValue || {}
    resetNumero(numero)
    resetSuffixe(suffixe || '')
    resetComment(comment || '')
    setSelectedParcelles(parcelles || [])
    setError(null)
  }, [resetNumero, resetSuffixe, resetComment, setError, setSelectedParcelles, initialValue])

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
    setOverrideText(numero ? computeCompletNumero(numero, suffixe) : null)
  }, [setOverrideText, numero, suffixe])

  useEffect(() => {
    setIsParcelleSelectionEnabled(true)
    return () => {
      onCancel()
      disableMarkers()
      setIsParcelleSelectionEnabled(false)
    }
  }, [disableMarkers, setIsParcelleSelectionEnabled, onCancel])

  useEffect(() => {
    let nom = null
    if (voieId) {
      nom = voies.find(voie => voie._id === voieId).nom
    }

    setSelectedNomVoie(nom)
  }, [voieId, voies])

  useEffect(() => {
    let nom = null
    if (toponymeId && toponymeId !== '- Choisir un toponyme -') {
      nom = toponymes.find(toponyme => toponyme._id === toponymeId).nom
    }

    setSelectedNomToponyme(nom)
  }, [toponymeId, toponymes])

  return (
    <Form onFormSubmit={onFormSubmit}>
      {hasPreview && (
        <AddressPreview
          numero={numero}
          suffixe={suffixe}
          selectedNomToponyme={selectedNomToponyme}
          voie={nomVoie || selectedNomVoie}
          commune={commune}
        />
      )}

      <Pane paddingTop={hasPreview ? 36 : 0}>
        <FormInput>
          <NumeroVoieSelector
            voieId={voieId}
            voies={voies}
            nomVoie={nomVoie}
            mode={voieId ? 'selection' : 'creation'}
            handleVoie={setVoieId}
            handleNomVoie={onNomVoieChange}
          />
        </FormInput>

        <Pane display='flex'>
          <FormInput>
            <SelectField
              label='Toponyme'
              flex={1}
              marginBottom={0}
              value={toponymeId || ''}
              onChange={({target}) => setToponymeId(target.value === (REMOVE_TOPONYME_LABEL || '') ? null : target.value)}
            >
              <option value={null}>{initialValue?.toponyme ? REMOVE_TOPONYME_LABEL : '- Choisir un toponyme -'}</option>
              {sortBy(toponymes, t => normalizeSort(t.nom)).map(({_id, nom}) => (
                <option key={_id} value={_id}>
                  {nom}
                </option>
              ))}
            </SelectField>
          </FormInput>
        </Pane>

        <FormInput>
          <Pane display='flex' alignItems='flex-end'>
            <TextInputField
              ref={focusRef}
              required
              label='Numéro'
              display='block'
              type='number'
              disabled={isLoading}
              width='100%'
              maxWidth={300}
              flex={2}
              min={0}
              max={9999}
              value={numero}
              marginBottom={0}
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
              marginBottom={0}
              placeholder='Suffixe'
              onChange={onSuffixeChange}
            />
          </Pane>
        </FormInput>

        {markers.length > 0 && (
          <FormInput>
            <PositionEditor />
          </FormInput>
        )}

        <FormInput>
          <SelectParcelles />
        </FormInput>

        <Comment input={comment} onChange={onCommentChange} />

        {error && (
          <Alert marginBottom={16} intent='danger' title='Erreur'>
            {error}
          </Alert>
        )}

        <CertificationButton
          isCertified={initialValue?.certifie || false}
          isLoading={isLoading}
          onConfirm={setCertifie}
          onCancel={onFormCancel}
        />
      </Pane>
    </Form>
  )
}

NumeroEditor.propTypes = {
  initialVoieId: PropTypes.string,
  initialValue: PropTypes.shape({
    numero: PropTypes.number.isRequired,
    voie: PropTypes.oneOfType([
      PropTypes.object, // When "voie" comes from getNumerosToponyme() -> it's an Object with "nomVoie", needed to sort numeros by voie and display nomVoie
      PropTypes.string // When "voie" comes from getNumeros() -> it's a String (only the id of "voie" is return)
    ]).isRequired,
    suffixe: PropTypes.string,
    parcelles: PropTypes.array,
    comment: PropTypes.string,
    positions: PropTypes.array,
    toponyme: PropTypes.string,
    certifie: PropTypes.bool // eslint-disable-line react/boolean-prop-naming
  }),
  commune: PropTypes.object.isRequired,
  hasPreview: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
}

NumeroEditor.defaultProps = {
  initialValue: null,
  initialVoieId: null,
  hasPreview: false,
  onCancel: null
}

export default NumeroEditor
