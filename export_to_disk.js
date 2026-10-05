/**
 * export_to_disk.js - browser-console companion to scrape.js + sink.js
 *
 * Result: leaders.csv written straight to disk.
 */
(async function exportToDisk() {
  if (typeof scrapeLeaders !== "function") {
    throw new Error(
      "scrape.js is not loaded - paste it into the console first.",
    );
  }

  const rows = await scrapeLeaders();
  const csv = toCsv(rows);

  const SINK = "http://127.0.0.1:8787/";
  const res = await fetch(SINK, { method: "POST", body: csv });
  const ack = await res.text();

  console.log("rows:", rows.length, "| bytes:", csv.length, "| sink:", ack);
  return { rows: rows.length, bytes: csv.length, sink: ack };
})();
