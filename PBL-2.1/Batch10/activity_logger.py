# activity_logger.py - Activity and Workout Management
from datetime import datetime, timedelta


class ActivityLogger:
    def __init__(self, data_manager, fitness_tracker):
        self.data_manager = data_manager
        self.fitness_tracker = fitness_tracker
        self.exercise_library = self._initialize_exercise_library()

    def _initialize_exercise_library(self):
        """Initialize a comprehensive exercise database"""
        return {
            'cardio': [
                {'name': 'Running', 'met': 8.0, 'description': 'Outdoor or treadmill running'},
                {'name': 'Cycling', 'met': 7.5, 'description': 'Stationary or outdoor cycling'},
                {'name': 'Swimming', 'met': 6.0, 'description': 'Lap swimming or water aerobics'},
                {'name': 'Jump Rope', 'met': 8.5, 'description': 'Skipping rope exercises'},
                {'name': 'Elliptical', 'met': 5.0, 'description': 'Elliptical machine workout'}
            ],
            'strength': [
                {'name': 'Weight Training', 'met': 6.0, 'description': 'Free weights or machines'},
                {'name': 'Bodyweight Exercises', 'met': 5.0, 'description': 'Push-ups, squats, pull-ups'},
                {'name': 'Resistance Bands', 'met': 4.5, 'description': 'Band-based strength training'},
                {'name': 'Kettlebell', 'met': 6.5, 'description': 'Kettlebell swings and exercises'}
            ],
            'flexibility': [
                {'name': 'Yoga', 'met': 3.0, 'description': 'Various yoga styles and poses'},
                {'name': 'Pilates', 'met': 3.5, 'description': 'Core strengthening and flexibility'},
                {'name': 'Stretching', 'met': 2.5, 'description': 'General stretching routine'}
            ],
            'sports': [
                {'name': 'Basketball', 'met': 6.5, 'description': 'Basketball game or practice'},
                {'name': 'Tennis', 'met': 5.0, 'description': 'Tennis singles or doubles'},
                {'name': 'Soccer', 'met': 7.0, 'description': 'Soccer game or practice'},
                {'name': 'Dancing', 'met': 5.0, 'description': 'Various dance styles'}
            ]
        }

    def log_comprehensive_workout(self, category, exercise_name, duration, intensity="moderate", notes=""):
        """Log workout with automatic calorie calculation"""
        # Find exercise in library
        exercise = None
        for cat_exercises in self.exercise_library.values():
            for ex in cat_exercises:
                if ex['name'].lower() == exercise_name.lower():
                    exercise = ex
                    break
            if exercise:
                break

        if not exercise:
            # Default to moderate exercise
            met_value = 5.0
        else:
            met_value = exercise['met']

        # Adjust MET based on intensity
        intensity_multipliers = {
            'light': 0.7,
            'moderate': 1.0,
            'vigorous': 1.3,
            'very_vigorous': 1.6
        }

        met_value *= intensity_multipliers.get(intensity.lower(), 1.0)

        # Calculate calories
        current_weight = self.fitness_tracker.get_current_stats()['current_weight']
        calories_burned = self.fitness_tracker.calculate_calories_burned(
            exercise_name, duration, current_weight
        )

        # Log the workout
        self.fitness_tracker.log_daily_activity(
            "workout",
            exercise_type=exercise_name,
            duration=duration,
            calories=calories_burned,
            intensity=intensity,
            notes=notes
        )

        return {
            'exercise': exercise_name,
            'duration': duration,
            'calories_burned': calories_burned,
            'intensity': intensity,
            'met_value': round(met_value, 1)
        }

    def get_activity_summary(self, period='week'):
        """Get activity summary for specified period"""
        if period == 'week':
            days = 7
        elif period == 'month':
            days = 30
        else:
            days = 7

        cutoff_date = datetime.now() - timedelta(days=days)

        recent_workouts = [
            w for w in self.data_manager.data['workout_logs']
            if datetime.fromisoformat(w['date']) >= cutoff_date
        ]

        recent_steps = [
            s for s in self.data_manager.data['daily_steps']
            if datetime.fromisoformat(s['date']) >= cutoff_date.date()
        ]

        # Calculate totals
        total_calories = sum(w['calories_burned'] for w in recent_workouts)
        total_duration = sum(w['duration_minutes'] for w in recent_workouts)
        total_steps = sum(s['steps'] for s in recent_steps)

        # Most popular exercises
        exercise_count = {}
        for workout in recent_workouts:
            ex_type = workout['exercise_type']
            exercise_count[ex_type] = exercise_count.get(ex_type, 0) + 1

        popular_exercises = sorted(exercise_count.items(), key=lambda x: x[1], reverse=True)[:3]

        return {
            'period': period,
            'total_workouts': len(recent_workouts),
            'total_calories_burned': total_calories,
            'total_workout_minutes': total_duration,
            'total_steps': total_steps,
            'average_daily_steps': total_steps // days if days > 0 else 0,
            'popular_exercises': popular_exercises,
            'workout_frequency': f"{len(recent_workouts)}/{days} days"
        }

    def suggest_workout_plan(self, goal, available_time):
        """Suggest workout plan based on goal and time available"""
        plans = {
            'weight_loss': {
                'short': ('HIIT', 'High-intensity interval training for maximum calorie burn'),
                'medium': ('Cardio + Strength', '30 min cardio + 20 min strength training'),
                'long': ('Full Body Circuit', '45-60 min full body workout with cardio')
            },
            'muscle_gain': {
                'short': ('Strength Focus', 'Heavy compound exercises with limited rest'),
                'medium': ('Hypertrophy', 'Moderate weight with higher reps for muscle growth'),
                'long': ('Bodybuilding Split', 'Targeted muscle group training')
            },
            'general_fitness': {
                'short': ('Full Body', 'Quick full body workout hitting all major groups'),
                'medium': ('Balanced Routine', 'Mix of strength, cardio, and flexibility'),
                'long': ('Comprehensive Workout', 'Complete fitness routine with warmup and cooldown')
            }
        }

        time_category = 'short' if available_time < 30 else 'medium' if available_time < 60 else 'long'

        if goal in plans and time_category in plans[goal]:
            workout_type, description = plans[goal][time_category]
            return {
                'goal': goal,
                'available_time': available_time,
                'recommended_workout': workout_type,
                'description': description,
                'suggested_exercises': self._get_suggested_exercises(goal, time_category)
            }

        return None

    def _get_suggested_exercises(self, goal, time_category):
        """Get suggested exercises based on goal and time"""
        suggestions = {
            'weight_loss': {
                'short': ['Jump Rope', 'Bodyweight Circuit', 'HIIT'],
                'medium': ['Running', 'Cycling', 'Weight Training'],
                'long': ['Running', 'Swimming', 'Full Body Workout']
            },
            'muscle_gain': {
                'short': ['Weight Training', 'Kettlebell', 'Bodyweight Exercises'],
                'medium': ['Weight Training', 'Resistance Bands', 'Compound Exercises'],
                'long': ['Weight Training', 'Bodybuilding Split', 'Strength Focus']
            },
            'general_fitness': {
                'short': ['Yoga', 'Bodyweight Exercises', 'Stretching'],
                'medium': ['Cycling', 'Weight Training', 'Pilates'],
                'long': ['Running', 'Weight Training', 'Yoga', 'Swimming']
            }
        }

        return suggestions.get(goal, {}).get(time_category, ['Walking', 'Stretching'])