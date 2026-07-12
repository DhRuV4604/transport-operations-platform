import { PrismaClient } from "@prisma/client";
import { resolveCoords, project, MAP_VIEWBOX } from "./src/lib/geo";
const db = new PrismaClient();
const INDIA_PATH =
  "M196 40 L232 44 L250 70 L286 74 L300 96 L336 92 L360 120 L352 156 L378 180 " +
  "L372 214 L400 236 L388 270 L360 286 L372 320 L352 352 L366 388 L340 410 " +
  "L330 452 L300 470 L286 512 L262 486 L250 520 L236 500 L232 462 L210 470 " +
  "L200 500 L182 466 L192 430 L168 420 L156 386 L172 356 L150 336 L158 300 " +
  "L132 280 L120 244 L96 232 L110 200 L92 172 L118 156 L110 124 L142 116 " +
  "L150 84 L176 88 Z";
const trips = await db.trip.findMany({ where: { status: "DISPATCHED" }, include: { vehicle: true, driver: true } });
let routes = "";
const dots = new Map<string,{x:number;y:number}>();
for (const t of trips) {
  const f = project(resolveCoords(t.source, t.vehicle.region));
  const to = project(resolveCoords(t.destination, t.vehicle.region));
  if(!dots.has(t.source))dots.set(t.source,f); if(!dots.has(t.destination))dots.set(t.destination,to);
  routes += `<line x1="${f.x}" y1="${f.y}" x2="${to.x}" y2="${to.y}" stroke="#2563eb" stroke-width="2" stroke-dasharray="5 5"/><circle cx="${f.x}" cy="${f.y}" r="4" fill="#2563eb"/><circle cx="${to.x}" cy="${to.y}" r="5" fill="#fff" stroke="#2563eb" stroke-width="2"/>`;
}
let dotsSvg=""; for(const [n,p] of dots){dotsSvg+=`<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#888"/><text x="${p.x+6}" y="${p.y+3}" font-size="9" fill="#555">${n}</text>`;}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}" width="${MAP_VIEWBOX.width}" height="${MAP_VIEWBOX.height}"><rect width="100%" height="100%" fill="#0b0f19"/><path d="${INDIA_PATH}" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.4)" stroke-width="1.5"/>${routes}${dotsSvg}</svg>`;
const { writeFileSync } = await import("node:fs");
writeFileSync("./_map.svg", svg);
await db.$disconnect();
