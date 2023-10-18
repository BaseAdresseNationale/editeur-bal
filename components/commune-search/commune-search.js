import {useState} from 'react'
import PropTypes from 'prop-types'
import {Autocomplete, Position, SearchInput} from 'evergreen-ui'
import {useDebouncedCallback} from 'use-debounce'

import {searchCommunes} from '@/lib/geo-api'

function CommuneSearch({placeholder, innerRef, initialSelectedItem, onSelect, ...props}) {
  const [communes, setCommunes] = useState([])

  const onSearch = useDebouncedCallback(async value => {
    const results = await searchCommunes(value, {
      fields: 'departement',
      limit: 20
    })
    const bestResults = results.filter(c => c._score > 0.1)

    setCommunes(bestResults.length > 5 ? bestResults : results)
  }, 300)

  return (
    <Autocomplete
      isFilterDisabled
      initialSelectedItem={initialSelectedItem}
      items={communes}
      itemToString={item => item ? `${item.nom} ${item.departement ? `(${item.departement.nom} - ${item.departement.code})` : ''}` : ''}
      onChange={onSelect}
      position={Position.BOTTOM_LEFT}
    >
      {({getInputProps, getRef, inputValue}) => {
        return (
          <SearchInput
            ref={ref => {
              if (innerRef) {
                innerRef(ref)
              }

              return getRef(ref)
            }}
            autoComplete='chrome-off'
            placeholder={placeholder}
            value={inputValue}
            {...getInputProps({
              onChange: e => onSearch(e.target.value)
            })}
            {...props}
          />
        )
      }}
    </Autocomplete>
  )
}

CommuneSearch.propTypes = {
  initialSelectedItem: PropTypes.shape({
    code: PropTypes.string.isRequired,
    nom: PropTypes.string.isRequired,
    departement: PropTypes.shape({
      code: PropTypes.string.isRequired,
      nom: PropTypes.string.isRequired
    }).isRequired
  }),
  placeholder: PropTypes.string,
  innerRef: PropTypes.func,
  onSelect: PropTypes.func
}

CommuneSearch.defaultProps = {
  initialSelectedItem: null,
  placeholder: 'Chercher une commune…',
  innerRef: () => {},
  onSelect: () => {}
}

export default CommuneSearch
