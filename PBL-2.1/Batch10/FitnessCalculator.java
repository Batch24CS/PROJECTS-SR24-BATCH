import java.util.*;
import java.lang.Math;
import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * Java Data Processing Module for SPAM Fitness
 * Provides advanced calculations and data validation
 */
public class FitnessCalculator {

    // Data structures used: ArrayList, HashMap, Arrays
    private ArrayList<Double> weightHistory;
    private HashMap<String, Double> userMetrics;

    public FitnessCalculator() {
        this.weightHistory = new ArrayList<>();
        this.userMetrics = new HashMap<>();
    }

    /**
     * Calculate advanced progress metrics using Java algorithms
     */
    public HashMap<String, Object> calculateAdvancedMetrics(double[] weights, int workouts, int streak) {
        HashMap<String, Object> results = new HashMap<>();

        // Convert array to ArrayList (Data Structure operation)
        weightHistory.clear();
        for (double weight : weights) {
            weightHistory.add(weight);
        }

        // 1. Calculate weight trend using linear regression
        double[] trend = calculateWeightTrend(weights);
        results.put("trend_slope", trend[0]);
        results.put("trend_strength", trend[1]);

        // 2. Calculate weekly progress rate
        double weeklyRate = calculateWeeklyProgressRate(weights);
        results.put("weekly_progress_rate", weeklyRate);

        // 3. Predict goal date
        String predictedDate = predictGoalDate(weights, weeklyRate);
        results.put("predicted_goal_date", predictedDate);

        // 4. Calculate consistency score
        double consistency = calculateConsistencyScore(workouts, streak);
        results.put("consistency_score", consistency);

        // 5. Generate performance insights
        String insights = generatePerformanceInsights(weeklyRate, consistency, workouts);
        results.put("performance_insights", insights);

        results.put("processed_by", "Java Data Engine");
        results.put("timestamp", new Date().toString());

        return results;
    }

    /**
     * Linear regression for weight trend (Java algorithm)
     */
    private double[] calculateWeightTrend(double[] weights) {
        int n = weights.length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += weights[i];
            sumXY += i * weights[i];
            sumX2 += i * i;
        }

        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        double avgY = sumY / n;

        // Calculate R-squared (trend strength)
        double ssTot = 0, ssRes = 0;
        for (int i = 0; i < n; i++) {
            double predicted = slope * i + (sumY/n - slope * sumX/n);
            ssTot += Math.pow(weights[i] - avgY, 2);
            ssRes += Math.pow(weights[i] - predicted, 2);
        }

        double rSquared = 1 - (ssRes / ssTot);

