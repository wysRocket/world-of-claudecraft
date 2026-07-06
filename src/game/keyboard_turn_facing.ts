// Instant local display facing for keyboard turns online.
//
// Offline, A/D turning mutates the sim facing the same frame. Online the tl/tr
// flags are integrated SERVER-side at TURN_SPEED, so the model (and the follow
// camera) used to wait a full round trip before visibly turning. This module
// integrates the same TURN_SPEED math locally, display-only: the result feeds
// the renderer's facing-override chain and the camera follow, never the wire or
// ClientWorld state (the sanctioned display-layer anticipation, see
// src/net/CLAUDE.md).
//
// While engaged, the caller STREAMS the returned heading on the wire facing
// channel (the one mouselook streams; the server applies it outright) with
// the turn flags zeroed, so the server never integrates the turn itself: the
// local heading IS the authoritative heading, continuously, and there is no
// client/server disagreement to reconcile at release (server-side tick
// quantization, in-flight overshoot, and every release stutter they caused
// are gone by construction). On release the local facing is HELD while the
// mirrored server facing catches up over the last round trip, and the module
// hands off once it has settled within eps. The grace-then-gentle-glide
// correction remains only as the backstop for a facing the server refuses
// (a corpse) or a genuine misprediction.

import { TURN_SPEED } from '../sim/types';
import { wrapAngle } from './camera_follow';

// Within this of the server facing the display starts SEAMING: the wire
// rounds facing to 0.01 rad, so the mirror can sit ~0.3deg away from the held
// heading forever, and any one-frame jump onto it reads as a tiny end-of-turn
// tick. Inside the seam band the last fraction of a degree is eased at
// SEAM_RATE instead (sub-perceptual, ~0.33deg per 60fps frame).
const HANDOFF_EPS = 0.02; // rad (~1.1 degrees)
const SEAM_RATE = 0.35; // rad/s
// Fully handed off once within this (sub-pixel at any camera distance).
const HANDOFF_DONE_EPS = 0.002; // rad (~0.1 degrees)
// How long a release-time disagreement may stand before we start correcting.
// Sized to cover a generous input echo plus a couple of snapshots, so the
// normal catch-up always wins the race and no correction ever shows.
const RELEASE_GRACE_MS = 350;
// Gentle glide for a persistent residual (tick quantization is at most one
// server tick of turning, ~0.16 rad); a fraction of TURN_SPEED on purpose.
const RELEASE_CORRECT_RATE = 1.5; // rad/s
const MAX_FRAME_DT = 0.1; // clamp long frames so a hitch cannot over-rotate

export interface KeyboardTurnState {
  facing: number | null; // null = inactive (the server facing owns the display)
  releaseMs: number; // time spent in the release phase
}

export function newKeyboardTurnState(): KeyboardTurnState {
  return { facing: null, releaseMs: 0 };
}

function approachAngle(current: number, target: number, maxStep: number): number {
  const step = Math.max(0, maxStep);
  const d = wrapAngle(target - current);
  if (Math.abs(d) <= step) return target;
  return current + Math.sign(d) * step;
}

export interface KeyboardTurnArgs {
  turnLeft: boolean;
  turnRight: boolean;
  /** False while turning is blocked (stun family / corpse): hold, then correct. */
  turnAllowed: boolean;
  /**
   * The facing the client streams to the server this frame (mouselook,
   * click-move, mouselook-release latch). Non-null means that path owns the
   * heading and the server applies it immediately: clear and yield.
   */
  sentFacing: number | null;
  /** Interpolated prev->server facing (alpha capped at 1), the handoff target. */
  serverFacing: number;
  frameDt: number;
}

/**
 * Advance the local keyboard-turn display facing one frame. Returns the facing
 * to show (and to follow with the camera) while engaged or waiting for the
 * server to catch up, or null once the server facing owns the display again.
 */
export function stepKeyboardTurnFacing(
  state: KeyboardTurnState,
  args: KeyboardTurnArgs,
): number | null {
  if (args.sentFacing !== null) {
    // A foreign path (mouselook, click-move) owns the heading and streams it
    // itself; yield.
    state.facing = null;
    return null;
  }
  const dt = Math.min(Math.max(0, args.frameDt), MAX_FRAME_DT);
  if (args.turnAllowed && (args.turnLeft || args.turnRight)) {
    // Turning right DECREASES facing (sim convention: f points along (sin f, cos f)).
    const dir = (args.turnLeft ? 1 : 0) - (args.turnRight ? 1 : 0);
    const base = state.facing ?? args.serverFacing;
    state.facing = wrapAngle(base + dir * TURN_SPEED * dt);
    state.releaseMs = 0;
    return state.facing;
  }
  if (state.facing === null) return null;

  // Release phase: hold the local heading until the mirrored server facing
  // settles on it (the caller kept streaming it while we held, so the server
  // is already there; the mirror just needs the last round trip to show it).
  // Eps-arrival only, from either side: no crossing shortcuts, no rewinds.
  const gap = wrapAngle(args.serverFacing - state.facing);
  if (Math.abs(gap) <= HANDOFF_DONE_EPS) {
    state.facing = null;
    return args.serverFacing;
  }
  if (Math.abs(gap) <= HANDOFF_EPS) {
    // Seam band: ease the last fraction of a degree (mostly wire rounding)
    // onto the mirror instead of stepping it in a single frame.
    state.facing = approachAngle(state.facing, args.serverFacing, SEAM_RATE * dt);
    return state.facing;
  }
  state.releaseMs += dt * 1000;
  if (state.releaseMs >= RELEASE_GRACE_MS) {
    // The server never caught up (stun mid-turn, dropped input, quantization):
    // glide the residual out gently instead of snapping at TURN_SPEED.
    state.facing = approachAngle(state.facing, args.serverFacing, RELEASE_CORRECT_RATE * dt);
  }
  return state.facing;
}
