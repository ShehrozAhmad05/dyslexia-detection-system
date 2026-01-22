# ETDD70 Dataset Exploration Summary

## Dataset Overview
- **Name:** ETDD70 (Eye-Tracking Dyslexia Dataset)
- **Participants:** 70 Czech children aged 9-10 years
  - 35 Dyslexic (class_id = 1)
  - 35 Non-Dyslexic (class_id = 0)
- **Eye Tracker:** 250 Hz professional equipment
- **Tasks:** 3 reading tasks per participant
  - T1: Syllables reading
  - T4: Meaningful text reading
  - T5: Pseudo-text reading

## Data Structure

### Files Per Subject
Each subject has 4 file types per task:
1. **`*_raw.csv`** - Raw 250Hz eye position data
2. **`*_fixations.csv`** - Detected fixation events
3. **`*_saccades.csv`** - Detected saccade events
4. **`*_metrics.csv`** - **Aggregated statistical features (MOST IMPORTANT)**

### Key Label File
- **`dyslexia_class_label.csv`** - Subject-level dyslexia classification
  - `subject_id`: Participant ID (1003, 1016, etc.)
  - `class_id`: 0 = non-dyslexic, 1 = dyslexic
  - `label`: Text label

## Available Features in Metrics Files

### Trial-Level (Whole-Task) Features:
| Feature | Description | Relevance to Web Proxy |
|---------|-------------|------------------------|
| `n_fix_trial` | Total number of fixations | → Pause count (proxy) |
| `sum_fix_dur_trial` | Total fixation duration (ms) | → Total reading time |
| `mean_fix_dur_trial` | Average fixation duration (ms) | → Average pause duration |
| `n_sacc_trial` | Total number of saccades | → Navigation events |
| `mean_sacc_ampl_trial` | Average saccade amplitude | → Skip distance |
| `n_regress_trial` | **Total regressions** | **→ Revisit count (DIRECT)** |
| `n_within_line_regress_trial` | Within-line regressions | → Word re-reading |
| `n_between_line_regress_trial` | Between-line regressions | → Line re-reading |
| `ratio_progress_regress_trial` | Forward/backward ratio | → Reading fluency |

### AOI-Level (Area of Interest) Features:
| Feature | Description | Relevance |
|---------|-------------|-----------|
| `dwell_time_aoi` | Time spent on word/line | → Time per segment |
| `n_fix_aoi` | Fixations on specific word | → Difficulty indicators |
| `n_revisits_aoi` | Number of re-visits to word | → Re-reading frequency |
| `skipped_aoi` | Whether word was skipped | → Comprehension issues |
| `first_fix_dur_aoi` | Initial fixation duration | → Word decoding time |

## Most Relevant Features for Web Mapping

### High Priority (Direct Mapping Possible):
1. **`n_regress_trial`** → Web revisit count
2. **`sum_fix_dur_trial`** → Total reading time
3. **`n_revisits_aoi`** → Word-level re-reading
4. **`mean_fix_dur_trial`** → Average pause duration

### Medium Priority (Indirect Mapping):
5. **`mean_sacc_ampl_trial`** → Reading speed indicator
6. **`ratio_progress_regress_trial`** → Reading fluency
7. **`n_within_line_regress_trial`** → Comprehension struggles

### Low Priority (Hard to Map):
8. **`first_fix_land_pos_aoi`** → Eye landing position (no web equivalent)
9. **`mean_sacc_dur_trial`** → Saccade timing (no web equivalent)

## Focus for Analysis
For **T4_Meaningful_Text** (closest to our web reading test):
- Extract trial-level features for all 70 subjects
- Compare dyslexic vs non-dyslexic distributions
- Calculate thresholds using statistical methods
- Map to web proxy features

## Next Steps
1. ✅ Dataset structure documented
2. ⏭️ Create Python script to load and analyze T4_Meaningful_Text metrics
3. ⏭️ Train classification model
4. ⏭️ Extract feature importance and thresholds
