import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

export interface PublishedDocument {
  category: string;
  fileName: string;
  description: string;
  date: string;
  fileUrl?: string;
}

@Component({
  selector: 'shared-document-viewing',
  standalone: false,
  templateUrl: './document-viewing.component.html',
  styleUrls: ['./document-viewing.component.css']
})
export class DocumentViewingComponent implements OnInit, OnDestroy {
  @Input() caseNumber: string = 'CAS-01801-D657X8';
  @Input() projectNumber: string = 'Select...';

  displayedColumns: string[] = ['category', 'fileName', 'description', 'date'];
  dataSource: MatTableDataSource<PublishedDocument> = new MatTableDataSource<PublishedDocument>();
  originalData: PublishedDocument[] = [];

  selectedCategory: string = '';
  sortBy: string = '';
  searchTerm: string = '';

  categories: string[] = [
    'All Categories',
    'FM Report',
    'Decision Letter - Project Eligibility',
    'Appeal Info',
    'Decision Letter-Project'
  ];

  sortOptions: string[] = [
    'Date (Newest First)',
    'Date (Oldest First)',
    'Category A-Z',
    'Category Z-A',
    'File Name A-Z',
    'File Name Z-A'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadPublishedDocuments();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadPublishedDocuments(): void {
    // Mock data - replace with actual service call
    this.originalData = [
      {
        category: 'FM Report',
        fileName: 'FM1.1 BH101-1.pdf',
        description: '---',
        date: '09/16/2024'
      },
      {
        category: 'Decision Letter - Project Eligibility',
        fileName: 'BH101-1 Appeal Final.pdf',
        description: 'Appeal Decision letter for overturn',
        date: '07/11/2024'
      },
      {
        category: 'Appeal Info',
        fileName: 'Appeal Instructions.pdf',
        description: '---',
        date: '05/01/2024'
      },
      {
        category: 'Decision Letter-Project',
        fileName: 'Final Decision on BH101-1.pdf',
        description: 'Decision letter as approved and sent',
        date: '05/01/2024'
      }
    ];

    this.dataSource.data = [...this.originalData];
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applySorting();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filteredData = [...this.originalData];

    // Apply category filter
    if (this.selectedCategory && this.selectedCategory !== 'All Categories') {
      filteredData = filteredData.filter(doc => doc.category === this.selectedCategory);
    }

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter(doc =>
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.category.toLowerCase().includes(searchLower)
      );
    }

    this.dataSource.data = filteredData;
    this.applySorting();
  }

  applySorting(): void {
    if (!this.sortBy) return;

    const data = [...this.dataSource.data];

    switch (this.sortBy) {
      case 'Date (Newest First)':
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'Date (Oldest First)':
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'Category A-Z':
        data.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'Category Z-A':
        data.sort((a, b) => b.category.localeCompare(a.category));
        break;
      case 'File Name A-Z':
        data.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case 'File Name Z-A':
        data.sort((a, b) => b.fileName.localeCompare(a.fileName));
        break;
    }

    this.dataSource.data = data;
  }

  downloadDocument(publishedDoc: PublishedDocument): void {
    console.log('Downloading document:', publishedDoc.fileName);

    if (publishedDoc.fileUrl) {
      const link = document.createElement('a');
      link.href = publishedDoc.fileUrl;
      link.download = publishedDoc.fileName;
      link.click();
    }
  }

  backToDashboard(): void {
    this.router.navigate(['/dfa-dashboard']);
  }
}