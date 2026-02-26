import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ApiService();
      final data = await api.get('/api/notifications');
      setState(() {
        _notifications = data['notifications'] as List<dynamic>? ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(child: Text('No notifications'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  itemBuilder: (context, i) {
                    final n = _notifications[i] as Map<String, dynamic>;
                    final createdAt = n['createdAt'] as String?;
                    return ListTile(
                      title: Text(n['title'] as String? ?? ''),
                      subtitle: Text(
                        '${n['body'] ?? ''}${createdAt != null ? '\n${DateFormat.yMd().add_Hm().format(DateTime.parse(createdAt))}' : ''}',
                      ),
                      leading: (n['read'] as bool? ?? false)
                          ? null
                          : const Icon(Icons.circle, size: 8, color: Colors.blue),
                    );
                  },
                ),
    );
  }
}
