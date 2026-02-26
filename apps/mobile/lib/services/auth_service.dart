import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

class AuthService {
  static const _tokenKey = 'auth_token';
  final _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return _storage.read(key: _tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<bool> hasSession() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return false;
    try {
      final api = ApiService();
      final data = await api.get('/api/profile');
      return data['profile'] != null;
    } catch (_) {
      return false;
    }
  }

  Future<bool> signIn(String email, String password) async {
    try {
      final api = ApiService();
      final res = await api.post('/api/auth/token', {
        'email': email,
        'password': password,
      });
      if (res['token'] != null) {
        await saveToken(res['token'] as String);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> signOut() async {
    await clearToken();
  }
}
