/* eslint-disable react-hooks/immutability */
 
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { MouseEvent, useEffect, useRef, useState } from 'react';

import { stages } from '@/app/constants';
import { ClickEffect, GameStatus } from '@/app/types/game';
import { useRoom } from '@/hooks/useRoom';

export default function PlayPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId
  const { isConnected, sendClick, on, off, getRoomState, rejoinRoom } = useRoom()

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting')
  const [progress, setProgress] = useState<number>(0)
  const [clickCount, setClickCount] = useState<number>(0)
  const [isAnimating, setIsAnimating] = useState<boolean>(false)
  const [tapEffects, setTapEffects] = useState<ClickEffect[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)

  const buttonRef = useRef<HTMLButtonElement | null>(null)

  /* -------------------- INIT -------------------- */

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId')
    const storedPlayerName = sessionStorage.getItem('playerName')
    const storedRoomId = sessionStorage.getItem('roomId')

    if (!storedPlayerId || !storedPlayerName || !storedRoomId) {
      router.push('/join')
      return
    }

    setTimeout(() => {
        setPlayerId(storedPlayerId)
        setPlayerName(storedPlayerName)
    }, 0)
  }, [router])

  useEffect(() => {
    if (!roomId || !playerId) return

    rejoinRoom(roomId, playerId, playerName, (res: any) => {
      if (res.success) {
        const status = res.roomStatus
        if (status === 'playing') {
          setCountdown(5)
        } else {
          setGameStatus(status)
        }
        setProgress(res.progress ?? 0)
      }
    })
  }, [roomId, playerId, playerName, rejoinRoom])

  useEffect(() => {
    if (!isConnected || !roomId) return

    getRoomState(roomId, (res: any) => {
      if (res.success && res.room?.status) {
        const status = res.room.status
        if (status === 'playing') {
          setCountdown(5)
        } else {
          setGameStatus(status)
        }
        setProgress(res.room.progress ?? 0)
      }
    })
  }, [isConnected, roomId, getRoomState])

  useEffect(() => {
    if (!isConnected) return

    const handleGameStarted = () => {
      setCountdown(5)
    }

    const handleProgressUpdate = (data: { progress: number }) => {
      setProgress(data.progress)
    }

    const handleGameComplete = () => {
      setGameStatus('completed')
      fireConfetti()
    }

    on('game-started', handleGameStarted)
    on('progress-update', handleProgressUpdate)
    on('game-complete', handleGameComplete)

    return () => {
      off('game-started', handleGameStarted)
      off('progress-update', handleProgressUpdate)
      off('game-complete', handleGameComplete)
    }
  }, [isConnected, on, off])

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setGameStatus('playing')
      setCountdown(null)
    }
  }, [countdown])

  /* -------------------- ACTIONS -------------------- */

  const handleTap = (e: MouseEvent<HTMLButtonElement>) => {
    if (gameStatus !== 'playing' || isAnimating || !buttonRef.current) return

    setIsAnimating(true)
    setClickCount(prev => prev + 1)

    const rect = buttonRef.current.getBoundingClientRect()
    const effect: ClickEffect  = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    setTapEffects(prev => [...prev, effect])
    setTimeout(
      () => setTapEffects(prev => prev.filter(t => t.id !== effect.id)),
      1000
    )

    if (isConnected && roomId) {
      sendClick(roomId, playerId!, (res: any) => {
        if (res.success && typeof res.progress === 'number') {
          setProgress(res.progress)
        }
      })
    }

    setTimeout(() => setIsAnimating(false), 150)
  }

  const fireConfetti = () => {
    const end = Date.now() + 5000
    const frame = () => {
      confetti({
        particleCount: 5,
        spread: 55,
        angle: 60,
        origin: { x: 0, y: 0.8 }
      })
      confetti({
        particleCount: 5,
        spread: 55,
        angle: 120,
        origin: { x: 1, y: 0.8 }
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  const currentStage =
    stages.find(s => progress >= s.min && progress < s.max) || stages[3]

  /* -------------------- STATES -------------------- */

  if (!isConnected || !playerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          <div className="spinner mx-auto" />
          <p className="mt-5 text-gray-400">Connecting...</p>
        </div>
      </div>
    )
  }

  /* -------------------- WAITING -------------------- */

  if (gameStatus === 'waiting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-14 text-center backdrop-blur"
        >
          <motion.div
            className="mb-8 text-7xl"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            ⏳
          </motion.div>

          <h2 className="mb-4 text-4xl font-bold">Ready to Play!</h2>
          <p className="mb-8 text-gray-400">
            Waiting for the host to start the game...
          </p>

          <div className="rounded-2xl bg-white/5 p-5">
            <p className="text-xs uppercase tracking-widest text-gray-400">
              You are
            </p>
            <p className="mt-2 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-2xl font-bold text-transparent">
              {playerName}
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  /* -------------------- COUNTDOWN -------------------- */

  if (countdown !== null && countdown >= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          {countdown === 0 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="text-9xl font-bold"
            >
              🏁
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-[200px] font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                {countdown}
              </div>
            </motion.div>
          )}
          <motion.p
            className="mt-8 text-2xl text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {countdown === 0 ? 'GO!' : 'Get Ready...'}
          </motion.p>
        </motion.div>
      </div>
    )
  }

  /* -------------------- PLAYING -------------------- */

  if (gameStatus === 'playing') {
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          {countdown === 0 ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="text-9xl font-bold"
            >
              🏁
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-[200px] font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                {countdown}
              </div>
            </motion.div>
          )}
          <motion.p
            className="mt-8 text-2xl text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {countdown === 0 ? 'GO!' : 'Get Ready...'}
          </motion.p>
        </motion.div>
      </div>
    
  }

  if (gameStatus === 'playing') {
    return (
      <div
        className="min-h-screen px-5 py-10 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${currentStage.color}20 0%, #050816 100%)`
        }}
      >
        <div className="mx-auto flex max-w-xl flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <span className="font-semibold">{playerName}</span>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-400">
                Your taps
              </p>
              <motion.p
                key={clickCount}
                initial={{ scale: 1.5, color: currentStage.color }}
                animate={{ scale: 1, color: '#F8F9FA' }}
                className="text-2xl font-bold"
              >
                {clickCount}
              </motion.p>
            </div>
          </div>

          {/* Tap Button */}
          <div className="flex min-h-[360px] items-center justify-center">
            <motion.button
              ref={buttonRef}
              onClick={handleTap}
              whileTap={{ scale: 0.95 }}
              animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.15 }}
              className="relative flex h-[260px] w-[260px] select-none flex-col items-center justify-center rounded-full border-4 backdrop-blur"
              style={{
                borderColor: currentStage.color,
                background: isAnimating
                  ? currentStage.gradient
                  : 'rgba(255,255,255,0.1)',
                boxShadow: isAnimating
                  ? `0 0 60px ${currentStage.color}80`
                  : `0 0 40px ${currentStage.color}40`
              }}
            >
              <AnimatePresence>
                {tapEffects.map(e => (
                  <motion.div
                    key={e.id}
                    className="absolute h-[100px] w-[100px] rounded-full border-4"
                    style={{
                      left: e.x,
                      top: e.y,
                      borderColor: currentStage.color,
                      transform: 'translate(-50%, -50%)'
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  />
                ))}
              </AnimatePresence>

              <motion.span
                className="text-5xl font-bold text-white"
                animate={{ scale: isAnimating ? [1, 1.1, 1] : 1 }}
              >
                TAP!
              </motion.span>
              <span className="mt-2 text-xs uppercase tracking-widest text-white/80">
                Keep tapping to win
              </span>
            </motion.button>
          </div>

          <motion.div
            className="rounded-xl bg-white/5 p-4 text-center font-semibold"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔥 Every tap counts! Keep going!
          </motion.div>
        </div>
      </div>
    )
  }

  /* -------------------- COMPLETED -------------------- */

  if (gameStatus === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] to-[#050816]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-14 text-center backdrop-blur"
        >
          <motion.div
            className="mb-8 text-7xl"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉
          </motion.div>

          <h1 className="mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-4xl font-bold text-transparent">
            Happy New Year!
          </h1>

          <p className="mb-8 text-gray-400">
            You helped bring in 2026!
          </p>

          <div className="mb-8 rounded-2xl border border-orange-400/30 bg-white/5 px-12 py-6">
            <p className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-4xl font-bold text-transparent">
              {clickCount}
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-gray-400">
              Your taps
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl bg-orange-500/20 px-6 py-4 font-semibold text-orange-400"
          >
            ✨ Thank you for playing! ✨
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return null
}
