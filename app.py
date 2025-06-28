from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.utils import secure_filename
import os

import re
import pyzxing
from PIL import Image
import requests
import math
import uuid
import json
import anthropic

app = Flask(__name__, template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', 'fallback_secret_if_not_set')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'uploads')
client = anthropic.Anthropic(api_key=os.environ.get('CLAUDE_API_KEY', 'CLAUDE_KEY2'))

# Initialize DB once on startup
def round_sig(x, sig=2):
    if x == 0:
        return 0
    rounded = round(x, sig - int(math.floor(math.log10(abs(x))) + 1))
    return int(rounded) if rounded == int(rounded) else rounded

def compute_nutrition_score(nutriments, nutri_score=None):
    def clamp(x, min_val, max_val):
        return max(min_val, min(x, max_val))

    # If Nutri-Score is available, map directly (optional override)
    if nutri_score:
        nutri_map = {"a": 90, "b": 75, "c": 60, "d": 40, "e": 20}
        score_tag = nutri_score[0].lower() if nutri_score else None
        if score_tag in nutri_map:
            return nutri_map[score_tag]

    # Default missing values to 0
    energy = nutriments.get("energy_kcal_100g", 0)  # kcal/100g
    sugar = nutriments.get("sugars_100g", 0)
    sat_fat = nutriments.get("saturated_fat_100g", 0)
    salt = nutriments.get("salt_100g", 0)
    fiber = nutriments.get("fiber_100g", 0)
    protein = nutriments.get("proteins_100g", 0)

    # ---- NEGATIVE POINTS ----
    # Based on Nutri-Score threshold ranges
    energy_score = clamp((energy - 335) / (1000 - 335) * 10, 0, 10)
    sugar_score = clamp(sugar / 45 * 10, 0, 10)
    sat_fat_score = clamp(sat_fat / 10 * 10, 0, 10)
    salt_score = clamp(salt / 4 * 10, 0, 10)

    negative_points = energy_score + sugar_score + sat_fat_score + salt_score

    # ---- POSITIVE POINTS ----
    fiber_score = clamp(fiber / 10 * 5, 0, 5)
    protein_score = clamp(protein / 20 * 5, 0, 5)

    positive_points = fiber_score + protein_score

    raw_score = negative_points - positive_points  # lower = better
    raw_score = clamp(raw_score, 0, 40)  # Assume max 40 bad

    # Invert and scale to 20–80
    nutrition_score = round(20 + (40 - raw_score) / 40 * 60)
    return nutrition_score


def fetch_product_info(barcode):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch product"}
    
    data = response.json()
    
    if data.get('status') != 1:
        return {"error": "Product not found"}

    product = data.get("product", {})

    # Extracting fields
    result = {
        "barcode": barcode,
        "product_name": product.get("product_name"),
        "brands": product.get("brands"),
        "categories": product.get("categories"),
        "ingredients_text": product.get("ingredients_text"),
        "ingredients_analysis_tags": product.get("ingredients_analysis_tags", []),
        "allergens": product.get("allergens_tags", []),
        "traces": product.get("traces_tags", []),
        "additives": product.get("additives_tags", []),
        "nutriments": {
            "energy_kcal_100g": round_sig(product.get("nutriments", {}).get("energy-kcal_100g", 0)),
            "sugars_100g": round_sig(product.get("nutriments", {}).get("sugars_100g", 0)),
            "fat_100g": round_sig(product.get("nutriments", {}).get("fat_100g", 0)),
            "saturated_fat_100g": round_sig(product.get("nutriments", {}).get("saturated-fat_100g", 0)),
            "fiber_100g": round_sig(product.get("nutriments", {}).get("fiber_100g", 0)),
            "proteins_100g": round_sig(product.get("nutriments", {}).get("proteins_100g", 0)),
            "salt_100g": round_sig(product.get("nutriments", {}).get("salt_100g", 0)),
            "carbohydrates_100g": round_sig(product.get("nutriments", {}).get("carbohydrates_100g", 0)),
            "fat_100g": round_sig(product.get("nutriments", {}).get("fat_100g", 0))
        },
        "nutri_score": product.get("nutrition_grades_tags", []),
        "nova_group": product.get("nova_group"),
        "carbon_footprint_100g": round_sig(product.get("carbon_footprint_100g", 0) or product.get("carbon-footprint_100g", 0)*10),
        "ecoscore_grade": product.get("ecoscore_grade"),
        "ecoscore_score": product.get("ecoscore_score"),
        "agribalyse_co2_total": round_sig(product.get("ecoscore_data", {}).get("agribalyse", {}).get("co2_total", 0)),
        "water_usage": product.get("ecoscore_data", {}).get("agribalyse", {}).get("water_use"),
        "packaging": product.get("packaging_tags", []),
        "recyclable": product.get("packaging_recyclable"),
        # Heuristic storage info
        "storage_info": {
            "packaging_text": product.get("packaging_text"),
            "labels_tags": product.get("labels_tags", []),
            "other_info": product.get("other_information"),
            "conservation_conditions": product.get("conservation_conditions"),
        },
        "images": {
            "front": product.get("image_front_url"),
            "ingredients": product.get("image_ingredients_url"),
            "nutrition": product.get("image_nutrition_url"),
            "general": product.get("image_url"),
        },
    }
    result['tabulated_score'] = compute_nutrition_score(result['nutriments'], result['nutri_score'])
    return result


@app.route('/')
def home():
    return render_template('index.html')


def validate_profile_form(form):
    errors = {}
    cleaned_data = {}

    def validate_number(field, min_val=0, max_val=500, allow_blank=True):
        value = form.get(field, "").strip()
        if allow_blank and value == "":
            return None
        try:
            val = float(value)
            if val < min_val or val > max_val:
                errors[field] = f"{field.replace('_', ' ').capitalize()} must be between {min_val} and {max_val}."
                return None
            return val
        except ValueError:
            errors[field] = f"{field.replace('_', ' ').capitalize()} must be a number."
            return None

    # Strings
    for field in ['gender', 'activity_level', 'dietary_style', 'environmental_pref', 'eco_score_concern_level',
                  'dislikes', 'clinical_conditions', 'allergies', 'intolerances', 'medications']:
        cleaned_data[field] = form.get(field, "").strip()

    return errors, cleaned_data




def process_uploaded_file(file):
    if not file or file.filename == '':
        raise ValueError("No file provided.")
    
    filename = secure_filename(file.filename)
    if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise ValueError("Unsupported file type.")

    upload_path = app.config['UPLOAD_FOLDER']
    os.makedirs(upload_path, exist_ok=True)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(upload_path, unique_filename)
    file.save(file_path)

    try:
        Image.open(file_path)  # Just to validate it's a readable image
        reader = pyzxing.BarCodeReader()
        result = reader.decode(file_path)
        if not result or 'parsed' not in result[0]:
            raise ValueError("No barcode found in the image.")
        elif len(result) > 1:
            raise ValueError("Multiple barcodes found in the image.")
        barcode = result[0]['parsed']
        barcode_number = ''.join([x for x in str(barcode) if x.isdigit()])
        return barcode_number
    finally:
        pass

def check_existing_log(barcode_number, logs):
    for food_log in logs or []:
        if str(barcode_number) == food_log[1]:
            return True, food_log[0]
    return False, None





def construct_dietary_prompt(user_profile: dict, product_profile_dict) -> str:
    clinical_conditions = user_profile.get("clinical_conditions", "none")
    medications = user_profile.get("medications", "none")
    dietary_style = user_profile.get("dietary_style", "none")
    allergies = user_profile.get("allergies", "none")
    intolerances = user_profile.get("intolerances", "none")
    dislikes = user_profile.get("dislikes", "none")
    environmental_pref = user_profile.get("environmental_pref", "none")
    eco_score_concern_level = user_profile.get("eco_score_concern_level", "none")
    product_input = product_profile_dict.copy()
    product_input.pop('images', None)
    prompt = f"""
You are a dietary assistant. A user has specific health conditions and preferences. Based on the provided product data, analyze the product and return structured JSON insights.

User Profile:
* Conditions: {clinical_conditions}
* Medications: {medications}
* Diet: {dietary_style}
* Allergies: {allergies}
* Intolerances: {intolerances}
* Dislikes: {dislikes}
* Preferences: {environmental_pref}
* Environmental Concern Level: {eco_score_concern_level}

Product: {product_input}
Instructions:
1. Use OpenFoodFacts fields wherever possible.
2. If a value is missing, incomplete, or in another language, use general knowledge to estimate.
3. Base environmental score on factors such as packaging, food origin, processing level, ingredient type, etc., if CO2/water data is unavailable.
4. For each score (nutrition, health, environment), select exactly one category from the provided list.
5. In each reason, briefly justify the score. Mention if you estimated something due to missing info.
6. Consider ingredients, allergens, additives only if they conflict with the user's allergies, dislikes, diet, health conditions, or medications.
7. Do not flag common allergens like soy, milk, nuts unless they conflict with the user profile.
8. Treat all health conditions and medications seriously and holistically. Identify any nutrients or ingredients that could pose risks or require caution based on:
   - Possible dietary restrictions or nutrient limitations common to the conditions or medications.
   - Known interactions between nutrients and medications (e.g., potassium with certain blood pressure drugs).
9. Provide warnings or advice related to any such conflicts or potential risks, with severity levels (low, med, high).
10. Include warnings related to allergies, dislikes, or preferences only if applicable.
11. Return ONLY JSON in the format:

{{
  "warnings": [{{"msg": "...", "lvl": "l|m|h"}} ],
  "storage_warnings": [{{"msg": "...", "lvl": "l|m|h"}} ],
  "scores": {{
    "nutrition": {{"category": "<one category>", "reason": "..."}},
    "health": {{"category": "<one category>", "reason": "..."}},
    "environment": {{"category": "<one category>", "reason": "..."}}
  }}
}}

Scoring Categories (Use Exactly One Per Score):
* Very Very Low
* Very Low
* Low
* Low-Medium
* Medium Low
* Below Medium
* Slightly Below Medium
* Slightly Above Medium
* Above Medium
* Medium
* Medium High
* Slightly Above High
* Above High
* High
* Very High
* Very Very High
* Excellent
* Outstanding
* Near Perfect
* Perfect
""".strip()

    return prompt




class LLMProcessingError(Exception):
    pass


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    error = ""

    if request.method == 'POST':
        user_dietary_profile = {
            'activity_level': request.form.get('activity_level', ''),
            'dietary_style': request.form.get('dietary_style', ''),
            'clinical_conditions': request.form.get('clinical_conditions', ''),
            'medications': request.form.get('medications', ''),
            'allergies': request.form.get('allergies', ''),
            'intolerances': request.form.get('intolerances', ''),
            'dislikes': request.form.get('dislikes', ''),
            'environmental_pref': request.form.get('environmental_pref', ''),
            'eco_score_concern_level': request.form.get('eco_score_concern_level', '')
        }
        print("SAMPLE:")
        file = request.files.get('photo')
        barcode_input = request.form.get('manual-barcode', '').strip() or request.form.get("selected_barcode").strip()

        if not file and not barcode_input:
            return render_template('upload.html', error='Please upload a photo or enter a barcode.')

        if file:
            try:
                barcode_number = process_uploaded_file(file)
            except ValueError as ve:
                return render_template('upload.html', error=str(ve))
            except Exception as e:
                return render_template('upload.html', error=f"Something went wrong: {str(error)}")
        else:
            barcode_number = barcode_input

        info = fetch_product_info(barcode_number)
        if 'error' in info:
                return render_template('upload.html', error=f"Product ({barcode_number}) Something went wrong: {str(info['error'])}")
        prompt = construct_dietary_prompt(user_dietary_profile, info)
        print("GOT THIS PROMPT: ", prompt)
        try:
            llm_response = client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=1024,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
            llm_powered_scores = llm_response.content[0].text
            llm_powered_scores = json.loads(llm_powered_scores)
            print("GOT THIS RESPONSE: ", llm_powered_scores, type(llm_powered_scores))
        except Exception as e:
            info['nutrition_score'] = info['tabulated_score']
            info['nutrition_score_desc'] = "Sorry, information not available"
            info['health_score'] = 0
            info['health_score_desc'] = "Sorry, information not available"
            info['eco_score_desc'] = "Sorry, information not available"
            info['conservation_conditions'] = info.get('storage_info', {}).get('conservation_conditions')
            if type(info['conservation_conditions']) == list:
                info['conservation_conditions'] = 'm'+ ', '.join(info['conservation_conditions'])
            info['other_info'] = ""
            return render_template('result.html', result=info, error=f"Sorry AI insights not available {e}")
        # llm_powered_scores =  {
        #     "warnings": [
        #             {
        #             "msg": "This product contains wheat, which may not be suitable for Jain diets.",
        #             "lvl": "m"
        #             }
        #         ],
        #         "storage_warnings": [],
        #         "scores": {
        #             "nutrition": {
        #             "category": "Above Medium",
        #             "reason": "The product has a good balance of nutrients, with a moderately high calorie content (220 kcal per 100g), moderate fat (10g per 100g), and reasonable protein (5.5g per 100g) and fiber (3.3g per 100g) levels. The Nutri-Score of 'A' indicates it is a relatively healthy option."
        #             },
        #             "health": {
        #             "category": "Medium",
        #             "reason": "While the product is generally healthy, it contains wheat flour, which may not be suitable for Jain diets. Additionally, the high carbohydrate content (24g per 100g) may not be ideal for a keto diet. Some ingredients like cumin, coriander, and chili powder could potentially interact with certain medications, so caution may be required."
        #             },
        #             "environment": {
        #             "category": "Below Medium",
        #             "reason": "The product has a relatively high environmental impact, with an Eco-Score of 'F' and a high carbon footprint (23 kgCO2e per 100g). The mixed plastic packaging is also not very eco-friendly. While the product is palm oil-free, the processing and transport of the ingredients likely contribute to its environmental burden."
        #             }
        #         }
        #     }

        score_map = {
                    "Very Very Low": 0,
                    "Very Low": 5,
                    "Low": 10,
                    "Low-Medium": 15,
                    "Medium Low": 20,
                    "Below Medium": 25,
                    "Slightly Below Medium": 30,
                    "Medium": 35,
                    "Slightly Above Medium": 40,
                    "Medium High": 45,
                    "Above Medium": 50,
                    "Slightly Above High": 55,
                    "High": 60,
                    "Above High": 65,
                    "Very High": 70,
                    "Very Very High": 75,
                    "Excellent": 80,
                    "Outstanding": 85,
                    "Near Perfect": 90,
                    "Perfect": 95
                }
        try:
            info['nutrition_score'] = score_map[llm_powered_scores['scores']['nutrition']['category']]
            info['nutrition_score_desc'] = llm_powered_scores['scores']['nutrition']['reason']
            info['health_score'] = score_map[llm_powered_scores['scores']['health']['category']]
            info['health_score_desc'] = llm_powered_scores['scores']['health']['reason']
            if not info['ecoscore_score']:
                info['ecoscore_score'] = score_map[llm_powered_scores['scores']['environment']['category']]
            info['eco_score_desc'] = llm_powered_scores['scores']['environment']['reason']
            info['conservation_conditions'] = llm_powered_scores['storage_warnings']
            if info['conservation_conditions']:
                info['conservation_conditions'] = ";".join([x['lvl'][0] + x['msg'] for x in info['conservation_conditions']])
            info['other_info'] = llm_powered_scores['warnings']
            if info['other_info'] and info['other_info'] != []:
                info['other_info'] = ";".join([x['lvl'][0] + x['msg'] for x in info['other_info']])
            else:
                info['other_info'] = 'lComplete User Profile to get more insights'
        except Exception as e:
            return render_template('result.html', result=info, error=f"Error While Mapping Data {e}")
        return render_template('result.html', result=info, success="Item Found")
    return render_template('upload.html', error=error, success="", log_id=None)



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
