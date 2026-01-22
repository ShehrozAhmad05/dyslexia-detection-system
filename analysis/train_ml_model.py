"""
ETDD70 Machine Learning Classification Model
=============================================
Train classification models on ETDD70 to:
1. Validate predictive power of features
2. Extract feature importance rankings
3. Determine optimal feature weights for web app

Author: FYP Project
Date: January 2026
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, 
    accuracy_score, precision_recall_fscore_support
)
import warnings
warnings.filterwarnings('ignore')

# Set plotting style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)


class DyslexiaClassifier:
    def __init__(self, data_path, labels_path):
        """Initialize classifier with data paths."""
        self.data_path = Path(data_path)
        self.labels_path = Path(labels_path)
        self.df = None
        self.X = None
        self.y = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = StandardScaler()
        self.rf_model = None
        self.lr_model = None
        self.feature_names = None
        
    def load_and_prepare_data(self):
        """Load data and prepare features."""
        print("Loading data...")
        
        # Load labels
        labels_df = pd.read_csv(self.labels_path)
        
        # Load metrics for all subjects
        all_data = []
        for subject_id in labels_df['subject_id']:
            metrics_file = self.data_path / f"Subject_{subject_id}_T4_Meaningful_Text_metrics.csv"
            
            if not metrics_file.exists():
                continue
                
            try:
                df = pd.read_csv(metrics_file)
                trial_data = df.iloc[0][[
                    'n_fix_trial', 'sum_fix_dur_trial', 'mean_fix_dur_trial',
                    'n_sacc_trial', 'mean_sacc_ampl_trial', 'n_regress_trial',
                    'n_within_line_regress_trial', 'n_between_line_regress_trial',
                    'ratio_progress_regress_trial', 'dwell_time_trial'
                ]].to_dict()
                
                # Add label
                label_info = labels_df[labels_df['subject_id'] == subject_id].iloc[0]
                trial_data['class_id'] = label_info['class_id']
                trial_data['subject_id'] = subject_id
                
                all_data.append(trial_data)
            except Exception as e:
                print(f"  Error processing subject {subject_id}: {e}")
                continue
        
        self.df = pd.DataFrame(all_data)
        print(f"✓ Loaded {len(self.df)} subjects")
        print(f"  - Dyslexic: {(self.df['class_id'] == 1).sum()}")
        print(f"  - Non-Dyslexic: {(self.df['class_id'] == 0).sum()}")
        
        # Prepare features and target
        self.feature_names = [
            'n_fix_trial', 'sum_fix_dur_trial', 'mean_fix_dur_trial',
            'n_sacc_trial', 'mean_sacc_ampl_trial', 'n_regress_trial',
            'n_within_line_regress_trial', 'n_between_line_regress_trial',
            'ratio_progress_regress_trial', 'dwell_time_trial'
        ]
        
        self.X = self.df[self.feature_names].values
        self.y = self.df['class_id'].values
        
        return self.df
    
    def split_and_scale_data(self, test_size=0.3, random_state=42):
        """Split data into train/test and scale features."""
        print("\nSplitting and scaling data...")
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=test_size, random_state=random_state, stratify=self.y
        )
        
        # Scale features
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        print(f"✓ Train set: {len(self.X_train)} samples")
        print(f"✓ Test set: {len(self.X_test)} samples")
        
    def train_random_forest(self):
        """Train Random Forest classifier."""
        print("\n" + "="*80)
        print("TRAINING RANDOM FOREST CLASSIFIER")
        print("="*80)
        
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        )
        
        # Train model
        self.rf_model.fit(self.X_train_scaled, self.y_train)
        
        # Predictions
        y_pred_train = self.rf_model.predict(self.X_train_scaled)
        y_pred_test = self.rf_model.predict(self.X_test_scaled)
        y_pred_proba = self.rf_model.predict_proba(self.X_test_scaled)[:, 1]
        
        # Evaluate
        train_acc = accuracy_score(self.y_train, y_pred_train)
        test_acc = accuracy_score(self.y_test, y_pred_test)
        auc = roc_auc_score(self.y_test, y_pred_proba)
        
        print(f"\nTraining Accuracy: {train_acc:.3f}")
        print(f"Test Accuracy: {test_acc:.3f}")
        print(f"AUC-ROC: {auc:.3f}")
        
        print("\nClassification Report:")
        print(classification_report(self.y_test, y_pred_test, 
                                   target_names=['Non-Dyslexic', 'Dyslexic']))
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.rf_model, self.X_train_scaled, self.y_train, 
            cv=StratifiedKFold(n_splits=5), scoring='accuracy'
        )
        print(f"\nCross-Validation Accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
        
        return {
            'train_acc': train_acc,
            'test_acc': test_acc,
            'auc': auc,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std()
        }
    
    def train_logistic_regression(self):
        """Train Logistic Regression for comparison."""
        print("\n" + "="*80)
        print("TRAINING LOGISTIC REGRESSION")
        print("="*80)
        
        self.lr_model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight='balanced'
        )
        
        self.lr_model.fit(self.X_train_scaled, self.y_train)
        
        y_pred_test = self.lr_model.predict(self.X_test_scaled)
        test_acc = accuracy_score(self.y_test, y_pred_test)
        
        print(f"\nTest Accuracy: {test_acc:.3f}")
        print("\nClassification Report:")
        print(classification_report(self.y_test, y_pred_test,
                                   target_names=['Non-Dyslexic', 'Dyslexic']))
        
        return test_acc
    
    def extract_feature_importance(self):
        """Extract and display feature importance from Random Forest."""
        print("\n" + "="*80)
        print("FEATURE IMPORTANCE ANALYSIS")
        print("="*80)
        
        importance = self.rf_model.feature_importances_
        indices = np.argsort(importance)[::-1]
        
        print("\nFeature Ranking:")
        print("-" * 60)
        
        importance_data = []
        for i, idx in enumerate(indices):
            feature_name = self.feature_names[idx]
            importance_val = importance[idx]
            print(f"{i+1}. {feature_name:30s} {importance_val:.4f}")
            importance_data.append({
                'rank': i+1,
                'feature': feature_name,
                'importance': importance_val
            })
        
        importance_df = pd.DataFrame(importance_data)
        return importance_df
    
    def plot_feature_importance(self, save_path=None):
        """Plot feature importance."""
        importance = self.rf_model.feature_importances_
        indices = np.argsort(importance)[::-1]
        
        plt.figure(figsize=(12, 6))
        plt.bar(range(len(importance)), importance[indices], color='steelblue')
        plt.xticks(range(len(importance)), 
                   [self.feature_names[i] for i in indices], 
                   rotation=45, ha='right')
        plt.xlabel('Features')
        plt.ylabel('Importance Score')
        plt.title('Feature Importance from Random Forest Model')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"\n✓ Saved feature importance plot to {save_path}")
        
        plt.show()
        return plt.gcf()
    
    def plot_confusion_matrix(self, save_path=None):
        """Plot confusion matrix."""
        y_pred = self.rf_model.predict(self.X_test_scaled)
        cm = confusion_matrix(self.y_test, y_pred)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=['Non-Dyslexic', 'Dyslexic'],
                   yticklabels=['Non-Dyslexic', 'Dyslexic'])
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.title('Confusion Matrix - Random Forest')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"✓ Saved confusion matrix to {save_path}")
        
        plt.show()
        return plt.gcf()
    
    def generate_web_feature_weights(self, importance_df, output_path=None):
        """
        Generate feature weights for web application based on:
        1. Model feature importance
        2. Web feasibility (which features can be measured)
        """
        print("\n" + "="*80)
        print("WEB APPLICATION FEATURE WEIGHTS")
        print("="*80)
        
        # Map eye-tracking features to web proxies
        web_mapping = {
            'n_regress_trial': ('revisitCount', 1.0),  # High feasibility
            'dwell_time_trial': ('totalReadingTime', 1.0),  # High feasibility
            'mean_fix_dur_trial': ('avgPauseDuration', 0.7),  # Moderate feasibility
            'n_fix_trial': ('pauseCount', 0.7),  # Moderate feasibility
            'sum_fix_dur_trial': ('totalReadingTime', 0.5),  # Redundant with dwell_time
        }
        
        # Calculate web feature weights
        web_weights = {}
        for _, row in importance_df.iterrows():
            if row['feature'] in web_mapping:
                web_feature, feasibility = web_mapping[row['feature']]
                weight = row['importance'] * feasibility
                
                if web_feature in web_weights:
                    web_weights[web_feature] += weight
                else:
                    web_weights[web_feature] = weight
        
        # Normalize weights to sum to 1.0
        total_weight = sum(web_weights.values())
        web_weights = {k: v/total_weight for k, v in web_weights.items()}
        
        # Add comprehension (not in ETDD70 but important for web)
        # Allocate 30% to comprehension, redistribute others to 70%
        for k in web_weights:
            web_weights[k] *= 0.70
        web_weights['comprehensionScore'] = 0.30
        
        print("\nWeb Feature Weights (for risk calculation):")
        print("-" * 60)
        for feature, weight in sorted(web_weights.items(), key=lambda x: x[1], reverse=True):
            print(f"{feature:25s} {weight:.3f} ({weight*100:.1f}%)")
        
        # Generate JavaScript config
        config = f"""
