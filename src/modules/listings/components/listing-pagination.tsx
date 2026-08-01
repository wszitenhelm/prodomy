import Link from "next/link";
import type { ReactElement } from "react";

import { buildListingSearchHref } from "@/modules/listings/queries";
import type { ListingSearchInput, PaginatedListingResponse } from "@/modules/listings/types";

interface ListingPaginationProps {
  readonly filters: ListingSearchInput;
  readonly pagination: PaginatedListingResponse["pagination"];
}

function getPageNumbers(page: number, totalPages: number): number[] {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function ListingPagination({
  filters,
  pagination,
}: ListingPaginationProps): ReactElement | null {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(pagination.page, pagination.totalPages);

  return (
    <nav aria-label="Paginacja wyników" className="pagination">
      <Link
        aria-disabled={pagination.page <= 1}
        className="pagination__link"
        href={buildListingSearchHref({
          ...filters,
          page: Math.max(1, pagination.page - 1),
        })}
      >
        Poprzednia
      </Link>
      <div className="pagination__pages">
        {pages.map((page) => (
          <Link
            aria-current={page === pagination.page ? "page" : undefined}
            className={`pagination__page${page === pagination.page ? " pagination__page--active" : ""}`}
            href={buildListingSearchHref({
              ...filters,
              page,
            })}
            key={page}
          >
            {page}
          </Link>
        ))}
      </div>
      <Link
        aria-disabled={pagination.page >= pagination.totalPages}
        className="pagination__link"
        href={buildListingSearchHref({
          ...filters,
          page: Math.min(pagination.totalPages, pagination.page + 1),
        })}
      >
        Następna
      </Link>
    </nav>
  );
}
