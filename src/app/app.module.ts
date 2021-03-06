import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { environment } from '../environments/environment'

import { ServiceWorkerModule } from '@angular/service-worker'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'
import { EffectsModule } from '@ngrx/effects'
import { StoreRouterConnectingModule, DefaultRouterStateSerializer } from '@ngrx/router-store'
import { StoreModule } from '@ngrx/store'

import { AngularFireModule } from '@angular/fire'

import { reducers, metaReducers } from './store'
import { AppEffects } from './app.effects'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { NavbarComponent } from './components/navbar/navbar.component'
import { HomeComponent } from './components/home/home.component'
import { AngularFirestoreModule } from '@angular/fire/firestore'
import { SharedModule } from './components/shared.module'
import { MaterialModule } from './material.module'
import { CustomSerializer } from './store/route.serializer'

@NgModule({
  declarations: [AppComponent, NavbarComponent, HomeComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: true,
      },
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
    EffectsModule.forRoot([AppEffects]),
    StoreRouterConnectingModule.forRoot({ serializer: DefaultRouterStateSerializer }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    SharedModule,
    MaterialModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
