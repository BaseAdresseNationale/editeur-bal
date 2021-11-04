import {useState, useCallback, useEffect, useContext} from 'react'
import Router from 'next/router'
import {validate} from '@etalab/bal'
import {uniq, uniqBy} from 'lodash'
import {Pane, Alert, Button, TextInputField, Text, FormField, PlusIcon, InboxIcon} from 'evergreen-ui'

import {createBaseLocale, uploadBaseLocaleCsv, searchBAL} from '../../lib/bal-api'

import LocalStorageContext from '../../contexts/local-storage'

import useFocus from '../../hooks/focus'
import {useInput} from '../../hooks/input'

import Form from '../../components/form'
import FormInput from '../../components/form-input'
import Uploader from '../../components/uploader'

import AlertPublishedBAL from './alert-published-bal'

const MAX_SIZE = 10 * 1024 * 1024

function getFileExtension(name) {
  const pos = name.lastIndexOf('.')
  if (pos > 0) {
    return name.slice(pos + 1)
  }

  return null
}

function extractCodeCommuneFromCSV(response) {
  // Get cle_interop and slice it to get the commune's code
  const codes = response.rows.map(r => r.parsedValues.cle_interop.slice(0, 5))

  return uniq(codes)
}

function UploadForm() {
  const [bal, setBal] = useState(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [nom, onNomChange] = useInput('')
  const [email, onEmailChange] = useInput('')
  const [focusRef] = useFocus()
  const [userBALs, setUserBALs] = useState([])
  const [isShown, setIsShown] = useState(false)

  const {addBalAccess} = useContext(LocalStorageContext)

  const onError = error => {
    setFile(null)
    setIsLoading(false)
    setError(error)
  }

  const onDrop = useCallback(async ([file]) => {
    if (file) {
      if (getFileExtension(file.name).toLowerCase() !== 'csv') {
        return onError('Ce type de fichier n’est pas supporté. Vous devez déposer un fichier CSV.')
      }

      setFile(file)
      setError(null)
    }
  }, [])

  const onDropRejected = rejectedFiles => {
    const [file] = rejectedFiles

    if (rejectedFiles.length > 1) {
      onError('Vous ne pouvez déposer qu’un seul fichier.')
    } else if (file.size > MAX_SIZE) {
      return onError('Ce fichier est trop volumineux. Vous devez déposer un fichier de moins de 10 Mo.')
    } else {
      onError('Impossible de déposer ce fichier')
    }
  }

  const createNewBal = useCallback(async () => {
    if (!bal) {
      const baseLocale = await createBaseLocale({
        nom,
        emails: [
          email
        ]
      })

      addBalAccess(baseLocale._id, baseLocale.token)
      setBal(baseLocale)
    }
  }, [bal, email, nom, addBalAccess])

  const onCancel = () => {
    setIsShown(false)
    setIsLoading(false)
  }

  const onSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)

    await checkUserBALs()
  }

  const checkUserBALs = useCallback(async () => {
    const validateResponse = await validate(file)

    if (validateResponse) {
      const codes = extractCodeCommuneFromCSV(validateResponse)
      if (codes.length > 1) {
        onError('Le fichier comporte plusieurs communes. Pour gérer plusieurs communes, vous devez créer plusieurs Bases Adresses Locales. L’import d’un fichier CSV n’est possible que si ce fichier ne contient les adresses que d’une commune.')
        return
      }

      const userBALs = []

      await Promise.all(codes.map(async code => {
        const basesLocales = await searchBAL(code, email)
        if (basesLocales.length > 0) {
          userBALs.push(...basesLocales)
        }
      }))

      if (userBALs.length > 0) {
        const uniqUserBALs = uniqBy(userBALs, '_id')

        setUserBALs(uniqUserBALs)
        setIsShown(true)
      } else {
        createNewBal()
      }
    }
  }, [createNewBal, file, email])

  useEffect(() => {
    async function upload() {
      try {
        const response = await uploadBaseLocaleCsv(bal._id, file, bal.token)
        if (!response.isValid) {
          throw new Error('Fichier invalide')
        }

        Router.push(`/bal?balId=${bal._id}`, `/bal/${bal._id}`)
      } catch (error) {
        setError(error.message)
      }
    }

    if (file && bal) {
      setIsLoading(true)
      upload()
    }
  }, [bal, file])

  useEffect(() => {
    if (file || error) {
      setIsLoading(false)
    }
  }, [error, file])

  return (
    <>
      <Pane marginY={32} flex={1} overflowY='scroll'>
        <Form onFormSubmit={onSubmit}>
          {userBALs.length > 0 && (
            <AlertPublishedBAL
              isShown={isShown}
              userEmail={email}
              basesLocales={userBALs}
              updateBAL={() => checkUserBALs(email)}
              onConfirm={createNewBal}
              onClose={() => onCancel()}
            />
          )}

          <Pane display='flex' flexDirection='row'>
            <Pane flex={1} maxWidth={600}>
              <FormInput>
                <TextInputField
                  ref={focusRef}
                  required
                  autoComplete='new-password' // Hack to bypass chrome autocomplete
                  name='nom'
                  id='nom'
                  marginBottom={0}
                  value={nom}
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
                  marginBottom={0}
                  value={email}
                  disabled={isLoading}
                  label='Votre adresse email'
                  placeholder='nom@example.com'
                  onChange={onEmailChange}
                />
              </FormInput>
            </Pane>

            <Pane flex={1} marginLeft={16}>
              <FormInput>
                <FormField label='Fichier CSV' />
                <Uploader
                  file={file}
                  maxSize={MAX_SIZE}
                  height={150}
                  marginBottom={24}
                  placeholder='Sélectionnez ou glissez ici votre fichier BAL au format CSV (maximum 10 Mo)'
                  loadingLabel='Analyse en cours'
                  disabled={isLoading}
                  onDrop={onDrop}
                  onDropRejected={onDropRejected}
                />
              </FormInput>
            </Pane>
          </Pane>

          {error && (
            <Alert marginBottom={16} intent='danger' title='Erreur'>
              {error}
            </Alert>
          )}

          <Button height={40} type='submit' appearance='primary' intent='success' disabled={Boolean(error) || !file} isLoading={isLoading} iconAfter={isLoading ? null : PlusIcon}>
            {isLoading ? 'En cours de création…' : 'Créer la Base Adresse Locale'}
          </Button>
        </Form>
      </Pane>

      <Alert margin={16} title='Vous disposez déjà d’une Base Adresse Locale au format CSV gérée à partir d’un autre outil ?' marginY={16}>
        <Text>
          Utilisez notre formulaire de dépôt afin de publier vos adresses dans la Base Adresse Nationale.
        </Text>
        <Pane marginTop={16}>
          <Button appearance='primary' iconBefore={InboxIcon} is='a' href='https://adresse.data.gouv.fr/bases-locales/publication'>Accéder au formulaire de dépôt d’une Base Adresse Locale sur adresse.data.gouv.fr</Button>
        </Pane>
      </Alert>
    </>
  )
}

UploadForm.getInitialProps = () => ({
  layout: 'fullscreen'
})

export default UploadForm
