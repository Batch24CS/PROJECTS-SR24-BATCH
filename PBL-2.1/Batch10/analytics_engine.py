# analytics_engine.py - FIXED VERSION
import subprocess
import json
import tempfile
import os
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import numpy as np
import sys


class AnalyticsEngine:
    def __init__(self, data_manager):
        self.data_manager = data_manager
        self.r_script_path = "fitness_analytics.R"
        self.java_processor = JavaDataProcessor()

    def get_java_analytics(self, data_manager):
        """Simple wrapper for Java analytics"""
        return self.java_processor.get_java_analytics(data_manager)


class JavaDataProcessor:
    def __init__(self):
        pass

    def call_java_calculations(self, weight_history, workouts, streak):
        """Try Java first, fallback to Python if needed"""
        try:
            # First try to use Java
            java_path = self.find_java_path()
            classes_available = self.ensure_java_classes_available()

            if not java_path or not classes_available:
                print("Java environment not available - using Python analytics")
                return self.python_fallback_calculations(weight_history, workouts, streak)

            # If we have Java and classes, try to use them
            weights = [w['weight'] for w in weight_history]
            input_data = {
                'weights': weights,
                'workouts': workouts,
                'streak': streak
            }

            print(f"Attempting Java analysis with: {java_path}")

            result = subprocess.run([
                java_path,
                '-cp', '.',
                'FitnessCalculator'
            ], input=json.dumps(input_data), capture_output=True, text=True, timeout=30)

            if result.returncode == 0 and result.stdout.strip():
                java_result = json.loads(result.stdout)
                java_result['fallback_used'] = False
                java_result['processed_by'] = 'Java Analytics Engine'
                print("✅ Java analysis successful!")
                return java_result
            else:
                print("Java execution failed - using Python analytics")
                return self.python_fallback_calculations(weight_history, workouts, streak)

        except Exception as e:
            print(f"Java integration error: {e} - using Python analytics")
            return self.python_fallback_calculations(weight_history, workouts, streak)

    def python_fallback_calculations(self, weight_history, workouts, streak):
        """Python fallback that gives GOOD results like Java"""
        import numpy as np
        from datetime import datetime, timedelta

        print("Using enhanced Python analytics")

        if len(weight_history) < 2:
            return {'error': 'Insufficient data for analysis'}

        weights = [w['weight'] for w in weight_history]
        dates = [datetime.fromisoformat(w['date']) for w in weight_history]

        # Enhanced calculations
        x = np.arange(len(weights))
        y = np.array(weights)

        # Linear regression
        slope, intercept = np.polyfit(x, y, 1)
        trend_per_week = slope * 7 * -1

        # Calculate R-squared
        y_pred = slope * x + intercept
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        # Progress
        total_change = weights[0] - weights[-1]
        total_progress = (total_change / weights[0]) * 100 if weights[0] > 0 else 0

        # Consistency
        consistency_score = min(100, workouts * 8 + streak * 5 + len(weights) * 2)

        # SMART GOAL PREDICTION - This is what you want!
        if trend_per_week > 0.1:  # If losing weight
            goal_weight = max(weights[-1] - 5, 50)  # 5kg goal, min 50kg
            weeks_to_goal = (weights[-1] - goal_weight) / trend_per_week
            if weeks_to_goal > 0:
                predicted_date = datetime.now() + timedelta(weeks=weeks_to_goal)
                goal_prediction = f"Predicted: {predicted_date.strftime('%Y-%m-%d')}"
            else:
                goal_prediction = "Goal: Maintain current weight"
        else:
            goal_prediction = "Adjust plan for better progress"

        # Insights
        insights = []
        if trend_per_week > 0.5:
            insights.append("Excellent progress! Maintain your routine.")
        elif trend_per_week > 0.2:
            insights.append("Good progress. Consider increasing intensity.")
        else:
            insights.append("Try adjusting your nutrition or exercise plan.")

        if consistency_score >= 80:
            insights.append("Great consistency! Key to long-term success.")

        return {
            'trend_slope': float(slope),
            'trend_strength': float(r_squared),
            'weekly_progress_rate': float(trend_per_week),
            'predicted_goal_date': goal_prediction,  # This will show real dates!
            'consistency_score': int(consistency_score),
            'performance_insights': ' '.join(insights),
            'total_progress_percentage': float(total_progress),
            'processed_by': 'Advanced Analytics Engine',
            'fallback_used': True
        }

    def find_java_path(self):
        """Find Java installation"""
        import subprocess
        import os
        import glob

        # Check common paths
        possible_paths = [
            "java",
            "java.exe",
            r"C:\Program Files\Java\jdk-*\bin\java.exe",
            r"C:\Program Files\Java\jdk*\bin\java.exe",
        ]

        for path in possible_paths:
            try:
                if "*" in path:
                    matches = glob.glob(path)
                    if matches:
                        java_path = matches[0]
                        if os.path.exists(java_path):
                            return java_path
                else:
                    result = subprocess.run([path, '-version'],
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        return path
            except:
                continue
        return None

    def ensure_java_classes_available(self):
        """Check if Java classes exist"""
        import os
        return os.path.exists('FitnessCalculator.class') and os.path.exists('SimpleJSON.class')

    def get_java_analytics(self, data_manager):
        """Main method to get analytics"""
        weight_history = data_manager.data.get('weight_history', [])
        workouts = len(data_manager.data.get('workout_logs', []))
        streak = 0  # Simple streak

        if len(weight_history) < 2:
            return {'error': 'Insufficient data for analytics'}

        return self.call_java_calculations(weight_history, workouts, streak)