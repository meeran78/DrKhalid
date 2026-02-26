import 'package:flutter/material.dart';
import 'package:physician_scheduling/screens/login_screen.dart';
import 'package:physician_scheduling/screens/home_screen.dart';
import 'package:physician_scheduling/services/api_service.dart';
import 'package:physician_scheduling/services/auth_service.dart';

void main() {
  runApp(const PhysicianSchedulingApp());
}

class PhysicianSchedulingApp extends StatelessWidget {
  const PhysicianSchedulingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Physician Scheduling',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF334155)),
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    AuthService().hasSession().then((hasSession) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: AuthService().hasSession(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.data == true) {
          return const HomeScreen();
        }
        return const LoginScreen();
      },
    );
  }
}
