/* eslint-disable react-hooks/immutability */
 
 
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
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
  const [obstacles, setObstacles] = useState<Array<{ id: number; type: 'tree' | 'bush' |'fence'; y: number }>>([])
  const [countdown, setCountdown] = useState<number | null>(null)

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

    const handleGameStarted = () => {
      setCountdown(5)
    }

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

  // Obstacle animation effect (trees, bushes, rocks)
  useEffect(() => {
    if (gameStatus !== 'playing') return

    const interval = setInterval(() => {
      const types: Array<'tree' | 'bush' | 'fence'> = ['tree', 'bush', 'fence']
      const randomType = types[Math.floor(Math.random() * types.length)]
      
      setObstacles(prev => [...prev, { 
        id: Date.now() + Math.random(),
        type: randomType,
        y: Math.random() * 5 // Random vertical position for variety
      }])
    }, 1800) // Spawn a new obstacle every 1.8 seconds

    return () => clearInterval(interval)
  }, [gameStatus])

  // Clean up old obstacles that have moved off screen
  useEffect(() => {
    const cleanup = setInterval(() => {
      setObstacles(prev => prev.slice(-10)) // Keep only last 10 obstacles
    }, 5000)

    return () => clearInterval(cleanup)
  }, [])

  const fireConfetti = () => {
    const end = Date.now() + 5000
    const frame = () => {
      confetti({ particleCount: 6, spread: 60, origin: { x: 0 } })
      confetti({ particleCount: 6, spread: 60, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

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
          className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur"
        >
          <div className="mb-8">
            <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
              Room ID
            </p>
            <p className="mb-6 rounded-xl bg-white/10 p-4 font-mono text-2xl font-bold text-white">
              {roomId}
            </p>
          </div>

          <div className="mb-8 flex gap-8">
            <div className="flex-1">
              <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
                Scan to Join
              </p>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="mx-auto rounded-xl border border-white/20 p-4 bg-white w-[70%] aspect-square object-contain"
                />
              )}
            </div>
          </div>

          <div className="flex-1 mb-8">
              <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
                Players ({players.length})
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-white/5 p-4">
                {players.length === 0 ? (
                  <p className="text-gray-400">Waiting for players...</p>
                ) : (
                  <div className="flex gap-2 flex-wrap justify-center">
                    {players.map(player => (
                      <div
                        key={player.id}
                        className="rounded-lg w-fit bg-white/10 text-xl px-4 py-2 text-white"
                      >
                        {player.name}
                      </div>
                    ))}
                  </div>
                )}
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

  if (gameStatus === 'playing') {
    const bgUrl = '/playing_background.png'
    const treeUrl = '/tree.gif'
    const horseUrl = '/horse-2.gif'
    const bushUrl = '/bush.png'
    const fences = '/fences.png'
    return (
      <div className="h-screen bg-gradient-to-br from-[#0A0E27] to-[#050816] p-10 flex justify-center flex-col relative overflow-hidden" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover' }}>

          {/* Moving obstacles effect */}
          <AnimatePresence>
            {obstacles.map(obstacle => {
              const obstacleConfig = {
                tree: { src: treeUrl, height: 'h-96', duration: 5 },
                bush: { src: bushUrl, height: 'h-20', duration: 6 },
                fence: { src: fences, height: 'h-24', duration: 5.5 },
              }[obstacle.type]

              return (
                <motion.img
                  key={obstacle.id}
                  src={obstacleConfig.src}
                  alt={obstacle.type}
                  className={`absolute ${obstacleConfig.height} w-auto z-10 h- `}
                  style={{ bottom: `${11}%` }}
                  initial={{ right: '-10%' }}
                  animate={{ right: '110%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: obstacleConfig.duration, ease: 'linear' }}
                  onAnimationComplete={() => {
                    setObstacles(prev => prev.filter(o => o.id !== obstacle.id))
                  }}
                />
              )
            })}
          </AnimatePresence>

          <div className='relative w-full h-full'>
            <AnimatePresence>
              {clickEffects.map(e => (
                <motion.div
                  key={e.id}
                  className="absolute text-sm rounded-full font-semibold text-white shadow-lg z-999"
                  style={{ 
                    left: `${e.x}%`, 
                    top: `${e.y}%`, 
                    backgroundColor: e.color,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, y: -40 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="px-8 py-5">
                    {e.name}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
    

        <div className="mt-auto z-20 relative w-full">
          <div className="relative h-40 mb-4 flex items-center -top-14">
            <motion.img
              src={horseUrl}
              className="w-2xl rounded-xl absolute"
              animate={{ left: `calc(${progress}% - 290px )` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className=''>
          <div className="mb-3 flex justify-between">
          </div>

          <div className="h-10 overflow-hidden rounded-full bg-white p-4 relative flex items-center justify-center">
            <motion.div
              className="h-[90%] mx-[2px] rounded-full absolute left-0 p-1"
              style={{ backgroundColor: ' #FF6F00'}}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10 font-semibold text-gray-800">{progress.toFixed(0)}%</span>
          </div>
          </div>
        </div>

      
      </div>
    )
  }

  /* -------------------- COMPLETED -------------------- */

  if (gameStatus === 'completed') {
    const endingScreenUrl = '/ending_screen.webp'
    return (
    <div className="relative min-h-screen">
      <Image
        src={endingScreenUrl}
        alt="Ending screen"
        fill
        priority
        quality={70}
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'top' }}
      />
    </div>
      // <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0E27] via-[#1a0f2e] to-[#050816] p-5 relative overflow-hidden">
      //   {/* Animated background particles */}
      //   <div className="absolute inset-0 overflow-hidden">
      //     {[...Array(20)].map((_, i) => (
      //       <motion.div
      //         key={i}
      //         className="absolute rounded-full bg-gradient-to-br from-orange-400/30 to-yellow-400/30"
      //         style={{
      //           width: Math.random() * 100 + 50,
      //           height: Math.random() * 100 + 50,
      //           left: `${Math.random() * 100}%`,
      //           top: `${Math.random() * 100}%`,
      //         }}
      //         animate={{
      //           y: [0, -30, 0],
      //           opacity: [0.3, 0.6, 0.3],
      //           scale: [1, 1.2, 1],
      //         }}
      //         transition={{
      //           duration: Math.random() * 3 + 2,
      //           repeat: Infinity,
      //           ease: 'easeInOut',
      //         }}
      //       />
      //     ))}
      //   </div>

      //   <motion.div
      //     initial={{ opacity: 0, scale: 0.8 }}
      //     animate={{ opacity: 1, scale: 1 }}
      //     transition={{ duration: 0.5 }}
      //     className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl"
      //   >
      //     {/* Trophy/Victory Icon */}
      //     <motion.div
      //       initial={{ scale: 0, rotate: -180 }}
      //       animate={{ scale: 1, rotate: 0 }}
      //       transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      //       className="mb-6"
      //     >
      //       <span className="text-9xl">🏆</span>
      //     </motion.div>

      //     <motion.h1
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={{ opacity: 1, y: 0 }}
      //       transition={{ delay: 0.3 }}
      //       className="mb-4 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-6xl font-bold text-transparent"
      //     >
      //       Race Complete!
      //     </motion.h1>

      //     <motion.p
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={{ opacity: 1, y: 0 }}
      //       transition={{ delay: 0.4 }}
      //       className="mb-8 text-2xl text-gray-300"
      //     >
      //       🎉 Congratulations! The race has finished! 🎉
      //     </motion.p>

      //     {/* Stats Section */}
      //     <motion.div
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={{ opacity: 1, y: 0 }}
      //       transition={{ delay: 0.5 }}
      //       className="mb-8 grid grid-cols-2 gap-4"
      //     >
      //       <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 p-6 backdrop-blur">
      //         <p className="mb-2 text-sm uppercase tracking-widest text-gray-400">
      //           Total Clicks
      //         </p>
      //         <p className="text-4xl font-bold text-white">{totalClicks}</p>
      //       </div>
      //       <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 p-6 backdrop-blur">
      //         <p className="mb-2 text-sm uppercase tracking-widest text-gray-400">
      //           Players
      //         </p>
      //         <p className="text-4xl font-bold text-white">{players.length}</p>
      //       </div>
      //     </motion.div>

      //     {/* Player List */}
      //     <motion.div
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={{ opacity: 1, y: 0 }}
      //       transition={{ delay: 0.6 }}
      //       className="mb-8"
      //     >
      //       <p className="mb-4 text-sm uppercase tracking-widest text-gray-400">
      //         Amazing Players
      //       </p>
      //       <div className="max-h-48 overflow-y-auto rounded-xl bg-white/5 p-4">
      //         <ul className="space-y-2">
      //           {players.map((player, index) => (
      //             <motion.li
      //               key={player.id}
      //               initial={{ opacity: 0, x: -20 }}
      //               animate={{ opacity: 1, x: 0 }}
      //               transition={{ delay: 0.7 + index * 0.1 }}
      //               className="rounded-lg bg-gradient-to-r from-orange-500/30 to-yellow-500/30 px-4 py-3 text-white font-semibold"
      //             >
      //               {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎮'} {player.name}
      //             </motion.li>
      //           ))}
      //         </ul>
      //       </div>
      //     </motion.div>

      //     {/* New Game Button */}
      //     <motion.button
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={{ opacity: 1, y: 0 }}
      //       transition={{ delay: 0.8 }}
      //       onClick={() => {
      //         setGameStatus('initial')
      //         setRoomId(null)
      //         setQrCode(null)
      //         setJoinUrl(null)
      //         setPlayers([])
      //         setProgress(0)
      //         setTotalClicks(0)
      //         setClickEffects([])
      //         setObstacles([])
      //       }}
      //       className="rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-4 font-semibold text-white shadow-lg hover:scale-105 transition"
      //     >
      //       Start New Game
      //     </motion.button>
      //   </motion.div>
      // </div>
    )
  }

  return null
}
