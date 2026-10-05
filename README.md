# ESPN Fantasy Football Leaders Scraper

A lightweight browser-console scraper that extracts player projections, injury reports, and game statuses from the ESPN Fantasy Football leaders leaderboard and formats the output into CSV and Excel (.xlsx).

## Features

- Traverses dynamic client-side pagination automatically.
- Extracts player info, team, position, injury status, game matchups, and projected points.
- Saves directly to disk via a local Node HTTP sink (or copies straight to clipboard).
- Optional PowerShell script to generate a formatted Excel spreadsheet.

## Project Structure

- `scrape.js` - Core scraping script; navigates pages, extracts table data, and converts output to CSV format.
- `sink.js` - Minimal local Node.js HTTP server that writes incoming POST payloads directly to a CSV file.
- `export_to_disk.js` - Browser companion script that sends scraped data from the console to `sink.js`.
- `build_excel.ps1` - Converts the resulting CSV into a styled `.xlsx` file with autofilters and formatted columns.

## Getting Started

### Prerequisites

- Google Chrome (or any Chromium-based browser)
- Node.js (for local file saving)
- PowerShell (optional, for Excel formatting on Windows)

### Quick Start

#### Option A: Direct Disk Export (Recommended)

1. **Start the local sink server:**
   ```bash
   node sink.js ./leaders.csv 8787
   ```
