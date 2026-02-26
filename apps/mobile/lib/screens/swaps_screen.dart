import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SwapsScreen extends StatefulWidget {
  const SwapsScreen({super.key});

  @override
  State<SwapsScreen> createState() => _SwapsScreenState();
}

class _SwapsScreenState extends State<SwapsScreen> {
  List<dynamic> _swaps = [];
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
      final data = await api.get('/api/swaps');
      setState(() {
        _swaps = data['swaps'] as List<dynamic>? ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_swaps.isEmpty) {
      return const Center(child: Text('No swap requests'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _swaps.length,
        itemBuilder: (context, i) {
          final s = _swaps[i] as Map<String, dynamic>;
          final status = s['status'] as String? ?? 'pending';
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text('${s['physicianAName']} ↔ ${s['physicianBName']}'),
              subtitle: Text('Status: $status'),
              trailing: Chip(
                label: Text(status),
                backgroundColor: status == 'approved'
                    ? Colors.green.shade100
                    : status == 'rejected'
                        ? Colors.red.shade100
                        : Colors.amber.shade100,
              ),
            ),
          );
        },
      ),
    );
  }
}
