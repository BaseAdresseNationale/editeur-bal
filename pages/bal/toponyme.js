import {useState, useCallback, useContext, useMemo} from 'react'
import PropTypes from 'prop-types'
import {Pane, Heading, Table, Button, Alert, AddIcon, toaster} from 'evergreen-ui'

import {addVoie, editNumero, getToponyme, getNumerosToponyme} from '@/lib/bal-api'

import TokenContext from '@/contexts/token'
import BalDataContext from '@/contexts/bal-data'

import useHelp from '@/hooks/help'
import useFuse from '@/hooks/fuse'

import NumeroEditor from '@/components/bal/numero-editor'
import ToponymeNumeros from '@/components/toponyme/toponyme-numeros'
import AddNumeros from '@/components/toponyme/add-numeros'
import ToponymeHeading from '@/components/toponyme/toponyme-heading'

function Toponyme({baseLocale, commune}) {
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)

  const {token} = useContext(TokenContext)

  const {
    toponyme,
    numeros,
    reloadNumeros,
    editingId,
    setEditingId,
    isEditing,
    setIsEditing
  } = useContext(BalDataContext)

  const isAdding = useMemo(() => isEditing && !editingId, [isEditing, editingId])

  useHelp(2)
  const [filtered, setFilter] = useFuse(numeros, 200, {
    keys: [
      'numero'
    ]
  })

  const editedNumero = filtered.find(numero => numero._id === editingId)

  const onAdd = async numeros => {
    setIsLoading(true)
    const isMultiNumeros = numeros.length > 1

    try {
      await Promise.all(numeros.map(id => {
        return editNumero(id, {
          toponyme: toponyme._id
        }, token, true)
      }))

      await reloadNumeros()

      if (isMultiNumeros) {
        toaster.success('Les numéros ont bien été ajoutés')
      } else {
        toaster.success('Le numéro a bien été ajouté')
      }
    } catch (error) {
      setError(error.message)
    }

    setIsLoading(false)
    setIsEditing(false)
  }

  const onEdit = useCallback(async (voieData, body) => {
    let editedVoie = voieData

    try {
      if (!editedVoie._id) {
        editedVoie = await addVoie(baseLocale._id, commune.code, editedVoie, token)
      }

      await editNumero(editingId, {...body, voie: editedVoie._id}, token)
      await reloadNumeros()
    } catch (error) {
      setError(error.message)
    }

    setEditingId(null)
  }, [editingId, setEditingId, baseLocale, commune.code, reloadNumeros, token])

  const handleSelection = useCallback(id => {
    if (!isEditing) {
      setEditingId(id)
    }
  }, [isEditing, setEditingId])

  const onCancel = useCallback(() => {
    setEditingId(null)
    setError(null)
  }, [setEditingId])

  return (
    <>
      <ToponymeHeading toponyme={toponyme} />
      <Pane
        flexShrink={0}
        elevation={0}
        backgroundColor='white'
        padding={16}
        display='flex'
        alignItems='center'
        minHeight={64}
      >
        <Pane>
          <Heading>Liste des numéros</Heading>
        </Pane>
        {token && (
          <Pane marginLeft='auto'>
            <Button
              iconBefore={AddIcon}
              appearance='primary'
              intent='success'
              disabled={isEditing}
              onClick={() => setIsEditing(true)}
            >
              Ajouter des numéros
            </Button>
          </Pane>
        )}
      </Pane>

      {error && (
        <Alert marginY={5} intent='danger' title='Erreur'>
          {error}
        </Alert>
      )}

      <Pane flex={1} overflowY='scroll'>
        <Table>
          {!isEditing && (
            <Table.Head>
              <Table.SearchHeaderCell
                placeholder='Rechercher un numéro'
                onChange={setFilter}
              />
            </Table.Head>
          )}

          {isAdding && (
            <Table.Row height='auto' >
              <Table.Cell borderBottom display='block' padding={0} background='tint1'>
                <AddNumeros isLoading={isLoading} onSubmit={onAdd} onCancel={onCancel} />
              </Table.Cell>
            </Table.Row>
          )}

          {filtered.length === 0 && (
            <Table.Row>
              <Table.TextCell color='muted' fontStyle='italic'>
                Aucun numéro
              </Table.TextCell>
            </Table.Row>
          )}

          {editingId && editingId !== toponyme._id && !isAdding ? (
            <Table.Row height='auto'>
              <Table.Cell display='block' padding={0} background='tint1'>
                <NumeroEditor
                  hasPreview
                  initialValue={editedNumero}
                  commune={commune}
                  onSubmit={onEdit}
                  onCancel={onCancel}
                />
              </Table.Cell>
            </Table.Row>
          ) : (
            <ToponymeNumeros numeros={filtered} handleSelect={handleSelection} isEditable={token && !isAdding} />
          )}
        </Table>
      </Pane>
    </>
  )
}

Toponyme.getInitialProps = async ({query}) => {
  const toponyme = await getToponyme(query.idToponyme)
  const numeros = await getNumerosToponyme(toponyme._id)

  return {
    toponyme,
    numeros
  }
}

Toponyme.propTypes = {
  baseLocale: PropTypes.shape({
    _id: PropTypes.string.isRequired
  }).isRequired,
  commune: PropTypes.shape({
    code: PropTypes.string.isRequired
  }).isRequired
}

export default Toponyme
