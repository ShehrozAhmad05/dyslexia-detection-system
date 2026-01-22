"""
ETDD70 Eye-Tracking Dataset Analysis
=====================================
Analyzes the ETDD70 dataset to extract meaningful features and thresholds
for dyslexia classification.

Author: FYP Project
Date: January 2026
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Set plotting style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)

class ETDD70Analyzer:
    def __init__(self, data_path, labels_path):
        """
        Initialize the analyzer with paths to data and labels.
        
        Args:
            data_path: Path to the data directory containing CSV files
            labels_path: Path to dyslexia_class_label.csv
        """
        self.data_path = Path(data_path)
        self.labels_path = Path(labels_path)
        self.labels_df = None
        self.metrics_df = None
        self.dyslexic_df = None
        self.non_dyslexic_df = None
        
    def load_labels(self):
        """Load dyslexia classification labels."""
        print("Loading labels...")
        self.labels_df = pd.read_csv(self.labels_path)
        print(f"✓ Loaded {len(self.labels_df)} subject labels")
        print(f"  - Dyslexic: {(self.labels_df['class_id'] == 1).sum()}")
        print(f"  - Non-Dyslexic: {(self.labels_df['class_id'] == 0).sum()}")
        return self.labels_df
    
    def load_meaningful_text_metrics(self):
        """
        Load trial-level metrics from T4_Meaningful_Text for all subjects.
        This is the most relevant task for our web-based reading test.
        """
        print("\nLoading T4_Meaningful_Text metrics...")
        all_metrics = []
        
        for subject_id in self.labels_df['subject_id']:
            metrics_file = self.data_path / f"Subject_{subject_id}_T4_Meaningful_Text_metrics.csv"
            
            if not metrics_file.exists():
                print(f"  Warning: Missing file for subject {subject_id}")
                continue
            
            try:
                # Read metrics file
                df = pd.read_csv(metrics_file)
                
                # Extract trial-level features (first row contains trial-level data)
                trial_data = df.iloc[0][[
                    'sid', 'n_fix_trial', 'sum_fix_dur_trial', 'mean_fix_dur_trial',
                    'n_sacc_trial', 'mean_sacc_ampl_trial', 'n_regress_trial',
                    'n_within_line_regress_trial', 'n_between_line_regress_trial',
                    'ratio_progress_regress_trial', 'dwell_time_trial'
                ]].to_dict()
                
                # Add label information
                label_info = self.labels_df[self.labels_df['subject_id'] == subject_id].iloc[0]
                trial_data['class_id'] = label_info['class_id']
                trial_data['label'] = label_info['label']
                
                all_metrics.append(trial_data)
                
            except Exception as e:
                print(f"  Error processing subject {subject_id}: {e}")
                continue
        
        self.metrics_df = pd.DataFrame(all_metrics)
        print(f"✓ Loaded metrics for {len(self.metrics_df)} subjects")
        
        # Separate by class
        self.dyslexic_df = self.metrics_df[self.metrics_df['class_id'] == 1]
        self.non_dyslexic_df = self.metrics_df[self.metrics_df['class_id'] == 0]
        
        return self.metrics_df
    
    def calculate_descriptive_stats(self):
        """Calculate and display descriptive statistics for both groups."""
        print("\n" + "="*80)
        print("DESCRIPTIVE STATISTICS")
        print("="*80)
        
        features = [
            'n_fix_trial', 'sum_fix_dur_trial', 'mean_fix_dur_trial',
            'n_regress_trial', 'mean_sacc_ampl_trial', 'dwell_time_trial'
        ]
        
        stats_summary = []
        
        for feature in features:
            dyslexic_mean = self.dyslexic_df[feature].mean()
            dyslexic_std = self.dyslexic_df[feature].std()
            non_dyslexic_mean = self.non_dyslexic_df[feature].mean()
            non_dyslexic_std = self.non_dyslexic_df[feature].std()
            
            # Calculate ratio
            ratio = dyslexic_mean / non_dyslexic_mean if non_dyslexic_mean > 0 else 0
            
            stats_summary.append({
                'Feature': feature,
                'Dyslexic_Mean': dyslexic_mean,
                'Dyslexic_Std': dyslexic_std,
                'NonDyslexic_Mean': non_dyslexic_mean,
                'NonDyslexic_Std': non_dyslexic_std,
                'Ratio_D/ND': ratio
            })
        
        stats_df = pd.DataFrame(stats_summary)
        print("\n", stats_df.to_string(index=False))
        
        return stats_df
    
    def calculate_thresholds(self):
        """
        Calculate optimal thresholds for each feature using statistical methods.
        Uses midpoint between group means as threshold.
        """
        print("\n" + "="*80)
        print("CALCULATED THRESHOLDS")
        print("="*80)
        
        features_mapping = {
            'n_regress_trial': {
                'name': 'Regression Count',
                'web_proxy': 'Revisit Count',
                'conversion': 4.0  # Eye regressions happen ~4x more than manual revisits
            },
            'mean_fix_dur_trial': {
                'name': 'Mean Fixation Duration',
                'web_proxy': 'Pause Duration',
                'conversion': 1.8  # Convert eye fixations to inactivity pauses
            },
            'dwell_time_trial': {
                'name': 'Total Dwell Time',
                'web_proxy': 'Total Reading Time',
                'conversion': 1.0  # Direct mapping
            }
        }
        
        thresholds = []
        
        for feature, info in features_mapping.items():
            dyslexic_mean = self.dyslexic_df[feature].mean()
            non_dyslexic_mean = self.non_dyslexic_df[feature].mean()
            
            # Threshold = midpoint between means
            eye_tracking_threshold = (dyslexic_mean + non_dyslexic_mean) / 2
            
            # Convert to web proxy threshold
            web_threshold = eye_tracking_threshold / info['conversion']
            
            thresholds.append({
                'Eye_Feature': info['name'],
                'Web_Feature': info['web_proxy'],
                'Dyslexic_Mean': dyslexic_mean,
                'NonDyslexic_Mean': non_dyslexic_mean,
                'Eye_Threshold': eye_tracking_threshold,
                'Web_Threshold': web_threshold,
                'Conversion_Factor': info['conversion']
            })
        
        threshold_df = pd.DataFrame(thresholds)
        print("\n", threshold_df.to_string(index=False))
        
        return threshold_df
    
    def plot_distributions(self, save_path=None):
        """Plot distributions of key features for both groups."""
        features = [
            ('n_regress_trial', 'Number of Regressions'),
            ('mean_fix_dur_trial', 'Mean Fixation Duration (ms)'),
            ('dwell_time_trial', 'Total Dwell Time (ms)'),
            ('n_fix_trial', 'Number of Fixations')
        ]
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        axes = axes.flatten()
        
        for idx, (feature, title) in enumerate(features):
            ax = axes[idx]
            
            # Plot distributions
            self.dyslexic_df[feature].hist(
                bins=15, alpha=0.6, label='Dyslexic', color='red', ax=ax
            )
            self.non_dyslexic_df[feature].hist(
                bins=15, alpha=0.6, label='Non-Dyslexic', color='green', ax=ax
            )
            
            # Add mean lines
            ax.axvline(
                self.dyslexic_df[feature].mean(),
                color='darkred', linestyle='--', linewidth=2, label='Dyslexic Mean'
            )
            ax.axvline(
                self.non_dyslexic_df[feature].mean(),
                color='darkgreen', linestyle='--', linewidth=2, label='Non-Dyslexic Mean'
            )
            
            ax.set_xlabel(title)
            ax.set_ylabel('Frequency')
            ax.set_title(f'Distribution: {title}')
            ax.legend()
            ax.grid(alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"\n✓ Saved distribution plots to {save_path}")
        
        plt.show()
        return fig
    
    def generate_web_thresholds_config(self, output_path=None):
        """
        Generate threshold configuration for the web application.
        """
        print("\n" + "="*80)
        print("WEB APPLICATION THRESHOLD CONFIGURATION")
        print("="*80)
        
        # Calculate WPM from dwell time
        # Assuming ~200 words in the meaningful text (typical for Czech children's text)
        avg_text_words = 200
        
        dyslexic_dwell_ms = self.dyslexic_df['dwell_time_trial'].mean()
        non_dyslexic_dwell_ms = self.non_dyslexic_df['dwell_time_trial'].mean()
        
        dyslexic_wpm = (avg_text_words / (dyslexic_dwell_ms / 1000)) * 60
        non_dyslexic_wpm = (avg_text_words / (non_dyslexic_dwell_ms / 1000)) * 60
        
        # Regression thresholds
        dyslexic_regress = self.dyslexic_df['n_regress_trial'].mean()
        non_dyslexic_regress = self.non_dyslexic_df['n_regress_trial'].mean()
        
        # Convert to web revisits (eye regressions / 4)
        web_dyslexic_revisits = dyslexic_regress / 4
        web_non_dyslexic_revisits = non_dyslexic_regress / 4
        
        # Pause duration thresholds
        dyslexic_fixation = self.dyslexic_df['mean_fix_dur_trial'].mean()
        non_dyslexic_fixation = self.non_dyslexic_df['mean_fix_dur_trial'].mean()
        
        # Convert to web pauses (fixation * 1.8 for inactivity lag)
        web_dyslexic_pause = (dyslexic_fixation * 1.8) / 1000  # Convert to seconds
        web_non_dyslexic_pause = (non_dyslexic_fixation * 1.8) / 1000
        
        config = f"""
