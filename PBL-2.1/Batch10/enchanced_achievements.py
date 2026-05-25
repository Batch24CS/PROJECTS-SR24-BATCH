# enhanced_achievements.py - Advanced Badge System
import json
from datetime import datetime, timedelta


class EnhancedAchievementSystem:
    def __init__(self, data_manager):
        self.data_manager = data_manager
        self.achievements_db = self._initialize_enhanced_achievements()

    def _initialize_enhanced_achievements(self):
        """Initialize comprehensive achievement system"""
        return {
            'weight_loss': [
                {
                    'id': 'wl_1kg', 'name': 'First Kilo', 'icon': '⚖️',
                    'description': 'Lost your first kilogram',
                    'condition': lambda stats: stats.get('total_kg_lost', 0) >= 1,
                    'rarity': 'common', 'points': 10
                },
                {
                    'id': 'wl_5kg', 'name': 'Weight Warrior', 'icon': '🏆',
                    'description': 'Lost 5 kilograms',
                    'condition': lambda stats: stats.get('total_kg_lost', 0) >= 5,
                    'rarity': 'rare', 'points': 50
                },
                {
                    'id': 'wl_10kg', 'name': 'Transformation', 'icon': '🌟',
                    'description': 'Lost 10 kilograms',
                    'condition': lambda stats: stats.get('total_kg_lost', 0) >= 10,
                    'rarity': 'epic', 'points': 100
                }
            ],
            'workout_milestones': [
                {
                    'id': 'wo_10', 'name': 'Getting Started', 'icon': '💪',
                    'description': 'Completed 10 workouts',
                    'condition': lambda stats: stats.get('total_workouts', 0) >= 10,
                    'rarity': 'common', 'points': 15
                },
                {
                    'id': 'wo_50', 'name': 'Fitness Fanatic', 'icon': '🔥',
                    'description': 'Completed 50 workouts',
                    'condition': lambda stats: stats.get('total_workouts', 0) >= 50,
                    'rarity': 'rare', 'points': 75
                },
                {
                    'id': 'wo_100', 'name': 'Workout Master', 'icon': '👑',
                    'description': 'Completed 100 workouts',
                    'condition': lambda stats: stats.get('total_workouts', 0) >= 100,
                    'rarity': 'epic', 'points': 150
                }
            ],
            'streak_achievements': [
                {
                    'id': 'st_7', 'name': 'Weekly Warrior', 'icon': '📅',
                    'description': '7-day workout streak',
                    'condition': lambda stats: stats.get('current_streak', 0) >= 7,
                    'rarity': 'common', 'points': 20
                },
                {
                    'id': 'st_30', 'name': 'Monthly Marvel', 'icon': '📊',
                    'description': '30-day workout streak',
                    'condition': lambda stats: stats.get('current_streak', 0) >= 30,
                    'rarity': 'rare', 'points': 100
                },
                {
                    'id': 'st_100', 'name': 'Century Streak', 'icon': '🎯',
                    'description': '100-day workout streak',
                    'condition': lambda stats: stats.get('current_streak', 0) >= 100,
                    'rarity': 'legendary', 'points': 300
                }
            ],
            'consistency': [
                {
                    'id': 'co_4week', 'name': 'Consistent Performer', 'icon': '🔄',
                    'description': '4 weeks of consistent workouts',
                    'condition': lambda stats: stats.get('consistent_weeks', 0) >= 4,
                    'rarity': 'common', 'points': 40
                },
                {
                    'id': 'co_12week', 'name': 'Dedicated Athlete', 'icon': '🏅',
                    'description': '12 weeks of consistent workouts',
                    'condition': lambda stats: stats.get('consistent_weeks', 0) >= 12,
                    'rarity': 'epic', 'points': 120
                }
            ],
            'fitness_goals': [
                {
                    'id': 'fg_bmi_normal', 'name': 'Healthy BMI', 'icon': '❤️',
                    'description': 'Achieved normal BMI range',
                    'condition': lambda stats: stats.get('bmi_category') == 'Normal weight',
                    'rarity': 'rare', 'points': 80
                },
                {
                    'id': 'fg_goal_reached', 'name': 'Goal Achiever', 'icon': '🎉',
                    'description': 'Reached your target weight',
                    'condition': lambda stats: stats.get('goal_progress', 0) >= 95,
                    'rarity': 'epic', 'points': 200
                }
            ]
        }

    def check_and_award_achievements(self, user_stats):
        """Check and award new achievements with celebration"""
        current_achievements = self.data_manager.data.get('achievements', [])
        awarded_ids = [ach['id'] for ach in current_achievements]
        new_achievements = []

        for category, achievements in self.achievements_db.items():
            for achievement in achievements:
                if achievement['id'] not in awarded_ids:
                    if achievement['condition'](user_stats):
                        new_achievement = {
                            'id': achievement['id'],
                            'name': achievement['name'],
                            'description': achievement['description'],
                            'icon': achievement['icon'],
                            'category': category,
                            'rarity': achievement['rarity'],
                            'points': achievement['points'],
                            'awarded_date': datetime.now().isoformat(),
                            'unlocked': True
                        }
                        current_achievements.append(new_achievement)
                        new_achievements.append(new_achievement)

        if new_achievements:
            self.data_manager.data['achievements'] = current_achievements
            self.data_manager.save_data()

        return new_achievements

    def get_achievement_summary(self):
        """Get comprehensive achievement summary"""
        total_achievements = sum(len(achs) for achs in self.achievements_db.values())
        user_achievements = self.data_manager.data.get('achievements', [])
        unlocked_achievements = [ach for ach in user_achievements if ach.get('unlocked', False)]

        total_points = sum(ach.get('points', 0) for ach in unlocked_achievements)

        # Count by rarity
        rarity_count = {
            'common': len([a for a in unlocked_achievements if a.get('rarity') == 'common']),
            'rare': len([a for a in unlocked_achievements if a.get('rarity') == 'rare']),
            'epic': len([a for a in unlocked_achievements if a.get('rarity') == 'epic']),
            'legendary': len([a for a in unlocked_achievements if a.get('rarity') == 'legendary'])
        }

        return {
            'total_achievements': total_achievements,
            'unlocked_achievements': len(unlocked_achievements),
            'completion_percentage': round((len(unlocked_achievements) / total_achievements) * 100),
            'total_points': total_points,
            'level': self._calculate_level(total_points),
            'rarity_breakdown': rarity_count,
            'recent_achievements': unlocked_achievements[-5:] if unlocked_achievements else []
        }

    def _calculate_level(self, points):
        """Calculate user level based on total points"""
        levels = [
            (0, "Beginner"), (100, "Active"), (300, "Enthusiast"),
            (600, "Athlete"), (1000, "Pro"), (1500, "Elite"),
            (2000, "Master"), (3000, "Legend"), (5000, "Mythic")
        ]

        for threshold, level in reversed(levels):
            if points >= threshold:
                return f"Level {level}"
        return "Level Beginner"

    def get_user_stats(self):
        """Calculate comprehensive user stats for achievement checking"""
        weight_history = self.data_manager.data.get('weight_history', [])
        workouts = self.data_manager.data.get('workout_logs', [])

        # Calculate weight loss
        total_kg_lost = 0
        if len(weight_history) >= 2:
            total_kg_lost = max(0, weight_history[0]['weight'] - weight_history[-1]['weight'])

        # Calculate current streak
        current_streak = self._calculate_current_streak(workouts)

        # Calculate consistent weeks
        consistent_weeks = self._calculate_consistent_weeks(workouts)

        # Get current stats
        current_weight = weight_history[-1]['weight'] if weight_history else 0
        current_bmi = self._calculate_bmi(current_weight)

        return {
            'total_workouts': len(workouts),
            'total_kg_lost': total_kg_lost,
            'current_streak': current_streak,
            'consistent_weeks': consistent_weeks,
            'bmi_category': self._get_bmi_category(current_bmi),
            'goal_progress': min(100, max(0, (total_kg_lost / 10) * 100)) if total_kg_lost > 0 else 0
        }

    def _calculate_current_streak(self, workouts):
        """Calculate current workout streak"""
        if not workouts:
            return 0

        workout_dates = sorted(set(
            datetime.fromisoformat(w['date']).date() for w in workouts
        ), reverse=True)

        current_streak = 0
        current_date = datetime.now().date()

        for i in range(len(workout_dates)):
            if workout_dates[i] == current_date - timedelta(days=i):
                current_streak += 1
            else:
                break

        return current_streak

    def _calculate_consistent_weeks(self, workouts):
        """Calculate number of consistent weeks with 3+ workouts"""
        if not workouts:
            return 0

        # Group workouts by week
        weekly_count = {}
        for workout in workouts:
            workout_date = datetime.fromisoformat(workout['date']).date()
            week_start = workout_date - timedelta(days=workout_date.weekday())
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