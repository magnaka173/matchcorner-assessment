import 'package:flutter/material.dart';

import '../api/api_exception.dart';
import '../api/matchcorner_api.dart';
import '../models/api_error.dart';
import '../models/decoded_slip.dart';
import '../theme.dart';
import '../widgets/betslip_view.dart';
import '../widgets/booking_code_form.dart';
import '../widgets/error_panel.dart';

class DecodeScreen extends StatefulWidget {
  const DecodeScreen({super.key, required this.api});

  final MatchCornerApi api;

  @override
  State<DecodeScreen> createState() => _DecodeScreenState();
}

class _DecodeScreenState extends State<DecodeScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  ApiException? _error;
  DecodedSlip? _result;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading) {
      return;
    }

    final code = _controller.text.trim();
    if (code.isEmpty) {
      return;
    }

    FocusManager.instance.primaryFocus?.unfocus();

    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });

    try {
      final decoded = await widget.api.decodeSlip(code);
      if (!mounted) {
        return;
      }
      setState(() {
        _result = decoded;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = const ApiException(
          ApiError(
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong while decoding the booking code.',
            status: 0,
          ),
        );
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverAppBar.large(
            title: Text('MatchCorner'),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            sliver: SliverList.list(
              children: [
                const Text(
                  'Betway Nigeria',
                  style: TextStyle(
                    color: MatchCornerTheme.navy,
                    fontWeight: FontWeight.w700,
                    fontSize: 20,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Technical Assessment',
                  style: TextStyle(
                    color: MatchCornerTheme.muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Look up a Betway Nigeria booking code and inspect the canonical slip returned by the MatchCorner API.',
                  style: TextStyle(height: 1.4),
                ),
                const SizedBox(height: 20),
                BookingCodeForm(
                  controller: _controller,
                  loading: _loading,
                  onSubmit: _submit,
                ),
                if (_loading) ...[
                  const SizedBox(height: 20),
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: CircularProgressIndicator(key: Key('loadingIndicator')),
                    ),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 20),
                  ErrorPanel(error: _error!),
                ],
                if (_result != null) ...[
                  const SizedBox(height: 20),
                  BetslipView(
                    slip: _result!.slip,
                    fingerprint: _result!.fingerprint,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
