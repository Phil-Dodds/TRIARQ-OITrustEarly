// home.module.ts
import { NgModule }          from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { IonicModule }       from '@ionic/angular';
import { HomeComponent }     from './home.component';
import { MyActionQueueCardComponent }    from './components/my-action-queue-card.component';
import { MyNotificationsCardComponent }  from './components/my-notifications-card.component';
import { SystemHealthCardComponent }     from './components/system-health-card.component';
import { OILibraryCardComponent }        from './components/oi-library-card.component';
import { DivisionsCardComponent }        from './components/divisions-card.component';
import { UserManagementCardComponent }   from './components/user-management-card.component';
import { MyDeliveryCyclesCardComponent } from './components/my-delivery-cycles-card.component';
import { EmbeddedChatCardComponent }     from './components/embedded-chat-card.component';
import { OnboardingMessageCardComponent } from './components/onboarding-message-card.component';

@NgModule({
  declarations: [
    HomeComponent,
    MyActionQueueCardComponent,
    MyNotificationsCardComponent,
    SystemHealthCardComponent,
    OILibraryCardComponent,
    DivisionsCardComponent,
    UserManagementCardComponent,
    EmbeddedChatCardComponent,
    OnboardingMessageCardComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    MyDeliveryCyclesCardComponent,
    RouterModule.forChild([{ path: '', component: HomeComponent }])
  ]
})
export class HomeModule {}
