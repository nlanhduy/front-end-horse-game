/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useState } from 'react';

import { useSocket } from './useSocket';

interface RoomState {
  id: string
  players: Array<{
    id: string
    name: string
    clickCount: number
  }>
  progress: number
  started: boolean
}

interface SocketResponse<T = any> {
  success: boolean
  error?: string
  room?: T
}

export function useRoom() {
  const { emit, on, off, isConnected } = useSocket()

  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createRoom = useCallback(
    (callback?: (res: SocketResponse) => void) => {
      emit<SocketResponse>('create-room', {}, (response) => {
        response.success ? setError(null) : setError(response.error ?? null)
        callback?.(response)
      })
    },
    [emit]
  )

  const joinRoom = useCallback(
    (
      roomId: string,
      playerName: string,
      callback?: (res: SocketResponse) => void
    ) => {
      emit<SocketResponse>(
        'join-room',
        { roomId, playerName },
        (response) => {
          response.success
            ? setError(null)
            : setError(response.error ?? null)
          callback?.(response)
        }
      )
    },
    [emit]
  )

  const startGame = useCallback(
    (roomId: string, callback?: (res: SocketResponse) => void) => {
      emit<SocketResponse>('start-game', { roomId }, (response) => {
        response.success
          ? setError(null)
          : setError(response.error ?? null)
        callback?.(response)
      })
    },
    [emit]
  )

  const sendClick = useCallback(
    (roomId: string, playerId: string, callback?: (res: SocketResponse) => void) => {
      emit<SocketResponse>('player-click', { roomId, playerId }, callback)
    },
    [emit]
  )

  const getRoomState = useCallback(
    (roomId: string, callback?: (res: SocketResponse) => void) => {
      emit<SocketResponse<RoomState>>(
        'get-room-state',
        { roomId },
        (response) => {
          if (response.success && response.room) {
            setRoomState(response.room)
          } else {
            setError(response.error ?? null)
          }
          callback?.(response)
        }
      )
    },
    [emit]
  )

  const rejoinRoom = useCallback(
    (roomId: string, playerId: string, playerName: string, callback?: (res: SocketResponse) => void) => {
      emit<SocketResponse>(
        'rejoin-room',
        { roomId, playerId, playerName },
        (response) => {
          response.success ? setError(null) : setError(response.error ?? null)
          callback?.(response)
        }
      )
    },
    [emit]
  )

  return {
    isConnected,
    roomState,
    error,
    createRoom,
    joinRoom,
    startGame,
    sendClick,
    getRoomState,
    rejoinRoom,
    on,
    off,
  }
}
