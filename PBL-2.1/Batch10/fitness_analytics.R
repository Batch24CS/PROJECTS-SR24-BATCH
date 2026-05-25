
# Fitness Analytics using R
library(jsonlite)
library(ggplot2)

comprehensive_analysis <- function(input_file, output_file) {
    # Read data
    data <- read.csv(input_file)

    if(nrow(data) < 2) {
        return(list(
            error = "Insufficient data for analysis",
            recommendation = "Log more data points"
        ))
    }

    # Basic statistics
    stats <- summary(data$weight)

    # Trend analysis
    data$time_index <- 1:nrow(data)
    model <- lm(weight ~ time_index, data=data)
    trend <- coef(model)["time_index"]
    r_squared <- summary(model)$r.squared
    confidence <- confint(model)["time_index",]

    # Progress calculation
    initial_weight <- data$weight[1]
    current_weight <- data$weight[nrow(data)]
    total_progress <- ((initial_weight - current_weight) / initial_weight) * 100

    # Rate of change (kg per week)
    days_diff <- as.numeric(difftime(
        as.Date(data$date[nrow(data)]), 
        as.Date(data$date[1]), 
        units = "days"
    ))
    weekly_rate <- (trend * 7) * -1  # Convert to kg per week

    # Health assessment
    avg_weight <- mean(data$weight)
    weight_stability <- sd(data$weight) / avg_weight * 100

    # Create comprehensive results
    results <- list(
        basic_stats = as.list(stats),
        trend_analysis = list(
            trend_per_day = trend,
            trend_per_week = weekly_rate,
            r_squared = r_squared,
            confidence_interval = as.list(confidence),
            trend_strength = ifelse(abs(trend) > 0.05, "strong", 
                                   ifelse(abs(trend) > 0.02, "moderate", "weak"))
        ),
        progress_metrics = list(
            total_progress_percentage = total_progress,
            total_kg_change = initial_weight - current_weight,
            days_tracked = days_diff,
            average_daily_change = (current_weight - initial_weight) / days_diff
        ),
        health_insights = list(
            weight_stability_percentage = weight_stability,
            stability_assessment = ifelse(weight_stability < 2, "very stable",
                                        ifelse(weight_stability < 5, "stable", "volatile")),
            recommendation = ifelse(weekly_rate > 0.5, "Great progress! Maintain consistency",
                                  ifelse(weekly_rate > 0.2, "Good progress", 
                                       "Consider adjusting your routine"))
        )
    )

    return(results)
}

# Execute analysis
args <- commandArgs(trailingOnly=TRUE)
input_file <- args[1]
output_file <- args[2]

results <- comprehensive_analysis(input_file, output_file)
json_data <- toJSON(results, auto_unbox=TRUE)
write(json_data, "advanced_analysis.json")
