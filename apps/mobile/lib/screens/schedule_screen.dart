import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  List<dynamic> _shifts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ApiService();
      final data = await api.get('/api/shifts');
      setState(() {
        _shifts = data['shifts'] as List<dynamic>? ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _dropShift(String shiftId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Drop Shift'),
        content: const Text(
          'Drop this shift? It will become available for others to pick up.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Drop'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final api = ApiService();
      await api.post('/api/open-shifts/drop', {'shiftId': shiftId});
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _load,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    if (_shifts.isEmpty) {
      return const Center(child: Text('No shifts assigned'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _shifts.length,
        itemBuilder: (context, i) {
          final s = _shifts[i] as Map<String, dynamic>;
          final start = DateTime.parse(s['startTime'] as String);
          final end = DateTime.parse(s['endTime'] as String);
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(DateFormat('EEEE, MMM d').format(start)),
              subtitle: Text(
                '${DateFormat('h:mm a').format(start)} – ${DateFormat('h:mm a').format(end)} · ${s['type'] ?? 'call'}',
              ),
              trailing: TextButton(
                onPressed: () => _dropShift(s['id'] as String),
                child: const Text('Drop', style: TextStyle(color: Colors.red)),
              ),
            ),
          );
        },
      ),
    );
  }
}