// Thresholds derived from ETDD70 analysis
// Generated: {pd.Timestamp.now()}
// Dataset: 70 Czech children (35 dyslexic, 35 non-dyslexic)

const readingThresholds = {{
  wpm: {{
    dyslexic_mean: {dyslexic_wpm:.1f},
    non_dyslexic_mean: {non_dyslexic_wpm:.1f},
    threshold_high_risk: {(dyslexic_wpm + non_dyslexic_wpm) / 2:.1f},
    threshold_moderate: {non_dyslexic_wpm * 0.85:.1f}
  }},
  revisits: {{
    dyslexic_mean: {web_dyslexic_revisits:.1f},
    non_dyslexic_mean: {web_non_dyslexic_revisits:.1f},
    threshold_high_risk: {(web_dyslexic_revisits + web_non_dyslexic_revisits) / 2:.1f},
    threshold_moderate: {web_non_dyslexic_revisits * 1.5:.1f}
  }},
  pauseDuration: {{
    dyslexic_mean: {web_dyslexic_pause:.2f},
    non_dyslexic_mean: {web_non_dyslexic_pause:.2f},
    threshold_high_risk: {(web_dyslexic_pause + web_non_dyslexic_pause) / 2:.2f},
    threshold_moderate: {web_non_dyslexic_pause * 1.3:.2f}
  }},
  metadata: {{
    source: 'ETDD70 Eye-Tracking Dataset',
    conversion_method: 'Statistical mapping with conversion factors',
    note: 'Eye-tracking features converted to web behavioral proxies'
  }}
}};

