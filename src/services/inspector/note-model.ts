/**
 * The Note inspector's view-model, derived once here rather than rebuilt inline
 * in each app's inspector.
 *
 * Both apps showed the same fields with the same rule — where the selected
 * notes agree, show the value; where they do not, show "Mixed" — and each
 * rebuilt it with the same `commonValue(notes.map(...))` calls over the display
 * lens. That derivation is not presentation (it is what the fields *mean*), so
 * it lives here; the UI renders the result and owns the words for "Mixed".
 *
 * Pitch is read through the display lens (`displayedPitchForNote`), since a
 * transposing instrument or an `8va` shows something other than what is stored.
 * Commit still goes through music_editing's `setNotePitch` from the UI, which
 * converts the shown pitch back once.
 */
import type {
  NoteEvent,
  Pitch,
  PitchDisplay,
  Score,
} from '@sudobility/music_types';
import {
  NO_MARK,
  commonValue,
  durationFieldState,
  findTrack,
  voiceNumberOf,
} from '@sudobility/music_types';
import { displayedPitchForNote } from '@sudobility/music_editing';

/**
 * The common value of each Note field across the selection (undefined where the
 * notes disagree — the UI shows that as "Mixed"), plus the duration field's
 * three-state answer and the grace-note count of the first note.
 */
export function noteInspectorModel(
  notes: readonly NoteEvent[],
  score: Score,
  pitchDisplay: PitchDisplay
) {
  const shown = (note: NoteEvent): Pitch =>
    displayedPitchForNote(score, note, pitchDisplay);
  return {
    step: commonValue(notes.map(n => shown(n).step)),
    accidental: commonValue(notes.map(n => String(shown(n).accidental))),
    octave: commonValue(notes.map(n => shown(n).octave)),
    duration: durationFieldState(notes, score.ppq),
    startTick: commonValue(notes.map(n => n.startTick)),
    velocity: commonValue(notes.map(n => n.velocity)),
    articulation: commonValue(notes.map(n => n.articulation ?? NO_MARK)),
    dynamic: commonValue(notes.map(n => n.dynamic ?? NO_MARK)),
    trackName: commonValue(
      notes.map(n => findTrack(score, n.trackId)?.name ?? '?')
    ),
    voice: commonValue(notes.map(n => voiceNumberOf(score, n))),
    tieStart: commonValue(notes.map(n => n.tieStart === true)),
    tieStop: commonValue(notes.map(n => n.tieStop === true)),
    graceCount: notes[0]?.graceNotes?.length ?? 0,
  };
}

export type NoteInspectorModel = ReturnType<typeof noteInspectorModel>;
