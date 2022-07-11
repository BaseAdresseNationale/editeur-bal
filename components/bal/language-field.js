import PropTypes from 'prop-types'
import {Pane, Button, SelectMenu, TextInputField, Tooltip, TrashIcon} from 'evergreen-ui'

function LanguageField({field, index, selectedLanguages, onChange, onSelect, onDelete, isToponyme}) {
  const languagesList = [
    {label: 'Breton', value: 'bre', disabled: false},
    {label: 'Basque', value: 'eus', disabled: false},
    {label: 'Alsacien', value: 'asw', disabled: false},
    {label: 'Corse', value: 'cos', disabled: false},
    {label: 'Créole martiquais | guadeloupéen', value: 'gyn', disabled: false},
    {label: 'Créole réunionais', value: 'rcf', disabled: false},
    {label: 'Occitan', value: 'oci', disabled: false},
  ]

  for (const language of languagesList) {
    for (const selected of selectedLanguages) {
      if (selected.value === language.value) {
        language.disabled = true
      }
    }
  }

  const detectLanguage = field => {
    for (const language of languagesList) {
      if (field.value === language.value) {
        return language.label
      }
    }
  }

  const handlePlaceholder = field.label === '' && field.value ? `Nom ${isToponyme ? 'du toponyme' : 'de la voie'} en ${detectLanguage(field).toLowerCase()}` : `Nom ${isToponyme ? 'du toponyme' : 'de la voie'} en langue régionale`

  return (
    <Pane width='100%' display='flex' flexDirection='column' height='fit-content' marginBottom={18}>
      <SelectMenu
        title='Select Option'
        options={languagesList}
        selected={field ? detectLanguage(field) : null}
        onSelect={item => onSelect(item.value, index)}
        width='fit-content'
      >
        <Button
          type='button'
          width='fit-content'
          margin={0}
          fontStyle={detectLanguage(field) ? '' : 'italic'}
        >
          {detectLanguage(field) || 'Sélectionner une langue régionale...'}
        </Button>
      </SelectMenu>
      <Pane display='grid' gridTemplateColumns='1fr 40px' gap='10px' marginTop='5px'>
        <TextInputField
          onChange={e => onChange(e, index)}
          value={field.label}
          label=''
          aria-label={`Écrire le ${handlePlaceholder}`}
          placeholder={handlePlaceholder}
          width='100%'
          display='flex'
          padding={0}
          margin={0}
        />

        <Tooltip content='Supprimer la langue régionale'>
          <Button
            type='button'
            aria-label='Supprimer la langue régionale'
            onClick={() => onDelete(index)}
            intent='danger'
            width='fit-content'
            padding={0}
            margin={0}
          >
            <TrashIcon size={14} color='danger' />
          </Button>
        </Tooltip>
      </Pane>
    </Pane>
  )
}

LanguageField.propTypes = {
  field: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  selectedLanguages: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isToponyme: PropTypes.bool
}

LanguageField.defaultProps = {
  isToponyme: false
}

export default LanguageField
