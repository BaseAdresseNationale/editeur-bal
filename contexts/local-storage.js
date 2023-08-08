import React, {useCallback, useMemo} from 'react'

import {removeBaseLocale} from '@/lib/bal-api'

import {useLocalStorage} from '@/hooks/local-storage'

const LocalStorageContext = React.createContext()

const STORAGE_KEY = 'bal-access'
const WELCOMED_KEY = 'was-welcomed'
const RECOVERY_EMAIL = 'recovery-email-sent'
const CERTIFICATION_AUTO_KEY = 'certificationAutoAlert'
const VISIBILITY_KEY = 'hidden-bal'
const USER_SETTINGS = 'user-settings'

export function LocalStorageContextProvider(props) {
  const [balAccess, , getBalToken, addBalAccess, removeBalAccess] = useLocalStorage(STORAGE_KEY) // Do not assign a default value
  const [wasWelcomed, setWasWelcomed] = useLocalStorage(WELCOMED_KEY)
  const [recoveryEmailSent, setRecoveryEmailSent] = useLocalStorage(RECOVERY_EMAIL)
  const [informedAboutCertification, , getInformedAboutCertification, addInformedAboutCertification] = useLocalStorage(CERTIFICATION_AUTO_KEY)
  const [hiddenBal, setHiddenBal, getHiddenBal, addHiddenBal, removeHiddenBal] = useLocalStorage(VISIBILITY_KEY)
  const [userSettings, setUserSettings, getUserSettings, addUserSettings, removeUserSettings] = useLocalStorage(USER_SETTINGS)

  const removeBAL = useCallback(async balId => {
    const token = getBalToken(balId)
    await removeBaseLocale(balId, token)
    removeBalAccess(balId)
  }, [getBalToken, removeBalAccess])

  const value = useMemo(() => ({
    balAccess, getBalToken, addBalAccess, removeBAL,
    wasWelcomed, setWasWelcomed,
    recoveryEmailSent, setRecoveryEmailSent,
    informedAboutCertification, getInformedAboutCertification, addInformedAboutCertification,
    hiddenBal, setHiddenBal, getHiddenBal, addHiddenBal, removeHiddenBal,
    userSettings, setUserSettings, getUserSettings, addUserSettings, removeUserSettings
  }), [
    balAccess,
    getBalToken,
    addBalAccess,
    removeBAL,
    wasWelcomed,
    setWasWelcomed,
    recoveryEmailSent,
    setRecoveryEmailSent,
    informedAboutCertification,
    getInformedAboutCertification,
    addInformedAboutCertification,
    hiddenBal,
    setHiddenBal,
    getHiddenBal,
    addHiddenBal,
    removeHiddenBal,
    userSettings,
    setUserSettings,
    getUserSettings,
    addUserSettings,
    removeUserSettings
  ])

  return (
    <LocalStorageContext.Provider value={value} {...props} />
  )
}

export const LocalStorageContextConsumer = LocalStorageContext.Consumer

export default LocalStorageContext
