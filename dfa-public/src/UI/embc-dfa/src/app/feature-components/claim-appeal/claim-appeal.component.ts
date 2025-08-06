import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClaimAppealService, ClaimAppeal } from '../../core/services/claim-appeal.service';
import { ApplicationService } from '../../../core/services/application.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { AlertService } from '../../../core/services/alert.service';
import { FileCategory } from '../../../core/models/file-upload.model';

@Component({
  selector: 'app-claim-appeal',
  templateUrl: './claim-appeal.component.html',
  styleUrls: ['./claim-appeal.component.scss']
})
export class ClaimAppealComponent implements OnInit, OnDestroy {
  @Input() claimId: string = '';
  @Input() readOnly: boolean = false;

  claimAppealForm: FormGroup;
  existingAppeals: ClaimAppeal[] = [];
  isLoading: boolean = false;
  hasUnsavedChanges: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private claimAppealService: ClaimAppealService,
    private applicationService: ApplicationService,
    private attachmentService: AttachmentService,
    private alertService: AlertService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Get claimId from route params if not provided as input
    if (!this.claimId) {
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        this.claimId = params['claimId'];
        this.loadExistingAppeals();
      });
    } else {
      this.loadExistingAppeals();
    }

    // Monitor form changes for unsaved changes warning
    this.claimAppealForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasUnsavedChanges = this.claimAppealForm.dirty;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.claimAppealForm = this.fb.group({
      appealReason: ['', [Validators.required, Validators.maxLength(2000)]]
    });

    if (this.readOnly) {
      this.claimAppealForm.disable();
    }
  }

  private loadExistingAppeals(): void {
    if (!this.claimId) return;

    this.isLoading = true;
    this.claimAppealService.getClaimAppealsByClaim(this.claimId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appeals) => {
          this.existingAppeals = appeals;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading claim appeals:', error);
          this.alertService.setAlert('danger', 'Error loading existing appeals');
          this.isLoading = false;
        }
      });
  }

  public submitAppeal(): void {
    if (this.claimAppealForm.valid && !this.readOnly) {
      this.isLoading = true;

      const claimAppeal: ClaimAppeal = {
        claimId: this.claimId,
        appealReason: this.claimAppealForm.get('appealReason')?.value,
        createdOnPortal: true
      };

      this.claimAppealService.createClaimAppeal(claimAppeal)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (appealId) => {
            this.alertService.setAlert('success', 'Claim appeal submitted successfully');
            this.claimAppealForm.reset();
            this.hasUnsavedChanges = false;
            this.loadExistingAppeals(); // Refresh the list
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error submitting claim appeal:', error);
            this.alertService.setAlert('danger', 'Error submitting claim appeal. Please try again.');
            this.isLoading = false;
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.claimAppealForm.controls).forEach(key => {
      const control = this.claimAppealForm.get(key);
      control?.markAsTouched();
    });
  }

  public getErrorMessage(fieldName: string): string {
    const control = this.claimAppealForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('maxlength')) {
      return `${fieldName} exceeds maximum length`;
    }
    return '';
  }

  public formatAppealStatus(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'Under Review';
      case 'inactive':
        return 'Closed';
      default:
        return status || 'Unknown';
    }
  }

  public formatAppealDecision(decision?: string): string {
    switch (decision?.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'declined':
        return 'Declined';
      case 'partial':
        return 'Partially Approved';
      default:
        return decision || 'Pending';
    }
  }

  public canSubmitAppeal(): boolean {
    return !this.readOnly && 
           this.claimAppealForm.valid && 
           !this.isLoading &&
           !this.hasActiveAppeal();
  }

  private hasActiveAppeal(): boolean {
    return this.existingAppeals.some(appeal => 
      appeal.appealStatus?.toLowerCase() === 'active' && 
      !appeal.appealDecisionDate
    );
  }

  public getCharacterCount(fieldName: string): number {
    return this.claimAppealForm.get(fieldName)?.value?.length || 0;
  }
}
