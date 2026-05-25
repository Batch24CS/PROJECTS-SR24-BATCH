# user_profile.py - User Profile Management
from datetime import datetime


class UserProfile:
    def __init__(self, user_data):
        # FIX: Get user_id from the correct location
        self.user_id = user_data.get('user_id', 'unknown')
        self.username = user_data.get('username', 'unknown')
        self.name = user_data.get('name', 'Unknown User')
        self.age = user_data.get('age', 25)
        self.gender = user_data.get('gender', 'Not specified')
        self.height = user_data.get('height', 170)  # cm
        self.initial_weight = user_data.get('weight', 70)
        self.fitness_goal = user_data.get('fitness_goal', 'General Fitness')
        self.target_weight = user_data.get('target_weight', self.initial_weight - 5)
        self.created_at = datetime.now()

    def calculate_bmi(self, current_weight=None):
        weight = current_weight or self.initial_weight
        height_m = self.height / 100
        return round(weight / (height_m ** 2), 1)

    def get_bmi_category(self, bmi):
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"

    def calculate_calorie_needs(self, activity_level="moderate"):
        # Basal Metabolic Rate calculation
        if self.gender.lower() == "male":
            bmr = 10 * self.initial_weight + 6.25 * self.height - 5 * self.age + 5
        else:
            bmr = 10 * self.initial_weight + 6.25 * self.height - 5 * self.age - 161

        # Activity multipliers
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9
        }

        return round(bmr * activity_multipliers.get(activity_level, 1.55))

    def get_progress_towards_goal(self, current_weight):
        try:
            if self.fitness_goal.lower() == "weight loss":
                total_to_lose = self.initial_weight - self.target_weight
                current_loss = self.initial_weight - current_weight
                if total_to_lose <= 0:
                    return 0
                progress = (current_loss / total_to_lose) * 100
                return min(100, max(0, progress))
            elif self.fitness_goal.lower() == "muscle gain":
                total_to_gain = self.target_weight - self.initial_weight
                current_gain = current_weight - self.initial_weight
                if total_to_gain <= 0:
                    return 0
                progress = (current_gain / total_to_gain) * 100
                return min(100, max(0, progress))
            else:  # General Fitness
                # For general fitness, show progress based on workouts or other metrics
                return 50  # Default progress for general fitness
        except (ZeroDivisionError, TypeError):
            return 0