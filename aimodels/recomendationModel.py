# train_model.py

import pandas as pd
import numpy as np
import ast
import os
import joblib

from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler
from keras.models import Model
from keras.layers import Input, Dense, Dropout, BatchNormalization, LeakyReLU
from keras.models import save_model

# Load data
file_path = 'game_info.csv'
data = pd.read_csv(file_path).sample(frac=0.2, random_state=42)

# Process list-like fields
for col in ['platforms', 'genres', 'publishers']:
    data[col] = data[col].apply(lambda x: x.split('||') if isinstance(x, str) else [])

data['rating'] = data['rating'].apply(lambda x: ast.literal_eval(str(x)))
data['playtime'] = data['playtime'].apply(lambda x: ast.literal_eval(str(x)))

# Binarizers
mlb_platforms = MultiLabelBinarizer()
mlb_genres = MultiLabelBinarizer()
mlb_publishers = MultiLabelBinarizer()

platforms = mlb_platforms.fit_transform(data['platforms'])
genres = mlb_genres.fit_transform(data['genres'])
publishers = mlb_publishers.fit_transform(data['publishers'])

# Normalize numeric fields
scaler = StandardScaler()
numerical = scaler.fit_transform(data[['rating', 'playtime', 'game_series_count']])

# Final input
X = np.hstack([platforms, genres, publishers, numerical])
game_names = data['name'].tolist()

# Build autoencoder
input_layer = Input(shape=(X.shape[1],))
x = Dense(256)(input_layer)
x = BatchNormalization()(x)
x = LeakyReLU(0.1)(x)
x = Dropout(0.2)(x)
x = Dense(128)(x)
x = BatchNormalization()(x)
x = LeakyReLU(0.1)(x)
embedding = Dense(64, name="embedding")(x)
x = Dense(128)(embedding)
x = BatchNormalization()(x)
x = LeakyReLU(0.1)(x)
x = Dense(256)(x)
x = BatchNormalization()(x)
x = LeakyReLU(0.1)(x)
output = Dense(X.shape[1], activation='linear')(x)

autoencoder = Model(inputs=input_layer, outputs=output)
autoencoder.compile(optimizer='adam', loss='mse')
autoencoder.fit(X, X, epochs=8, batch_size=64, validation_split=0.2)

# Save path
save_path = 'saved'
os.makedirs(save_path, exist_ok=True)

# Save model
autoencoder.save(f"{save_path}/recommender_model.keras")

# Save embeddings + names
embeddings = Model(autoencoder.input, autoencoder.get_layer("embedding").output).predict(X)
np.save(f"{save_path}/game_embeddings.npy", embeddings)
pd.Series(game_names).to_csv(f"{save_path}/game_names.csv", index=False)

# Save encoders and scaler
joblib.dump(mlb_platforms, f"{save_path}/mlb_platforms.pkl")
joblib.dump(mlb_genres, f"{save_path}/mlb_genres.pkl")
joblib.dump(mlb_publishers, f"{save_path}/mlb_publishers.pkl")
joblib.dump(scaler, f"{save_path}/scaler.pkl")

# python recomendationModel.py