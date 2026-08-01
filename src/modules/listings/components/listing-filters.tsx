import Link from "next/link";
import type { ReactElement } from "react";

import type { ListingSearchInput } from "@/modules/listings/types";
import { cityOptions } from "@/modules/listings/formatters";

interface ListingFiltersProps {
  readonly filters: ListingSearchInput;
}

export function ListingFilters({ filters }: ListingFiltersProps): ReactElement {
  return (
    <form className="filters-card" action="/listings" method="get">
      <input name="active" type="hidden" value="true" />
      <div className="filters-card__header">
        <div>
          <p className="eyebrow">Wyszukiwanie</p>
          <h2>Filtry ofert</h2>
        </div>
        <Link className="text-link" href="/listings">
          Resetuj
        </Link>
      </div>
      <fieldset className="filters-grid">
        <legend className="sr-only">Filtry wyszukiwania ofert</legend>
        <div className="field">
          <span id="transaction-type-label">Typ transakcji</span>
          <div className="segmented-control" role="radiogroup" aria-labelledby="transaction-type-label">
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
        </div>

        <label className="field field--wide">
          <span>Szukaj</span>
          <input defaultValue={filters.q ?? ""} name="q" placeholder="np. balkon, Kazimierz, Dietla" type="search" />
        </label>

        <label className="field">
          <span>Miasto</span>
          <select defaultValue={filters.city ?? ""} name="city">
            <option value="">Wszystkie miasta</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </label>

        <label className="field">
          <span>Dzielnica</span>
          <input defaultValue={filters.district ?? ""} name="district" placeholder="np. Krowodrza" type="text" />
        </label>

        <label className="field">
          <span>Pokoje</span>
          <select defaultValue={filters.rooms?.toString() ?? ""} name="rooms">
            <option value="">Dowolnie</option>
            {[1, 2, 3, 4, 5].map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}+
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Cena od</span>
          <input defaultValue={filters.minPrice?.toString() ?? ""} inputMode="numeric" min="1" name="minPrice" placeholder="np. 400000" type="number" />
        </label>

        <label className="field">
          <span>Cena do</span>
          <input defaultValue={filters.maxPrice?.toString() ?? ""} inputMode="numeric" min="1" name="maxPrice" placeholder="np. 900000" type="number" />
        </label>

        <label className="field">
          <span>Metraż od</span>
          <input defaultValue={filters.minArea?.toString() ?? ""} inputMode="decimal" min="1" name="minArea" placeholder="np. 35" step="0.1" type="number" />
        </label>

        <label className="field">
          <span>Metraż do</span>
          <input defaultValue={filters.maxArea?.toString() ?? ""} inputMode="decimal" min="1" name="maxArea" placeholder="np. 80" step="0.1" type="number" />
        </label>

        <label className="field">
          <span>Sortowanie</span>
          <select defaultValue={filters.sort} name="sort">
            <option value="newest">Najnowsze</option>
            <option value="price_asc">Cena rosnąco</option>
            <option value="price_desc">Cena malejąco</option>
            <option value="area_asc">Metraż rosnąco</option>
            <option value="area_desc">Metraż malejąco</option>
          </select>
        </label>

        <label className="field checkbox-field">
          <span>Aktywne oferty</span>
          <input checked readOnly type="checkbox" />
        </label>
      </fieldset>

      <div className="filters-card__actions">
        <button className="button-link button-link--primary" type="submit">
          Zastosuj filtry
        </button>
      </div>
    </form>
  );
}
