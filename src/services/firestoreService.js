/**
 * Firestore Service
 * Handles all Firestore database operations
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * User Service
 */
export const UserService = {
  // Get user profile
  getUser: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  },

  // Update user profile
  updateUser: async (uid, data) => {
    try {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  // Update user stats after test completion
  updateUserStats: async (uid, testResult) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      let userData = {}
      
      if (!userSnap.exists()) {
        // Create user document if it doesn't exist
        console.log('User document not found, creating...')
        userData = {
          uid,
          testsTaken: 0,
          totalScore: 0,
          avgScore: 0,
          streak: 0,
          createdAt: serverTimestamp()
        }
        await setDoc(userRef, userData)
      } else {
        userData = userSnap.data()
      }
      
      const currentTestsTaken = userData.testsTaken || 0
      const currentTotalScore = userData.totalScore || 0
      const newTestsTaken = currentTestsTaken + 1
      const newTotalScore = currentTotalScore + testResult.score
      const newAvgScore = Math.round(newTotalScore / newTestsTaken)
      
      await updateDoc(userRef, {
        testsTaken: newTestsTaken,
        totalScore: newTotalScore,
        avgScore: newAvgScore,
        lastTestDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      console.log('User stats updated:', { newTestsTaken, newTotalScore, newAvgScore })
      
      return {
        testsTaken: newTestsTaken,
        totalScore: newTotalScore,
        avgScore: newAvgScore
      }
    } catch (error) {
      console.error('Error updating user stats:', error)
      throw error
    }
  }
}

/**
 * Streak Service
 */
export const StreakService = {
  // Check and update streak
  updateStreak: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      let userData = {}
      
      if (!userSnap.exists()) {
        // Create basic user doc if not exists
        console.log('User not found for streak update, creating...')
        userData = { streak: 0, lastTestDate: null }
        await setDoc(userRef, { 
          uid, 
          streak: 0, 
          createdAt: serverTimestamp() 
        }, { merge: true })
      } else {
        userData = userSnap.data()
      }
      
      const lastTestDate = userData.lastTestDate?.toDate() || null
      const currentStreak = userData.streak || 0
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let newStreak = currentStreak
      
      if (!lastTestDate) {
        // First test ever
        newStreak = 1
      } else {
        const lastDate = new Date(lastTestDate)
        lastDate.setHours(0, 0, 0, 0)
        
        const diffTime = today.getTime() - lastDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
          // Same day - no streak change, keep at least 1
          newStreak = Math.max(currentStreak, 1)
        } else if (diffDays === 1) {
          // Consecutive day - increment streak
          newStreak = currentStreak + 1
        } else {
          // Skipped days - reset streak
          newStreak = 1
        }
      }
      
      await updateDoc(userRef, {
        streak: newStreak,
        lastTestDate: serverTimestamp()
      })
      
      console.log('Streak updated to:', newStreak)
      return newStreak
    } catch (error) {
      console.error('Error updating streak:', error)
      throw error
    }
  },

  // Get user streak
  getStreak: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        return userSnap.data().streak || 0
      }
      return 0
    } catch (error) {
      console.error('Error getting streak:', error)
      throw error
    }
  }
}

/**
 * Leaderboard Service
 */
export const LeaderboardService = {
  // Update leaderboard entry for user
  updateLeaderboard: async (uid, userData) => {
    try {
      const leaderboardRef = doc(db, 'leaderboard', uid)
      
      await setDoc(leaderboardRef, {
        uid,
        name: userData.name,
        totalScore: userData.totalScore,
        avgScore: userData.avgScore,
        testsTaken: userData.testsTaken,
        streak: userData.streak,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (error) {
      console.error('Error updating leaderboard:', error)
      throw error
    }
  },

  // Get all-time leaderboard (simplified query - single orderBy)
  getAllTimeLeaderboard: async (limitCount = 10) => {
    try {
      const leaderboardRef = collection(db, 'leaderboard')
      const q = query(
        leaderboardRef, 
        orderBy('totalScore', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(q)
      const results = snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        id: doc.id,
        ...doc.data()
      }))
      
      // Sort by totalScore, then avgScore client-side
      return results.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return (b.avgScore || 0) - (a.avgScore || 0)
      })
    } catch (error) {
      console.error('Error getting all-time leaderboard:', error)
      return []
    }
  },

  // Get daily leaderboard (tests taken today)
  getDailyLeaderboard: async (limitCount = 10) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const leaderboardRef = collection(db, 'leaderboard')
      const q = query(
        leaderboardRef,
        where('updatedAt', '>=', Timestamp.fromDate(today)),
        limit(50) // Get more to filter and sort client-side
      )
      
      const snapshot = await getDocs(q)
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Sort by totalScore client-side and add ranks
      return results
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        .slice(0, limitCount)
        .map((item, index) => ({ ...item, rank: index + 1 }))
    } catch (error) {
      console.error('Error getting daily leaderboard:', error)
      // Fallback to all-time if daily query fails
      return LeaderboardService.getAllTimeLeaderboard(limitCount)
    }
  },

  // Get weekly leaderboard (tests taken this week)
  getWeeklyLeaderboard: async (limitCount = 10) => {
    try {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      weekAgo.setHours(0, 0, 0, 0)
      
      const leaderboardRef = collection(db, 'leaderboard')
      const q = query(
        leaderboardRef,
        where('updatedAt', '>=', Timestamp.fromDate(weekAgo)),
        limit(50) // Get more to filter and sort client-side
      )
      
      const snapshot = await getDocs(q)
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Sort by totalScore client-side and add ranks
      return results
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        .slice(0, limitCount)
        .map((item, index) => ({ ...item, rank: index + 1 }))
    } catch (error) {
      console.error('Error getting weekly leaderboard:', error)
      // Fallback to all-time if weekly query fails
      return LeaderboardService.getAllTimeLeaderboard(limitCount)
    }
  }
}

/**
 * Test Results Service
 */
export const TestResultService = {
  // Save test result
  saveTestResult: async (uid, testResult) => {
    try {
      const resultRef = doc(collection(db, 'testResults'))
      
      await setDoc(resultRef, {
        uid,
        ...testResult,
        createdAt: serverTimestamp()
      })
      
      return resultRef.id
    } catch (error) {
      console.error('Error saving test result:', error)
      throw error
    }
  },

  // Get user's test history
  getUserTestHistory: async (uid, limitCount = 10) => {
    try {
      console.log('Fetching test history for uid:', uid)
      const resultsRef = collection(db, 'testResults')
      
      // Simple query without orderBy to avoid index requirement
      const q = query(
        resultsRef,
        where('uid', '==', uid),
        limit(50) // Get more and sort client-side
      )
      
      const snapshot = await getDocs(q)
      console.log('Test history docs found:', snapshot.docs.length)
      
      const results = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to date string for display
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
        }
      })
      
      // Sort by createdAt descending client-side
      results.sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return dateB - dateA
      })
      
      return results.slice(0, limitCount)
    } catch (error) {
      console.error('Error getting test history:', error)
      return [] // Return empty array instead of throwing
    }
  }
}

export default {
  UserService,
  StreakService,
  LeaderboardService,
  TestResultService
}
