import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const ALLOWED_UID = import.meta.env.VITE_ALLOWED_UID

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && ALLOWED_UID && firebaseUser.uid !== ALLOWED_UID) {
        // Wrong account — sign them out immediately
        await firebaseSignOut(auth)
        setUser(null)
      } else {
        setUser(firebaseUser)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOut = () => firebaseSignOut(auth)

  return { user, loading, signIn, signOut }
}
