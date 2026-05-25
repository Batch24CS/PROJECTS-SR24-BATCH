# auth_system.py - Secure User Authentication
import hashlib
import json
import os
from datetime import datetime


class AuthenticationSystem:
    def __init__(self):
        self.users_file = "users_data.json"
        self.load_users()

    def get_user_data(self, username):
        """Get complete user data for dashboard"""
        if username in self.users:
            user_data = self.users[username].copy()
            user_data['username'] = username  # Add username to the data
            return user_data
        return None

    def _hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def load_users(self):
        if os.path.exists(self.users_file):
            with open(self.users_file, 'r') as f:
                self.users = json.load(f)
        else:
            self.users = {}

    def save_users(self):
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=2)

    def register_user(self, user_data):
        username = user_data['username']

        if username in self.users:
            return False, "Username already exists"

        user_id = f"user_{len(self.users) + 1:03d}"

        self.users[username] = {
            'user_id': user_id,
            'password_hash': self._hash_password(user_data['password']),
            'profile': {
                'name': user_data['name'],
                'age': user_data['age'],
                'gender': user_data['gender'],
                'height': user_data['height'],
                'initial_weight': user_data['weight'],
                'fitness_goal': user_data['fitness_goal'],
                'target_weight': user_data.get('target_weight')  # ← Use custom target weight
            },
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'is_active': True
        }

        self.save_users()
        return True, f"User {user_data['name']} registered successfully!"
    def login_user(self, username, password):
        if username not in self.users:
            return False, "User not found"

        if not self.users[username]['is_active']:
            return False, "Account is deactivated"

        if self.users[username]['password_hash'] != self._hash_password(password):
            return False, "Invalid password"

        self.users[username]['last_login'] = datetime.now().isoformat()
        self.save_users()
        return True, "Login successful"

    def change_password(self, username, old_password, new_password):
        auth, message = self.login_user(username, old_password)
        if not auth:
            return False, message

        self.users[username]['password_hash'] = self._hash_password(new_password)
        self.save_users()
        return True, "Password changed successfully"

    def recover_account(self, username, new_password):
        if username not in self.users:
            return False, "User not found"

        self.users[username]['password_hash'] = self._hash_password(new_password)
        self.save_users()
        return True, "Password reset successfully"

    def delete_account(self, username, password):
        auth, message = self.login_user(username, password)
        if not auth:
            return False, message

        self.users[username]['is_active'] = False
        self.save_users()
        return True, "Account deactivated successfully"