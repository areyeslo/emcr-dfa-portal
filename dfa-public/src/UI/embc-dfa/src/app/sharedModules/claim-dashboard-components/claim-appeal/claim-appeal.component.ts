import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DfaClaimMain } from 'src/app/core/api/models';
import { CoreModule } from 'src/app/core/core.module';
import { DFAClaimMainDataService } from 'src/app/feature-components/dfa-claim-main/dfa-claim-main-data.service';
import { InvoiceExtended } from '../claim-decision/claim-decision.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FixedCurrencyPipe } from 'src/app/core/pipe/fixedCurrency.pipe';
import InvoiceComponent from '../../forms/dfa-claim-main-forms/invoice/invoice.component';
import { FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { CancelConfirmationDialogComponent } from 'src/app/core/components/dialog-components/dfa-cancel-confirmation-dialog/dfa-cancel-confirmation-dialog.component';
import { ClaimAppealService } from 'src/app/core/api/services/claim-appeal.service';
import { SubmitClaimAppealRequest, InvoiceAppealRequest } from 'src/app/core/api/models';
import { MatSnackBar } from '@angular/material/snack-bar';


type TableRow = 
  | { type: 'invoice'; data: InvoiceExtended }
  | { type: 'appealReason'; data: InvoiceExtended };

@Component({
  selector: 'app-claim-appeal',
  standalone: true,
  imports: [CoreModule, MatCardModule, MatTableModule, CommonModule, MatDialogModule, MatCheckboxModule, FixedCurrencyPipe, FormsModule, MatStepperModule],
  templateUrl: './claim-appeal.component.html',
  styleUrl: './claim-appeal.component.scss'
})
export class ClaimAppealComponent implements OnInit {
  claimMain: DfaClaimMain | null = null;

  documentSummaryColumnsToDisplay = ['appealCheckbox','invoiceNumber', 'vendorName', 'invoiceDate', 'invoiceAmount', 'approvedAmount', 'paidAmount', 'appealAdjustment', 'viewInvoice'];
  appealReasonColumnsToDisplay = ['appealReasonCheckboxPlaceholder', 'appealReason'];
  documentSummaryDataSource = new MatTableDataSource<TableRow>();
  selection = new SelectionModel<InvoiceExtended>(true, []);
  selectedStepIndex: number = 4;
  
  constructor(
    private route: ActivatedRoute,
    public dfaClaimMainDataService: DFAClaimMainDataService,
    private router: Router,
    public dialog: MatDialog,
    private claimAppealService: ClaimAppealService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.claimMain = this.dfaClaimMainDataService.getDFAProjectMain() ?? null;
    const invoices = this.dfaClaimMainDataService.getClaimInvoices() ?? [];

    // Union invoice data + 'appealReason'
    const interleavedRows: TableRow[] = invoices.reduce<TableRow[]>((acc, invoice) => {
      acc.push({ type: 'invoice', data: invoice });
      acc.push({ type: 'appealReason', data: invoice });
      return acc;
    }, []);

    this.documentSummaryDataSource.data = interleavedRows.filter(
      row => !(row.type === 'appealReason' && row.data.emcrDecision === 'Approved Total')
    );
  }

  BackToDashboard() {
    const projId = this.dfaClaimMainDataService.getProjectId();
    this.router.navigate(['/dfa-project/' + projId + '/claims']);
  }

  getYesNoNotSet(value: boolean | null | undefined): string {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'Not Set';
  }

  isInvoiceRow = (_: number, row: TableRow): boolean => row.type === 'invoice';
  isAppealReasonRow = (_: number, row: TableRow): boolean => row.type === 'appealReason';

  // highlight row and remove hair line between the invoice and appeal reason row
  getRowClass(row: TableRow, index: number): string {
    const isInvoice = row.type === 'invoice';
    const next = this.documentSummaryDataSource.data[index + 1];
    const isNextAppeal = next?.type === 'appealReason';
    const isSelected = this.selection.isSelected(row.data);
    const isDisabled = row.data.emcrDecision === 'Approved Total';
    const classes = [];

    if (isInvoice) {
      classes.push('invoice-row');
      if (isNextAppeal) {
        classes.push('no-border');
      }
    }

    if (isSelected) {
      classes.push('selected-row');
    }
    if (isDisabled) {
      classes.push('disabled-row');
    }

    return classes.join(' ');
  }

  reasonTouchedMap: { [invoiceId: string]: boolean } = {};

  onAppealCheckboxChange(invoice: InvoiceExtended): void {
    this.selection.toggle(invoice);

    if (this.selection.isSelected(invoice)) {
      this.reasonTouchedMap[invoice.invoiceId] = true;
    } else {
      this.reasonTouchedMap[invoice.invoiceId] = false;
    }
  }

  isAppealFormValid(): boolean {
    const selectedRows = this.selection.selected;

    if (!selectedRows.length) {
      return false;
    }

    return selectedRows.every(row => !!row.appealReason?.trim());
  }

  submitAppeal(): void {
    // const invalidRows = this.documentSummaryDataSource.data
    //   .filter(row => this.selection.isSelected(row.data) && !row.data.appealReason?.trim());

    const selectedInvoices = this.selection.selected;

    if (!selectedInvoices.length) return; // safe but silent

    console.log('Submitting appeal for selected invoices:', selectedInvoices);

    // Get the claim ID from the data service
    const claimId = this.dfaClaimMainDataService.getClaimId();
    
    if (!claimId) {
      console.error('No claim ID found');
      this.snackBar.open('Error: No claim ID found. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Map the selected invoices to the API request format
    const invoiceAppeals: InvoiceAppealRequest[] = selectedInvoices.map(invoice => ({
      invoiceId: invoice.invoiceId,
      appealReason: invoice.appealReason || '',
      appealAdjustment: invoice.appealAdjustment || null
    }));

    // Create the request object
    const request: SubmitClaimAppealRequest = {
      claimId: claimId,
      selectedInvoices: invoiceAppeals
    };

    // Submit the appeal
    this.claimAppealService.claimAppealSubmitClaimAppeal({ body: request }).subscribe({
      next: (response) => {
        console.log('Appeal submitted successfully:', response);
        this.snackBar.open('Appeal submitted successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        // Navigate back to claim decision or show success message
        this.router.navigate(['/app-claim-decision/' + claimId]);
      },
      error: (error) => {
        console.error('Error submitting appeal:', error);
        
        // Handle specific error for existing appeal
        if (error.error && typeof error.error === 'string' && 
            error.error.includes('Existing claim appeal found')) {
          this.snackBar.open('An appeal already exists for this claim. Only one appeal per claim is allowed.', 'Close', {
            duration: 8000,
            panelClass: ['error-snackbar']
          });
        } else if (error.status === 400 && error.error) {
          // Handle other 400 errors with more specific messages
          this.snackBar.open(`Error submitting appeal: ${error.error}`, 'Close', {
            duration: 8000,
            panelClass: ['error-snackbar']
          });
        } else {
          this.snackBar.open('Error submitting appeal. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  viewInvoiceRow(element, index): void {
    this.openInvoiceViewPopup(element, index);
  }
  
  openInvoiceViewPopup(objInvoice, _index): void {
    if (objInvoice && objInvoice.invoiceId) {
      this.dfaClaimMainDataService.setInvoiceId(objInvoice.invoiceId);
      delete (objInvoice as any).invoiceId;
    } else {
      this.dfaClaimMainDataService.setInvoiceId(null);
    }

    this.dialog
      .open(InvoiceComponent, {
        data: {
          content: objInvoice,
          invoiceId: this.dfaClaimMainDataService.getInvoiceId(),
          claimDecision: this.dfaClaimMainDataService.getClaimDecision(),
          header: 'View'
        },
        maxHeight: '90vh',
        width: '1200px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((_result) => {});
  }

  addSupportingDocuments(): void {
    // Implementation for adding supporting documents
  }

  cancelAppeal(): void {
    const dialogRef = this.dialog.open(CancelConfirmationDialogComponent, {
      data: {
        title: 'Cancel Appeal',
        subtitle: 'Are you sure you want to cancel your appeal?',
        text: "Appeals must be created and submitted in the same session.\nDrafts are not saved - any changes you've made will be lost.",
        cancelButton: 'No, go back',
        confirmButton: 'Yes, cancel appeal',
        showCloseIcon: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.selection.clear();
        this.documentSummaryDataSource.data.forEach(row => {
          if (row.data?.appealReason !== undefined) {
            row.data.appealReason = '';
          }
        });

        const claimId = this.dfaClaimMainDataService.getClaimId();
        this.router.navigate(['/app-claim-decision/' + claimId]);
      }
    });
  }
}
