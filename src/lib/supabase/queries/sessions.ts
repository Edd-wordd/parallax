import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SessionSchema,
  SessionTargetInsertSchema,
  SessionTargetSchema,
  SessionUpsertSchema,
  integrationMinutes,
  type SessionRow,
  type SessionTargetRow,
  type SessionUpsert,
} from "@/lib/schemas";
import type { z } from "zod";

type SessionTargetInsert = z.infer<typeof SessionTargetInsertSchema>;
import { assertNoError } from "../errors";

export type SessionWithTargets = SessionRow & {
  targets: SessionTargetRow[];
  /** Derived */
  total_integration_minutes: number;
};

/** Idempotent Save Log: one session per mission_id. */
export async function upsertSessionFromLog(
  client: SupabaseClient,
  input: SessionUpsert,
  targets: SessionTargetInsert[],
): Promise<SessionWithTargets> {
  const parsed = SessionUpsertSchema.parse(input);
  const parsedTargets = targets.map((t) => SessionTargetInsertSchema.parse(t));

  const { data: sessionData, error: sessionError } = await client
    .from("sessions")
    .upsert(
      {
        mission_id: parsed.mission_id,
        location_id: parsed.location_id,
        started_at: parsed.started_at ?? null,
        ended_at: parsed.ended_at ?? null,
        outcome_score: parsed.outcome_score,
        what_i_learned: parsed.what_i_learned ?? null,
        session_software: parsed.session_software ?? null,
        deleted_at: null,
      },
      { onConflict: "mission_id" },
    )
    .select("*")
    .single();
  assertNoError(sessionError, "upsertSessionFromLog.session");

  const session = SessionSchema.parse(normalizeSession(sessionData));

  const { error: delError } = await client
    .from("session_targets")
    .delete()
    .eq("session_id", session.id);
  assertNoError(delError, "upsertSessionFromLog.deleteTargets");

  let targetRows: SessionTargetRow[] = [];
  if (parsedTargets.length > 0) {
    const { data, error } = await client
      .from("session_targets")
      .insert(
        parsedTargets.map((t) => ({
          session_id: session.id,
          catalog_id: t.catalog_id,
          target_name: t.target_name,
          frames_captured: t.frames_captured,
          exposure_seconds: t.exposure_seconds,
          iso: t.iso ?? null,
          gain: t.gain ?? null,
          notes: t.notes ?? null,
        })),
      )
      .select("*");
    assertNoError(error, "upsertSessionFromLog.insertTargets");
    targetRows = (data ?? []).map((row) =>
      SessionTargetSchema.parse(normalizeTarget(row)),
    );
  }

  return withDerived(session, targetRows);
}

export async function listSessions(
  client: SupabaseClient,
): Promise<SessionWithTargets[]> {
  const { data, error } = await client
    .from("sessions")
    .select("*, session_targets(*)")
    .is("deleted_at", null)
    .order("ended_at", { ascending: false, nullsFirst: false });
  assertNoError(error, "listSessions");

  return (data ?? []).map((row) => {
    const { session_targets, ...rest } = row as Record<string, unknown> & {
      session_targets?: unknown[];
    };
    const session = SessionSchema.parse(normalizeSession(rest));
    const targets = (session_targets ?? []).map((t) =>
      SessionTargetSchema.parse(normalizeTarget(t as Record<string, unknown>)),
    );
    return withDerived(session, targets);
  });
}

export async function getSessionById(
  client: SupabaseClient,
  id: string,
): Promise<SessionWithTargets | null> {
  const { data, error } = await client
    .from("sessions")
    .select("*, session_targets(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  assertNoError(error, "getSessionById");
  if (!data) return null;
  const { session_targets, ...rest } = data as Record<string, unknown> & {
    session_targets?: unknown[];
  };
  const session = SessionSchema.parse(normalizeSession(rest));
  const targets = (session_targets ?? []).map((t) =>
    SessionTargetSchema.parse(normalizeTarget(t as Record<string, unknown>)),
  );
  return withDerived(session, targets);
}

function withDerived(
  session: SessionRow,
  targets: SessionTargetRow[],
): SessionWithTargets {
  const total = targets.reduce(
    (sum, t) => sum + integrationMinutes(t.frames_captured, t.exposure_seconds),
    0,
  );
  return {
    ...session,
    targets,
    total_integration_minutes: Math.round(total * 10) / 10,
  };
}

function normalizeSession(row: Record<string, unknown>) {
  return {
    ...row,
    started_at: row.started_at == null ? null : toIso(row.started_at),
    ended_at: row.ended_at == null ? null : toIso(row.ended_at),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    deleted_at: row.deleted_at == null ? null : toIso(row.deleted_at),
  };
}

function normalizeTarget(row: Record<string, unknown>) {
  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function toIso(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}