// Feature weights derived from ETDD70 Random Forest model
// Generated: {pd.Timestamp.now()}
// Model Accuracy: {self.rf_model.score(self.X_test_scaled, self.y_test):.3f}

const featureWeights = {{
  // Weights sum to 1.0 (100%)
  revisitCount: {web_weights.get('revisitCount', 0):.3f},
  totalReadingTime: {web_weights.get('totalReadingTime', 0):.3f},
  pauseCount: {web_weights.get('pauseCount', 0):.3f},
  avgPauseDuration: {web_weights.get('avgPauseDuration', 0):.3f},
  comprehensionScore: {web_weights.get('comprehensionScore', 0):.3f},
  
  metadata: {{
    source: 'ETDD70 Random Forest Feature Importance',
    model_accuracy: {self.rf_model.score(self.X_test_scaled, self.y_test):.3f},
    note: 'Weights adjusted for web feasibility and include comprehension'
  }}
}};

module.exports = featureWeights;
"""
        
        print(config)
        
        if output_path:
            with open(output_path, 'w') as f:
                f.write(config)
            print(f"\n✓ Saved feature weights config to {output_path}")
        
        return web_weights


def main():
    """Main training pipeline."""
    print("="*80)
    print("ETDD70 MACHINE LEARNING MODEL TRAINING")
    print("="*80)
    
    # Paths
    data_path = Path("D:/FYP/Code/Eye_Dataset/13332134/data/data")
    labels_path = Path("D:/FYP/Code/Eye_Dataset/13332134/dyslexia_class_label.csv")
    output_dir = Path("D:/FYP/Code/dyslexia-detection-system/analysis")
    
    # Initialize classifier
    classifier = DyslexiaClassifier(data_path, labels_path)
    
    # Load and prepare data
    classifier.load_and_prepare_data()
    classifier.split_and_scale_data()
    
    # Train Random Forest
    rf_results = classifier.train_random_forest()
    
    # Train Logistic Regression for comparison
    lr_acc = classifier.train_logistic_regression()
    
    # Extract feature importance
    importance_df = classifier.extract_feature_importance()
    importance_df.to_csv(output_dir / "feature_importance.csv", index=False)
    
    # Generate plots
    classifier.plot_feature_importance(
        save_path=output_dir / "feature_importance_plot.png"
    )
    classifier.plot_confusion_matrix(
        save_path=output_dir / "confusion_matrix.png"
    )
    
    # Generate web feature weights
    web_weights = classifier.generate_web_feature_weights(
        importance_df,
        output_path=output_dir / "web_feature_weights.js"
    )
    
    # Save model summary
    summary = {
        'model': 'Random Forest',
        'train_accuracy': rf_results['train_acc'],
        'test_accuracy': rf_results['test_acc'],
        'auc_roc': rf_results['auc'],
        'cv_accuracy_mean': rf_results['cv_mean'],
        'cv_accuracy_std': rf_results['cv_std'],
        'logistic_regression_accuracy': lr_acc,
        'n_samples': len(classifier.df),
        'n_features': len(classifier.feature_names)
    }
    
    summary_df = pd.DataFrame([summary])
    summary_df.to_csv(output_dir / "model_summary.csv", index=False)
    
    print("\n" + "="*80)
    print("MODEL TRAINING COMPLETE!")
    print("="*80)
    print(f"Output files saved to: {output_dir}")
    print(f"\nModel Performance Summary:")
    print(f"  Test Accuracy: {rf_results['test_acc']:.3f}")
    print(f"  AUC-ROC: {rf_results['auc']:.3f}")
    print(f"  CV Accuracy: {rf_results['cv_mean']:.3f} (+/- {rf_results['cv_std']:.3f})")


if __name__ == "__main__":
    main()
