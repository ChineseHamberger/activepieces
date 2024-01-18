import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { SigningKeysDataSource } from './signing-keys-table.datasource';
import { Observable, Subject, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CreateSigningKeyDialogComponent } from '../dialogs/create-signing-key-dialog/create-signing-key-dialog.component';
import { startWith } from 'rxjs';
import { Platform, SigningKey } from '@activepieces/ee-shared';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { SigningKeysService } from '../../service/signing-keys.service';

@Component({
  selector: 'app-signing-keys-table',
  templateUrl: './signing-keys-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigningKeysTableComponent implements OnInit {
  displayedColumns = ['id', 'displayName', 'created', 'action'];
  dataSource!: SigningKeysDataSource;
  refresh$: Subject<boolean> = new Subject();
  dialogClosed$?: Observable<unknown>;
  featureDisabledTooltip = featureDisabledTooltip;
  @Input({ required: true }) platform!: Platform;
  constructor(
    private matDialog: MatDialog,
    private signingKeysService: SigningKeysService
  ) {}
  ngOnInit(): void {
    this.dataSource = new SigningKeysDataSource(
      this.refresh$.asObservable().pipe(startWith(false)),
      this.signingKeysService,
      !this.platform.embeddingEnabled || !!this.platform.isDemo
    );
  }

  createKey() {
    const dialog = this.matDialog.open(CreateSigningKeyDialogComponent, {
      disableClose: true,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }

  deleteKey(key: SigningKey) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.signingKeysService.delete(key.id).pipe(
        tap(() => {
          this.refresh$.next(true);
        })
      ),
      entityName: key.displayName,
      note: $localize`This will permanently delete the key, all embedding that was using this key will break.`,
    };
    const dialog = this.matDialog.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }
}
