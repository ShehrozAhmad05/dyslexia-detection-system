"""
Process Aalto 136M Keystrokes Dataset for Dyslexia Detection
==============================================================

Processes the Aalto University typing dataset to extract 8 normalized
behavioral keystroke features for Isolation Forest anomaly detection.

Dataset:  https://userinterfaces.aalto.fi/136Mkeystrokes/
Citation: Dhakal et al. (2018) - CHI Best Paper Award

Feature set (8, normalized):
    1. avgHoldTime    - average key-press duration (ms)
    2. cvHoldTime     - coefficient of variation of hold times (%)  [rhythm consistency]
    3. avgFlightTime  - average inter-key interval (ms)             [typing tempo]
    4. cvFlightTime   - coefficient of variation of flight times (%) [timing variability]
    5. wpm            - (chars/5) / minutes                         [speed]
    6. pauseFrequency - pauses(>2s) / words                        [decoding pauses, per-word]
    7. pauseDuration  - average duration of pauses >2s (ms)         [cognitive load]
    8. backspaceRate  - BKSP+DEL keystrokes / total keystrokes      [spelling errors]

Why these 8?
    - stdHoldTime / stdFlightTime removed  : CV already encodes std/mean, std alone is redundant
    - errorRate removed                    : identical to backspaceRate in this dataset
    - pauseDuration added                  : captures HOW LONG pauses last, independent of frequency
    - All count-based features normalized  : avoids sentence-length bias

Usage:
    python process_aalto_dataset.py --input D:/FYP/Code/aalto_data --output training_data_aalto.json --sample 10000

Requirements:
    pip install pandas numpy tqdm
"""

import json
import os
import numpy as np
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import argparse

# Modifier/special keys that should NOT be included in hold/flight timing stats.
# They overlap with regular keystrokes and inflate duration values.
MODIFIER_KEYS = {
    'SHIFT', 'CTRL', 'ALT', 'CAPS', 'TAB', 'ENTER', 'ESC',
    'META', 'WIN', 'FN', 'ALTGR', 'CONTROL', 'CAPSLOCK',
}


# ====================================================================
# PAUSE THRESHOLD (ms) - flight time above this is a "hesitation pause"
# ====================================================================
PAUSE_THRESHOLD_MS = 2000  # 2 seconds


def cv(values):
    """Coefficient of variation (%) — std / mean × 100."""
    mean = np.mean(values)
    return float(np.std(values) / mean * 100) if mean > 0 else 0.0


