# Analytics contract

Boccone analytics is an aggregation surface over persisted product data. It does
not add event tracking, synthetic values, or a second source of truth.

## Personal Insights

The mobile Insights route is available at `/insights` without adding a sixth tab.
It supports 7 days, 30 days, 3 months, and 1 year. The API chooses daily,
weekly, or monthly buckets respectively and uses the client-provided local
calendar date as the period end because meal dates are stored as PostgreSQL
`date` values. Daily buckets are meal-day totals; weekly and monthly personal
nutrition buckets are logged-day averages so longer ranges remain readable and
comparable to the headline average.

Personal averages use logged days as the denominator. A bucket with no logged
meal is returned as `null` and is rendered as a gap; it is not treated as zero.
The comparison is the preceding period of equal length. The current daily
target is shown as context only: target history is not stored and no historical
target comparison is implied.

Meal-type distribution reports the share of logged calories, alongside the meal
count. Food contributors use immutable nutrition snapshots from catalog-backed
meal entries. Manual meal totals remain in calorie and macro summaries, but
cannot be attributed to a catalog food. Contributors open the filtered Diary
view for that catalog food. Meal timing, failed-search telemetry, retention,
funnels, and clinical interpretation are outside the current data model.

## Admin Analytics

The admin workspace is available under `/analytics`, with Nutrition, Catalog,
and AI subroutes. It supports 7-day, 30-day, 90-day, and custom periods. Admin
reporting is explicitly UTC and compares each period with the preceding period
of equal length.

The overview defines an active user as a user with at least one meal in the
selected period. Its time series labels registrations as **New users** and does
not present them as active-user activity. Nutrition totals include all stored
meals, including manual meals. Catalog analytics reads current catalog status
plus dated food and submission records. AI analytics exposes only privacy-safe
usage metadata such as request status, latency, tokens, provider, model, and
feature; prompts, responses, and credentials are never included.

Every chart has a textual summary and an accessible data table fallback. Empty
periods remain empty states, loading remains loading, and API errors remain
retryable errors. Charts use standard surfaces; Liquid Glass is reserved for
functional floating controls and never carries chart content.
