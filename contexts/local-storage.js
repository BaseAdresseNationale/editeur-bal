import React from 'react'

import {removeBaseLocale} from '../lib/bal-api'

import {useLocalStorage} from '../hooks/local-storage'

const LocalStorageContext = React.createContext()

const STORAGE_KEY = 'bal-access'

export function LocalStorageContextProvider(props) {
  const [balAccess, , getBalToken, addBalAccess, removeBalAccess] = useLocalStorage(STORAGE_KEY)

  const removeBAL = async balId => {
    const token = getBalToken(balId)
    await removeBaseLocale(balId, token)
    removeBalAccess(balId)
  }

  return (
    <LocalStorageContext.Provider
      value={{
        balAccess,
        getBalToken,
        addBalAccess,
        removeBAL
      }}
      {...props}
    />
  )
}

export const LocalStorageContextConsumer = LocalStorageContext.Consumer

export default LocalStorageContext
