import type { ReactElement } from "react";

import { cityOptions } from "@/modules/listings/formatters";
import type { ListingSearchInput } from "@/modules/listings/types";

interface ListingsHeroProps {
  readonly filters: ListingSearchInput;
}

export function ListingsHero({ filters }: ListingsHeroProps): ReactElement {
  return (
    <section className="listings-hero">
      <div className="listings-hero__content">
        <p className="eyebrow listings-hero__eyebrow">Prodomy</p>
        <h1 className="listings-hero__title">Znajdź mieszkanie, w którym zamieszkasz</h1>
        <p className="listings-hero__subtitle">
          Przeglądaj sprawdzone oferty sprzedaży i wynajmu w czterech największych miastach.
        </p>

        <form className="listings-hero__search" action="/listings" method="get">
          <input name="active" type="hidden" value="true" />
          {/* Preserves the detailed filters below so a quick search from the
              hero does not reset them; those fields live only in the bottom
              panel to avoid duplicate, out-of-sync controls. */}
          {filters.district !== undefined ? (
            <input name="district" type="hidden" value={filters.district} />
          ) : null}
          {filters.rooms !== undefined ? (
            <input name="rooms" type="hidden" value={filters.rooms} />
          ) : null}
          {filters.minPrice !== undefined ? (
            <input name="minPrice" type="hidden" value={filters.minPrice} />
          ) : null}
          {filters.maxPrice !== undefined ? (
            <input name="maxPrice" type="hidden" value={filters.maxPrice} />
          ) : null}
          {filters.minArea !== undefined ? (
            <input name="minArea" type="hidden" value={filters.minArea} />
          ) : null}
          {filters.maxArea !== undefined ? (
            <input name="maxArea" type="hidden" value={filters.maxArea} />
          ) : null}
          {filters.sort !== "newest" ? <input name="sort" type="hidden" value={filters.sort} /> : null}

          <div
            aria-label="Typ transakcji"
            className="segmented-control listings-hero__transaction"
            role="radiogroup"
          >
            {[
              { label: "Wszystkie", value: "" },
              { label: "Sprzedaż", value: "SALE" },
              { label: "Wynajem", value: "RENT" },
            ].map((option) => (
              <label className="segmented-control__option" key={option.label}>
                <input
                  defaultChecked={(filters.transactionType ?? "") === option.value}
                  name="transactionType"
                  type="radio"
                  value={option.value}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <label className="listings-hero__search-field">
            <span className="sr-only">Szukaj ofert</span>
            <input
              defaultValue={filters.q ?? ""}
              name="q"
              placeholder="Szukaj po lokalizacji, ulicy lub cechach oferty…"
              type="search"
            />
          </label>

          <button className="button-link button-link--primary listings-hero__submit" type="submit">
            Szukaj
          </button>

          <div aria-label="Miasta" className="listings-hero__cities" role="group">
            {cityOptions.map((city) => (
              <label className="city-chip" key={city}>
                <input
                  defaultChecked={filters.city?.includes(city) ?? false}
                  name="city"
                  type="checkbox"
                  value={city}
                />
                <span>{city}</span>
              </label>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
