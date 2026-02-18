"use client";

import { TEAM_SEED } from "@/lib/articleSeeds";
import type { TeamMember, TeamStatus } from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";

const STORAGE_KEY = "mission-control-team-roster-v1";
const TEAM_STATUSES: TeamStatus[] = ["planning", "working", "idle"];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OfficeScreen() {
  const [members, setMembers] = usePersistentState<TeamMember[]>(
    STORAGE_KEY,
    TEAM_SEED,
  );

  const onStatus = (memberId: string, status: TeamStatus) => {
    setMembers((current) =>
      current.map((member) =>
        member.memberId === memberId ? { ...member, status } : member,
      ),
    );
  };

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Office</h1>
          <p>
            Live floor view of who is actively working, planning, or idle across
            the team.
          </p>
        </div>
      </div>

      <div className="office-grid">
        {members.map((member) => (
          <article key={member.memberId} className="panel office-desk">
            <div className="office-desk__avatar">{initials(member.name)}</div>
            <h2>{member.name}</h2>
            <p className="meta">{member.role}</p>
            <p>{member.currentFocus}</p>
            <p className="meta">{member.responsibilities}</p>
            <label>
              Presence status
              <select
                value={member.status}
                onChange={(event) =>
                  onStatus(member.memberId, event.target.value as TeamStatus)
                }
              >
                {TEAM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