module.exports = readingThresholds;
"""
        
        print(config)
        
        if output_path:
            with open(output_path, 'w') as f:
                f.write(config)
            print(f"\n✓ Saved threshold configuration to {output_path}")
        
        return config


def main():
    """Main analysis pipeline."""
    print("="*80)
    print("ETDD70 DYSLEXIA DATASET ANALYSIS")
    print("="*80)
    
    # Paths
    data_path = Path("D:/FYP/Code/Eye_Dataset/13332134/data/data")
    labels_path = Path("D:/FYP/Code/Eye_Dataset/13332134/dyslexia_class_label.csv")
    output_dir = Path("D:/FYP/Code/dyslexia-detection-system/analysis")
    output_dir.mkdir(exist_ok=True)
    
    # Initialize analyzer
    analyzer = ETDD70Analyzer(data_path, labels_path)
    
    # Step 1: Load data
    analyzer.load_labels()
    analyzer.load_meaningful_text_metrics()
    
    # Step 2: Calculate statistics
    stats_df = analyzer.calculate_descriptive_stats()
    stats_df.to_csv(output_dir / "ETDD70_descriptive_stats.csv", index=False)
    
    # Step 3: Calculate thresholds
    threshold_df = analyzer.calculate_thresholds()
    threshold_df.to_csv(output_dir / "ETDD70_thresholds.csv", index=False)
    
    # Step 4: Generate plots
    analyzer.plot_distributions(save_path=output_dir / "ETDD70_distributions.png")
    
    # Step 5: Generate web config
    analyzer.generate_web_thresholds_config(
        output_path=output_dir / "web_thresholds_config.js"
    )
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE!")
    print("="*80)
    print(f"Output files saved to: {output_dir}")


if __name__ == "__main__":
    main()
