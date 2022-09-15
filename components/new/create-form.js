import {useState, useCallback, useContext} from 'react'
import PropTypes from 'prop-types'
import Router from 'next/router'
import {Pane, TextInputField, Checkbox, Button, PlusIcon} from 'evergreen-ui'

import {createBaseLocale, populateCommune, searchBAL} from '@/lib/bal-api'

import LocalStorageContext from '@/contexts/local-storage'

import useFocus from '@/hooks/focus'
import {useCheckboxInput} from '@/hooks/input'

import FormContainer from '@/components/form-container'
import FormInput from '@/components/form-input'
import CommuneSearchField from '@/components/commune-search/commune-search-field'
import AlertPublishedBAL from '@/components/new/alert-published-bal'

function CreateForm({defaultCommune, nom, onNomChange, email, onEmailChange}) {
  const {addBalAccess} = useContext(LocalStorageContext)

  const [isLoading, setIsLoading] = useState(false)
  const [populate, onPopulateChange] = useCheckboxInput(true)
  const [codeCommune, setCodeCommune] = useState(defaultCommune ? defaultCommune.code : null)
  const [isShown, setIsShown] = useState(false)
  const [userBALs, setUserBALs] = useState([])
  const [focusedElement] = useFocus(true)

  const onSelect = useCallback(commune => {
    setCodeCommune(commune.code)
  }, [])

  const createNewBal = useCallback(async () => {
    if (codeCommune) {
      const bal = await createBaseLocale({
        nom,
        emails: [
          email
        ],
        commune: codeCommune
      })

      addBalAccess(bal._id, bal.token)

      if (populate) {
        await populateCommune(bal._id, bal.token)
      }

      Router.push(
        `/bal?balId=${bal._id}`,
        `/bal/${bal._id}`
      )
    }
  }, [email, nom, populate, codeCommune, addBalAccess])

  const onSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)

    checkUserBALs(codeCommune, email)
  }

  const onCancel = () => {
    setIsShown(false)
    setIsLoading(false)
  }

  const checkUserBALs = async () => {
    const userBALs = await searchBAL(codeCommune, email)

    if (userBALs.length > 0) {
      setUserBALs(userBALs)
      setIsShown(true)
    } else {
      createNewBal()
    }
  }

  return (

    <Pane overflowY='scroll' marginY={32}>
      <FormContainer onSubmit={onSubmit}>
        {userBALs.length > 0 && (
          <AlertPublishedBAL
            isShown={isShown}
            userEmail={email}
            basesLocales={userBALs}
            updateBAL={() => checkUserBALs(codeCommune, email)}
            onConfirm={createNewBal}
            onClose={() => onCancel()}
          />
        )}

        <FormInput>
          <TextInputField
            ref={focusedElement}
            required
            autoComplete='new-password' // Hack to bypass chrome autocomplete
            name='nom'
            id='nom'
            value={nom}
            maxWidth={600}
            marginBottom={0}
            disabled={isLoading}
            label='Nom de la Base Adresse Locale'
            placeholder='Nom'
            onChange={onNomChange}
          />
        </FormInput>

        <FormInput>
          <TextInputField
            required
            type='email'
            name='email'
            id='email'
            value={email}
            maxWidth={400}
            marginBottom={0}
            disabled={isLoading}
            label='Votre adresse email'
            placeholder='nom@example.com'
            onChange={onEmailChange}
          />
        </FormInput>

        <FormInput>
          <CommuneSearchField
            required
            id='commune'
            initialSelectedItem={defaultCommune}
            label='Commune'
            hint='Pour affiner la recherche, renseignez le code département'
            placeholder='Roche 42'
            appearance='default'
            maxWidth={500}
            disabled={isLoading}
            onSelect={onSelect}
          />

          <Checkbox
            label='Importer les voies et numéros depuis la BAN'
            checked={populate}
            disabled={isLoading}
            marginBottom={0}
            onChange={onPopulateChange}
          />
        </FormInput>

        <Button height={40} marginTop={8} type='submit' appearance='primary' intent='success' isLoading={isLoading} iconAfter={isLoading ? null : PlusIcon}>
          {isLoading ? 'En cours de création…' : 'Créer la Base Adresse Locale'}
        </Button>
      </FormContainer>
    </Pane>

  )
}

CreateForm.propTypes = {
  defaultCommune: PropTypes.shape({
    nom: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired
  }),
  nom: PropTypes.string.isRequired,
  onNomChange: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired
}

CreateForm.defaultProps = {
  defaultCommune: null
}

export default CreateForm
