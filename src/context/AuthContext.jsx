import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext()

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return null

    try {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        const { email, displayName, photoURL } = user
        const createdAt = serverTimestamp()

        await setDoc(userRef, {
          uid: user.uid,
          name: displayName || additionalData.name || 'User',
          email,
          photoURL: photoURL || null,
          createdAt,
          streak: 0,
          lastTestDate: null,
          totalScore: 0,
          testsTaken: 0,
          avgScore: 0,
          ...additionalData
        })
      }

      // Fetch and return user profile
      const updatedSnap = await getDoc(userRef)
      return { id: updatedSnap.id, ...updatedSnap.data() }
    } catch (err) {
      console.error('Error creating user profile:', err)
      // Return a basic profile if Firestore fails
      return {
        uid: user.uid,
        name: user.displayName || additionalData.name || 'User',
        email: user.email,
        photoURL: user.photoURL || null,
        streak: 0,
        totalScore: 0,
        testsTaken: 0,
        avgScore: 0
      }
    }
  }

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const profile = { id: userSnap.id, ...userSnap.data() }
        setUserProfile(profile)
        return profile
      }
      return null
    } catch (err) {
      console.error('Error fetching user profile:', err)
      // Don't block the app if Firestore is temporarily unavailable
      setUserProfile(null)
      return null
    }
  }

  // Register with email and password
  const register = async (email, password, name) => {
    try {
      setError(null)
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      await updateProfile(user, { displayName: name })
      
      // Create user profile in Firestore
      const profile = await createUserProfile(user, { name })
      setUserProfile(profile)
      
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null)
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      const profile = await fetchUserProfile(user.uid)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Login with Google (using popup for better UX and accessibility)
  const loginWithGoogle = async () => {
    try {
      setError(null)
      const { user } = await signInWithPopup(auth, googleProvider)
      const profile = await createUserProfile(user)
      setUserProfile(profile)
      return user
    } catch (err) {
      // Handle popup closed by user
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Google sign-in was cancelled')
      } else {
        setError(err.message)
      }
      throw err
    }
  }

  // Logout
  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
      setUserProfile(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        await fetchUserProfile(user.uid)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (currentUser) {
      console.log('Refreshing user profile for:', currentUser.uid)
      const profile = await fetchUserProfile(currentUser.uid)
      console.log('Refreshed profile:', profile)
      
      // If no profile exists, create one
      if (!profile) {
        console.log('No profile found, creating one...')
        const newProfile = await createUserProfile(currentUser, { name: currentUser.displayName || 'User' })
        console.log('Created new profile:', newProfile)
        return newProfile
      }
      return profile
    }
  }

  // Get auth headers for API calls
  const getAuthHeaders = async () => {
    if (!currentUser) {
      return { 'Content-Type': 'application/json' }
    }
    
    try {
      const token = await currentUser.getIdToken()
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    } catch (err) {
      console.error('Error getting auth token:', err)
      return { 'Content-Type': 'application/json' }
    }
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    refreshUserProfile,
    getAuthHeaders,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
