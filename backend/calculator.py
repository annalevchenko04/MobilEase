import logging
from questions import questions

# Update emission factors to include seasonal adjustments
emission_factors = {
    # Existing factors
    "electricity_usage": 0.39,  # kg CO2e/kWh
    "home_size": 0.39,
    "flights_per_year": 200,  # kg CO2e/flight-hour
    "clothing_spend": 0.5,  # kg CO2e/dollar spent
    "food_waste": 0.5,  # kg CO2e per kg of food waste
    "emails_sent": 0.004,  # kg CO2e per email sent

    # Nested factors for specific questions
    "energy_source": {
        "Natural Gas": 2.1,  # kg CO2e/unit
        "Heating Oil": 2.96,
        "Solar": 0.0,
        "District Heating": 0.5,
    },
    "car_type": {
        "Petrol": 0.1949,  # kg CO2e/km
        "Diesel": 0.171,
        "Hybrid": 0.12,
        "Electric": 0.05,
    },
    "diet_type": {
        "Vegan": 1.054,
        "Vegetarian": 1.39,
        "Pescetarian": 1.427,
        "Meat-eater": 2.054,
    },
    "electronics_frequency": {
        "Rarely": 20,
        "Every year": 200,
        "Every 2 years": 100,
    },
    "eco_program": {
        "Yes": 0.5,
        "No": 1.0,
    },

    # New seasonal adjustment factors
    "seasonal_adjustment": {
        "electricity_usage": {
            "Winter": 1.2,  # 20% higher in winter
            "Spring": 1.0,
            "Summer": 1.1,  # 10% higher in summer (AC usage)
            "Fall": 1.0
        },
        "home_size": {
            "Winter": 1.2,  # Higher heating needs
            "Spring": 1.0,
            "Summer": 1.0,
            "Fall": 1.1
        },
        "car_km": {
            "Winter": 0.9,  # Less driving in winter in some regions
            "Spring": 1.0,
            "Summer": 1.2,  # More vacation driving
            "Fall": 1.0
        },
        "flights_per_year": {
            "Winter": 1.1,  # Holiday travel
            "Spring": 0.9,
            "Summer": 1.3,  # Summer vacation
            "Fall": 0.8
        },
        "clothing_spend": {
            "Winter": 1.1,
            "Spring": 1.0,
            "Summer": 0.8,
            "Fall": 1.2  # Fall fashion season
        },
        "food_waste": {
            "Winter": 0.9,
            "Spring": 1.0,
            "Summer": 1.2,  # More food waste in summer
            "Fall": 1.0
        }
    },

    # New digital footprint factors
    "video_calls": 0.08,  # kg CO2e per hour
    "streaming": {
        "Low (<5 hrs/week)": 1.0,
        "Medium (5-15 hrs/week)": 3.0,
        "High (15-30 hrs/week)": 6.0,
        "Very High (>30 hrs/week)": 10.0
    },
    "cloud_storage": {
        "Minimal (<50GB)": 0.5,
        "Average (50-500GB)": 2.0,
        "High (>500GB)": 5.0
    }
}


