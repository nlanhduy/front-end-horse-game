'use client'

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JoinPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
      const trimmedRoomId = roomId.trim()

    if (!trimmedRoomId) {
      setError('Please enter a room ID')
      return
    }

    if (trimmedRoomId.length < 6) {
      setError('Room ID must be at least 6 characters')
      return
    }

    setError('')
    router.push(`/join/${trimmedRoomId}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-14 text-center backdrop-blur w-full max-w-md"
      >
        <h1 className="mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-5xl font-bold text-transparent">
          🎮 Join Game
        </h1>
        <p className="mb-8 text-gray-400">
          Enter the room ID to join the game
        </p>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full rounded-xl bg-white/10 px-6 py-4 text-center font-mono text-2xl font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-red-400 text-sm"
          >
            {error}
          </motion.p>
        )}

        <button
          onClick={handleJoin}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-4 font-semibold text-white shadow-lg hover:scale-105 transition"
        >
          Join Room
        </button>
      </motion.div>
    </div>
  )
}