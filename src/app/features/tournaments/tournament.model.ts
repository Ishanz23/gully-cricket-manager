import { AngularFirestoreDocument } from '@angular/fire/firestore'
import { Player } from '../players/player'
import firebase from 'firebase'
export interface Tournamnent {
  id?: string
  name: string
  season: string
  address?: string
  city?: string
  startDate?: firebase.firestore.Timestamp
  endDate?: firebase.firestore.Timestamp
  duration?: number
  noOfTeams?: number
  votingOpen: boolean
  adminPin?: string
  players: TournamentPlayer[]
}
export interface TournamentPlayer {
  count: number
  isNominated: boolean
  votes: string[]
  player: firebase.firestore.DocumentReference
}