def calculate_footprint(answers: dict, season: str = None) -> dict:
    logging.info(f"Incoming Answers for Calculation: {answers}")

    # Ensure empty strings default to 'No'
    answers['car_owner'] = answers.get('car_owner', 'No') or 'No'
    answers['eco_program'] = answers.get('eco_program', 'No') or 'No'

    total_footprint = 0
    category_breakdown = {}
    unified_data = {
        "numeric_data": {},
        "non_numeric_data": {}
    }

    # Add season to unified data if provided
    if season:
        unified_data['non_numeric_data']['season'] = season

    # Correct string mapping for car_owner and eco_program
    mapping_corrections = {
        "car_owner": {"Yes": "Yes", "No": "No"},
        "eco_program": {"Yes": "Yes", "No": "No"}
    }
    corrected_answers = {k: mapping_corrections.get(k, {}).get(v, v) for k, v in answers.items()}
    answers.update(corrected_answers)

    for question_id, value in answers.items():
        # Treat empty numeric fields as zero
        if value == "":
            value = 0

        factor = emission_factors.get(question_id)

        # Correct handling for 'car_owner'
        if question_id == "car_owner":
            if value not in ["Yes", "No"]:
                logging.warning(f"Unexpected value for 'car_owner': {value}")
                unified_data['non_numeric_data'][question_id] = value
                continue  # Avoid treating as numeric data

        if isinstance(factor, dict):
            factor = factor.get(value)
            if factor is None:
                logging.warning(f"No factor found for {question_id} with value {value}")
                unified_data['non_numeric_data'][question_id] = value
                continue

        numeric_value = float(value) if str(value).replace('.', '', 1).isdigit() else None
        if numeric_value is not None:
            unified_data['numeric_data'][question_id] = numeric_value
        else:
            unified_data['non_numeric_data'][question_id] = value
            continue

        # Special Handling for Car Emission
        if question_id == "car_owner":
            if value == "Yes":
                car_type = answers.get("car_type", "")
                car_km = float(answers.get("car_km", 0))

                if car_type and car_km:
                    car_emission_factor = emission_factors.get("car_type", {}).get(car_type, 0)
                    emission = car_km * car_emission_factor

                    # Apply seasonal adjustment if available
                    if season and "car_km" in emission_factors.get("seasonal_adjustment", {}):
                        season_factor = emission_factors["seasonal_adjustment"]["car_km"].get(season, 1.0)
                        emission *= season_factor

                    unified_data['numeric_data']['car_km'] = car_km
                else:
                    emission = 0  # Avoid errors if data is missing
        elif question_id == "video_calls":
            video_calls = float(answers["video_calls"]) if answers["video_calls"] else 0
            unified_data['numeric_data']['video_calls'] = video_calls
            emission = video_calls * emission_factors.get("video_calls", 0.08)
        else:
            emission = numeric_value * factor if numeric_value is not None and factor is not None else 0

            # Apply seasonal adjustment if applicable
            if season and question_id in emission_factors.get("seasonal_adjustment", {}):
                season_factor = emission_factors["seasonal_adjustment"][question_id].get(season, 1.0)
                emission *= season_factor

        # Add to breakdown
        if emission > 0:
            category = get_category(question_id)
            if category:
                category_breakdown.setdefault(category, 0)
                category_breakdown[category] += emission
                total_footprint += emission

        logging.info(f"Processed {question_id}: Value={value}, Factor={factor}, Emission={emission}")

    if not category_breakdown:
        logging.error("Category breakdown is empty. No emissions data found.")
        raise ValueError("Invalid calculation result: Category breakdown is missing")

    # Calculate seasonal benchmarks
    benchmarks = {
        "2030_goal": 0.625,  # tonnes CO2e per season (from methodology doc)
        "2050_goal": 0.25,  # tonnes CO2e per season (from methodology doc)
    }

    logging.info(f"Unified Data: {unified_data}")
    return {
        "total_carbon_footprint_kg": round(total_footprint, 2),
        "category_breakdown": category_breakdown,
        "unified_data": unified_data,
        "benchmarks": benchmarks,
        "season": season
    }


def get_category(question_id):
    for q in questions:
        if q['id'] == question_id:
            return q.get('category', "Uncategorized")  # Return "Uncategorized" only as a fallback
    logging.warning(f"Category not found for question ID: {question_id}")
    return None  # Return `None` instead of "Uncategorized"


