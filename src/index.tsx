/* eslint-disable no-unused-vars */
import { Identity } from '@dfinity/agent'
import { AuthClient, AuthClientLoginOptions } from '@dfinity/auth-client'
import React, { useContext } from 'react'

interface InternetIdentityContextState {
  error: string | null
  authClient: AuthClient | null
  identityProvider: string
  isAuthenticated: boolean
  identity: Identity | null
  authenticate: () => void
  signout: () => void
}

export const InternetIdentityContext =
  React.createContext<InternetIdentityContextState>({
    error: null,
    authClient: null,
    identityProvider: '',
    isAuthenticated: false,
    identity: null,
    authenticate: () => {},
    signout: () => {}
  })

interface AuthClientOptions extends Omit<AuthClientLoginOptions, 'onSuccess'> {
  onSuccess?: (identity: Identity) => void
}

interface UseInternetIdentityProps {
  authClientOptions?: AuthClientOptions
}

const useICIIAuth = ({
  authClientOptions: { onError, onSuccess, ...authClientOptions } = {}
}: UseInternetIdentityProps = {}) => {
  const [authClient, setAuthClient] = React.useState<AuthClient | null>(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const identityProvider = (
    authClientOptions.identityProvider || 'https://identity.ic0.app/#authorize'
  ).toString()

  const createAuthClient = React.useCallback(async () => {
    const authClient = await AuthClient.create()
    setAuthClient(authClient)
  }, [])

  React.useEffect(() => {
    createAuthClient()
  }, [createAuthClient])

  const setAuthStatus = React.useCallback(async (authClient) => {
    if (authClient) {
      const isAuthenticated = await authClient.isAuthenticated()
      return setIsAuthenticated(isAuthenticated)
    }
    return setIsAuthenticated(false)
  }, [])

  React.useEffect(() => {
    authClient && setAuthStatus(authClient)
  }, [authClient, setAuthStatus])

  const handleOnSuccess = React.useCallback((authClient) => {
    setIsAuthenticated(true)
    onSuccess && onSuccess(authClient.getIdentity())
  }, [])

  const handleOnError = React.useCallback((error) => {
    setError(error)
    onError && onError(error)
  }, [])

  const authenticate = React.useCallback(async () => {
    if (authClient) {
      await authClient.login({
        onSuccess: () => handleOnSuccess(authClient),
        onError: handleOnError,
        identityProvider,
        ...authClientOptions
      })
    }
  }, [authClient, handleOnError])

  const signout = React.useCallback(async () => {
    if (authClient) {
      await authClient.logout()
      setIsAuthenticated(false)
    }
  }, [authClient])

  return {
    error,
    authClient,
    identityProvider,
    isAuthenticated,
    identity: authClient ? authClient.getIdentity() : null,
    authenticate,
    signout
  }
}

interface InternetIdentityProviderProps {
  authClientOptions?: AuthClientOptions
}

export const InternetIdentityProvider: React.FC<InternetIdentityProviderProps> =
  ({ children, authClientOptions = {} }) => {
    const {
      error,
      authClient,
      identityProvider,
      isAuthenticated,
      identity,
      authenticate,
      signout
    } = useICIIAuth({ authClientOptions })
    return (
      <InternetIdentityContext.Provider
        value={{
          error,
          authClient,
          identityProvider,
          isAuthenticated,
          identity,
          authenticate,
          signout
        }}
      >
        {children}
      </InternetIdentityContext.Provider>
    )
  }

export const useInternetIdentity = () => {
  return useContext(InternetIdentityContext)
}