def process_session(session_data, has_letter_col):
    """
    Extract 8 normalized features from one typing session.

    Features:
        avgHoldTime    - mean key-press duration (ms)
        cvHoldTime     - CV of hold times (%)            [rhythm consistency]
        avgFlightTime  - mean inter-key interval (ms)    [typing tempo]
        cvFlightTime   - CV of flight times (%)          [timing variability]
        wpm            - (chars / 5) / minutes           [speed]
        pauseFrequency - pauses / words                  [decoding pauses, per-word]
        pauseDuration  - mean pause length (ms)          [cognitive load]
        backspaceRate  - BKSP+DEL / total keys           [spelling corrections]

    Normalization rationale:
        pauseFrequency is divided by WORDS (not keystrokes) so long sentences
        don't artificially inflate the count.
        backspaceRate is divided by total keystrokes, independent of sentence length.
        wpm already normalises for time.
    """
    session_data = session_data.copy()

    # --- Identify modifier keys (SHIFT, CTRL etc.) ----------------------
    # These overlap with regular keystrokes and must be excluded from timing.
    if has_letter_col:
        is_modifier = session_data['LETTER'].isin(MODIFIER_KEYS)
        is_correction = session_data['LETTER'].isin(['BKSP', 'Backspace', 'DEL', 'Delete'])
        correction_count = int(is_correction.sum())
        # Keep only printable characters for timing analysis
        timing_rows = session_data[~is_modifier & ~is_correction]
    else:
        correction_count = 0
        timing_rows = session_data

    # --- Hold times and flight times (on printable keys only) -------------
    timing_rows = timing_rows.copy()
    timing_rows['hold_time'] = timing_rows['RELEASE_TIME'] - timing_rows['PRESS_TIME']
    timing_rows['flight_time'] = (
        timing_rows['PRESS_TIME'] - timing_rows['RELEASE_TIME'].shift(1)
    )

    # --- Filter outliers ---------------------------------------------------
    typing_data = timing_rows[
        (timing_rows['hold_time'] > 0) & (timing_rows['hold_time'] < 5000)
    ].copy()

    hold_times = typing_data['hold_time'].dropna().values
    all_flight_times = typing_data['flight_time'].dropna().values

    # Motor rhythm flights only: exclude key rollover negatives and long pauses.
    # ChatGPT recommendation adopted: keep only 0-2000 ms for flight CV/mean.
    motor_flight_times = all_flight_times[
        (all_flight_times >= 0) & (all_flight_times <= PAUSE_THRESHOLD_MS)
    ]

    # Guard against unstable CV in short sessions.
    if len(hold_times) < 10 or len(motor_flight_times) < 5:
        return None

    # --- WPM: use SENTENCE column if available (most accurate word count) --
    time_span_ms = (
        session_data['PRESS_TIME'].max() - session_data['PRESS_TIME'].min()
    )
    time_span_min = time_span_ms / 60_000
    # Word count from the target sentence is the ground truth;
    # fall back to chars-typed / 5 if column absent
    if 'SENTENCE' in session_data.columns:
        sentence = str(session_data['SENTENCE'].iloc[0])
        words = len(sentence.split())
    else:
        words = len(typing_data) / 5.0
    wpm = (words / time_span_min) if time_span_min > 0 else 0.0

    # --- Pause features (per-word, not per-keystroke) ---------------------
    pause_mask     = all_flight_times > PAUSE_THRESHOLD_MS
    pause_count    = int(np.sum(pause_mask))
    pause_durations = all_flight_times[pause_mask]

    # Normalize: pauses per word typed (avoids sentence-length bias)
    words_typed = max(words, 1.0)
    pause_frequency = pause_count / words_typed
    pause_duration  = float(np.mean(pause_durations)) if len(pause_durations) > 0 else 0.0

    # --- Backspace rate (normalized by total original keystrokes) ---------
    total_keys    = len(session_data)
    backspace_rate = correction_count / total_keys if total_keys > 0 else 0.0

    return {
        'avgHoldTime':    float(np.mean(hold_times)),
        'cvHoldTime':     cv(hold_times),
        'avgFlightTime':  float(np.mean(motor_flight_times)),
        'cvFlightTime':   cv(motor_flight_times),
        'wpm':            float(wpm),
        'pauseFrequency': float(pause_frequency),
        'pauseDuration':  float(pause_duration),
        'backspaceRate':  float(backspace_rate),
        'keystrokeCount': int(total_keys),
    }


def detect_columns(df):
    """
    Detect actual column names for PRESS_TIME, RELEASE_TIME, LETTER, SESSION_ID.
    Aalto dataset column capitalization may vary between versions.
    """
    col_map = {}
    cols_lower = {c.lower(): c for c in df.columns}

    for target, candidates in {
        'PRESS_TIME':   ['press_time', 'presstime', 'down_time', 'downtime'],
        'RELEASE_TIME': ['release_time', 'releasetime', 'up_time', 'uptime'],
        'LETTER':       ['letter', 'key', 'char', 'character', 'keycode', 'key_code'],
        'SESSION_ID':   ['session_id', 'sessionid', 'session',
                          'test_section_id', 'test_section', 'sectionid'],  # Aalto uses TEST_SECTION_ID
    }.items():
        for c in candidates:
            if c in cols_lower:
                col_map[target] = cols_lower[c]
                break

    return col_map