        return new double[]{slope, rSquared};
    }

    /**
     * Calculate weekly progress rate
     */
    private double calculateWeeklyProgressRate(double[] weights) {
        if (weights.length < 2) return 0.0;

        double totalChange = weights[0] - weights[weights.length - 1];
        double weeks = Math.max(1, weights.length / 7.0); // Approximate weeks

        return totalChange / weeks;
    }

    /**
     * Predict when user will reach goal (Java logic)
     */
    private String predictGoalDate(double[] weights, double weeklyRate) {
        if (weeklyRate <= 0 || weights.length < 2) {
            return "Insufficient data for prediction";
        }

        double currentWeight = weights[weights.length - 1];
        double goalWeight = currentWeight - 5; // Assume 5kg goal

        double weeksToGoal = (currentWeight - goalWeight) / weeklyRate;
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_YEAR, (int)(weeksToGoal * 7));

        Date predictedDate = calendar.getTime();
        return String.format("Predicted: %tY-%tm-%td", predictedDate, predictedDate, predictedDate);
    }

    /**
     * Calculate workout consistency score
     */
    private double calculateConsistencyScore(int totalWorkouts, int currentStreak) {
        double baseScore = Math.min(totalWorkouts * 2, 50); // Max 50 points for total workouts
        double streakScore = Math.min(currentStreak * 5, 30); // Max 30 points for streak
        double regularityScore = 20; // Base score

        return baseScore + streakScore + regularityScore;
    }

    /**
     * Generate personalized insights using Java logic
     */
    private String generatePerformanceInsights(double weeklyRate, double consistency, int workouts) {
        ArrayList<String> insights = new ArrayList<>();

        if (weeklyRate > 0.5) {
            insights.add("Excellent progress! Maintain your current routine.");
        } else if (weeklyRate > 0.2) {
            insights.add("Good progress. Consider increasing workout intensity.");
        } else {
            insights.add("Try adjusting your nutrition or exercise plan.");
        }

        if (consistency >= 80) {
            insights.add("Great consistency! This is key to long-term success.");
        } else if (consistency >= 60) {
            insights.add("Good consistency. Aim for 4-5 workouts weekly.");
        }

        if (workouts < 3) {
            insights.add("Increase workout frequency for better results.");
        }

        return String.join(" ", insights);
    }

    /**
     * Simple JSON parser for weights array
     */
    private double[] parseWeightsFromInput(String input) {
        try {
            // Find weights array in input
            int start = input.indexOf("\"weights\":[") + 11;
            int end = input.indexOf("]", start);
            String weightsStr = input.substring(start, end);

            String[] weightStrs = weightsStr.split(",");
            double[] weights = new double[weightStrs.length];
            for (int i = 0; i < weightStrs.length; i++) {
                weights[i] = Double.parseDouble(weightStrs[i].trim());
            }
            return weights;
        } catch (Exception e) {
            // Return default weights if parsing fails
            return new double[]{70.0, 69.5, 69.0, 68.5, 68.0};
        }
    }

    /**
     * Simple JSON parser for workouts
     */
    private int parseWorkoutsFromInput(String input) {
        try {
            int start = input.indexOf("\"workouts\":") + 11;
            int end = input.indexOf(",", start);
            if (end == -1) end = input.indexOf("}", start);
            String workoutsStr = input.substring(start, end).trim();
            return Integer.parseInt(workoutsStr);
        } catch (Exception e) {
            return 5; // Default value
        }
    }

    /**
     * Simple JSON parser for streak
     */
    private int parseStreakFromInput(String input) {
        try {
            int start = input.indexOf("\"streak\":") + 9;
            int end = input.indexOf("}", start);
            if (end == -1) end = input.length();
            String streakStr = input.substring(start, end).trim();
            // Remove any trailing characters
            if (streakStr.contains(",")) streakStr = streakStr.substring(0, streakStr.indexOf(","));
            if (streakStr.contains("}")) streakStr = streakStr.substring(0, streakStr.indexOf("}"));
            return Integer.parseInt(streakStr);
        } catch (Exception e) {
            return 3; // Default value
        }
    }

    /**
     * Main method for JSON input/output
     */
    public static void main(String[] args) {
        FitnessCalculator calculator = new FitnessCalculator();

        try {
            // Read JSON input from stdin
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            StringBuilder inputJson = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                inputJson.append(line);
            }

            HashMap<String, Object> response = new HashMap<>();

            if (inputJson.length() == 0) {
                // Use test data if no input
                double[] testWeights = {70.0, 69.5, 69.0, 68.5, 68.0};
                int workouts = 8;
                int streak = 5;

                response = calculator.calculateAdvancedMetrics(testWeights, workouts, streak);
                response.put("test_data_used", true);
            } else {
                try {
                    String input = inputJson.toString();

                    // Parse input using simple string parsing
                    double[] weights = calculator.parseWeightsFromInput(input);
                    int workouts = calculator.parseWorkoutsFromInput(input);
                    int streak = calculator.parseStreakFromInput(input);

                    // Calculate results
                    response = calculator.calculateAdvancedMetrics(weights, workouts, streak);
                    response.put("test_data_used", false);
                    response.put("input_received", true);

                } catch (Exception e) {
                    response.put("error", "JSON parsing failed: " + e.getMessage());
                    response.put("sample_input", "{\"weights\":[70,69,68],\"workouts\":5,\"streak\":3}");

                    // Use default data
                    double[] testWeights = {70.0, 69.5, 69.0, 68.5, 68.0};
                    int workouts = 5;
                    int streak = 3;
                    response.put("default_results", calculator.calculateAdvancedMetrics(testWeights, workouts, streak));
                }
            }

            // Output JSON response
            System.out.println(SimpleJSON.toJSON(response));

        } catch (Exception e) {
            // Return error as JSON
            HashMap<String, Object> error = new HashMap<>();
            error.put("error", "Java processing failed: " + e.getMessage());
            System.out.println(SimpleJSON.toJSON(error));
        }
    }
}