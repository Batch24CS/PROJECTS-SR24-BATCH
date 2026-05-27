# app.py — Main Flask Application
import os
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, session
from config import Config
from models.db import init_db
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.portfolio_routes import portfolio_bp
from routes.admin_routes import admin_bp
from routes.reset_routes import reset_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure upload dirs exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'profiles'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'projects'), exist_ok=True)

    # Database
    init_db(app)

    # Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(portfolio_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(reset_bp)

    # Root route
    @app.route('/')
    def index():
        if 'user_id' in session:
            return redirect(url_for('dashboard.dashboard'))
        return render_template('index.html')

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template('500.html'), 500

    # Template filters
    @app.template_filter('tags_list')
    def tags_list_filter(s):
        if not s: return []
        return [t.strip() for t in s.split(',') if t.strip()]

    @app.template_filter('nl2br')
    def nl2br(s):
        if s: return s.replace('\n', '<br>')
        return ''

    @app.template_filter('strftime')
    def strftime_filter(date_str, fmt='%d %b %Y'):
        """Convert date string or datetime object to formatted string"""
        if not date_str:
            return 'N/A'
        try:
            # If it's already a datetime object, use it directly
            if isinstance(date_str, datetime):
                return date_str.strftime(fmt)
            # If it's a string, parse it first
            elif isinstance(date_str, str):
                # Try ISO format first (SQLite default)
                try:
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    # Try other common formats
                    for fmt_attempt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S']:
                        try:
                            dt = datetime.strptime(date_str, fmt_attempt)
                            break
                        except ValueError:
                            continue
                    else:
                        return date_str  # Return as-is if can't parse
                return dt.strftime(fmt)
            return date_str
        except Exception:
            return date_str

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=5000)
