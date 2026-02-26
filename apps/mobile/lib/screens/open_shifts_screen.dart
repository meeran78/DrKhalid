import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class OpenShiftsScreen extends StatefulWidget {
  const OpenShiftsScreen({super.key});

  @override
  State<OpenShiftsScreen> createState() => _OpenShiftsScreenState();
}

class _OpenShiftsScreenState extends State<OpenShiftsScreen> {
  List<dynamic> _openShifts = [];
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
      final data = await api.get('/api/open-shifts');
      setState(() {
        _openShifts = data['openShifts'] as List<dynamic>? ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _requestPickup(String openShiftRequestId) async {
    try {
      final api = ApiService();
      await api.post('/api/pickups', {'openShiftRequestId': openShiftRequestId});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pickup requested. Pending admin approval.')),
        );
      }
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
            FilledButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }
    if (_openShifts.isEmpty) {
      return const Center(child: Text('No open shifts'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _openShifts.length,
        itemBuilder: (context, i) {
          final os = _openShifts[i] as Map<String, dynamic>;
          final start = DateTime.parse(os['startTime'] as String);
          final end = DateTime.parse(os['endTime'] as String);
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(DateFormat('EEEE, MMM d').format(start)),
              subtitle: Text(
                '${DateFormat('h:mm a').format(start)} – ${DateFormat('h:mm a').format(end)} · ${os['type'] ?? 'call'}\nDropped by ${os['droppedByName']}',
              ),
              trailing: FilledButton(
                onPressed: () => _requestPickup(os['id'] as String),
                child: const Text('Request Pickup'),
              ),
            ),
          );
        },
      ),
    );
  }
}
