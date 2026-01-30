/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { useRoom } from '@/hooks/useRoom';

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()

  const roomId =
    Array.isArray(params.roomId) ? params.roomId[0] : params.roomId ?? ''

  const { isConnected, joinRoom, getRoomState, on, off } = useRoom()

  const [playerName, setPlayerName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isJoining, setIsJoining] = useState<boolean>(false)
  const [hasJoined, setHasJoined] = useState<boolean>(false)
  const [roomExists, setRoomExists] = useState<boolean | null>(null)

  // Check if room exists and listen for game start
  useEffect(() => {
    if (!isConnected) return

    getRoomState(roomId, (res: any) => {
      if (res.success) {
        setRoomExists(true)
      } else {
        setRoomExists(false)
        setError('Room not found. Please check the room ID.')
      }
    })

    const handleGameStarted = () => {
      router.push('/play/' + roomId)
    }

    on('game-started', handleGameStarted)

    return () => {
      off('game-started', handleGameStarted)
    }
  }, [isConnected, roomId, on, off, getRoomState])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (playerName.trim().length > 20) {
      setError('Name must be 20 characters or less')
      return
    }

    setIsJoining(true)
    setError('')

    joinRoom(roomId, playerName.trim(), (response: any) => {
      if (response.success) {
        setHasJoined(true)
        sessionStorage.setItem('playerId', String(response.playerId))
        sessionStorage.setItem('playerName', playerName.trim())
        sessionStorage.setItem('roomId', String(roomId))
      } else {
        setError(response.error || 'Failed to join game')
        setIsJoining(false)
      }
    })
  }

  /* -------------------- STATES -------------------- */
    if (roomExists === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816] px-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          <div className="spinner mx-auto" />
          <p className="mt-5 text-gray-400">Checking room...</p>
        </div>
      </div>
    )
  }

  if (roomExists === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816] px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur"
        >
          <h1 className="mb-4 text-4xl font-bold text-red-400">❌ Room Not Found</h1>
          <p className="mb-6 text-gray-400">The room ID is invalid or the game has ended.</p>
          <button
            onClick={() => router.push('/join')}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-4 font-semibold text-white shadow-lg hover:scale-105 transition"
          >
            Back to Join
          </button>
        </motion.div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816] px-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          <div className="spinner mx-auto" />
          <p className="mt-5 text-gray-400">Connecting...</p>
        </div>
      </div>
    )
  }

  if (hasJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816] px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-14 text-center backdrop-blur"
        >
          <motion.div
            className="mb-6 text-7xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            ⏳
          </motion.div>

          <h2 className="mb-4 text-4xl font-bold">You&apos;re In!</h2>
          <p className="mb-8 text-gray-400">
            Waiting for the game to start...
          </p>

          <motion.div
            className="mx-auto h-3 w-3 rounded-full bg-orange-500"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    )
  }

  /* -------------------- JOIN FORM -------------------- */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816] px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur"
      >
        <div className="mb-6 text-6xl animate-pulse">🎮</div>

        <h1 className="mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-4xl font-bold text-transparent">
          Join the Game
        </h1>

        <p className="mb-10 text-gray-400">
          Enter your name to participate
        </p>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-6 text-left">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              autoFocus
              disabled={isJoining}
              className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 text-lg text-white outline-none transition focus:border-orange-400 disabled:opacity-50"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isJoining || !playerName.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-4 text-lg font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJoining ? (
              <>
                <div className="spinner h-5 w-5" />
                Joining...
              </>
            ) : (
              'Join Game →'
            )}
          </motion.button>
        </form>

        <div className="border-t border-white/10 pt-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-gray-400">
            Room Code
          </p>
          <p className="text-2xl font-bold">{roomId}</p>
        </div>
      </motion.div>
    </div>
  )
}
