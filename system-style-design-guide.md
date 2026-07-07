# PLTA Monitoring - Design System

Foundations untuk website Telemetering, Forecasting & Reporting — dark control-room theme.

---

## 01 — Color Palette

### Surface, Border & Text

| Name | Hex Code |
| --- | --- |
| **surface/base** | `#0B1220` |
| **surface/raised** | `#111C2E` |
| **surface/overlay** | `#1A2740` |
| **border/subtle** | `#223049` |
| **text/primary** | `#F1F5F9` |
| **text/secondary** | `#94A3B8` |
| **text/muted** | `#64748B` |

### Brand & Status

| Name | Hex Code |
| --- | --- |
| **brand/primary** | `#22D3EE` |
| **brand/primary-strong** | `#0891B2` |
| **status/success** | `#34D399` |
| **status/warning** | `#FBBF24` |
| **status/danger** | `#F87171` |
| **status/info** | `#60A5FA` |

### Chart Series

* **chart/series-1**
* **chart/series-2**
* **chart/series-3**
* **chart/series-4**

---

## 02 — Typography

| Font Details | Example Text |
| --- | --- |
| **Space Grotesk / 36 / bold** | Telemetering Dashboard |
| **Space Grotesk / 28 / semibold** | Inflow Forecasting — 7 Days |
| **Space Grotesk / 20 / semibold** | Reservoir Water Level |
| **Inter / 16 / regular** | Data telemetri diperbarui setiap 5 menit dari RTU di intake, penstock, dan turbine hall. |
| **Inter / 12 / medium** | LAST SYNC 14:32 WIB · STATION UPPER DAM |
| **JetBrains Mono / 16** *(angka telemetri)* | 452.80 mdpl · 128.4 m³/s · 86.2 MW |

---

## 03 — Spacing Scale

| Token Name | Value |
| --- | --- |
| **space/xs** | 4px |
| **space/sm** | 8px |
| **space/md** | 16px |
| **space/lg** | 24px |
| **space/xl** | 32px |
| **space/2xl** | 48px |

---

## 04 — Corner Radius

| Token Name | Value |
| --- | --- |
| **radius/sm** | 6px |
| **radius/md** | 10px |
| **radius/lg** | 16px |

---

## 05 — Core Elements

### Buttons & Status Badges

* **Buttons:** `Generate Report` (Primary), `Export CSV` (Secondary/Surface Raised)
* **Badges:** `Normal` (Success), `Siaga` (Warning), `Awas` (Danger)

### KPI Card (Telemetering)

* **Title:** WATER LEVEL · UPPER DAM
* **Value:** 452.80 mdpl
* **Trend/Info:** +0.35 m vs kemarin · forecast stabil

### Alert Banner

* **Status:** Warning
* **Title:** Debit inflow melewati ambang siaga
* **Description:** Forecast 6 jam ke depan: 142 m³/s. Periksa bukaan spillway gate 2.