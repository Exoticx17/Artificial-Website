from flask import Flask, request, jsonify
from keras.models import load_model, Model
import numpy as np
import pandas as pd
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import joblib  # For loading saved encoders/scalers

app = Flask(__name__)

# === Load model and saved data ===
model_path = "C:/Users/ccoff/OneDrive/Chases Stuff/Coding/Coding-Projects/xartificialpr/aimodels/saved"
autoencoder = load_model(f"{model_path}/recommender_model.keras")
embedding_model = Model(inputs=autoencoder.input, outputs=autoencoder.get_layer("embedding").output)

# === Load data ===
embeddings = np.load(f"{model_path}/game_embeddings.npy")

# Load game names safely
game_names_df = pd.read_csv(f"{model_path}/game_names.csv", skip_blank_lines=True)
game_names_df.columns = game_names_df.columns.str.strip()
game_names = pd.read_csv(f"{model_path}/game_names.csv", header=None)[0].tolist()

# Load previously fitted encoders and scaler
mlb_platforms = joblib.load(f"{model_path}/mlb_platforms.pkl")
mlb_genres = joblib.load(f"{model_path}/mlb_genres.pkl")
mlb_publishers = joblib.load(f"{model_path}/mlb_publishers.pkl")
scaler = joblib.load(f"{model_path}/scaler.pkl")

# === Helper: Encode input data ===
def encode_input_data(platforms, genres, publishers, rating, playtime):
    try:
        platforms_encoded = mlb_platforms.transform([platforms])
        genres_encoded = mlb_genres.transform([genres])
        publishers_encoded = mlb_publishers.transform([publishers])
    except Exception as e:
        return None, f"Encoding error: {str(e)}"

    scaled_features = scaler.transform([[rating, playtime, 0]])  # Assuming game_series_count=0
    encoded_input = np.hstack([platforms_encoded, genres_encoded, publishers_encoded, scaled_features])
    return encoded_input, None

# === Route: Recommend games ===
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()

    # Extract input values from the request
    platforms = data.get('platforms', [])
    genres = data.get('genres', [])
    publishers = data.get('publishers', [])
    rating = data.get('rating')
    playtime = data.get('playtime')

    # Print the retrieved data
    print("Platforms:", platforms)
    print("Genres:", genres)
    print("Publishers:", publishers)
    print("Rating:", rating)
    print("Playtime:", playtime)

    # Validate inputs
    if not platforms or not genres or not publishers or rating is None or playtime is None:
        return jsonify({"error": "Please provide platforms, genres, publishers, rating, and playtime."}), 400

    # Check for valid types (platforms, genres, publishers should be lists, rating and playtime should be numeric)
    if not isinstance(platforms, list) or not isinstance(genres, list) or not isinstance(publishers, list):
        return jsonify({"error": "Platforms, genres, and publishers must be provided as lists."}), 400

    if not isinstance(rating, (int, float)) or not isinstance(playtime, (int, float)):
        return jsonify({"error": "Rating and playtime must be numeric values."}), 400

    # Encode the input data
    encoded_input, error = encode_input_data(platforms, genres, publishers, rating, playtime)
    
    # If there's an error in encoding input data, return the error
    if error:
        return jsonify({"error": error}), 400

    # Get the embedding for the input data
    try:
        input_embedding = embedding_model.predict(encoded_input)
    except Exception as e:
        return jsonify({"error": f"Error generating embeddings: {str(e)}"}), 500

    # Calculate cosine similarity between input embedding and stored embeddings
    sim_scores = cosine_similarity(input_embedding, embeddings)[0]

    # Get top 5 similar games (excluding itself)
    top_indices = sim_scores.argsort()[::-1][1:13]
    recommendations = [game_names[i] for i in top_indices]

    return jsonify({
        "recommendations": recommendations
    })


# === Run Flask app ===
if __name__ == '__main__':
    app.run(debug=True)
