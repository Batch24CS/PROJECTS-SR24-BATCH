# data_manager.py - Central Data Management
import json
import os
from datetime import datetime, timedelta


class DataManager:
    def __init__(self, user_id, user_profile=None):
        self.user_id = user_id
        self.user_profile = user_profile  # Store user profile reference
        self.data_file = f"user_{user_id}_data.json"
        self.load_data()

    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                self.data = json.load(f)
        else:
            # Initialize with starting weight data using user profile
            initial_weight = self.user_profile.initial_weight if self.user_profile else 70
            self.data = {
                'weight_history': [{
                    'date': datetime.now().isoformat(),
                    'weight': initial_weight,
                    'bmi': self.calculate_bmi(initial_weight),
                    'notes': 'Initial weight'
                }],
                'workout_logs': [],
                'daily_steps': [],
                'sleep_records': [],
                'hydration_logs': [],
                'body_measurements': [],
                'achievements': [],
                'goals': []
            }
            self.save_data()

    def save_data(self):
        with open(self.data_file, 'w') as f:
            json.dump(self.data, f, indent=2)

    # Weight Management
    def add_weight_record(self, weight, body_fat=None, notes=""):
        record = {
            'date': datetime.now().isoformat(),
            'weight': weight,
            'body_fat': body_fat,
            'bmi': self.calculate_bmi(weight),
            'notes': notes
        }
        self.data['weight_history'].append(record)
        self.save_data()

    def calculate_bmi(self, weight, height=170):
        height_m = height / 100
        return round(weight / (height_m ** 2), 1)

    # Workout Management
    def log_workout(self, exercise_type, duration, calories, intensity="moderate", notes=""):
        workout = {
            'date': datetime.now().isoformat(),
            'exercise_type': exercise_type,
            'duration_minutes': duration,
            'calories_burned': calories,
            'intensity': intensity,
            'notes': notes
        }
        self.data['workout_logs'].append(workout)
        self.save_data()

    # Steps Tracking
    def log_steps(self, steps, distance_km):
        record = {
            'date': datetime.now().date().isoformat(),
            'steps': steps,
            'distance_km': distance_km,
            'calories': steps * 0.04  # Approximate
        }
        self.data['daily_steps'].append(record)
        self.save_data()

    # Sleep Tracking
    def log_sleep(self, hours, quality=3):
        record = {
            'date': datetime.now().date().isoformat(),
            'hours': hours,
            'quality': quality,  # 1-5 scale
            'timestamp': datetime.now().isoformat()
        }
        self.data['sleep_records'].append(record)
        self.save_data()

    # Hydration Tracking
    def log_hydration(self, amount_ml):
        record = {
            'timestamp': datetime.now().isoformat(),
            'amount_ml': amount_ml
        }
        self.data['hydration_logs'].append(record)
        self.save_data()

    # Analytics Methods
    def get_weekly_stats(self):
        week_ago = datetime.now() - timedelta(days=7)

        recent_workouts = [w for w in self.data['workout_logs']
                           if datetime.fromisoformat(w['date']) >= week_ago]
        recent_steps = [s for s in self.data['daily_steps']
                        if datetime.fromisoformat(s['date']) >= week_ago.date()]

        total_calories = sum(w['calories_burned'] for w in recent_workouts)
        total_steps = sum(s['steps'] for s in recent_steps)
        total_workout_time = sum(w['duration_minutes'] for w in recent_workouts)

        return {
            'total_calories_burned': total_calories,
            'total_steps': total_steps,
            'total_workout_minutes': total_workout_time,
            'workout_count': len(recent_workouts)
        }

    def get_weight_progress(self):
        """Calculate weight progress percentage"""
        weight_history = self.data['weight_history']

        if len(weight_history) < 2:
            return 0

        initial_weight = weight_history[0]['weight']
        current_weight = weight_history[-1]['weight']

        # Calculate percentage change
        if initial_weight > 0:
            progress = ((initial_weight - current_weight) / initial_weight) * 100
            return round(progress, 1)
        return 0