# New function to generate seasonal recommendations
def generate_seasonal_recommendations(season, category_breakdown):
    """Generate season-specific recommendations based on footprint breakdown."""
    recommendations = []

    # Home Energy Recommendations
    if "Home_Energy" in category_breakdown and category_breakdown["Home_Energy"] > 200:
        if season == "Winter":
            recommendations.append("Lower your thermostat by 1-2 degrees and wear warmer clothing indoors.")
            recommendations.append("Use draft stoppers and weather stripping to prevent heat loss.")
            recommendations.append("Take advantage of natural sunlight for heating by opening curtains during the day.")
        elif season == "Summer":
            recommendations.append("Use fans instead of air conditioning when possible.")
            recommendations.append("Close blinds during peak heat to reduce cooling needs.")
            recommendations.append("Consider a programmable thermostat to reduce cooling when you're away.")
        elif season == "Spring" or season == "Fall":
            recommendations.append("Open windows for natural ventilation instead of using heating or cooling.")
            recommendations.append("Adjust your thermostat settings as temperatures fluctuate between warm and cool.")
            recommendations.append("Use natural light instead of artificial lighting as daylight hours change.")

    # Transportation Recommendations
    if "Transportation" in category_breakdown and category_breakdown["Transportation"] > 150:
        if season in ["Spring", "Summer"]:
            recommendations.append("Consider biking or walking for short trips during pleasant weather.")
            recommendations.append("Plan local vacations to reduce flight emissions during peak travel season.")
        elif season in ["Fall", "Winter"]:
            recommendations.append("Use public transportation or carpooling to reduce winter driving emissions.")
            recommendations.append("Combine errands to reduce the number of car trips in cold weather.")

    # Food Recommendations
    if "Food_Choices" in category_breakdown and category_breakdown["Food_Choices"] > 100:
        if season == "Summer":
            recommendations.append("Shop at farmers markets for locally grown seasonal produce.")
            recommendations.append("Reduce food waste by properly storing fresh summer produce.")
        elif season == "Winter":
            recommendations.append(
                "Choose root vegetables and winter squash which have lower carbon footprints in colder seasons.")
            recommendations.append("Consider plant-based alternatives for holiday meal traditions.")
        elif season == "Spring":
            recommendations.append("Incorporate more seasonal spring vegetables into your diet.")
        elif season == "Fall":
            recommendations.append("Preserve fall harvest foods to reduce food waste and food miles in winter.")

    # Digital Footprint Recommendations
    if "Digital_Usage" in category_breakdown and category_breakdown["Digital_Usage"] > 50:
        if season in ["Winter", "Fall"]:
            recommendations.append(
                "Download content instead of streaming repeatedly during high indoor activity seasons.")
            recommendations.append("Consider a digital decluttering of unused files and emails at season's end.")
        elif season in ["Spring", "Summer"]:
            recommendations.append("Reduce screen time and streaming by spending more time outdoors.")
            recommendations.append("Unsubscribe from unused digital services before vacation season.")

    # Shopping Recommendations
    if "Shopping_Leisure" in category_breakdown and category_breakdown["Shopping_Leisure"] > 100:
        if season == "Winter":
            recommendations.append("Focus on quality over quantity for winter clothing purchases.")
        elif season == "Summer":
            recommendations.append("Consider secondhand options for seasonal summer items.")
        elif season == "Fall":
            recommendations.append("Repair and reuse last year's fall and winter items instead of buying new.")
        elif season == "Spring":
            recommendations.append("Participate in clothing swaps or community sharing as you refresh your wardrobe.")

    # Ensure at least 3 recommendations
    default_recommendations = [
        "Consider upgrading to more energy-efficient appliances.",
        "Reduce food waste by planning meals and freezing leftovers.",
        "Choose reusable products instead of single-use items.",
        "Look for opportunities to participate in local community sustainability initiatives.",
        "Invest in a home energy audit to identify further efficiency opportunities."
    ]

    # Add default recommendations if we don't have enough
    while len(recommendations) < 3:
        for rec in default_recommendations:
            if rec not in recommendations:
                recommendations.append(rec)
                break

    return recommendations[:5]  # Return top 5 recommendations