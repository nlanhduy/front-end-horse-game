/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

type EmitCallback<T = any> = (response: T) => void

export function useSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [reconnecting, setReconnecting] = useState<boolean>(false)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      setIsConnected(true)
      setReconnecting(false)
    })

    socket.on('disconnect', (reason: string) => {
      setIsConnected(false)
    })

    socket.on('reconnect_attempt', () => {
      setReconnecting(true)
    })

    socket.on('reconnect', () => {
      setIsConnected(true)
      setReconnecting(false)
    })

    socket.on('reconnect_failed', () => {
      setReconnecting(false)
    })

    socket.on('error', (error: unknown) => {
      console.error('Socket error:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const emit = useCallback(
    <T = any,>(
      event: string,
      data?: any,
      callback?: EmitCallback<T>
    ) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, data, callback)
      } else {
        console.warn('Socket not connected, cannot emit event:', event)
        callback?.({ success: false, error: 'Not connected' } as T)
      }
    },
    [isConnected]
  )

  const on = useCallback(
    <T = any>(event: string, handler: (data: T) => void) => {
      socketRef.current?.on(event, handler)
    },
    []
  )

  const off = useCallback(
    <T = any>(event: string, handler?: (data: T) => void) => {
      if (!socketRef.current) return
      handler
        ? socketRef.current.off(event, handler)
        : socketRef.current.off(event)
    },
    []
  )

  return {
    isConnected,
    reconnecting,
    emit,
    on,
    off,
  }
}
