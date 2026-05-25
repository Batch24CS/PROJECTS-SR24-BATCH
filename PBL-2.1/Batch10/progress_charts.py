# progress_charts.py - Fixed Version
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import ttk


class ProgressCharts:
    def __init__(self, data_manager):
        self.data_manager = data_manager
        self.style = 'seaborn-v0_8'

    def create_weight_progress_chart(self, parent_frame):
        """Create clean weight progress chart"""
        weight_data = self.data_manager.data.get('weight_history', [])

        if len(weight_data) < 2:
            return self._create_no_data_chart(parent_frame, "Weight data needed for progress chart")

        # Prepare data
        dates = [datetime.fromisoformat(r['date']) for r in weight_data]
        weights = [r['weight'] for r in weight_data]
        bmis = [r.get('bmi', 0) for r in weight_data]

        # Create figure with better layout
        fig = Figure(figsize=(12, 8), dpi=100)
        fig.patch.set_facecolor('#ffffff')

        # Create subplots with better spacing
        gs = fig.add_gridspec(2, 2, height_ratios=[2, 1], width_ratios=[2, 1])
        ax1 = fig.add_subplot(gs[0, :])  # Main weight progress
        ax2 = fig.add_subplot(gs[1, 0])  # BMI progress
        ax3 = fig.add_subplot(gs[1, 1])  # Stats

        # Apply clean style
        plt.style.use(self.style)

        # Chart 1: Weight Progress (Main Chart)
        ax1.plot(dates, weights, 'o-', linewidth=2.5, markersize=8,
                 color='#2E86AB', label='Weight', alpha=0.8)
        ax1.set_title('Weight Progress Over Time', fontsize=16, fontweight='bold', pad=20)
        ax1.set_ylabel('Weight (kg)', fontsize=12, fontweight='bold')
        ax1.grid(True, alpha=0.3, linestyle='--')
        ax1.legend(loc='upper right', framealpha=0.9)

        # Add trend line if enough data
        if len(weights) > 2:
            x_numeric = np.arange(len(weights))
            z = np.polyfit(x_numeric, weights, 1)
            p = np.poly1d(z)
            ax1.plot(dates, p(x_numeric), 'r--', alpha=0.7, linewidth=2, label='Trend Line')
            ax1.legend(loc='upper right', framealpha=0.9)

        # Clean x-axis formatting
        ax1.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
        if len(dates) <= 7:
            ax1.xaxis.set_major_locator(mdates.DayLocator(interval=1))
        else:
            ax1.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))

        plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha='right')

        # Chart 2: BMI Progress
        if any(bmis) and max(bmis) > 0:
            ax2.plot(dates, bmis, 's-', linewidth=2, markersize=5,
                     color='#A23B72', label='BMI', alpha=0.8)
            ax2.set_title('BMI Progress', fontsize=14, fontweight='bold', pad=15)
            ax2.set_ylabel('BMI', fontsize=11, fontweight='bold')
            ax2.set_xlabel('Date', fontsize=10)
            ax2.grid(True, alpha=0.3, linestyle='--')
            ax2.legend(loc='upper right')

            # Add BMI category backgrounds
            ax2.axhspan(0, 18.5, alpha=0.1, color='#3498db')
            ax2.axhspan(18.5, 25, alpha=0.1, color='#2ecc71')
            ax2.axhspan(25, 30, alpha=0.1, color='#f39c12')
            ax2.axhspan(30, 40, alpha=0.1, color='#e74c3c')

            # Consistent x-axis formatting
            ax2.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
            if len(dates) <= 7:
                ax2.xaxis.set_major_locator(mdates.DayLocator(interval=1))
            else:
                ax2.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))

            plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right')
        else:
            ax2.text(0.5, 0.5, 'No BMI Data Available',
                     transform=ax2.transAxes, ha='center', va='center',
                     fontsize=12, style='italic', color='gray')
            ax2.axis('off')

        # Chart 3: Statistics - FIXED TEXT ALIGNMENT
        stats_text = self._generate_clean_stats_text(weight_data, weights)

        # Add title separately
        ax3.text(0.05, 0.95, 'Progress Statistics', transform=ax3.transAxes,
                 fontsize=14, fontweight='bold', va='top', ha='left')  # FIXED: ha='left'

        # Add statistics text with proper alignment
        ax3.text(0.05, 0.80, stats_text, transform=ax3.transAxes, fontsize=10,
                 verticalalignment='top', ha='left', linespacing=1.4)  # FIXED: ha='left'

        ax3.axis('off')

        # Professional spacing
        plt.tight_layout(pad=3.0, h_pad=3.0, w_pad=3.0)

        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, parent_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)

        return canvas

    def _generate_clean_stats_text(self, weight_data, weights):
        """Generate clean statistics text"""
        if len(weights) < 2:
            return "Need more data for statistics"

        total_change = weights[-1] - weights[0]
        avg_weight = np.mean(weights)
        weight_std = np.std(weights)

        # Calculate weekly rate
        if len(weight_data) >= 2:
            first_date = datetime.fromisoformat(weight_data[0]['date'])
            last_date = datetime.fromisoformat(weight_data[-1]['date'])
            days_diff = (last_date - first_date).days
            weekly_rate = (total_change / days_diff * 7) if days_diff > 0 else 0
        else:
            weekly_rate = 0

        # Format change with sign
        change_sign = "+" if total_change >= 0 else ""
        rate_sign = "+" if weekly_rate >= 0 else ""

        stats_text = f"""Starting Weight: {weights[0]:.1f} kg
Current Weight:  {weights[-1]:.1f} kg
Total Change:    {change_sign}{total_change:+.1f} kg

Average Weight:  {avg_weight:.1f} kg
Weight Stability: {weight_std:.2f} kg

Weekly Rate:     {rate_sign}{weekly_rate:+.2f} kg/wk
Days Tracked:    {len(weights)}"""

        return stats_text

    def create_workout_analytics_chart(self, parent_frame):
        """Create workout analytics chart with clean layout"""
        workouts = self.data_manager.data.get('workout_logs', [])

        if len(workouts) < 2:
            return self._create_no_data_chart(parent_frame, "Workout data needed for analytics")

        # Prepare data
        exercise_types = {}
        daily_calories = {}
        weekly_volume = {}

        for workout in workouts:
            ex_type = workout['exercise_type']
            exercise_types[ex_type] = exercise_types.get(ex_type, 0) + 1

            date = datetime.fromisoformat(workout['date']).date()
            daily_calories[date] = daily_calories.get(date, 0) + workout['calories_burned']

            week_start = date - timedelta(days=date.weekday())
            weekly_volume[week_start] = weekly_volume.get(week_start, 0) + workout['duration_minutes']

        # Create figure
        fig = Figure(figsize=(12, 8), dpi=100)
        fig.patch.set_facecolor('#ffffff')

        # Create subplots with clean layout
        gs = fig.add_gridspec(2, 2, height_ratios=[1, 1])
        ax1 = fig.add_subplot(gs[0, 0])  # Exercise distribution
        ax2 = fig.add_subplot(gs[0, 1])  # Weekly volume
        ax3 = fig.add_subplot(gs[1, :])  # Calorie trends

        plt.style.use(self.style)

        # Chart 1: Exercise Distribution
        if exercise_types:
            exercises = list(exercise_types.keys())
            counts = list(exercise_types.values())

            colors = plt.cm.Set3(np.linspace(0, 1, len(exercises)))
            ax1.pie(counts, labels=exercises, autopct='%1.1f%%', colors=colors,
                    startangle=90, textprops={'fontsize': 9})
            ax1.set_title('Exercise Distribution', fontsize=14, fontweight='bold', pad=20)

        # Chart 2: Weekly Volume
        if weekly_volume:
            weeks = sorted(weekly_volume.keys())[-8:]
            volumes = [weekly_volume[week] for week in weeks]
            week_labels = [f'W{week.isocalendar()[1]}' for week in weeks]

            bars = ax2.bar(week_labels, volumes, color='#3498db', alpha=0.7, edgecolor='#2980b9')
            ax2.set_title('Weekly Workout Volume', fontsize=14, fontweight='bold', pad=20)
            ax2.set_ylabel('Minutes', fontweight='bold')

            # Add value labels
            for bar in bars:
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width() / 2., height + 5,
                         f'{int(height)}', ha='center', va='bottom', fontsize=9)

        # Chart 3: Calorie Trends
        if daily_calories:
            dates = sorted(daily_calories.keys())[-30:]
            calories = [daily_calories[date] for date in dates]
            date_labels = [date.strftime('%m/%d') for date in dates]

            ax3.plot(date_labels, calories, 'o-', linewidth=2.5, markersize=6,
                     color='#e67e22', alpha=0.8)
            ax3.set_title('Daily Calories Burned (Last 30 Days)', fontsize=14, fontweight='bold', pad=20)
            ax3.set_ylabel('Calories', fontweight='bold')
            ax3.grid(True, alpha=0.3, linestyle='--')
            plt.setp(ax3.xaxis.get_majorticklabels(), rotation=45, ha='right')
            ax3.fill_between(date_labels, calories, alpha=0.2, color='#e67e22')

        plt.tight_layout(pad=3.0, h_pad=3.0, w_pad=3.0)

        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, parent_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)

        return canvas

    def _create_no_data_chart(self, parent_frame, message):
        """Create a clean placeholder chart"""
        fig = Figure(figsize=(8, 6), dpi=100)
        ax = fig.add_subplot(111)

        ax.text(0.5, 0.5, message, transform=ax.transAxes,
                fontsize=16, ha='center', va='center',  # FIXED: ha='center'
                bbox=dict(boxstyle="round,pad=1", facecolor="#f8f9fa",
                          edgecolor="#dee2e6", linewidth=2))
        ax.axis('off')

        canvas = FigureCanvasTkAgg(fig, parent_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)

        return canvas