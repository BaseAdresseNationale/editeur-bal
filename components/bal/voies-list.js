import {useContext} from 'react'
import PropTypes from 'prop-types'
import {sortBy} from 'lodash'
import {Pane, Table} from 'evergreen-ui'

import {normalizeSort} from '@/lib/normalize'

import BalDataContext from '@/contexts/bal-data'
import TokenContext from '@/contexts/token'

import useFuse from '@/hooks/fuse'

import TableRow from '@/components/table-row'
import VoieEditor from '@/components/bal/voie-editor'

function VoiesList({voies, onEnableEditing, isAdding, onSelect, onAdd, onEdit, onCancel, setToRemove}) {
  const {token} = useContext(TokenContext)
  const {isEditing, editingId} = useContext(BalDataContext)

  const isEditable = Boolean(!isEditing && !isAdding && token)
  const [filtered, setFilter] = useFuse(voies, 200, {
    keys: [
      'nom'
    ]
  })

  return (
    <Pane flex={1} overflowY='scroll'>
      <Table>
        <Table.Head>
          <Table.SearchHeaderCell
            placeholder='Rechercher une voie'
            onChange={setFilter}
          />
        </Table.Head>
        {isAdding && (
          <Table.Row height='auto'>
            <Table.Cell borderBottom display='block' padding={0} background='tint1'>
              <VoieEditor
                onSubmit={onAdd}
                onCancel={onCancel}
              />
            </Table.Cell>
          </Table.Row>
        )}
        {filtered.length === 0 && (
          <Table.Row>
            <Table.TextCell color='muted' fontStyle='italic'>
              Aucun résultat
            </Table.TextCell>
          </Table.Row>
        )}
        {sortBy(filtered, v => normalizeSort(v.nom))
          .map(voie => voie._id === editingId ? (
            <Table.Row key={voie._id} height='auto'>
              <Table.Cell display='block' padding={0} background='tint1'>
                <VoieEditor
                  initialValue={voie}
                  onSubmit={onEdit}
                  onCancel={onCancel}
                />
              </Table.Cell>
            </Table.Row>
          ) : (
            <TableRow
              key={voie._id}
              label={voie.nom}
              isEditingEnabled={isEditable}
              actions={{
                onSelect: () => onSelect(voie._id),
                onEdit: () => onEnableEditing(voie._id),
                onRemove: () => setToRemove(voie._id)
              }}
            />
          ))}
      </Table>
    </Pane>
  )
}

VoiesList.propTypes = {
  voies: PropTypes.array,
  isAdding: PropTypes.bool.isRequired,
  setToRemove: PropTypes.func.isRequired,
  onEnableEditing: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
}

VoiesList.defaultProps = {
  voies: null
}

export default VoiesList
