/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useRoom } from '../../hooks/useRoom';
import { stages } from '../constants';
import { ClickEffect, GameStatus, Player } from '../types/game';

export default function AdminDashboard() {
  const { isConnected, createRoom, startGame, on, off } = useRoom()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameStatus, setGameStatus] = useState<GameStatus>('initial')
  const [progress, setProgress] = useState<number>(0)
  const [totalClicks, setTotalClicks] = useState<number>(0)
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([])

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C41A',
      '#FF85C0', '#13C2C2', '#FAAD14', '#F5222D', '#722ED1'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  useEffect(() => {
    if (!isConnected) return

    const handlePlayerJoined = (data: { players: Player[] }) => {
      setPlayers(data.players || [])
    }

    const handleGameStarted = () => setGameStatus('playing')

    const handleProgressUpdate = (data: {
      progress: number
      clickCount: number
      clickerName: string
    }) => {
      setProgress(data.progress)
      setTotalClicks(data.clickCount)

      const effect: ClickEffect = {
        id: Date.now() + Math.random(),
        name: data.clickerName,
        x: Math.random() * 80 + 10,
        y: Math.random() * 40 + 50,
        color: getRandomColor()
      }

      setClickEffects(prev => [...prev, effect])
      setTimeout(
        () => setClickEffects(prev => prev.filter(e => e.id !== effect.id)),
        2000
      )
    }

    const handleGameComplete = () => {
      setGameStatus('completed')
      // eslint-disable-next-line react-hooks/immutability
      fireConfetti()
    }

    on('player-joined', handlePlayerJoined)
    on('game-started', handleGameStarted)
    on('progress-update', handleProgressUpdate)
    on('game-complete', handleGameComplete)

    return () => {
      off('player-joined', handlePlayerJoined)
      off('game-started', handleGameStarted)
      off('progress-update', handleProgressUpdate)
      off('game-complete', handleGameComplete)
    }
  }, [isConnected, on, off])

  const fireConfetti = () => {
    const end = Date.now() + 5000
    const frame = () => {
      confetti({ particleCount: 6, spread: 60, origin: { x: 0 } })
      confetti({ particleCount: 6, spread: 60, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  const currentStage =
    stages.find(s => progress >= s.min && progress < s.max) || stages[3]

  /* -------------------- UI -------------------- */

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <p className="text-gray-400">Connecting to server...</p>
      </div>
    )
  }

  if (gameStatus === 'initial') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-14 text-center backdrop-blur"
        >
          <h1 className="mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-5xl font-bold text-transparent">
            🎮 New Year Game
          </h1>
          <p className="mb-8 text-gray-400">
            Create a room to start the countdown!
          </p>
          <button
            onClick={() =>
              createRoom((res: any) => {
                console.log('Room created:', res)
                setRoomId(res.roomId)
                setQrCode(res.qrCode)
                setJoinUrl(res.joinUrl)
                setGameStatus('lobby')
              })
            }
            className="rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-4 font-semibold text-white shadow-lg hover:scale-105 transition"
          >
            Create New Game
          </button>
        </motion.div>
      </div>
    )
  }

  /* -------------------- LOBBY -------------------- */

  if (gameStatus === 'lobby') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816] p-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur"
        >
          <h1 className="mb-8 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-4xl font-bold text-transparent">
            🎮 Game Lobby
          </h1>

          <div className="mb-8">
            <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
              Room ID
            </p>
            <p className="mb-6 rounded-xl bg-white/10 p-4 font-mono text-2xl font-bold text-white">
              {roomId}
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
                Scan to Join
              </p>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="mx-auto rounded-xl border border-white/20 p-4 bg-white w-64 h-64"
                />
              )}
            </div>

            <div className="flex-1">
              <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
                Players ({players.length})
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-white/5 p-4">
                {players.length === 0 ? (
                  <p className="text-gray-400">Waiting for players...</p>
                ) : (
                  <ul className="space-y-2">
                    {players.map(player => (
                      <li
                        key={player.id}
                        className="rounded-lg bg-white/10 px-4 py-2 text-white"
                      >
                        👤 {player.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {roomId && 
            <button
              onClick={() => {
                startGame(roomId, (res: any) => {
                  if (res.success) {
                    setGameStatus('playing')
                  }
                })
              }}
              disabled={players.length === 0}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-4 font-semibold text-white shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Game
            </button>
          }
        </motion.div>
      </div>
    )
  }

  if (gameStatus === 'playing') {
    const bgUrl = 'https://assets.filum.ai/20260130_135735_526faeb6b1.png'
    return (
      <div className="h-screen bg-gradient-to-br from-[#0A0E27] to-[#050816] p-10 flex justify-center flex-col relative" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover' }}>

         <AnimatePresence>
            {clickEffects.map(e => (
              <motion.div
                key={e.id}
                className="absolute rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg z-999 backdrop-blur"
                style={{ left: `${e.x}%`, top: `${e.y}%`, backgroundColor: e.color }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, y: -40 }}
                exit={{ opacity: 0 }}
              >
                {e.name}
              </motion.div>
            ))}
          </AnimatePresence>
    

        <div className="mt-auto">
              <img
            src='/horse.gif'
            className="mx-auto w-xl rounded-xl"
          />
          <div className=' rounded-3xl border border-white/10 bg-white p-8 backdrop-blur'>
          <div className="mb-3 flex justify-between">
            <span style={{ color: currentStage.color }} className="font-bold">
              {currentStage.label}
            </span>
            <span className="font-bold">{Math.round(progress)}%</span>
          </div>

          <div className="h-8 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full"
              style={{ backgroundColor: currentStage.color }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          </div>
        </div>

      
      </div>
    )
  }

  return null
}
