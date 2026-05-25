# health_metrics.py - Comprehensive Health Tracking
from datetime import datetime, timedelta


class HealthMetrics:
    def __init__(self, data_manager):
        self.data_manager = data_manager

    def log_body_measurements(self, chest, waist, hips, arms, neck=None):
        """Log comprehensive body measurements"""
        measurement = {
            'timestamp': datetime.now().isoformat(),
            'chest_cm': chest,
            'waist_cm': waist,
            'hips_cm': hips,
            'arms_cm': arms,
            'neck_cm': neck
        }
        self.data_manager.data['body_measurements'].append(measurement)
        self.data_manager.save_data()

    def get_sleep_analysis(self, days=7):
        """Analyze sleep patterns over specified days"""
        recent_sleep = self.data_manager.data['sleep_records'][-days:]

        if not recent_sleep:
            return {
                'average_hours': 0,
                'average_quality': 0,
                'consistency_score': 0,
                'recommendation': 'No sleep data available'
            }

        total_hours = sum(record['hours'] for record in recent_sleep)
        total_quality = sum(record['quality'] for record in recent_sleep)

        avg_hours = total_hours / len(recent_sleep)
        avg_quality = total_quality / len(recent_sleep)

        # Calculate consistency (standard deviation of sleep hours)
        sleep_hours = [record['hours'] for record in recent_sleep]
        mean_hours = sum(sleep_hours) / len(sleep_hours)
        variance = sum((h - mean_hours) ** 2 for h in sleep_hours) / len(sleep_hours)
        consistency = max(0, 100 - (variance * 20))  # Convert to percentage

        # Generate recommendation
        if avg_hours < 6:
            recommendation = "Consider increasing sleep duration for better recovery"
        elif avg_hours > 9:
            recommendation = "You're getting plenty of sleep! Maintain this pattern"
        else:
            recommendation = "Good sleep duration. Focus on quality and consistency"

        return {
            'average_hours': round(avg_hours, 1),
            'average_quality': round(avg_quality, 1),
            'consistency_score': round(consistency),
            'recommendation': recommendation
        }

    def get_hydration_summary(self, days=7):
        """Get hydration analysis"""
        recent_hydration = self.data_manager.data['hydration_logs'][-days * 5:]  # Assume 5 logs per day

        if not recent_hydration:
            return {
                'daily_average': 0,
                'total_week': 0,
                'goal_percentage': 0,
                'recommendation': 'Start logging your water intake'
            }

        # Group by date
        daily_totals = {}
        for record in recent_hydration:
            date = datetime.fromisoformat(record['timestamp']).date()
            daily_totals[date] = daily_totals.get(date, 0) + record['amount_ml']

        avg_daily = sum(daily_totals.values()) / len(daily_totals)
        goal_percentage = min(100, (avg_daily / 2000) * 100)  # 2L daily goal

        if goal_percentage < 60:
            recommendation = "Increase water intake for better hydration"
        elif goal_percentage < 85:
            recommendation = "Good hydration, aim for consistent daily intake"
        else:
            recommendation = "Excellent hydration! Maintain this level"

        return {
            'daily_average': round(avg_daily),
            'total_week': sum(daily_totals.values()),
            'goal_percentage': round(goal_percentage),
            'recommendation': recommendation
        }

    def calculate_health_score(self):
        """Calculate overall health score based on multiple metrics"""
        sleep_analysis = self.get_sleep_analysis()
        hydration_summary = self.get_hydration_summary()

        # Sleep score (0-30 points)
        sleep_score = min(30, sleep_analysis['average_hours'] * 3)

        # Hydration score (0-25 points)
        hydration_score = hydration_summary['goal_percentage'] * 0.25

        # Activity score (0-45 points) - simplified version
        activity_score = 25  # Default score

        total_score = sleep_score + hydration_score + activity_score

        return {
            'total_score': round(total_score),
            'sleep_score': round(sleep_score),
            'hydration_score': round(hydration_score),
            'activity_score': round(activity_score),
            'grade': self._get_health_grade(total_score)
        }

    def _get_health_grade(self, score):
        """Convert score to letter grade"""
        if score >= 90:
            return "A+"
        elif score >= 80:
            return "A"
        elif score >= 70:
            return "B"
        elif score >= 60:
            return "C"
        elif score >= 50:
            return "D"
        else:
            return "F"