def process_participant_file(file_path):
    """
    Read one Aalto participant file and return a list of session feature dicts.

    Aalto files are tab-separated (TSV) with one row per keystroke event.
    From Dhakal et al. (2018):
      "ERROR CORRECTIONS (%) refers to the percentage of keypresses using
       the Backspace (BKSP) or Delete (DEL) key during typing."
    """
    try:
        df = pd.read_csv(file_path, sep='\t', on_bad_lines='skip')

        col_map = detect_columns(df)

        if 'PRESS_TIME' not in col_map or 'RELEASE_TIME' not in col_map:
            return None  # Cannot compute timing features without timestamps

        # Rename detected columns to canonical names
        rename = {v: k for k, v in col_map.items()}
        df = df.rename(columns=rename)

        has_letter_col = 'LETTER' in df.columns

        # Group into sessions
        if 'SESSION_ID' in df.columns:
            groups = df.groupby('SESSION_ID')
        else:
            groups = [(0, df)]

        results = []
        for _, session_data in groups:
            if len(session_data) < 20:
                continue
            feat = process_session(session_data, has_letter_col)
            if feat is not None:
                results.append(feat)

        return results if results else None

    except Exception as exc:
        print(f"  [WARN] {file_path.name}: {exc}")
        return None


def summarise(all_sessions, output_path):
    """Print summary statistics after extraction."""
    df = pd.DataFrame(all_sessions)
    print(f"\n{'='*60}")
    print(f"EXTRACTION SUMMARY  ({len(all_sessions)} sessions)")
    print(f"{'='*60}")

    features_8 = [
        'avgHoldTime', 'cvHoldTime',
        'avgFlightTime', 'cvFlightTime',
        'wpm', 'pauseFrequency', 'pauseDuration', 'backspaceRate',
    ]
    for feat in features_8:
        if feat in df.columns:
            v = df[feat]
            print(
                f"  {feat:<20s}  mean={v.mean():.3f}  "
                f"p5={v.quantile(0.05):.3f}  p95={v.quantile(0.95):.3f}"
            )

    print(f"\n✅ Saved → {output_path}")
    print(f"\nNEXT STEPS:")
    print(f"  1. python generate_thresholds_from_aalto.py --input {output_path}")
    print(f"  2. python ../src/ml/keystroke/trainModel.py")
    print(f"  3. Replace backend/config/keystrokeConfig.js")


def process_aalto_dataset(input_dir, output_path, sample_size=10000):
    """
    Main pipeline: scan → sample → extract → save.

    Args:
        input_dir:   Directory (or sub-directory) containing Aalto TSV files.
        output_path: Destination JSON for training_data_aalto.json.
        sample_size: Max number of participant FILES to process.
                     Each file can contain multiple sessions.
                     Recommended: 5 000 – 10 000.
    """
    input_path = Path(input_dir)

    # Aalto files are named <id>_keystrokes.txt — exclude readme and metadata
    EXCLUDE = {'readme.txt', 'metadata_participants.txt'}
    files = [
        f for f in (list(input_path.rglob('*.txt')) + list(input_path.rglob('*.csv')))
        if f.name.lower() not in EXCLUDE and f.name != 'training_data_aalto.json'
    ]

    if not files:
        print(f"\n❌  No data files found under: {input_dir}")
        print("    Expected tab-separated .txt or .csv files.")
        print("    Check that the Aalto dataset zip was fully extracted.")
        return

    print(f"Found {len(files)} participant files.")

    if sample_size and len(files) > sample_size:
        np.random.seed(42)
        idx = np.random.choice(len(files), sample_size, replace=False)
        files = [files[i] for i in idx]
        print(f"Sampling {sample_size} files (seed=42 for reproducibility).")

    all_sessions = []
    for file_path in tqdm(files, desc='Extracting features'):
        sessions = process_participant_file(file_path)
        if sessions:
            all_sessions.extend(sessions)

    print(f"\nValid sessions extracted: {len(all_sessions)}")

    if not all_sessions:
        print("❌  No valid sessions.  Check data format (run Phase 2 inspection first).")
        return

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_sessions, f, indent=2)

    summarise(all_sessions, output_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Extract 8 normalized keystroke features from Aalto 136M dataset'
    )
    parser.add_argument('--input',  required=True,
                        help='Path to extracted Aalto data directory')
    parser.add_argument('--output', default='training_data_aalto.json',
                        help='Output JSON file (default: training_data_aalto.json)')
    parser.add_argument('--sample', type=int, default=10000,
                        help='Max participant files to process (default: 10000)')
    args = parser.parse_args()

    process_aalto_dataset(args.input, args.output, args.sample)
