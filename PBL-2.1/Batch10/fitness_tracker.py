# fitness_tracker.py - Core Fitness Tracking Logic
from datetime import datetime, timedelta
import json


class FitnessTracker:
    def __init__(self, user_profile, data_manager):
        self.user_profile = user_profile
        self.data_manager = data_manager
        self.workout_streak = 0
        self.current_streak = 0

    def log_daily_activity(self, activity_type, **kwargs):
        if activity_type == "weight":
            self.data_manager.add_weight_record(
                kwargs['weight'],
                kwargs.get('body_fat'),
                kwargs.get('notes', '')
            )
        elif activity_type == "workout":
            self.data_manager.log_workout(
                kwargs['exercise_type'],
                kwargs['duration'],
                kwargs['calories'],
                kwargs.get('intensity', 'moderate'),
                kwargs.get('notes', '')
            )
            self._update_streak()
        elif activity_type == "steps":
            self.data_manager.log_steps(kwargs['steps'], kwargs['distance_km'])
        elif activity_type == "sleep":
            self.data_manager.log_sleep(kwargs['hours'], kwargs.get('quality', 3))
        elif activity_type == "hydration":
            self.data_manager.log_hydration(kwargs['amount_ml'])

    def _update_streak(self):
        """Update workout streak based on consecutive days with workouts"""
        workouts = self.data_manager.data['workout_logs']
        if not workouts:
            self.current_streak = 0
            return

        # Get all unique workout dates
        workout_dates = sorted(set(
            datetime.fromisoformat(w['date']).date() for w in workouts
        ), reverse=True)  # Sort from newest to oldest

        # Calculate current streak
        current_streak = 0
        current_date = datetime.now().date()

        print(f"DEBUG: Checking streak for {current_date}")
        print(f"DEBUG: Workout dates: {workout_dates}")

        # Check if we have workout today, then yesterday, then day before, etc.
        check_date = current_date
        while check_date in workout_dates:
            current_streak += 1
            check_date = check_date - timedelta(days=1)  # Move to previous day
            print(f"DEBUG: Found workout on {check_date + timedelta(days=1)}, streak: {current_streak}")

        self.current_streak = current_streak
        if current_streak > self.workout_streak:
            self.workout_streak = current_streak

        print(f"DEBUG: Final streak: {self.current_streak} days")

    def get_current_stats(self):
        """Get comprehensive current statistics"""
        weight_history = self.data_manager.data['weight_history']
        current_weight = weight_history[-1]['weight'] if weight_history else self.user_profile.initial_weight
        current_bmi = self.user_profile.calculate_bmi(current_weight)

        weekly_stats = self.data_manager.get_weekly_stats()

        # Force streak update before returning stats
        self._update_streak()

        # Calculate goal progress using USER PROFILE method (IMPORTANT!)
        goal_progress = self.user_profile.get_progress_towards_goal(current_weight)

        # DEBUG: Print all calculated values
        print(f"=== DEBUG get_current_stats ===")
        print(f"Current Weight: {current_weight}")
        print(f"Initial Weight: {self.user_profile.initial_weight}")
        print(f"Target Weight: {self.user_profile.target_weight}")
        print(f"Goal Progress: {goal_progress}")
        print(f"Workout Streak: {self.current_streak}")
        print(f"Total Workouts: {len(self.data_manager.data['workout_logs'])}")
        print(f"=== END DEBUG ===")

        return {
            'current_weight': current_weight,
            'current_bmi': current_bmi,
            'bmi_category': self.user_profile.get_bmi_category(current_bmi),
            'weight_progress': self.data_manager.get_weight_progress(),  # This might be different
            'goal_progress': goal_progress,  # This is the important one!
            'workout_streak': self.current_streak,
            'weekly_calories_burned': weekly_stats['total_calories_burned'],
            'weekly_steps': weekly_stats['total_steps'],
            'weekly_workout_time': weekly_stats['total_workout_minutes'],
            'total_workouts': len(self.data_manager.data['workout_logs'])
        }

    def get_recommended_workout(self):
        """Get personalized workout recommendation"""
        stats = self.get_current_stats()

        if stats['current_bmi'] >= 25:
            return {
                'type': 'cardio',
                'recommendation': '30-45 minutes of cardio',
                'exercises': ['running', 'cycling', 'swimming'],
                'reason': 'Focus on fat burning and cardiovascular health'
            }
        elif stats['current_bmi'] < 18.5:
            return {
                'type': 'strength',
                'recommendation': 'Strength training with proper nutrition',
                'exercises': ['weight_training', 'bodyweight exercises'],
                'reason': 'Focus on muscle building and weight gain'
            }
        else:
            return {
                'type': 'balanced',
                'recommendation': 'Mix of cardio and strength training',
                'exercises': ['running', 'weight_training', 'yoga'],
                'reason': 'Maintain fitness and overall health'
            }

    def calculate_calories_burned(self, exercise_type, duration_minutes, weight=None):
        """Calculate calories burned for various exercises"""
        weight = weight or self.user_profile.initial_weight

        # MET values for different exercises (Metabolic Equivalent of Task)
        met_values = {
            'running': 8.0, 'walking': 3.5, 'cycling': 7.5, 'swimming': 6.0,
            'weight training': 6.0, 'yoga': 3.0, 'hiit': 8.5, 'dancing': 5.0,
            'boxing': 8.5, 'pilates': 3.5, 'elliptical': 5.0, 'rowing': 7.0,
            'jump rope': 8.5, 'resistance bands': 4.5, 'kettlebell': 6.5,
            'basketball': 6.5, 'tennis': 5.0, 'soccer': 7.0
        }

        # Convert exercise type to lowercase for case-insensitive matching
        exercise_key = exercise_type.lower()
        met = met_values.get(exercise_key, 5.0)  # Default to moderate exercise

        # Calories calculation formula: (MET * 3.5 * weight * duration) / 200
        calories = (met * 3.5 * weight * duration_minutes) / 200
        return round(calories)