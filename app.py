from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)

# Konfigurasi database SQLite
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'data', 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Model Score
class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)

    def as_dict(self):
        return {"username": self.username, "score": self.score}

# Model User
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    progress = db.Column(db.Text)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/play')
def play():
    return render_template('play.html')

@app.route('/api/save_score', methods=['POST'])
def save_score():
    data = request.get_json()
    username = data.get('username')
    score = data.get('score')

    if not username or not isinstance(score, int):
        return jsonify({"status": "error", "message": "Invalid input"}), 400

    new_score = Score(username=username, score=score)
    db.session.add(new_score)
    db.session.commit()

    return jsonify({"status": "success"})

@app.route('/api/save_progress', methods=['POST'])
def save_progress():
    data = request.get_json()
    username = data.get('username')
    progress = data.get('progress')

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'})

    user.progress = progress
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/leaderboard')
def leaderboard():
    # Ambil skor tertinggi dari setiap username
    subquery = db.session.query(
        Score.username,
        db.func.max(Score.score).label('max_score')
    ).group_by(Score.username).subquery()

    top_scores = db.session.query(
        subquery.c.username,
        subquery.c.max_score.label('score')
    ).order_by(subquery.c.max_score.desc()).limit(10).all()

    return jsonify([{"username": s.username, "score": s.score} for s in top_scores])

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"status": "error", "message": "Username already taken"}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"status": "success"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user:
        if user.check_password(password):
            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "error", "message": "Password salah"}), 401
    else:
        # Auto-register jika belum ada
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User baru berhasil didaftarkan dan login"})

@app.route('/api/get_progress', methods=['POST'])
def get_progress():
    data = request.get_json()
    username = data.get('username')

    user = User.query.filter_by(username=username).first()
    if not user or not user.progress:
        return jsonify({'success': False, 'message': 'No progress'})

    return jsonify({'success': True, 'progress': user.progress})

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8080)
