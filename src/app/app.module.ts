import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DrawerComponent } from './drawer/drawer.component';
import { RawComponent } from './raw/raw.component';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { PropertiesComponent } from './properties/properties.component';
import { ObjectListComponent } from './object-list/object-list.component';
import { CollapseModule } from 'ngx-bootstrap/collapse'
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent,
    DrawerComponent,
    RawComponent,
    HomeComponent,
    PropertiesComponent,
    ObjectListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    CollapseModule,
    ToastrModule.forRoot({
      positionClass: "toast-bottom-left"
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
