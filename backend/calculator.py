import logging

from questions import questions

emission_factors = {
    "electricity_usage": 0.39,  # kg CO2e/kWh
    "home_size": 0.39,
    "flights_per_year": 200,  # kg CO2e/flight-hour
    "clothing_spend": 0.5,  # kg CO2e/dollar spent
    "food_waste": 0.5,  # kg CO2e per kg of food waste
    "emails_sent": 0.004,  # kg CO2e per email sent
    # Nested factors for specific questions
    "energy_source": {
        "Natural Gas": 2.1,  # kg CO2e/unit (adjust based on usage)
        "Heating Oil": 2.96,
        "Solar": 0.0,
        "District Heating": 0.5,  # Example value
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
        "Yes": 0.5,  # Example: Reduce footprint for eco-friendly actions
        "No": 1.0,
    },
}



def calculate_footprint(answers: dict) -> dict:
    logging.info(f"Incoming Answers for Calculation: {answers}")

    # # Ensure empty strings default to 'No'
    # answers['car_owner'] = answers.get('car_owner', 'No') or 'No'
    # answers['eco_program'] = answers.get('eco_program', 'No') or 'No'


    total_footprint = 0
    category_breakdown = {}
    unified_data = {
        "numeric_data": {},
        "non_numeric_data": {}
    }

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
                    unified_data['numeric_data']['car_km'] = car_km
                else:
                    emission = 0  # Avoid errors if data is missing
        elif question_id == "video_calls":
            video_calls = float(answers["video_calls"]) if answers["video_calls"] else 0
            unified_data['numeric_data']['video_calls'] = video_calls
            emission = 0  # Assume no factor is needed for video calls calculation
        else:
            emission = numeric_value * factor if numeric_value is not None and factor is not None else 0

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

    logging.info(f"Unified Data: {unified_data}")
    return {
        "total_carbon_footprint_kg": round(total_footprint, 2),
        "category_breakdown": category_breakdown,
        "unified_data": unified_data
    }



def get_category(question_id):
    for q in questions:
        if q['id'] == question_id:
            return q.get('category', "Uncategorized")  # Return "Uncategorized" only as a fallback
    logging.warning(f"Category not found for question ID: {question_id}")
    return None  # Return `None` instead of "Uncategorized"
