import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument,
  DocumentData,
} from '@angular/fire/firestore'
import { FormControl, FormBuilder, Validators } from '@angular/forms'
import firebase from 'firebase'
import { Player } from '../../players/player'
import { MatSnackBar, MatSnackBarVerticalPosition, MatSnackBarHorizontalPosition } from '@angular/material/snack-bar'
import { Subscription } from 'rxjs'
import { take } from 'rxjs/operators'
import { TournamentPlayer, Tournamnent } from '../tournament.model'

@Component({
  selector: 'app-enroll-player',
  templateUrl: './enroll-player.component.html',
  styleUrls: ['./enroll-player.component.scss'],
})
export class EnrollPlayerComponent implements OnInit, OnDestroy {
  playersCollection: AngularFirestoreCollection<Player>
  tournament_id: string
  tournament: Tournamnent
  tournamentDocument: AngularFirestoreDocument<Tournamnent>
  searchText = new FormControl()
  registeredPlayerPin = new FormControl()
  players: Player[]
  is_enrolled = false
  playerType: 'none' | 'new' | 'registered' = 'none'
  registeredPlayerForm = this.fb.group({
    player: [null, Validators.required],
    pin: ['', [Validators.required, Validators.maxLength(4)]],
    captaincy: [false],
  })
  newPlayerForm = this.fb.group({
    firstName: [null, Validators.required],
    lastName: [null],
    nickName: [''],
    address: ['Kolkata'],
    mobile: [null, [Validators.required, Validators.maxLength(10)]],
    yearOfBirth: [null],
    pin: [null, [Validators.required, Validators.maxLength(4)]],
    battingOrientation: ['right'],
    bowlingOrientation: ['right'],
    specialization: ['all-rounder'],
    captaincy: [false],
  })
  loading = false
  subscriptions = new Subscription()

