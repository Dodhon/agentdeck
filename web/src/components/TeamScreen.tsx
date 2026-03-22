"use client";

import { useState } from "react";
import { TEAM_SEED } from "@/lib/articleSeeds";
import type { TeamMember, TeamStatus } from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";

const STORAGE_KEY = "mission-control-team-roster-v1";
const TEAM_STATUSES: TeamStatus[] = ["planning", "working", "idle"];

export function TeamScreen() {
  const [members, setMembers] = usePersistentState<TeamMember[]>(
    STORAGE_KEY,
    TEAM_SEED,
  );
  const [name, setName] = useState("");
  const [role, setRole] = useState("Developer");
  const [responsibilities, setResponsibilities] = useState("");

  const onCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    const next: TeamMember = {
      memberId: `member_${crypto.randomUUID()}`,
      name: name.trim(),
      role: role.trim() || "Generalist",
      responsibilities: responsibilities.trim() || "No responsibilities set yet.",
      currentFocus: "Assign first task",
      status: "planning",
    };
    setMembers((current) => [next, ...current]);
    setName("");
    setRole("Developer");
    setResponsibilities("");
  };

  const onPatch = (memberId: string, patch: Partial<TeamMember>) => {
    setMembers((current) =>
      current.map((member) =>
        member.memberId === memberId ? { ...member, ...patch } : member,
      ),
    );
  };

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Team</h1>
          <p>
            Define agent roles, responsibilities, and current focus so execution
            stays accountable.
          </p>
        </div>
      </div>

      <form className="panel form" onSubmit={onCreate}>
        <h2>Add team member</h2>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Research Agent"
          />
        </label>
        <label>
          Role
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Developer"
          />
        </label>
        <label>
          Responsibilities
          <textarea
            rows={3}
            value={responsibilities}
            onChange={(event) => setResponsibilities(event.target.value)}
            placeholder="Define what this agent owns."
          />
        </label>
        <button type="submit">Add member</button>
      </form>

      <div className="grid-list">
        {members.map((member) => (
          <article key={member.memberId} className="card">
            <header>
              <h3>{member.name}</h3>
              <span className={`chip chip--${member.status}`}>{member.status}</span>
            </header>
            <label>
              Role
              <input
                value={member.role}
                onChange={(event) =>
                  onPatch(member.memberId, { role: event.target.value })
                }
              />
            </label>
            <label>
              Responsibilities
              <textarea
                rows={3}
                value={member.responsibilities}
                onChange={(event) =>
                  onPatch(member.memberId, {
                    responsibilities: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Current focus
              <input
                value={member.currentFocus}
                onChange={(event) =>
                  onPatch(member.memberId, { currentFocus: event.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={member.status}
                onChange={(event) =>
                  onPatch(member.memberId, {
                    status: event.target.value as TeamStatus,
                  })
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
