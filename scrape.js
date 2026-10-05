/**
 
 * The page is client-rendered and paginated (20 pages x 50 rows), so this runs
 * inside the page: it clicks through the pagination, waits for the table to
 * re-render, and reads every row.
 *
 */

async function scrapeLeaders(options = {}) {
  const maxPages = options.maxPages || 20;
  const timeoutMs = options.timeoutMs || 8000;
  const settleMs = options.settleMs || 200;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const activePage = () => {
    const el = document.querySelector(
      '.Pagination__list__item[aria-current="page"]',
    );
    return el ? parseInt(el.textContent, 10) : 0;
  };

  const firstRowCell = () => document.querySelector("table tbody tr td");

  const readTable = () => {
    const table = document.querySelector("table");
    if (!table) return [];
    return Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
      const c = tr.children;
      const cell = c[0] || {};
      const injury = cell.querySelector(".playerinfo__injurystatus");
      const link = cell.querySelector(".player-column__athlete a");
      const txt = (sel) => {
        const n = cell.querySelector(sel);
        return n ? n.textContent.trim() : "";
      };
      return {
        player:
          (link && link.textContent.trim()) || cell.getAttribute("title") || "",
        team: txt(".playerinfo__playerteam"),
        pos: txt(".playerinfo__playerpos"),
        status: injury ? injury.textContent.trim() : "",
        statusDetail: injury ? injury.getAttribute("title") || "" : "",
        opp: c[3] ? c[3].textContent.trim() : "",
        gameStatus: c[4] ? c[4].textContent.trim() : "",
        proj: c[5] ? c[5].textContent.trim() : "",
      };
    });
  };

  const rows = [];
  const log = [];

  if (activePage() !== 1) {
    throw new Error("Not on page 1 - reload the page before scraping.");
  }

  for (let page = 1; page <= maxPages; page++) {
    await sleep(settleMs);
    const pageRows = readTable();
    rows.push.apply(rows, pageRows);
    log.push({
      page: activePage(),
      rows: pageRows.length,
      first: pageRows[0] ? pageRows[0].player : "",
    });

    if (activePage() >= maxPages) break;

    const next = document.querySelector("button.Pagination__Button--next");
    if (!next || next.disabled) {
      log.push({ stop: "next button unavailable" });
      break;
    }

    const beforeFirst = firstRowCell() ? firstRowCell().textContent : "";
    const target = activePage() + 1;
    next.click();

    // wait until both the pager and the table have moved on
    const deadline = Date.now() + timeoutMs;
    let moved = false;
    while (Date.now() < deadline) {
      await sleep(120);
      const now = firstRowCell() ? firstRowCell().textContent : "";
      if (activePage() === target && now !== beforeFirst) {
        moved = true;
        break;
      }
    }
    await sleep(settleMs);

    if (!moved || activePage() !== target) {
      log.push({
        error: "pagination stalled",
        expected: target,
        got: activePage(),
      });
      break;
    }
  }

  console.table(log);
  return rows;
}

/** Rows -> CSV string (RFC4180-ish, all fields quoted). */
function toCsv(rows) {
  const header = [
    "Player",
    "Team",
    "Pos",
    "Status (Injury)",
    "Injury Detail",
    "Opp",
    "Status (Game)",
    "Proj",
  ];
  const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const line = (a) => a.map(esc).join(",");
  return (
    [line(header)]
      .concat(
        rows.map((r) =>
          line([
            r.player,
            r.team,
            r.pos,
            r.status,
            r.statusDetail,
            r.opp,
            r.gameStatus,
            r.proj,
          ]),
        ),
      )
      .join("\n") + "\n"
  );
}

/** Put the CSV on the clipboard (console helper). */
async function copy(text) {
  await navigator.clipboard.writeText(text);
  return "copied " + text.length + " chars";
}

if (typeof window !== "undefined") {
  window.scrapeLeaders = scrapeLeaders;
  window.toCsv = toCsv;
  window.copy = copy;
}
if (typeof module !== "undefined") {
  module.exports = { scrapeLeaders, toCsv };
}
