import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center justify-between px-4 py-3 bg-white border-t border-primary-200 sm:px-6"
    >
      <div class="flex items-center justify-between flex-1 sm:hidden">
        <button
          (click)="onPageChange(page - 1)"
          [disabled]="page === 1"
          class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          (click)="onPageChange(page + 1)"
          [disabled]="page === totalPages"
          class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 font-medium">
            Showing <span class="font-bold">{{ (page - 1) * limit + 1 }}</span> to
            <span class="font-bold">{{ getEndIndex() }}</span> of
            <span class="font-bold">{{ totalItems }}</span> results
          </p>
        </div>
        <div>
          <nav
            class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              (click)="onPageChange(page - 1)"
              [disabled]="page === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="sr-only">Previous</span>
              <span class="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            @for (p of pages; track p) {
              <button
                (click)="onPageChange(p)"
                [class.z-10]="p === page"
                [class.bg-brand-50]="p === page"
                [class.border-brand-500]="p === page"
                [class.text-brand-600]="p === page"
                [class.bg-white]="p !== page"
                [class.border-gray-300]="p !== page"
                [class.text-gray-500]="p !== page"
                [class.hover:bg-gray-50]="p !== page"
                class="relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors"
              >
                {{ p }}
              </button>
            }

            <button
              (click)="onPageChange(page + 1)"
              [disabled]="page === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="sr-only">Next</span>
              <span class="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() limit = 10;

  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    // Generate a simple array of page numbers 1 to totalPages
    // For large totalPages, you might want to implement ellipses logic
    const arr = [];
    const maxVisible = 5;

    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      if (i > 0) arr.push(i);
    }
    return arr;
  }

  getEndIndex(): number {
    return Math.min(this.page * this.limit, this.totalItems);
  }

  onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.pageChange.emit(newPage);
    }
  }
}
