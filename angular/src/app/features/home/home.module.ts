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
import { MyActivityCardComponent }       from './components/my-activity-card.component';
// Contract G8 (D-560): IE pending-gates count card (standalone).
import { AllPendingGatesCardComponent }  from './components/all-pending-gates-card.component';
// Contract G10 (D-568 C): quarter deploy-goal card (standalone).
import { QuarterDeployGoalCardComponent } from './components/quarter-deploy-goal-card.component';
import { MyCompletedGatesCardComponent } from './components/my-completed-gates-card.component';
// Contract 41: R/C/I pending + recently completed gates (standalone).
import { MyRaciGatesCardComponent }      from './components/my-raci-gates-card.component';
import { EmbeddedChatCardComponent }     from './components/embedded-chat-card.component';
import { OnboardingMessageCardComponent } from './components/onboarding-message-card.component';
import { MyEasterEggsCardComponent }     from '../easter-eggs/my-easter-eggs-card.component';
import { CommunityEggsCardComponent }    from '../easter-eggs/community-eggs-card.component';
import { EggSpotComponent }              from '../easter-eggs/egg-spot.component';

@NgModule({
  declarations: [
    HomeComponent,
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
    MyActionQueueCardComponent,
    MyDeliveryCyclesCardComponent,
    MyActivityCardComponent,
    AllPendingGatesCardComponent,
    QuarterDeployGoalCardComponent,
    MyCompletedGatesCardComponent,
    MyRaciGatesCardComponent,
    MyEasterEggsCardComponent,
    CommunityEggsCardComponent,
    EggSpotComponent,
    RouterModule.forChild([{ path: '', component: HomeComponent }])
  ]
})
export class HomeModule {}
