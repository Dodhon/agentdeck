import type { ContentItem, ContentStage, TeamMember } from "./types";

export const CONTENT_STAGES: readonly ContentStage[] = [
  "idea",
  "script",
  "thumbnail",
  "filming",
  "published",
];

export const CONTENT_STAGE_LABELS: Record<ContentStage, string> = {
  idea: "Idea",
  script: "Script",
  thumbnail: "Thumbnail",
  filming: "Filming",
  published: "Published",
};

export const CONTENT_PIPELINE_SEED: ContentItem[] = [
  {
    contentId: "content_seed_1",
    title: "Mission Control setup walkthrough",
    notes: "Draft script on how Tasks + Calendar keep OpenClaw proactive.",
    stage: "script",
    createdAt: "2026-02-18T00:00:00.000Z",
    updatedAt: "2026-02-18T00:00:00.000Z",
  },
  {
    contentId: "content_seed_2",
    title: "Memory screen search demo",
    notes: "Show citation coverage report and retrieval examples.",
    stage: "idea",
    createdAt: "2026-02-18T00:00:00.000Z",
    updatedAt: "2026-02-18T00:00:00.000Z",
  },
];

export const TEAM_SEED: TeamMember[] = [
  {
    memberId: "member_openclaw",
    name: "OpenClaw",
    role: "Operator",
    responsibilities: "Owns execution queue, triages tasks, and updates status.",
    currentFocus: "Closing task transitions and activity logs",
    status: "working",
  },
  {
    memberId: "member_writer",
    name: "Scriptwriter Agent",
    role: "Writer",
    responsibilities: "Turns content ideas into scripts and short-form outlines.",
    currentFocus: "Drafting script for Mission Control overview video",
    status: "planning",
  },
  {
    memberId: "member_designer",
    name: "Thumbnail Agent",
    role: "Designer",
    responsibilities: "Generates thumbnail concepts and visual style options.",
    currentFocus: "Preparing thumbnail options for filming queue",
    status: "idle",
  },
];