  constructor(
    private activatedRoute: ActivatedRoute,
    private afs: AngularFirestore,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loading = true
    this.tournament_id = this.activatedRoute.snapshot.paramMap.get('id')
    this.tournamentDocument = this.afs.doc<Tournamnent>(`tournaments/${this.tournament_id}`)
    this.subscriptions.add(
      this.tournamentDocument.valueChanges().subscribe((tournament) => {
        this.tournament = { id: this.tournament_id, ...tournament }
        this.loading = false
      })
    )
    this.playersCollection = this.afs.collection<Player>('players', (ref) => ref.orderBy('firstName'))
    this.subscriptions.add(
      this.playersCollection.valueChanges({ idField: 'id' }).subscribe((players) => {
        this.players = players
        this.loading = false
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe()
  }
  displayFn(player?: Player): string | undefined {
    return player ? player.firstName + ' ' + player.lastName : undefined
  }

  enroll(event: Event, newPlayer = false) {
    this.loading = true
    if (newPlayer) {
      // console.log(this.newPlayerForm.value)
      if (this.newPlayerForm.valid) {
        this.afs
          .collectionGroup<Player>('players', (ref) =>
            ref.where('mobile', '==', this.newPlayerForm.controls.mobile.value)
          )
          .valueChanges()
          .pipe(take(1))
          .subscribe((players) => {
            if (players && players.length > 0) {
              this.loading = false
              this.openSnackBar('Mobile number already exists', 'Error!')
            } else {
              this.playersCollection
                .add({
                  ...this.newPlayerForm.value,
                  firstName: this.newPlayerForm.value.firstName.trim(),
                  lastName: this.newPlayerForm.value.lastName.trim(),
                  nickName: this.newPlayerForm.value.nickName.trim(),
                  career: {
                    ballsBowled: 0,
                    ballsFaced: 0,
                    battingAverage: 0,
                    bestBowlingFigures: { runs: 0, wickets: 0 },
                    catches: 0,
                    economy: 0,
                    highestScore: 0,
                    innings: 0,
                    matches: 0,
                    notOuts: 0,
                    runs: 0,
                    runsConceded: 0,
                    strikeRate: 0,
                    stumpings: 0,
                    wickets: 0,
                  },
                  tournaments: [this.afs.doc(`tournaments/${this.tournament_id}`).ref],
                })
                .then((data) => {
                  this.tournamentDocument
                    .update({
                      players: firebase.firestore.FieldValue.arrayUnion({
                        player: this.playersCollection.doc(data.id).ref,
                        isNominated: this.newPlayerForm.value.captaincy,
                        count: 0,
                        votes: [],
                      }) as unknown as TournamentPlayer[],
                    })
                    .then((data) => {
                      this.openSnackBar(
                        this.newPlayerForm.value.firstName + ' ' + this.newPlayerForm.value.lastName,
                        'Enrolled!'
                      )
                      this.newPlayerForm.reset()
                    })
                    .finally(() => (this.loading = false))
                })
                .catch((err) => this.openSnackBar(err, 'Error!'))
                .finally(() => (this.loading = false))
            }
          })
      } else {
        this.loading = false
        this.openSnackBar('Data you entered is incorrect', 'Invalid')
      }
    } else {
      // console.log(this.registeredPlayerForm.value)
      if (
        this.registeredPlayerForm.valid &&
        this.registeredPlayerForm.value.player.pin === this.registeredPlayerForm.value.pin
      ) {
        this.tournamentDocument.get().subscribe((doc) => {
          if (doc.exists) {
            const tournament = doc.data()
            const does_player_exist = tournament.players.find(
              (player) => player.player.id == this.registeredPlayerForm.value.player.id
            )
            if (!does_player_exist) {
              this.tournamentDocument
                .update({
                  players: firebase.firestore.FieldValue.arrayUnion({
                    player: this.playersCollection.doc(this.registeredPlayerForm.value.player.id).ref,
                    isNominated: this.registeredPlayerForm.value.captaincy,
                    count: 0,
                    votes: [],
                  }) as unknown as TournamentPlayer[],
                })
                .then((data) => {
                  this.openSnackBar(
                    this.registeredPlayerForm.value.player.firstName +
                      ' ' +
                      this.registeredPlayerForm.value.player.lastName +
                      ' enrolled',
                    ''
                  )
                })
                .catch((err) => this.openSnackBar(err, 'Error!'))
                .finally(() => (this.loading = false))
              this.playersCollection.doc(this.registeredPlayerForm.value.player.id).update({
                tournaments: firebase.firestore.FieldValue.arrayUnion(
                  this.tournamentDocument.ref
                ) as unknown as firebase.firestore.DocumentReference<DocumentData>[],
              })
            } else {
              this.loading = false
              this.openSnackBar('Player already enrolled!', '')
            }
          } else {
            this.loading = false
            this.openSnackBar('Something went wrong :(', 'Error!')
          }
        })
      } else {
        this.loading = false
        this.openSnackBar('Incorrect pin', 'Error!')
      }
    }
    this.is_enrolled = true
  }

  reset(event: Event, newPlayer = false) {
    if (newPlayer) {
      this.newPlayerForm.reset()
    } else {
      this.registeredPlayerForm.reset()
    }
  }

  leave($event: Event) {
    if (
      this.registeredPlayerForm.valid &&
      this.registeredPlayerForm.value.player.pin === this.registeredPlayerForm.value.pin
    ) {
      this.tournamentDocument.get().subscribe((doc) => {
        if (doc.exists) {
          const tournament = doc.data()
          const does_player_exist = tournament.players.find(
            (player) => player.player.id == this.registeredPlayerForm.value.player.id
          )
          if (does_player_exist) {
            this.tournamentDocument
              .update({
                players: tournament.players.filter(
                  (playerRef) => playerRef.player.id !== this.registeredPlayerForm.value.player.id
                ),
              })
              .then((data) => {
                this.openSnackBar(
                  this.registeredPlayerForm.value.player.firstName +
                    ' ' +
                    this.registeredPlayerForm.value.player.lastName +
                    ' left',
                  ''
                )
              })
              .catch((err) => this.openSnackBar(err, 'Error!'))
              .finally(() => (this.loading = false))
            this.playersCollection.doc(this.registeredPlayerForm.value.player.id).update({
              tournaments: firebase.firestore.FieldValue.arrayRemove(
                this.tournamentDocument.ref
              ) as unknown as firebase.firestore.DocumentReference<DocumentData>[],
            })
          } else {
            this.loading = false
            this.openSnackBar('Player is not enrolled!', '')
          }
        } else {
          this.loading = false
          this.openSnackBar('Something went wrong :(', 'Error!')
        }
      })
    } else {
      this.loading = false
      this.openSnackBar('Incorrect pin', 'Error!')
    }
  }

  private openSnackBar(
    message: string,
    action: string = '',
    duration: number = 2000,
    panelClass = 'accent',
    verticalPosition: MatSnackBarVerticalPosition = 'bottom',
    horizontalPosition: MatSnackBarHorizontalPosition = 'center'
  ) {
    this._snackBar.open(message, action, {
      duration,
      panelClass,
      verticalPosition,
      horizontalPosition,
    })
  }
}
