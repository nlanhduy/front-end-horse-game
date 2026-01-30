export type GameStatus = 'initial' | 'lobby' | 'playing' | 'completed' | 'waiting'

export type Player = {
  id: string
  name: string
}

export type Stage = {
  min: number
  max: number
  color: string
  label: string
  emoji: string
}

export type ClickEffect = {
  id: number
  name?: string
  x: number
  y: number
  color?: string
}


