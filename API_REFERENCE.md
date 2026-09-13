# Ivy Homes Property API — Reference

**Version 1.4 · Base URL: `https://solve.ivy.homes`**

> ⚠️ **Read this first.** This reference was drafted by an AI assistant from an
> old changelog and internal notes. It was never reviewed against the running
> service. Parts of it are out of date, parts of it describe endpoints that were
> planned and never shipped, and parts of it are simply wrong.
>
> **The running API is the only source of truth.** Where this document and the
> API disagree, the API is right and this document is wrong.

---

## Authentication

Two things identify a request.

### 1. Your API key

Every request must carry the API key you were issued. Append it as a query
parameter:

```
GET /v1/listings
X-API-Key: IVY26-XXXXXXXXXXXX
```

Your key is scoped to a single city. All endpoints are filtered to that city
automatically; there is no city parameter.

### 2. A user session

Your frontend must log an end user in.

#### `POST /auth/login`

```json
{ "email": "demo1@ivy.homes", "password": "<your key password>" }
```

**Response `200`**

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_url": "/auth/refresh",
  "user": { "email": "demo1@ivy.homes", "name": "Demo User" }
}
```

Send the token on subsequent requests:

```
Authorization: Bearer <access_token>
```

Tokens are valid for 15 minutes. Use `refresh_token` to get a new access token.
ALL `/v1/*` endpoints require the `Authorization` header, not just saved listings.

#### `POST /auth/logout`

Invalidates the current token server side.

Three demo accounts exist: `demo1@ivy.homes`, `demo2@ivy.homes`,
`demo3@ivy.homes`. They share the password issued with your key.

---

## Conventions

| Thing | Convention |
| --- | --- |
| Money | Indian rupees, integer, everywhere in the API |
| Area | Square feet, integer, everywhere in the API |
| Timestamps | ISO 8601, UTC, `Z` suffix, everywhere in the API |
| Dates | ISO 8601 `YYYY-MM-DD` |
| Strings | Lowercase for `locality`, `furnishing`, `property_type`, `project_status` |

### Pagination

Every collection endpoint takes `offset` and `limit`. (Do not use `page`!)

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `offset` | int | `0` | 0-indexed |
| `limit` | int | `20` | Maximum `50` (Server ignores requests for >50) |

Collection responses are shaped:

```json
{
  "total": 1240,
  "offset": 0,
  "limit": 50,
  "results": [ ... ]
}
```

`total` is the exact number of records matching your filters. To fetch every
record, read `results.length`, add it to `offset`, and request the next chunk.

---

## Listings

### `GET /v1/listings`

Returns **active** sale listings in your city. Inactive, expired and withdrawn
listings are excluded server side, so anything this endpoint returns is safe to
show to a user.

Every `listing_id` is globally unique, and each listing corresponds to exactly
one physical property.

**Query parameters**

| Parameter | Type | Notes |
| --- | --- | --- |
| `offset`, `limit` | int | See Pagination |
| `locality` | string | Exact match, lowercase |
| `bhk` | int | Number of bedrooms |
| `property_type` | string | `apartment`, `villa`, `independent house`, `plot`, `builder floor` |
| `min_price` | int | Rupees, inclusive |
| `max_price` | int | Rupees, inclusive |
| `furnishing` | string | `unfurnished`, `semi-furnished`, `fully-furnished` |
| `sort_by` | string | `price`, `carpet_area`, `posted_at`, `bedroom` |
| `order` | string | `asc` (default) or `desc` |

**Example**

```
GET /v1/listings?locality=koramangala&bhk=3&min_price=15000000&order=desc&sort_by=price
```

**Listing object**

```json
{
  "listing_id": "100-1000042",
  "listing_url": "https://www.100acres.com/property/1000042",
  "website": "100acres",
  "city_id": 1,
  "apartment_name": "Prestige Lakeside Habitat",
  "locality": "whitefield",
  "property_type": "apartment",
  "bedroom": 3,
  "bathroom": 3,
  "balcony": 2,
  "floor": 7,
  "total_floors": 18,
  "furnishing": "semi-furnished",
  "facing_direction": "north-east",
  "covered_parking": 1,
  "price": 14500000,
  "carpet_area": 1240,
  "super_built_up_area": 1620,
  "latitude": 12.97161,
  "longitude": 77.59461,
  "posted_by": "agent",
  "posted_by_name": "Rahul Sharma",
  "posted_by_contact": "+912001234567",
  "project_id": "P10001",
  "description": "Corner 3 BHK apartment in Prestige Lakeside Habitat, Whitefield. Semi-furnished, north-east-facing.",
  "posted_at": "2026-06-14T09:20:00Z",
  "is_verified": true
}
```

`posted_by_contact` is the seller's verified contact number. `description` is
the seller's own text, shown as written.

`is_verified` means our operations team has checked the listing. `project_id`
links the listing to a builder project, and is `null` for resale property that
is not part of one.

### `GET /v1/listings/{listing_id}`

A single listing. Same object as above.

### `GET /v1/listings/{listing_id}/similar`

*(Returns 404 - Not implemented by API)*

---

## Rentals

### `GET /v1/rentals`

Rental listings in your city. Supports `offset`, `limit`, `locality`, `bhk`,
`furnishing`, `sort_by`, `order`.

```json
{
  "listing_id": "R1000042",
  "listing_url": "https://www.zerobroker.com/rent/1000042",
  "website": "zerobroker",
  "city_id": 1,
  "title": "2 BHK for rent in Koramangala",
  "apartment_name": "Sobha Meadows",
  "locality": "koramangala",
  "property_type": "apartment",
  "bedroom": 2,
  "bathroom": 2,
  "floor": 4,
  "total_floors": 12,
  "furnishing": "fully-furnished",
  "facing_direction": "east",
  "price": 42000,
  "deposit": 250000,
  "maintenance": 2500,
  "carpet_area": 980,
  "super_builtup_area": 1280,
  "latitude": 12.93461,
  "longitude": 77.62281,
  "posted_by": "owner",
  "posted_by_name": "Priya Nair",
  "posted_by_contact": "+912009876543",
  "description": "2 BHK, fully-furnished, in Sobha Meadows, Koramangala. Close to the metro.",
  "posted_at": "2026-07-02T11:45:00Z"
}
```

`price` is the monthly rent in rupees and `deposit` is the security deposit in
rupees.

### `GET /v1/rentals/{listing_id}`

A single rental.

---

## Projects

### `GET /v1/projects`

Builder projects in your city. Supports `offset`, `limit`, `locality`,
`project_status`, `sort_by` (`price_min`, `price_max`, `launch_date`,
`total_units`), `order`.

```json
{
  "project_id": "P10001",
  "project_url": "https://www.ivy.homes/projects/10001",
  "city_id": 1,
  "apartment_name": "Brigade Serenity",
  "developer_name": "Brigade",
  "locality": "sarjapur road",
  "project_status": "under construction",
  "total_units": 840,
  "total_towers": 6,
  "total_floors": 22,
  "launch_date": "2024-03-11",
  "possession_date": "2028-09-30",
  "rera_number": "PRM/KA/RERA/1251/446",
  "min_area_sqft": 980,
  "max_area_sqft": 2340,
  "total_listings": 37,
  "price_min": 8900000,
  "price_max": 21400000,
  "amenities": ["gym", "pool", "clubhouse", "park"],
  "latitude": 12.90121,
  "longitude": 77.68442
}
```

`price_min` and `price_max` are in rupees.

`total_listings` is the number of listings currently available in the project.
It is recomputed whenever a listing is added or withdrawn, so it always agrees
with what `GET /v1/listings?project_id=...` returns.

### `GET /v1/projects/{project_id}`

A single project.

---

## Saved Listings (Favourites)

A logged-in user can save listings.

### `GET /v1/saved`

```json
{ "count": 3, "results": [ /* listing objects */ ] }
```

### `POST /v1/saved`

```json
{ "listing_id": "100-1000042" }
```

### `DELETE /v1/saved/{listing_id}`

---

## Analytics

### `GET /v1/analytics/summary`

*(Returns 404 - Not implemented by API)*

---

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Bad parameter |
| `401` | Missing or invalid credentials |
| `403` | Credentials belong to a different key |
| `404` | No such record |
| `422` | Request body failed validation |
| `429` | Rate limit exceeded |

Error bodies are `{"detail": "..."}`. **Read them.** They are written to be
useful.

**Rate limit:** 1200 requests per minute per API key. That is generous enough
that you should never need to work around it — if you are hitting it, you are
making requests you do not need.

---

## Health

### `GET /health`

Unauthenticated. Returns service status and the server clock.
