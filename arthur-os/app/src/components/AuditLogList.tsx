import type { AuditEvent } from "@prisma/client";

export function AuditLogList({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {events.map((event) => (
        <li key={event.id} className="py-2 text-sm">
          <span className="text-slate-400">{event.createdAt.toISOString().replace("T", " ").slice(0, 19)}</span>{" "}
          — <span className="font-medium">{event.actor}</span> {event.action.replaceAll("_", " ").toLowerCase()}
          {event.entityType ? ` (${event.entityType}${event.entityId ? ` ${event.entityId.slice(0, 8)}` : ""})` : ""}
        </li>
      ))}
    </ul>
  );
}
