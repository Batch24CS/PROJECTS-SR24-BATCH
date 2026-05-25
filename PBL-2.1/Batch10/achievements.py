# achievements.py - Achievement & Badge System
from datetime import datetime, timedelta


class AchievementSystem:
    def __init__(self, data_manager):
        self.data_manager = data_manager
        self.achievements_db = self._initialize_achievements()

    def _initialize_achievements(self):
        """Initialize all possible achievements"""
        return {
            'weight_loss': [
                {
                    'id': 'wl_1kg',
                    'name': 'First Kilo',
                    'description': 'Lost your first kilogram',
                    'icon': '⚖️',
                    'condition': lambda stats: stats.get('total_kg_lost', 0) >= 1
                },
                {
                    'id': 'wl_5kg',
                    'name': 'Weight Warrior',
                    'description': 'Lost 5 kilograms',
                    'icon': '🏆',
                    'condition': lambda stats: stats.get('total_kg_lost', 0) >= 5
                },
                {
                    'id': 'wl_10kg',
                    'name': 'Transformation',
                    'description': 'Lost 10 kilograms',
                    'icon': '🌟',
                    'condition': lambda stats: stats.get('total_kg_lost', 0) >= 10
                }
            ],
            'workout': [
                {
                    'id': 'wo_10',
                    'name': 'Getting Started',
                    'description': 'Completed 10 workouts',
                    'icon': '💪',
                    'condition': lambda stats: stats.get('total_workouts', 0) >= 10
                },
                {
                    'id': 'wo_50',
                    'name': 'Fitness Fanatic',
                    'description': 'Completed 50 workouts',
                    'icon': '🔥',
                    'condition': lambda stats: stats.get('total_workouts', 0) >= 50
                },
                {
                    'id': 'wo_100',
                    'name': 'Workout Master',
                    'description': 'Completed 100 workouts',
                    'icon': '👑',
                    'condition': lambda stats: stats.get('total_workouts', 0) >= 100
                }
            ],
            'streak': [
                {
                    'id': 'st_7',
                    'name': 'Weekly Warrior',
                    'description': '7-day workout streak',
                    'icon': '📅',
                    'condition': lambda stats: stats.get('current_streak', 0) >= 7
                },
                {
                    'id': 'st_30',
                    'name': 'Monthly Marvel',
                    'description': '30-day workout streak',
                    'icon': '📊',
                    'condition': lambda stats: stats.get('current_streak', 0) >= 30
                },
                {
                    'id': 'st_100',
                    'name': 'Century Streak',
                    'description': '100-day workout streak',
                    'icon': '🎯',
                    'condition': lambda stats: stats.get('current_streak', 0) >= 100
                }
            ],
            'consistency': [
                {
                    'id': 'co_4week',
                    'name': 'Consistent Performer',
                    'description': '4 weeks of consistent workouts',
                    'icon': '🔄',
                    'condition': lambda stats: stats.get('consistent_weeks', 0) >= 4
                },
                {
                    'id': 'co_12week',
                    'name': 'Dedicated Athlete',
                    'description': '12 weeks of consistent workouts',
                    'icon': '🏅',
                    'condition': lambda stats: stats.get('consistent_weeks', 0) >= 12
                }
            ],
            'milestone': [
                {
                    'id': 'mi_bmi_normal',
                    'name': 'Healthy BMI',
                    'description': 'Achieved normal BMI range',
                    'icon': '❤️',
                    'condition': lambda stats: stats.get('bmi_category') == 'Normal weight'
                },
                {
                    'id': 'mi_goal_reached',
                    'name': 'Goal Achiever',
                    'description': 'Reached your target weight',
                    'icon': '🎉',
                    'condition': lambda stats: stats.get('goal_progress', 0) >= 95
                }
            ]
        }

    def check_achievements(self, user_stats):
        """Check and award new achievements"""
        current_achievements = self.data_manager.data['achievements']
        awarded_achievements = [ach['id'] for ach in current_achievements]
        new_achievements = []

        for category, achievements in self.achievements_db.items():
            for achievement in achievements:
                if achievement['id'] not in awarded_achievements:
                    if achievement['condition'](user_stats):
                        new_achievement = {
                            'id': achievement['id'],
                            'name': achievement['name'],
                            'description': achievement['description'],
                            'icon': achievement['icon'],
                            'category': category,
                            'awarded_date': datetime.now().isoformat(),
                            'points': self._calculate_points(achievement['id'])
                        }
                        current_achievements.append(new_achievement)
                        new_achievements.append(new_achievement)

        if new_achievements:
            self.data_manager.save_data()

        return new_achievements

    def _calculate_points(self, achievement_id):
        """Calculate points for each achievement"""
        point_values = {
            'wl_1kg': 10, 'wl_5kg': 50, 'wl_10kg': 100,
            'wo_10': 15, 'wo_50': 75, 'wo_100': 150,
            'st_7': 20, 'st_30': 100, 'st_100': 300,
            'co_4week': 40, 'co_12week': 120,
            'mi_bmi_normal': 80, 'mi_goal_reached': 200
        }
        return point_values.get(achievement_id, 10)

    def get_user_stats(self):
        """Calculate comprehensive user stats for achievement checking"""
        weight_history = self.data_manager.data['weight_history']
        workouts = self.data_manager.data['workout_logs']

        # Calculate weight loss
        total_kg_lost = 0
        if len(weight_history) >= 2:
            total_kg_lost = weight_history[0]['weight'] - weight_history[-1]['weight']

        # Calculate current streak
        current_streak = 0
        if workouts:
            workout_dates = sorted(set(
                datetime.fromisoformat(w['date']).date() for w in workouts
            ), reverse=True)

            current_date = datetime.now().date()
            for i, workout_date in enumerate(workout_dates):
                if workout_date == current_date - timedelta(days=i):
                    current_streak += 1
                else:
                    break

        # Calculate consistent weeks
        consistent_weeks = self._calculate_consistent_weeks(workouts)

        # Get current stats
        current_weight = weight_history[-1]['weight'] if weight_history else 0
        current_bmi = self._calculate_bmi(current_weight)

        return {
            'total_workouts': len(workouts),
            'total_kg_lost': max(0, total_kg_lost),
            'current_streak': current_streak,
            'consistent_weeks': consistent_weeks,
            'bmi_category': self._get_bmi_category(current_bmi),
            'goal_progress': min(100, max(0, (total_kg_lost / 10) * 100))  # Assuming 10kg goal
        }

    def _calculate_bmi(self, weight, height=170):
        height_m = height / 100
        return weight / (height_m ** 2)

    def _get_bmi_category(self, bmi):
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25:
            return "Normal weight"
        elif bmi < 30:
            return "Overweight"
        else:
            return "Obese"

    def _calculate_consistent_weeks(self, workouts):
        """Calculate number of consistent weeks with 3+ workouts"""
        if not workouts:
            return 0

        # Group workouts by week
        weekly_count = {}
        for workout in workouts:
            week_start = datetime.fromisoformat(workout['date']).date() - timedelta(
                days=datetime.fromisoformat(workout['date']).weekday()
            )
            weekly_count[week_start] = weekly_count.get(week_start, 0) + 1

        # Count consecutive weeks with 3+ workouts
        consistent_weeks = 0
        sorted_weeks = sorted(weekly_count.keys(), reverse=True)

        for week in sorted_weeks:
            if weekly_count[week] >= 3:
                consistent_weeks += 1
            else:
                break

        return consistent_weeks

    def get_achievement_summary(self):
        """Get summary of all achievements"""
        total_achievements = sum(len(achs) for achs in self.achievements_db.values())
        user_achievements = self.data_manager.data['achievements']
        total_points = sum(ach.get('points', 0) for ach in user_achievements)

        return {
            'total_achievements': total_achievements,
            'earned_achievements': len(user_achievements),
            'completion_percentage': round((len(user_achievements) / total_achievements) * 100),
            'total_points': total_points,
            'level': self._calculate_level(total_points),
            'recent_achievements': user_achievements[-5:] if user_achievements else []
        }

    def _calculate_level(self, points):
        """Calculate user level based on total points"""
        levels = [
            (0, "Beginner"), (100, "Active"), (300, "Enthusiast"),
            (600, "Athlete"), (1000, "Pro"), (1500, "Elite"),
            (2000, "Master"), (3000, "Legend")
        ]

        for threshold, level in reversed(levels):
            if points >= threshold:
                return level
        return "Beginner"